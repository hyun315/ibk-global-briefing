"use client";

export default function Ticker({ items }) {
  if (!items.length) return null;
  const loopItems = [...items, ...items];

  return (
    <div className="ticker">
      <span className="ticker-label mono">WATCH</span>
      <div className="ticker-track">
        <div className="ticker-content">
          {loopItems.map((item, i) => (
            <span className="ticker-item" key={i}>
              <span className={`dot ${item.impactLevel === "높음" ? "high" : "mid"}`} />
              <span className="mono code">{item.code}</span>
              <span className="headline">{item.summary}</span>
            </span>
          ))}
        </div>
      </div>

      <style jsx>{`
        .ticker {
          display: flex;
          align-items: center;
          gap: 14px;
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
          background: var(--panel);
          overflow: hidden;
          padding: 10px 0;
        }
        .ticker-label {
          flex: none;
          padding: 0 16px 0 20px;
          color: var(--gold);
          font-size: 12px;
          letter-spacing: 0.12em;
          border-right: 1px solid var(--border);
        }
        .ticker-track {
          overflow: hidden;
          flex: 1;
        }
        .ticker-content {
          display: flex;
          gap: 40px;
          width: max-content;
          animation: scroll 180s linear infinite;
        }
        .ticker-item {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          white-space: nowrap;
          font-size: 13px;
          color: var(--muted);
        }
        .code {
          color: var(--text);
          font-size: 12px;
        }
        .dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          flex: none;
        }
        .dot.high { background: var(--high); }
        .dot.mid { background: var(--mid); }
        @keyframes scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
