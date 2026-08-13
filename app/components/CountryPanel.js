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

            <button className="toggle mono" onClick={() => setExpanded((v) => !v)}>
              {expanded ? "영향 분석 접기 ▲" : "은행 영향 분석 보기 ▼"}
            </button>

            {expanded && (
              <div className="detail">
                <p className="impact">{briefing.impactAnalysis}</p>
                {briefing.recommendedActions?.length > 0 && (
                  <ul className="actions">
                    {briefing.recommendedActions.map((a, i) => (
                      <li key={i}>{a}</li>
                    ))}
                  </ul>
                )}
                {briefing.articles?.length > 0 && (
                  <div className="sources">
                    <span className="sources-label mono">SOURCES</span>
                    {briefing.articles.slice(0, 5).map((a, i) => (
                      <a href={a.link} target="_blank" rel="noreferrer" key={i} className="source-link">
                        {a.source ? `${a.source} — ` : ""}{a.title}
                      </a>
                    ))}
                  </div>
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
        .type {
          color: var(--muted);
          font-size: 12px;
        }
        .level {
          font-size: 12px;
          letter-spacing: 0.05em;
        }
        .name {
          margin: 0 0 2px;
          font-size: 20px;
          font-weight: 700;
        }
        .updated {
          color: var(--muted);
          font-size: 11px;
        }
        .summary {
          font-size: 14px;
          line-height: 1.55;
          color: var(--text);
          margin: 12px 0;
        }
        .summary.muted { color: var(--muted); }
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
          line-height: 1.55;
          color: var(--text);
          margin: 0 0 10px;
        }
        .actions {
          margin: 0 0 12px;
          padding-left: 18px;
          font-size: 13px;
          color: var(--text);
          line-height: 1.6;
        }
        .sources {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .sources-label {
          color: var(--muted);
          font-size: 10px;
          letter-spacing: 0.1em;
          margin-bottom: 2px;
        }
        .source-link {
          font-size: 12px;
          color: var(--muted);
          text-decoration: none;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .source-link:hover { color: var(--text); text-decoration: underline; }
      `}</style>
    </div>
  );
}
