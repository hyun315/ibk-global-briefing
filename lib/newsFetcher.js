import { XMLParser } from "fast-xml-parser";
import { TOPIC_QUERY, KOREAN_DOMAIN_BLOCKLIST } from "./locations.js";

const parser = new XMLParser({ ignoreAttributes: false });

function buildRssUrl(location) {
  const q = encodeURIComponent(`${location.queryCity} (${TOPIC_QUERY})`);
  const { hl, gl, ceid } = location.gnews;
  return `https://news.google.com/rss/search?q=${q}&hl=${hl}&gl=${gl}&ceid=${ceid}`;
}

function isKoreanDomesticSource(link, sourceName) {
  const lowerLink = (link || "").toLowerCase();
  const lowerSource = (sourceName || "").toLowerCase();
  return KOREAN_DOMAIN_BLOCKLIST.some(
    (domain) => lowerLink.includes(domain) || lowerSource.includes(domain.split(".")[0])
  );
}

// 위치 하나에 대한 최신 뉴스 항목 가져오기 (최대 maxItems개)
export async function fetchNewsForLocation(location, maxItems = 8) {
  const url = buildRssUrl(location);
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; IBKGlobalBriefing/1.0)" },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(`RSS fetch failed for ${location.id}: ${res.status}`);
  }

  const xml = await res.text();
  const parsed = parser.parse(xml);
  const rawItems = parsed?.rss?.channel?.item;
  const items = Array.isArray(rawItems) ? rawItems : rawItems ? [rawItems] : [];

  const cleaned = items
    .map((item) => {
      const sourceName =
        typeof item.source === "object" ? item.source["#text"] : item.source;
      return {
        title: item.title || "",
        link: item.link || "",
        source: sourceName || "",
        pubDate: item.pubDate || "",
      };
    })
    .filter((item) => item.title && !isKoreanDomesticSource(item.link, item.source));

  return cleaned.slice(0, maxItems);
}

// 전체 위치에 대해 순차적으로 수집 (구글 뉴스 과호출 방지를 위해 약간의 딜레이)
export async function fetchAllLocations(locations) {
  const results = [];
  for (const location of locations) {
    try {
      const articles = await fetchNewsForLocation(location);
      results.push({ location, articles, error: null });
    } catch (err) {
      results.push({ location, articles: [], error: String(err?.message || err) });
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  return results;
}
