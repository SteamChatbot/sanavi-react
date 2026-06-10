import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Avatar from '../components/Avatar';
import Button from '../components/Button';
import './MatchPage.css';

const LAWYERS = [
  { id:1, name:'김○○ 변호사', spec:'산재·노동법 전문', career:'경력 12년', rating:4.9, tags:['산재','직업병','노동법'],  color:'purple' },
  { id:2, name:'이○○ 변호사', spec:'산재 전문',        career:'경력 8년',  rating:4.7, tags:['산재','건설업'],          color:'amber'  },
  { id:3, name:'박○○ 변호사', spec:'노동·산재 전문',   career:'경력 15년', rating:5.0, tags:['산재','직업성질환'],      color:'teal'   },
];

const FIELD_OPTIONS  = ['산재', '노동법', '민사'];
const REGION_OPTIONS = ['전국', '서울', '경기', '부산'];

export default function MatchPage({ user }) {
  const [fields,  setFields]  = useState([]);
  const [region,  setRegion]  = useState('전국');
  const [minRate, setMinRate] = useState(0);

  const toggleField = (f) => setFields(p => p.includes(f) ? p.filter(x => x !== f) : [...p, f]);

  const filtered = LAWYERS.filter(l => {
    const matchField  = fields.length === 0 || l.tags.some(t => fields.includes(t));
    const matchRating = l.rating >= minRate;
    return matchField && matchRating;
  });

  return (
    <div className="match-page">
      <Navbar user={user} />

      {/* 미구현 배너 */}
      <div className="match-wip-banner">
        ⚠ 미구현 서비스 — 디자인 선행 화면입니다. match 테이블 구상 중이며, 개발 착수 전 기획 확정이 필요합니다.
      </div>

      <div className="match-layout">
        {/* 사이드바 */}
        <aside className="match-sidebar">
          <h2 className="match-sidebar__title">필터</h2>

          <div className="filter-group">
            <div className="filter-group__label">전문 분야</div>
            {FIELD_OPTIONS.map(f => (
              <label key={f} className="filter-check">
                <input type="checkbox" checked={fields.includes(f)} onChange={() => toggleField(f)} />
                {f}
              </label>
            ))}
          </div>

          <div className="filter-group">
            <div className="filter-group__label">지역</div>
            <select className="filter-select" value={region} onChange={e => setRegion(e.target.value)}>
              {REGION_OPTIONS.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>

          <div className="filter-group">
            <div className="filter-group__label">최소 평점</div>
            {[0, 3, 4, 4.5].map(v => (
              <label key={v} className="filter-check">
                <input type="radio" checked={minRate === v} onChange={() => setMinRate(v)} />
                {v === 0 ? '전체' : `${v}점 이상`}
              </label>
            ))}
          </div>

          <button className="filter-reset" onClick={() => { setFields([]); setRegion('전국'); setMinRate(0); }}>
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
                <div className="lawyer-card__rating">
                  <span className="lawyer-card__stars">{'★'.repeat(Math.floor(l.rating))}</span>
                  <span className="lawyer-card__score">{l.rating}</span>
                </div>
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
