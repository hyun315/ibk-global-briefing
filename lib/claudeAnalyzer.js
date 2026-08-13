// 모델 선택 — 비용을 더 줄이려면 아래 값을 "claude-haiku-4-5-20251001"로 바꾸세요.
const ANTHROPIC_MODEL = "claude-sonnet-5";

const SYSTEM_PROMPT = `당신은 IBK기업은행 글로벌그룹의 리서치 애널리스트입니다.
독자는 글로벌그룹 그룹장 이하 부장급 경영진이며, 해당 지역의 현지 언어를 읽지 못합니다.

제공되는 현지 뉴스 헤드라인(현지어 원문)을 바탕으로 다음을 수행하십시오.
1) 각 헤드라인을 자연스러운 한국어로 번역하고, 무슨 내용인지 한 문장으로 풀어 설명합니다.
2) 해당 국가/지역의 최근 동향을 은행 경영 관점에서 종합 요약합니다.
3) 이 동향이 기업은행의 해당 지점/법인 운영, 여신·수신, 외환·환리스크, 규제·컴플라이언스,
   진출 한국기업 고객사의 영업환경에 미칠 영향을 판단합니다.
4) 영향이 유의미하면 구체적인 대응 조치를 제안합니다.

문화·사회 뉴스는 은행 경영과 관련될 때(소비심리, 연휴로 인한 영업일 변경, 사회 불안 등)만 반영하십시오.
반드시 한국어로, 아래 JSON 형식으로만 답하십시오. 코드블록 표시나 다른 텍스트 없이 순수 JSON만 출력하십시오.

{
  "summary": "국가/지역 동향 종합 요약 3~5문장",
  "impactLevel": "높음" | "중간" | "낮음",
  "impactAnalysis": "은행업 및 기업은행에 미치는 영향 분석 2~4문장 (영향이 낮으면 그 이유를 명시)",
  "recommendedActions": ["대응 조치 1", "대응 조치 2"],
  "items": [
    {
      "index": 0,
      "titleKo": "헤드라인의 한국어 번역",
      "detail": "이 기사가 다루는 내용과 의미를 한 문장으로 설명"
    }
  ]
}

items에는 제공된 모든 기사를 순서대로 포함하고, index는 제공된 번호를 그대로 사용하십시오.
기사가 하나도 없으면 items는 빈 배열로 두고 summary에 "수집된 기사가 없습니다"라고 적으십시오.`;

export async function analyzeLocation(location, articles) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY가 설정되지 않았습니다.");

  const articleList = articles
    .map((a, i) => `${i}. [${a.source || "출처불명"}] ${a.title}`)
    .join("\n");

  const userContent = `지역: ${location.nameKo} (${location.countryKo}, IBK ${location.type})
수집된 최신 헤드라인 (${articles.length}건):
${articleList || "(수집된 기사가 없습니다)"}`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 1600,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userContent }],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Claude API 오류 (${location.id}): ${response.status} ${errText}`);
  }

  const data = await response.json();
  const textBlock = (data.content || []).find((b) => b.type === "text");
  const raw = (textBlock?.text || "").trim();
  const cleaned = raw.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    parsed = {
      summary: "AI 응답을 해석하지 못했습니다. 원문 헤드라인을 참고하세요.",
      impactLevel: "낮음",
      impactAnalysis: "",
      recommendedActions: [],
      items: [],
    };
  }

  // AI가 번역한 항목을 원문 기사(출처·링크)와 병합
  const items = (Array.isArray(parsed.items) ? parsed.items : []).map((item) => {
    const source = articles[item.index] || {};
    return {
      titleKo: item.titleKo || "",
      detail: item.detail || "",
      titleOriginal: source.title || "",
      source: source.source || "",
      link: source.link || "",
      pubDate: source.pubDate || "",
    };
  });

  return {
    locationId: location.id,
    summary: parsed.summary || "",
    impactLevel: ["높음", "중간", "낮음"].includes(parsed.impactLevel) ? parsed.impactLevel : "낮음",
    impactAnalysis: parsed.impactAnalysis || "",
    recommendedActions: Array.isArray(parsed.recommendedActions) ? parsed.recommendedActions : [],
    items,
    articles,
    generatedAt: new Date().toISOString(),
  };
}
