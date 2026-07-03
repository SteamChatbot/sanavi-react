// 하드웨어 리소스 게이지 카드 — 라벨/현재값/막대게이지/최근 5분 점선 추이(AdminSparkline)를 한 세트로 묶은 컴포넌트
// AdminSystemPage의 CPU/메모리/디스크/네트워크 4개 카드가 전부 이 컴포넌트 하나를 재사용
import React from 'react';
import AdminSparkline from './AdminSparkline';

function fillClass(pct) {
  if (pct >= 80) return 'ad-gauge__fill ad-gauge__fill--danger';
  if (pct >= 60) return 'ad-gauge__fill ad-gauge__fill--warn';
  return 'ad-gauge__fill';
}

/**
 * AdminHardwareGauge
 * @param {string} label - 게이지 이름 (예: "CPU 사용량")
 * @param {string} value - 우측에 표시할 현재값 문자열 (예: "42%", "측정 중")
 * @param {number} pct - 막대 게이지 채움 비율 0~100 (트랙을 안 채우려면 null)
 * @param {string} sub - 게이지 아래 보조 설명 텍스트
 * @param {number[]} history - 최근 5분 스파크라인 데이터(오래된 것 → 최신)
 * @param {number} [sparklineMax] - 스파크라인 y축 상한 — 퍼센트 지표는 100 고정, 절대값(MB/s 등)은 미지정 시 자동 스케일
 */
export default function AdminHardwareGauge({ label, value, pct, sub, history, sparklineMax }) {
  return (
    <div className="ad-gauge">
      <div className="ad-gauge__head">
        <span className="ad-gauge__label">{label}</span>
        <span className="ad-gauge__value">{value}</span>
      </div>
      <div className="ad-gauge__track">
        {pct != null && <div className={fillClass(pct)} style={{ width: `${pct}%` }} />}
      </div>
      <AdminSparkline data={history} max={sparklineMax} />
      <div className="ad-gauge__sub">{sub}</div>
    </div>
  );
}
