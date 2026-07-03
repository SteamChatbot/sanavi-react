// 검색 가능한 다중선택 드롭다운 — 옵션이 많아서(예: 직업) 체크박스 나열이 아니라 검색+스크롤로 골라야 할 때 사용
// 외부 라이브러리 없음(package.json에 select류 라이브러리 없어서 직접 구현, AdminSparkline과 동일 방침)
import React, { useEffect, useMemo, useRef, useState } from 'react';
import './MultiSelectDropdown.css';

/**
 * MultiSelectDropdown
 * @param {string[]} options - 선택 가능한 전체 옵션
 * @param {string[]} selected - 현재 선택된 값
 * @param {(next: string[]) => void} onChange
 * @param {string} [placeholder]
 */
export default function MultiSelectDropdown({ options, selected, onChange, placeholder = '전체' }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const rootRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = useMemo(
    () => options.filter((o) => o.toLowerCase().includes(search.toLowerCase())),
    [options, search],
  );

  function toggle(option) {
    if (selected.includes(option)) {
      onChange(selected.filter((v) => v !== option));
    } else {
      onChange([...selected, option]);
    }
  }

  const label = selected.length === 0 ? placeholder : `${selected.length}개 선택됨`;

  return (
    <div className="msd" ref={rootRef}>
      <button type="button" className="msd__trigger ad-select" onClick={() => setOpen((v) => !v)}>
        {label}
      </button>

      {open && (
        <div className="msd__panel">
          <input
            type="text"
            className="msd__search"
            placeholder="검색"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
          <div className="msd__list">
            {filteredOptions.length === 0 ? (
              <div className="msd__empty">일치하는 옵션이 없습니다.</div>
            ) : (
              filteredOptions.map((option) => (
                <label key={option} className="msd__item">
                  <input
                    type="checkbox"
                    checked={selected.includes(option)}
                    onChange={() => toggle(option)}
                  />
                  {option}
                </label>
              ))
            )}
          </div>
        </div>
      )}

      {selected.length > 0 && (
        <div className="msd__tags">
          {selected.map((option) => (
            <span key={option} className="msd__tag">
              {option}
              <button type="button" onClick={() => toggle(option)} aria-label={`${option} 선택 해제`}>×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
