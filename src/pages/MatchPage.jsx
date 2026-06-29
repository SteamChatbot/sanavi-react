import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Avatar from '../components/Avatar';
import Button from '../components/Button';
import { SPECIALTY_LIST } from '../constants/specialties';
import { SIDO_LIST } from '../constants/regions';
import './MatchPage.css';

const LAWYERS = [
  { id:1, name:'김○○ 변호사', spec:'산재·노동법 전문', career:'경력 12년', rating:4.9, tags:['산업재해','직업병','노동법'],  color:'purple' },
  { id:2, name:'이○○ 변호사', spec:'산재 전문',        career:'경력 8년',  rating:4.7, tags:['산업재해','건설업재해'],       color:'amber'  },
  { id:3, name:'박○○ 변호사', spec:'노동·산재 전문',   career:'경력 15년', rating:5.0, tags:['산업재해','직업병'],           color:'teal'   },
];

export default function MatchPage({ user }) {
  const [fields, setFields] = useState([]);
  const [region, setRegion] = useState('전체');

  const toggleField = (f) => setFields(p => p.includes(f) ? p.filter(x => x !== f) : [...p, f]);

  const filtered = LAWYERS.filter(l => {
    const matchField  = fields.length === 0 || l.tags.some(t => fields.includes(t));
    const matchRegion = region === '전체' || l.region === region;
    return matchField && matchRegion;
  });

  return (
    <div className="match-page">
      <Navbar user={user} />

      <div className="match-layout">
        {/* 사이드바 */}
        <aside className="match-sidebar">
          <h2 className="match-sidebar__title">필터</h2>

          <div className="filter-group">
            <div className="filter-group__label">전문 분야</div>
            {SPECIALTY_LIST.map(f => (
              <label key={f} className="filter-check">
                <input type="checkbox" checked={fields.includes(f)} onChange={() => toggleField(f)} />
                {f}
              </label>
            ))}
          </div>

          <div className="filter-group">
            <div className="filter-group__label">지역</div>
            <select className="filter-select" value={region} onChange={e => setRegion(e.target.value)}>
              <option value="전체">전체</option>
              {SIDO_LIST.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <button className="filter-reset" onClick={() => { setFields([]); setRegion('전체'); }}>
            필터 초기화
          </button>
        </aside>

        {/* 리스트 */}
        <div className="match-list">
          <div className="match-list__count">{filtered.length}명의 변호사를 찾았습니다</div>
          {filtered.map(l => (
            <div key={l.id} className="lawyer-card">
              <Avatar name={l.name.charAt(0)} size="lg" color={l.color} />
              <div className="lawyer-card__info">
                <div className="lawyer-card__name">{l.name}</div>
                <div className="lawyer-card__spec">{l.spec} | {l.career}</div>
                <div className="lawyer-card__tags">
                  {l.tags.map(t => <span key={t} className="lawyer-card__tag">{t}</span>)}
                </div>
              </div>
              <Button variant="primary" size="sm">상담 신청</Button>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="match-empty">조건에 맞는 변호사가 없습니다.</div>
          )}
        </div>
      </div>
    </div>
  );
}
