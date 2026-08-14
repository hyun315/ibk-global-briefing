// 기업은행(IBK) 해외지점 · 해외법인 소재지 설정
// 배열 순서 = 대시보드 표시 순서
//   1) 중국법인 (도시 가나다순)
//   2) 인도네시아법인 → 폴란드법인 → 미얀마법인
//   3) 지점 (가나다순)

export const LOCATIONS = [
  // ── 중국법인 (가나다순) ──
  { id: "beijing", code: "PEK", nameKo: "베이징", type: "지점", group: "china", country: "중국", countryKo: "중국",
    gnews: { hl: "zh-CN", gl: "CN", ceid: "CN:zh-Hans" }, queryCity: "北京" },
  { id: "shenyang", code: "SHE", nameKo: "선양", type: "지점", group: "china", country: "중국", countryKo: "중국",
    gnews: { hl: "zh-CN", gl: "CN", ceid: "CN:zh-Hans" }, queryCity: "沈阳" },
  { id: "shenzhen", code: "SZX", nameKo: "선전", type: "지점", group: "china", country: "중국", countryKo: "중국",
    gnews: { hl: "zh-CN", gl: "CN", ceid: "CN:zh-Hans" }, queryCity: "深圳" },
  { id: "suzhou", code: "SZV", nameKo: "쑤저우", type: "지점", group: "china", country: "중국", countryKo: "중국",
    gnews: { hl: "zh-CN", gl: "CN", ceid: "CN:zh-Hans" }, queryCity: "苏州" },
  { id: "yantai", code: "YNT", nameKo: "옌타이", type: "지점", group: "china", country: "중국", countryKo: "중국",
    gnews: { hl: "zh-CN", gl: "CN", ceid: "CN:zh-Hans" }, queryCity: "烟台" },
  { id: "wuhan", code: "WUH", nameKo: "우한", type: "지점", group: "china", country: "중국", countryKo: "중국",
    gnews: { hl: "zh-CN", gl: "CN", ceid: "CN:zh-Hans" }, queryCity: "武汉" },
  { id: "qingdao", code: "TAO", nameKo: "칭다오", type: "지점", group: "china", country: "중국", countryKo: "중국",
    gnews: { hl: "zh-CN", gl: "CN", ceid: "CN:zh-Hans" }, queryCity: "青岛" },
  { id: "tianjin", code: "TSN", nameKo: "톈진", type: "지점", group: "china", country: "중국", countryKo: "중국",
    gnews: { hl: "zh-CN", gl: "CN", ceid: "CN:zh-Hans" }, queryCity: "天津" },

  // ── 기타 해외법인 ──
  { id: "indonesia", code: "JKT", nameKo: "인도네시아", type: "법인", group: "subsidiary", country: "인도네시아", countryKo: "인도네시아",
    gnews: { hl: "id", gl: "ID", ceid: "ID:id" }, queryCity: "Indonesia" },
  { id: "poland", code: "WAW", nameKo: "폴란드", type: "법인", group: "subsidiary", country: "폴란드", countryKo: "폴란드",
    gnews: { hl: "pl", gl: "PL", ceid: "PL:pl" }, queryCity: "Polska" },
  { id: "myanmar", code: "RGN", nameKo: "미얀마", type: "법인", group: "subsidiary", country: "미얀마", countryKo: "미얀마",
    gnews: { hl: "en", gl: "MM", ceid: "MM:en" }, queryCity: "Myanmar" },

  // ── 해외지점 (가나다순) ──
  { id: "newdelhi", code: "DEL", nameKo: "뉴델리", type: "지점", group: "branch", country: "인도", countryKo: "인도",
    gnews: { hl: "en-IN", gl: "IN", ceid: "IN:en" }, queryCity: "India" },
  { id: "newyork", code: "NYC", nameKo: "뉴욕", type: "지점", group: "branch", country: "미국", countryKo: "미국",
    gnews: { hl: "en-US", gl: "US", ceid: "US:en" }, queryCity: "United States" },
  { id: "tokyo", code: "TYO", nameKo: "도쿄", type: "지점", group: "branch", country: "일본", countryKo: "일본",
    gnews: { hl: "ja", gl: "JP", ceid: "JP:ja" }, queryCity: "日本" },
  { id: "london", code: "LON", nameKo: "런던", type: "지점", group: "branch", country: "영국", countryKo: "영국",
    gnews: { hl: "en-GB", gl: "GB", ceid: "GB:en" }, queryCity: "United Kingdom" },
  { id: "manila", code: "MNL", nameKo: "마닐라", type: "지점", group: "branch", country: "필리핀", countryKo: "필리핀",
    gnews: { hl: "en-PH", gl: "PH", ceid: "PH:en" }, queryCity: "Philippines" },
  { id: "phnompenh", code: "PNH", nameKo: "프놈펜", type: "지점", group: "branch", country: "캄보디아", countryKo: "캄보디아",
    gnews: { hl: "en", gl: "KH", ceid: "KH:en" }, queryCity: "Cambodia" },
  { id: "hongkong", code: "HKG", nameKo: "홍콩", type: "지점", group: "branch", country: "홍콩", countryKo: "홍콩",
    gnews: { hl: "en-HK", gl: "HK", ceid: "HK:en" }, queryCity: "Hong Kong" },
];

// 검색 시 결합할 주제 키워드 (경제/정치/은행업 중심, 문화는 보조)
export const TOPIC_QUERY = "economy OR politics OR finance OR banking OR trade OR investment";

// 국내(한국) 언론 배제용 도메인 블록리스트 (로케일 필터와 이중 적용)
export const KOREAN_DOMAIN_BLOCKLIST = [
  "yna.co.kr", "chosun.com", "joongang.co.kr", "joins.com", "hani.co.kr",
  "mk.co.kr", "hankyung.com", "sedaily.com", "edaily.co.kr", "news1.kr",
  "yonhapnews.co.kr", "kbs.co.kr", "mbc.co.kr", "sbs.co.kr", "ytn.co.kr",
  "donga.com", "khan.co.kr", "seoul.co.kr", "heraldcorp.com", "asiae.co.kr",
  "fnnews.com", "moneys.co.kr", "newsis.com", "biz.chosun.com",
];

// 대시보드 구분 제목
export const GROUPS = [
  { key: "china", label: "중국법인", note: "IBK China 산하 지점" },
  { key: "subsidiary", label: "해외법인" },
  { key: "branch", label: "해외지점" },
];
