const ANTHROPIC_MODEL = "claude-sonnet-5";

const SYSTEM_PROMPT = `당신은 IBK기업은행 글로벌그룹의 리서치 애널리스트입니다.
독자는 글로벌그룹 그룹장 이하 부장급 경영진입니다.
아래로 제공되는 해외 현지 뉴스 헤드라인 목록(제목/출처/링크)을 바탕으로,
1) 해당 국가/지역의 최근 경제·정치·사회 동향을 은행 경영 관점에서 압축 요약하고
2) 이 뉴스들이 기업은행의 해당 지점/법인 운영, 여신·수신, 외환·환리스크, 규제·컴플라이언스,
   고객사(특히 진출 한국기업) 영업환경에 미칠 수 있는 영향을 판단하며
3) 영향이 유의미하다고 판단되면 구체적인 대응 조치를 제안하십시오.
문화 뉴스는 은행 경영과 직접 관련 있는 경우(소비심리, 휴일/연휴로 인한 영업일 변경, 사회 불안 등)에만 반영하십시오.
반드시 한국어로, 아래 JSON 형식으로만 답하십시오. 다른 텍스트, 코드블록 표시 없이 순수 JSON만 출력하십시오.

{
  "summary": "국가/지역 동향 3~5문장 요약",
  "impactLevel": "높음" | "중간" | "낮음",
  "impactAnalysis": "은행업 및 기업은행에 미치는 영향 분석 2~4문장 (영향이 낮으면 그 이유를 간단히 명시)",
  "recommendedActions": ["대응 조치 1", "대응 조치 2"],
  "keyArticleIndexes": [0, 2]
}

keyArticleIndexes는 분석의 근거가 된 기사들의 0부터 시작하는 인덱스 배열입니다.
근거가 될 만한 기사가 없으면 summary에 "특이 동향 없음"으로 표기하고 impactLevel은 "낮음"으로 하십시오.`;

export async function analyzeLocation(location, articles) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY가 설정되지 않았습니다.");

  const articleList = articles
    .map((a, i) => `${i}. [${a.source || "출처불명"}] ${a.title}`)
    .join("\n");

  const userContent = `지역: ${location.nameKo} (${location.countryKo}, IBK ${location.type})
수집된 최신 헤드라인 (최대 ${articles.length}건):
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
      max_tokens: 1200,
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
      summary: "AI 응답 파싱 실패 — 원문을 확인하세요.",
      impactLevel: "낮음",
      impactAnalysis: raw.slice(0, 500),
      recommendedActions: [],
      keyArticleIndexes: [],
    };
  }

  return {
    locationId: location.id,
    summary: parsed.summary || "",
    impactLevel: ["높음", "중간", "낮음"].includes(parsed.impactLevel) ? parsed.impactLevel : "낮음",
    impactAnalysis: parsed.impactAnalysis || "",
    recommendedActions: Array.isArray(parsed.recommendedActions) ? parsed.recommendedActions : [],
    keyArticleIndexes: Array.isArray(parsed.keyArticleIndexes) ? parsed.keyArticleIndexes : [],
    articles,
    generatedAt: new Date().toISOString(),
  };
}
