// AI 분석관리 — 전체 분석이력 조회/검색, 분석결과 강제삭제
import React, { useMemo, useState } from 'react';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import GaugeCard from '../../components/GaugeCard';
import Pagination from '../../components/Pagination';
import AdminLayout from './AdminLayout';
import './AdminPage.css';

const MOCK_ANALYSIS = [
  { id: 'a1029', userId: 'kimcs01', disease: '소음성 난청', job: '조선소 용접공', score: 82, createdAt: '2026-06-30 10:02' },
  { id: 'a1028', userId: 'parkmj', disease: '근막동통증후군', job: '택배 상하차', score: 64, createdAt: '2026-06-30 08:47' },
  { id: 'a1027', userId: 'leesh', disease: '추간판탈출증', job: '건설 형틀목공', score: 58, createdAt: '2026-06-29 22:13' },
  { id: 'a1026', userId: 'jungyr', disease: '수근관증후군', job: '간호조무사', score: 45, createdAt: '2026-06-29 19:30' },
  { id: 'a1025', userId: 'choiwd', disease: '진폐증', job: '광산 채굴공', score: 91, createdAt: '2026-06-29 14:08' },
];

function scoreBadgeType(score) {
  if (score >= 75) return 'ok';
  if (score >= 50) return 'pending';
  return 'rejected';
}

function average(list) {
  if (list.length === 0) return null;
  return Math.round(list.reduce((sum, a) => sum + a.score, 0) / list.length);
}

export default function AdminAnalysisPage({ user, onLogout }) {
  const [items, setItems] = useState(MOCK_ANALYSIS);
  const [keyword, setKeyword] = useState('');
  const [scoreFilter, setScoreFilter] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return items.filter((a) => {
      if (keyword && !`${a.userId}${a.disease}${a.job}`.toLowerCase().includes(keyword.toLowerCase())) return false;
      if (scoreFilter === 'high' && a.score < 75) return false;
      if (scoreFilter === 'mid' && (a.score < 50 || a.score >= 75)) return false;
      if (scoreFilter === 'low' && a.score >= 50) return false;
      return true;
    });
  }, [items, keyword, scoreFilter]);

  const isFiltered = Boolean(keyword || scoreFilter);
  const overallAvg = average(items);
  const filteredAvg = average(filtered);

  const forceDelete = (id) => {
    if (!window.confirm(`분석 결과 ${id} 를 강제 삭제하시겠습니까?`)) return;
    setItems((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <AdminLayout
      title="AI 분석관리"
      description="전체 회원의 AI 분석 이력을 조회·검색하고 부적절한 분석 결과를 강제 삭제합니다."
      user={user}
      onLogout={onLogout}
    >
      <section className="ad-section">
        <div className="ad-section__head">
          <div>
            <div className="ad-section__title">승인율 현황</div>
            <div className="ad-section__desc">전체 분석 평균 승인율과 현재 검색·필터 결과의 평균 승인율을 비교합니다.</div>
          </div>
        </div>
        <div className="ad-section__body ad-approval-row">
          <GaugeCard
            size={120}
            label="전체 평균 승인율"
            score={overallAvg}
            sub={`전체 ${items.length}건 기준`}
          />
          <GaugeCard
            size={120}
            label="검색결과 평균 승인율"
            score={filteredAvg}
            sub={isFiltered ? `검색결과 ${filtered.length}건 기준` : '검색·필터를 적용하면 결과가 표시됩니다'}
          />
        </div>
      </section>

      <section className="ad-section">
        <div className="ad-toolbar">
          <div className="ad-search">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              placeholder="회원ID, 질병명, 직업 검색"
              value={keyword}
              onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
            />
          </div>

          <select className="ad-select" value={scoreFilter} onChange={(e) => { setScoreFilter(e.target.value); setPage(1); }}>
            <option value="">승인율 전체</option>
            <option value="high">높음 (75%↑)</option>
            <option value="mid">보통 (50~74%)</option>
            <option value="low">낮음 (50%↓)</option>
          </select>

          <span className="ad-toolbar__spacer ad-toolbar__count">총 {filtered.length}건</span>
        </div>

        <div className="ad-table ad-table--analysis">
          <div className="ad-table__head">
            <span>분석ID</span>
            <span>회원ID</span>
            <span>질병명</span>
            <span>직업</span>
            <span>승인율</span>
            <span>분석일시</span>
            <span>관리</span>
          </div>

          {filtered.length === 0 ? (
            <div className="ad-empty">조건에 맞는 분석 이력이 없습니다.</div>
          ) : (
            filtered.map((a) => (
              <div className="ad-table__row" key={a.id}>
                <div className="ad-table__cell-strong">{a.id}</div>
                <div>{a.userId}</div>
                <div>{a.disease}</div>
                <div className="ad-table__cell-muted">{a.job}</div>
                <div><Badge type={scoreBadgeType(a.score)}>{a.score}%</Badge></div>
                <div className="ad-table__cell-muted">{a.createdAt}</div>
                <div className="ad-table__actions">
                  <Button variant="outline" size="xs">상세보기</Button>
                  <Button variant="danger-solid" size="xs" onClick={() => forceDelete(a.id)}>강제삭제</Button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="ad-pagination-wrap">
          <Pagination currentPage={page} totalPages={1} onPageChange={setPage} />
        </div>
      </section>
    </AdminLayout>
  );
}
