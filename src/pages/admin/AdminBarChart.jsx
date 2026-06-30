// 관리자 페이지 공용 막대그래프 — 통계/시스템 모니터링 등에서 데이터만 바꿔 재사용
// 외부 차트 라이브러리 없이 CSS로 표현 (스타일은 AdminPage.css의 .ad-bar-chart* 참고)
import React from 'react';

/**
 * AdminBarChart
 * @param {{label: string, [seriesKey: string]: number}[]} data
 * @param {{key: string, label?: string, color?: string, variant?: string}[]} series
 * @param {number} [barWidth] - 막대 너비(px). 미지정 시 CSS 기본값 사용
 */
export default function AdminBarChart({ data, series, barWidth }) {
  const max = Math.max(1, ...data.flatMap((d) => series.map((s) => Number(d[s.key]) || 0)));

  return (
    <>
      <div className="ad-bar-chart">
        {data.map((d) => (
          <div className="ad-bar-chart__col" key={d.label}>
            <div className="ad-bar-chart__bars">
              {series.map((s) => (
                <div
                  key={s.key}
                  className={['ad-bar-chart__bar', s.variant ? `ad-bar-chart__bar--${s.variant}` : ''].filter(Boolean).join(' ')}
                  style={{
                    height: `${(Number(d[s.key]) || 0) / max * 100}%`,
                    ...(barWidth ? { width: barWidth } : {}),
                  }}
                  title={`${s.label ?? s.key} ${d[s.key]}`}
                />
              ))}
            </div>
            <span className="ad-bar-chart__label">{d.label}</span>
          </div>
        ))}
      </div>

      {series.length > 1 && (
        <div className="ad-bar-chart__legend">
          {series.map((s) => (
            <span key={s.key}>
              <i className="ad-bar-chart__dot" style={{ background: s.color }} />
              {s.label ?? s.key}
            </span>
          ))}
        </div>
      )}
    </>
  );
}
