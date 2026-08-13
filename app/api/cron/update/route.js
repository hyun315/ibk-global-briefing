import { NextResponse } from "next/server";
import { LOCATIONS } from "../../../../lib/locations.js";
import { fetchNewsForLocation } from "../../../../lib/newsFetcher.js";
import { analyzeLocation } from "../../../../lib/claudeAnalyzer.js";
import { getAdminDb } from "../../../../lib/firebaseAdmin.js";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Vercel 환경변수에 ENABLE_AI_ANALYSIS=true 를 넣기 전까지는
// Claude API를 호출하지 않고 뉴스 수집만 합니다 (비용 없음).
const AI_ENABLED = process.env.ENABLE_AI_ANALYSIS === "true";

// 사용법:
//   ?part=1          → 1번 지역 하나만 처리 (가장 안전, 수동 실행용)
//   ?part=1&span=3   → 1번부터 3개 지역 처리 (자동 실행용)
//   파라미터 없음      → 전체 시도 (AI 켜진 상태에서는 시간초과 가능)

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
  const span = parseInt(url.searchParams.get("span") || "1", 10);

  if (!part || part < 1 || part > LOCATIONS.length) return LOCATIONS;

  const start = part - 1;
  const count = span > 0 ? span : 1;
  return LOCATIONS.slice(start, start + count);
}

async function processLocation(location) {
  const articles = await fetchNewsForLocation(location);

  if (!AI_ENABLED) {
    return {
      locationId: location.id,
      summary: articles.length
        ? "AI 분석이 비활성화되어 있습니다. 아래 주요 뉴스를 참고하세요."
        : "수집된 기사가 없습니다.",
      impactLevel: "낮음",
      impactAnalysis: "",
      recommendedActions: [],
      items: articles.map((a) => ({
        titleKo: a.title || "",
        detail: "",
        titleOriginal: a.title || "",
        source: a.source || "",
        link: a.link || "",
        pubDate: a.pubDate || "",
      })),
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
  const saved = [];
  const errors = [];

  // 지역 하나가 끝날 때마다 곧바로 저장.
  // 도중에 시간이 초과되어도 이미 처리한 지역은 안전하게 반영됩니다.
  for (const location of targets) {
    try {
      const result = await processLocation(location);
      await db.collection("briefings").doc(location.id).set(result);
      saved.push(location.id);
    } catch (err) {
      errors.push({
        locationId: location.id,
        error: String(err?.message || err).slice(0, 300),
      });
    }
  }

  return NextResponse.json({
    ok: true,
    saved,
    savedCount: saved.length,
    errorCount: errors.length,
    errors,
  });
}
