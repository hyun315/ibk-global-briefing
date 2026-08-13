import { NextResponse } from "next/server";
import { LOCATIONS } from "../../../../lib/locations.js";
import { fetchNewsForLocation } from "../../../../lib/newsFetcher.js";
import { analyzeLocation } from "../../../../lib/claudeAnalyzer.js";
import { getAdminDb } from "../../../../lib/firebaseAdmin.js";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Vercel Pro 이상에서는 최대 300(Fluid 시 800)까지 상향 가능

const BATCH_SIZE = 4;

// Vercel 환경변수에 ENABLE_AI_ANALYSIS=true 를 추가하기 전까지는
// Claude API를 호출하지 않고 뉴스 수집만 진행합니다 (비용 발생 없음).
const AI_ENABLED = process.env.ENABLE_AI_ANALYSIS === "true";

function isAuthorized(req) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // CRON_SECRET 미설정 시 개발 편의를 위해 허용 (운영 배포 시 반드시 설정 권장)

  const authHeader = req.headers.get("authorization");
  if (authHeader === `Bearer ${secret}`) return true;

  const url = new URL(req.url);
  if (url.searchParams.get("secret") === secret) return true;

  return false;
}

async function processLocation(location) {
  const articles = await fetchNewsForLocation(location);

  if (!AI_ENABLED) {
    // AI 분석 비활성화 상태 — 수집된 헤드라인만 저장하고 Claude API는 호출하지 않음
    return {
      locationId: location.id,
      summary: articles.length
        ? "AI 분석이 비활성화되어 있습니다. 아래 원문 헤드라인을 참고하세요."
        : "수집된 기사가 없습니다.",
      impactLevel: "낮음",
      impactAnalysis: "",
      recommendedActions: [],
      items: [],
      articles,
      generatedAt: new Date().toISOString(),
    };
  }

  const analysis = await analyzeLocation(location, articles);
  return analysis;
}

export async function GET(req) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const db = getAdminDb();
  const startedAt = new Date().toISOString();
  const results = [];
  const errors = [];

  for (let i = 0; i < LOCATIONS.length; i += BATCH_SIZE) {
    const batch = LOCATIONS.slice(i, i + BATCH_SIZE);
    const settled = await Promise.allSettled(batch.map(processLocation));

    settled.forEach((outcome, idx) => {
      const location = batch[idx];
      if (outcome.status === "fulfilled") {
        results.push(outcome.value);
      } else {
        errors.push({ locationId: location.id, error: String(outcome.reason?.message || outcome.reason) });
      }
    });
  }

  const writeBatch = db.batch();
  results.forEach((r) => {
    const ref = db.collection("briefings").doc(r.locationId);
    writeBatch.set(ref, r);
  });
  const logRef = db.collection("runLogs").doc();
  writeBatch.set(logRef, {
    startedAt,
    finishedAt: new Date().toISOString(),
    successCount: results.length,
    errorCount: errors.length,
    errors,
  });
  await writeBatch.commit();

  return NextResponse.json({
    ok: true,
    successCount: results.length,
    errorCount: errors.length,
    errors,
  });
}
