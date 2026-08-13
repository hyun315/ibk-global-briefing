"use client";

import { useState } from "react";

const LEVEL_COLOR = { 높음: "var(--high)", 중간: "var(--mid)", 낮음: "var(--low)" };

function timeAgo(iso) {
  if (!iso) return "—";
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 1) return "1시간 이내";
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
}

export default function CountryPanel({ location, briefing }) {
  const [expanded, setExpanded] = useState(false);
  const level = briefing?.impactLevel || "낮음";
  const color = LEVEL_COLOR[level];
  const items = briefing?.items || [];

  return (
    <div className="panel" style={{ "--bar-color": color }}>
      <div className="bar" />
      <div className="panel-body">
        <div className="panel-head">
          <div>
            <span className="mono code">{location.code}</span>
            <span className="type">{location.type}</span>
          </div>
          <span className="mono level" style={{ color }}>{level}</span>
        </div>

        <h3 className="display name">{location.nameKo}</h3>
        <span className="mono updated">
          {briefing ? `업데이트 ${timeAgo(briefing.generatedAt)}` : "데이터 없음"}
        </span>

        {briefing ? (
          <>
            <p className="summary">{briefing.summary}</p>

            {items.length > 0 && (
              <div className="report">
                <span className="section-label mono">주요 뉴스</span>
                {items.map((item, i) => (
                  <div className="item" key={i}>
                    <p className="item-title">{item.titleKo}</p>
                    {item.detail && <p className="item-detail">{item.detail}</p>}
                    <span className="item-source mono">
                      출처: {item.source || "미상"}
                      {item.titleOriginal ? ` · 원제: ${item.titleOriginal}` : ""}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {(briefing.impactAnalysis || briefing.recommendedActions?.length > 0) && (
              <button className="toggle mono" onClick={() => setExpanded((v) => !v)}>
                {expanded ? "은행 영향 분석 접기 ▲" : "은행 영향 분석 보기 ▼"}
              </button>
            )}

            {expanded && (
              <div className="detail">
                {briefing.impactAnalysis && <p className="impact">{briefing.impactAnalysis}</p>}
                {briefing.recommendedActions?.length > 0 && (
                  <>
                    <span className="section-label mono">권고 조치</span>
                    <ul className="actions">
                      {briefing.recommendedActions.map((a, i) => (
                        <li key={i}>{a}</li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            )}
          </>
        ) : (
          <p className="summary muted">첫 자동 수집을 기다리는 중입니다.</p>
        )}
      </div>

      <style jsx>{`
        .panel {
          position: relative;
          background: var(--panel);
          border: 1px solid var(--border);
          border-radius: 4px;
          overflow: hidden;
          display: flex;
        }
        .bar {
          width: 4px;
          flex: none;
          background: var(--bar-color);
        }
        .panel-body {
          padding: 16px 18px 18px;
          flex: 1;
          min-width: 0;
        }
        .panel-head {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 6px;
        }
        .code {
          color: var(--gold);
          font-size: 13px;
          letter-spacing: 0.05em;
          margin-right: 8px;
        }
        .type { color: var(--muted); font-size: 12px; }
        .level { font-size: 12px; letter-spacing: 0.05em; }
        .name {
          margin: 0 0 2px;
          font-size: 20px;
          font-weight: 700;
        }
        .updated { color: var(--muted); font-size: 11px; }
        .summary {
          font-size: 14px;
          line-height: 1.6;
          color: var(--text);
          margin: 12px 0 14px;
        }
        .summary.muted { color: var(--muted); }
        .section-label {
          display: block;
          color: var(--gold);
          font-size: 10px;
          letter-spacing: 0.14em;
          margin-bottom: 8px;
        }
        .report {
          border-top: 1px solid var(--border);
          padding-top: 12px;
          margin-bottom: 14px;
        }
        .item {
          padding-bottom: 12px;
          margin-bottom: 12px;
          border-bottom: 1px dashed var(--border);
        }
        .item:last-child {
          border-bottom: none;
          margin-bottom: 0;
          padding-bottom: 0;
        }
        .item-title {
          font-size: 14px;
          font-weight: 600;
          line-height: 1.5;
          margin: 0 0 4px;
          color: var(--text);
        }
        .item-detail {
          font-size: 13px;
          line-height: 1.55;
          color: var(--text);
          opacity: 0.85;
          margin: 0 0 6px;
        }
        .item-source {
          display: block;
          font-size: 11px;
          color: var(--muted);
          line-height: 1.45;
        }
        .toggle {
          background: none;
          border: none;
          color: var(--gold);
          font-size: 11px;
          padding: 0;
          letter-spacing: 0.03em;
        }
        .detail {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px dashed var(--border);
        }
        .impact {
          font-size: 13px;
          line-height: 1.6;
          color: var(--text);
          margin: 0 0 12px;
        }
        .actions {
          margin: 0;
          padding-left: 18px;
          font-size: 13px;
          color: var(--text);
          line-height: 1.65;
        }
      `}</style>
    </div>
  );
}
