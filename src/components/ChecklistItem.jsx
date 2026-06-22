// 증거 보강 체크리스트 아이템 — 완료 체크 토글 + 목적/방법/이유 상세 접기/펼치기
import React, { useState } from 'react';

export default function ChecklistItem({ title, purpose, method, reason, checked, onToggle }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`checklist-item${checked ? ' checklist-item--checked' : ''}`}>
      <div className="checklist-item__top">
        <button
          className={`checklist-item__check${checked ? ' checklist-item__check--done' : ''}`}
          onClick={onToggle} aria-label={checked ? '완료 취소' : '완료 표시'}
        >{checked ? '✓' : ''}</button>
        <button className="checklist-item__text-btn" onClick={onToggle}>
          <span className="checklist-item__title">{title}</span>
          {purpose && <span className="checklist-item__purpose">{purpose}</span>}
        </button>
        <button
          className="checklist-item__toggle"
          onClick={() => setOpen(o => !o)}
          aria-expanded={open}
        >
          자세히 보기 <span className="checklist-item__arrow">{open ? '▲' : '▼'}</span>
        </button>
      </div>
      {open && (
        <div className="checklist-item__detail">
          {purpose && <p><strong>[목적]</strong> {purpose}</p>}
          <p><strong>[방법]</strong> {method}</p>
          <p><strong>[이유]</strong> {reason}</p>
        </div>
      )}
    </div>
  );
}
