// 관리자 페이지 공용 점선 추이 차트(스파크라인) — 짧은 시계열(예: 최근 5분 리소스 추이)을 작게 보여줄 때 사용
// 외부 차트 라이브러리 없이 SVG로 직접 그림 (AdminBarChart와 동일한 방침 — 라이브러리 미사용)
import React from 'react';
import './AdminSparkline.css';

/**
 * AdminSparkline
 * @param {number[]} data - 시간순 값 배열(오래된 것 → 최신)
 * @param {number} [max] - y축 상한. 미지정 시 data의 최댓값으로 자동 스케일(퍼센트가 아닌 지표용)
 * @param {string} [color] - 선 색상 (CSS 변수 사용 가능)
 */
export default function AdminSparkline({ data, max, color = 'var(--color-primary)' }) {
  const height = 36;
  const width = 100;
  const values = data && data.length ? data : [0];
  const effectiveMax = Math.max(1, max ?? Math.max(...values));

  const points = values
    .map((v, i) => {
      const x = values.length > 1 ? (i / (values.length - 1)) * width : width;
      const y = height - (Math.min(Math.max(v, 0), effectiveMax) / effectiveMax) * height;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg className="ad-sparkline" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeDasharray="4 3"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
