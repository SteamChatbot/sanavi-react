// AI 분석관리 — 전체 분석이력 조회/검색, 분석결과 강제삭제
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import GaugeCard from '../../components/GaugeCard';
import Pagination from '../../components/Pagination';
import AdminLayout from './AdminLayout';
import { getAdminAnalysisList, getAdminAnalysisStats, forceDeleteAdminAnalysis } from '../../api/adminAnalysisApi';
import './AdminPage.css';

const PAGE_SIZE = 10;

function scoreBadgeType(score) {
  if (score >= 75) return 'ok';
  if (score >= 50) return 'pending';
  return 'rejected';
}

// "2026-06-30T10:02:00" -> "2026-06-30 10:02"
function formatDateTime(value) {
  if (!value) return '-';
  return value.replace('T', ' ').slice(0, 16);
}

export default function AdminAnalysisPage({ user, onLogout }) {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [listError, setListError] = useState('');

  const [stats, setStats] = useState(null);
  const [statsError, setStatsError] = useState('');

  const [page, setPage] = useState(1);

  // 입력 중인 값(draft) — "조회"를 눌러야 applied*로 커밋되어 실제 요청에 반영됨
  const [draftKeyword, setDraftKeyword] = useState('');
  const [draftScoreFilter, setDraftScoreFilter] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const [appliedScoreFilter, setAppliedScoreFilter] = useState('');

  function applyFilters() {
    setAppliedKeyword(draftKeyword.trim());
    setAppliedScoreFilter(draftScoreFilter);
    setPage(1);
  }

  function handleSearchKeyDown(e) {
    if (e.key === 'Enter') applyFilters();
  }

  // 목록 — page/필터(applied*)가 바뀔 때마다 조회
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await getAdminAnalysisList({
          page, size: PAGE_SIZE, keyword: appliedKeyword, scoreFilter: appliedScoreFilter,
        });
        if (!cancelled) {
          setItems(res.contents ?? []);
          setTotalCount(res.totalCount ?? 0);
          setTotalPages(res.totalPages || 1);
          setListError('');
        }
      } catch (err) {
        if (!cancelled) setListError(err.message || '분석 이력을 불러오지 못했습니다.');
      }
    }
    load();
    return () => { cancelled = true; };
  }, [page, appliedKeyword, appliedScoreFilter]);

  // 승인율 게이지 — 필터가 바뀔 때만 조회 (페이지네이션과 무관)
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await getAdminAnalysisStats({ keyword: appliedKeyword, scoreFilter: appliedScoreFilter });
        if (!cancelled) { setStats(res); setStatsError(''); }
      } catch (err) {
        if (!cancelled) setStatsError(err.message || '승인율 통계를 불러오지 못했습니다.');
      }
    }
    load();
    return () => { cancelled = true; };
  }, [appliedKeyword, appliedScoreFilter]);

  const isFiltered = Boolean(appliedKeyword || appliedScoreFilter);

  async function forceDelete(id) {
    if (!window.confirm(`분석 결과 ${id} 를 강제 삭제하시겠습니까?`)) return;

    try {
      await forceDeleteAdminAnalysis(id);
      setItems((prev) => prev.filter((a) => a.id !== id));
      setTotalCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      alert(err.message || '삭제에 실패했습니다.');
    }
  }

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
        {statsError && <div className="ad-empty">{statsError}</div>}
        <div className="ad-section__body ad-approval-row">
          <GaugeCard
            size={120}
            label="전체 평균 승인율"
            score={stats?.overallAverage != null ? Math.round(stats.overallAverage) : null}
            sub={`전체 ${stats?.overallCount ?? 0}건 기준`}
          />
          <GaugeCard
            size={120}
            label="검색결과 평균 승인율"
            score={isFiltered && stats?.filteredAverage != null ? Math.round(stats.filteredAverage) : null}
            sub={isFiltered ? `검색결과 ${stats?.filteredCount ?? 0}건 기준` : '검색·필터를 적용하면 결과가 표시됩니다'}
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
              value={draftKeyword}
              onChange={(e) => setDraftKeyword(e.target.value)}
              onKeyDown={handleSearchKeyDown}
            />
          </div>

          <select className="ad-select" value={draftScoreFilter} onChange={(e) => setDraftScoreFilter(e.target.value)}>
            <option value="">승인율 전체</option>
            <option value="high">높음 (75%↑)</option>
            <option value="mid">보통 (50~74%)</option>
            <option value="low">낮음 (50%↓)</option>
          </select>

          <Button size="sm" onClick={applyFilters}>조회</Button>

          <span className="ad-toolbar__spacer ad-toolbar__count">총 {totalCount}건</span>
        </div>

        {listError && <div className="ad-empty">{listError}</div>}

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

          {!listError && items.length === 0 ? (
            <div className="ad-empty">조건에 맞는 분석 이력이 없습니다.</div>
          ) : (
            items.map((a) => (
              <div className="ad-table__row" key={a.id}>
                <div className="ad-table__cell-strong">{a.id}</div>
                <div>{a.userId}</div>
                <div>{a.disease}</div>
                <div className="ad-table__cell-muted">{a.job}</div>
                <div><Badge type={scoreBadgeType(a.baseScore)}>{Math.round(a.baseScore)}%</Badge></div>
                <div className="ad-table__cell-muted">{formatDateTime(a.createdAt)}</div>
                <div className="ad-table__actions">
                  <Button variant="outline" size="xs" onClick={() => navigate(`/analysis/${a.id}`)}>상세보기</Button>
                  <Button variant="danger-solid" size="xs" onClick={() => forceDelete(a.id)}>강제삭제</Button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="ad-pagination-wrap">
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </section>
    </AdminLayout>
  );
}
