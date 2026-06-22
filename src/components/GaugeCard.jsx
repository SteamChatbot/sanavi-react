// 산재 승인 예상 비율 원형 게이지 — score 75↑초록 / 50↑노랑 / 50↓빨강
  import React from 'react';

export default function GaugeCard({ score }) {
  const r = 45, circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);
  const color = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
  const level = score >= 75 ? '높음' : score >= 50 ? '보통' : '낮음';
  return (
    <div className="gauge-card">
      <div className="gauge-card__circle-wrap">
        <svg viewBox="0 0 100 100" width="150" height="150">
          <circle cx="50" cy="50" r={r} fill="none" stroke="#e2e8f0" strokeWidth="9" />
          <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="9"
            strokeDasharray={circ} strokeDashoffset={offset}
            strokeLinecap="round" transform="rotate(-90 50 50)"
            style={{ transition:'stroke-dashoffset 1s ease-out' }} />
        </svg>
        <div className="gauge-card__overlay">
          <span className="gauge-card__score" style={{ color }}>{score}<small>%</small></span>
          <span className="gauge-card__level" style={{ background:`${color}22`, color }}>{level}</span>
        </div>
      </div>
      <div className="gauge-card__title">산재 승인 예상 비율</div>
      <div className="gauge-card__sub">
        직업·질병 조합 통계 기반 참고 지표 — 실제 결과와 다를 수 있습니다
      </div>
    </div>
  );
}
