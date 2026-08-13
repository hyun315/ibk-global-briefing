import { NextResponse } from "next/server";
import { LOCATIONS } from "../../../../lib/locations.js";
import { fetchNewsForLocation } from "../../../../lib/newsFetcher.js";
import { analyzeLocation } from "../../../../lib/claudeAnalyzer.js";
import { getAdminDb } from "../../../../lib/firebaseAdmin.js";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BATCH_SIZE = 3;

// Vercel 환경변수에 ENABLE_AI_ANALYSIS=true 를 추가하기 전까지는
// Claude API를 호출하지 않고 뉴스 수집만 진행합니다 (비용 발생 없음).
const AI_ENABLED = process.env.ENABLE_AI_ANALYSIS === "true";

// AI 분석을 켜면 지역당 처리 시간이 길어져 한 번에 18개를 다 돌리면 시간 초과가 납니다.
// ?part=1 / 2 / 3 으로 나눠 실행하세요 (part 미지정 시 전체 시도).
const PARTS = 3;

function isAuthorized(req) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;

  const authHeader = req.headers.get("authorization");
  if (authHeader === `Bearer ${secret}`) return true;

  const url = new URL(req.url);
  if (url.searchParams.get("secret") === secret) return true;

  return false;
}

function selectLocations(req) {
  const url = new URL(req.url);
  const part = parseInt(url.searchParams.get("part") || "0", 10);
  if (!part || part < 1 || part > PARTS) return LOCATIONS;

  const perPart = Math.ceil(LOCATIONS.length / PARTS);
  const start = (part - 1) * perPart;
  return LOCATIONS.slice(start, start + perPart);
}

async function processLocation(location) {
  const articles = await fetchNewsForLocation(location);

  if (!AI_ENABLED) {
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

  return await analyzeLocation(location, articles);
}

export async function GET(req) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const targets = selectLocations(req);
  const db = getAdminDb();
  const startedAt = new Date().toISOString();
  const results = [];
  const errors = [];

  for (let i = 0; i < targets.length; i += BATCH_SIZE) {
    const batch = targets.slice(i, i + BATCH_SIZE);
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
    processed: targets.map((t) => t.id),
    successCount: results.length,
    errorCount: errors.length,
    errors,
  });
  await writeBatch.commit();

  return NextResponse.json({
    ok: true,
    processed: targets.map((t) => t.id),
    successCount: results.length,
    errorCount: errors.length,
    errors,
  });
}
