// 원형 퍼센트 게이지 — score 75↑초록 / 50↑노랑 / 50↓빨강, score가 없으면 회색 빈 링
// label/sub를 커스터마이징할 수 있어 산재 승인율 외에 다른 퍼센트 지표(예: 관리자 통계)에도 재사용 가능
import React from 'react';
import './GaugeCard.css';

export default function GaugeCard({
  score,
  label = '산재 승인 예상 비율',
  sub = '직업·질병 조합 통계 기반 참고 지표 — 실제 결과와 다를 수 있습니다',
  size = 150,
}) {
  const r = 45, circ = 2 * Math.PI * r;
  const hasScore = score !== null && score !== undefined;
  const offset = circ * (1 - (hasScore ? score : 0) / 100);
  const color = !hasScore ? '#d1d5db' : score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
  const level = score >= 75 ? '높음' : score >= 50 ? '보통' : '낮음';

  return (
    <div className="gauge-card">
      <div className="gauge-card__circle-wrap" style={{ width: size, height: size }}>
        <svg viewBox="0 0 100 100" width={size} height={size}>
          <circle cx="50" cy="50" r={r} fill="none" stroke="#e2e8f0" strokeWidth="9" />
          {hasScore && (
            <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="9"
              strokeDasharray={circ} strokeDashoffset={offset}
              strokeLinecap="round" transform="rotate(-90 50 50)"
              style={{ transition:'stroke-dashoffset 1s ease-out' }} />
          )}
        </svg>
        <div className="gauge-card__overlay">
          <span className="gauge-card__score" style={{ color }}>{hasScore ? score : '—'}{hasScore && <small>%</small>}</span>
          {hasScore && <span className="gauge-card__level" style={{ background:`${color}22`, color }}>{level}</span>}
        </div>
      </div>
      <div className="gauge-card__title">{label}</div>
      <div className="gauge-card__sub">{sub}</div>
    </div>
  );
}
