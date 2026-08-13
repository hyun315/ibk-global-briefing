"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebaseClient.js";
import { LOCATIONS } from "../lib/locations.js";
import CountryPanel from "./components/CountryPanel.js";
import Ticker from "./components/Ticker.js";

export default function Page() {
  const [briefingsById, setBriefingsById] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "briefings"), (snap) => {
      const next = {};
      snap.forEach((doc) => { next[doc.id] = doc.data(); });
      setBriefingsById(next);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // 표시 순서는 locations.js에 정의된 순서를 그대로 따릅니다.
  // (중국법인 가나다순 → 인도네시아·폴란드·미얀마 법인 → 지점 가나다순)
  const orderedLocations = LOCATIONS;

  const watchItems = useMemo(() => {
    return orderedLocations
      .filter((loc) => ["높음", "중간"].includes(briefingsById[loc.id]?.impactLevel))
      .map((loc) => ({
        code: loc.code,
        summary: briefingsById[loc.id]?.summary,
        impactLevel: briefingsById[loc.id]?.impactLevel,
      }));
  }, [orderedLocations, briefingsById]);

  const latestSync = useMemo(() => {
    const times = Object.values(briefingsById).map((b) => b?.generatedAt).filter(Boolean);
    if (!times.length) return null;
    return times.sort().at(-1);
  }, [briefingsById]);

  return (
    <main className="page">
      <header className="header">
        <div className="header-top">
          <div className="brand">
            <span className="mono eyebrow">INDUSTRIAL BANK OF KOREA</span>
            <h1 className="display title">GLOBAL WIRE</h1>
          </div>
          <div className="meta">
            <span className="mono dedication">For Leo, with respect — HJ</span>
            <span className="mono sync">
              {latestSync
                ? `마지막 수집 ${new Date(latestSync).toLocaleString("ko-KR", { hour12: false })}`
                : loading ? "불러오는 중…" : "수집 대기 중"}
            </span>
          </div>
        </div>
        <p className="subtitle">
          해외지점 · 해외법인 소재국 경제 · 정치 동향과 은행 영향도 분석 — 국내 언론 제외
        </p>
      </header>

      <Ticker items={watchItems} />

      <section className="grid">
        {orderedLocations.map((loc) => (
          <CountryPanel key={loc.id} location={loc} briefing={briefingsById[loc.id]} />
        ))}
      </section>

      <style jsx>{`
        .page {
          max-width: 1240px;
          margin: 0 auto;
          padding: 0 0 60px;
        }
        .header {
          padding: 36px 20px 20px;
        }
        .header-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          flex-wrap: wrap;
          gap: 14px;
        }
        .brand {
          min-width: 0;
        }
        .eyebrow {
          color: var(--gold);
          font-size: 12px;
          letter-spacing: 0.16em;
        }
        .title {
          margin: 6px 0 0;
          font-size: 40px;
          font-weight: 700;
          letter-spacing: 0.01em;
        }
        .meta {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
          text-align: right;
        }
        .dedication {
          color: var(--gold);
          font-size: 12px;
          letter-spacing: 0.04em;
          opacity: 0.85;
        }
        .sync {
          color: var(--muted);
          font-size: 12px;
        }
        .subtitle {
          color: var(--muted);
          font-size: 14px;
          margin: 14px 0 0;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 14px;
          padding: 24px 20px 0;
        }
        /* 좁은 화면에서는 은행명과 헌사가 겹치지 않도록 한 줄 아래로 */
        @media (max-width: 720px) {
          .header-top {
            flex-direction: column;
            align-items: flex-start;
          }
          .meta {
            align-items: flex-start;
            text-align: left;
          }
          .title {
            font-size: 32px;
          }
        }
      `}</style>
    </main>
  );
}
