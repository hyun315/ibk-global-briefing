// 모델 선택 — 비용을 더 줄이려면 아래 값을 "claude-haiku-4-5-20251001"로 바꾸세요.
const ANTHROPIC_MODEL = "claude-sonnet-5";

const SYSTEM_PROMPT = `당신은 IBK기업은행 글로벌그룹의 리서치 애널리스트입니다.
독자는 글로벌그룹 그룹장 이하 부장급 경영진이며, 해당 지역의 현지 언어를 읽지 못합니다.

제공되는 현지 뉴스 헤드라인(현지어 원문)을 바탕으로 다음을 수행하십시오.
1) 각 헤드라인을 자연스러운 한국어로 번역하고, 무슨 내용인지 한 문장으로 설명합니다.
2) 해당 지역의 최근 동향을 은행 경영 관점에서 종합 요약합니다.
3) 기업은행의 해당 지점/법인 운영, 여신·수신, 외환·환리스크, 규제·컴플라이언스,
   진출 한국기업 고객사의 영업환경에 미칠 영향을 판단합니다.
4) 영향이 유의미하면 구체적 대응 조치를 제안합니다.

출력 규칙 (엄수):
- 응답 전체가 하나의 JSON 객체여야 합니다. 여는 중괄호로 시작해 닫는 중괄호로 끝납니다.
- 코드블록 표시(백틱), 머리말, 맺음말, 주석을 절대 넣지 마십시오.
- 모든 값은 한국어로 작성합니다.
- 문자열 안에서 큰따옴표를 쓰지 말고 작은따옴표를 사용하십시오.
- 문자열 안에 줄바꿈을 넣지 마십시오.
- summary는 3문장 이내, impactAnalysis는 3문장 이내, detail은 1문장으로 씁니다.

형식:
{"summary":"지역 동향 종합 요약","impactLevel":"높음 또는 중간 또는 낮음","impactAnalysis":"은행 영향 분석","recommendedActions":["조치1","조치2"],"items":[{"index":0,"titleKo":"헤드라인 한국어 번역","detail":"내용 설명 한 문장"}]}

items에는 제공된 모든 기사를 순서대로 넣고 index는 제공된 번호를 그대로 씁니다.
기사가 없으면 items는 빈 배열, summary는 '수집된 기사가 없습니다'로 씁니다.`;

// 응답 문자열에서 JSON 객체만 최대한 관대하게 추출
function extractJson(raw) {
  let text = String(raw || "").trim();

  // 코드블록 제거
  text = text.replace(/```(?:json)?/gi, "").trim();

  // 첫 '{' 부터 마지막 '}' 까지
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  text = text.slice(start, end + 1);

  try {
    return JSON.parse(text);
  } catch (e) {
    // 흔한 오류 보정: 트레일링 콤마 제거 후 재시도
    try {
      return JSON.parse(text.replace(/,\s*([}\]])/g, "$1"));
    } catch (e2) {
      return null;
    }
  }
}

async function callClaude(apiKey, userContent) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 3000,
      temperature: 0,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userContent }],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Claude API 오류: ${response.status} ${errText}`);
  }

  const data = await response.json();
  const textBlock = (data.content || []).find((b) => b.type === "text");
  return textBlock?.text || "";
}

export async function analyzeLocation(location, articles) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY가 설정되지 않았습니다.");

  const articleList = articles
    .map((a, i) => `${i}. [${a.source || "출처불명"}] ${a.title}`)
    .join("\n");

  const userContent = `지역: ${location.nameKo} (${location.countryKo}, IBK ${location.type})
수집된 최신 헤드라인 (${articles.length}건):
${articleList || "(수집된 기사가 없습니다)"}

위 내용을 JSON 객체 하나로만 답하십시오.`;

  // 1차 시도 → 실패 시 1회 재시도
  let parsed = extractJson(await callClaude(apiKey, userContent));
  if (!parsed) {
    parsed = extractJson(
      await callClaude(apiKey, userContent + "\n\n반드시 유효한 JSON 객체 하나만 출력하십시오. 다른 텍스트는 절대 넣지 마십시오.")
    );
  }

  const ok = !!parsed;
  const aiItems = ok && Array.isArray(parsed.items) ? parsed.items : [];

  // AI 번역 결과를 원문 기사(출처·링크)와 병합.
  // 번역이 없으면 원문 제목이라도 그대로 표시.
  const items = articles.map((article, i) => {
    const ai = aiItems.find((x) => Number(x.index) === i) || aiItems[i] || {};
    return {
      titleKo: ai.titleKo || article.title || "",
      detail: ai.detail || "",
      titleOriginal: article.title || "",
      source: article.source || "",
      link: article.link || "",
      pubDate: article.pubDate || "",
    };
  });

  return {
    locationId: location.id,
    summary: ok
      ? parsed.summary || ""
      : "요약 생성에 실패했습니다. 아래 주요 뉴스를 참고하세요.",
    impactLevel:
      ok && ["높음", "중간", "낮음"].includes(parsed.impactLevel) ? parsed.impactLevel : "낮음",
    impactAnalysis: ok ? parsed.impactAnalysis || "" : "",
    recommendedActions:
      ok && Array.isArray(parsed.recommendedActions) ? parsed.recommendedActions : [],
    items,
    articles,
    generatedAt: new Date().toISOString(),
  };
}
