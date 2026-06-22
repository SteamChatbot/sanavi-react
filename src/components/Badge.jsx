// 상태 뱃지 — type(ok/warn/error/info)별 색상 표시
import React from 'react';
import './Badge.css';

/**
 * Badge
 * @param {'ok'|'pending'|'rejected'|'admin'|'primary'|'pro'} type
 * @param {boolean} pill
 */
export default function Badge({ children, type = 'primary', pill = false, className = '' }) {
  return (
    <span className={['badge', `badge--${type}`, pill ? 'badge--pill' : '', className].filter(Boolean).join(' ')}>
      {children}
    </span>
  );
}
