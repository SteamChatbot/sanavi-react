// 책임: 의뢰글 목록 페이지 (BoardListPage와 유사한 구조)
//       Input:  user (로그인 유저 — role로 변호사/고객 분기)
//       Output: 의뢰글 목록 테이블 + 상태·희망지역·최소보수 필터 + 페이지네이션
//       책임:   변호사(role_lawyer)는 전체 의뢰글 조회·클릭 시 상세(/matchboard/:id)로 이동
//               고객은 본인 의뢰글만 조회·클릭 시 입찰 목록(/matchboard/:id/bids)으로 이동
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Pagination from '../components/Pagination';
import { getMatchList } from '../api/matchApi';
import { isLawyer } from '../constants/roles';
import { SIDO_LIST } from '../constants/regions';
import './MatchBoardPage.css';

const STATUS_MAP = {
  OPEN:      { label: '모집중', color: 'primary'  },
  BIDDING:   { label: '입찰중', color: 'pending'  },
  CLOSED:    { label: '마감',   color: 'ok'       },
  CANCELLED: { label: '취소',   color: 'rejected' },
};

const STATUS_OPTIONS = [
  { value: '',          label: '전체' },
  { value: 'OPEN',      label: '모집중' },
  { value: 'BIDDING',   label: '입찰중' },
  { value: 'CLOSED',    label: '마감' },
  { value: 'CANCELLED', label: '취소' },
];

export default function MatchBoardPage({ user }) {
  const lawyer = isLawyer(user?.role);
  const [items, setItems]           = useState([]);
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading]       = useState(true);

  const [filterStatus, setFilterStatus]           = useState('');
  const [filterRegion, setFilterRegion]           = useState('');
  const [filterMinPrice, setFilterMinPrice]       = useState('');

  const size = 10;

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = await getMatchList({
          page, size,
          status: filterStatus || undefined,
          preferredRegion: filterRegion || undefined,
          minPrice: filterMinPrice ? Number(filterMinPrice) : undefined,
        });
        if (!cancelled) {
          setItems(res?.data?.contents ?? []);
          setTotalCount(res?.data?.totalCount ?? 0);
          setTotalPages(res?.data?.totalPages ?? 1);
        }
      } catch (e) {
        if (!cancelled) {
          console.error(e);
          alert(e.message || '목록을 불러오지 못했습니다.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [page, filterStatus, filterRegion, filterMinPrice]);

  // 상태·지역 변경 — 즉시 반영 (1페이지 리셋)
  const handleStatusChange   = (val) => { setFilterStatus(val);   setPage(1); };
  const handleRegionChange   = (e)   => { setFilterRegion(e.target.value); setPage(1); };
  // 최소보수 — Enter 또는 버튼으로 적용
  const handleMinPriceApply  = ()    => { setPage(1); };
  const handleMinPriceKey    = (e)   => { if (e.key === 'Enter') handleMinPriceApply(); };

  const resetFilter = () => {
    setFilterStatus('');
    setFilterRegion('');
    setFilterMinPrice('');
    setPage(1);
  };

  const handlePageChange = (p) => { setPage(p); };

  return (
    <div className="mb-page">
      <Navbar user={user} />
      <div className="mb-container">

        <div className="mb-header">
          <div>
            <h1 className="mb-header__title">
              {lawyer ? '입찰 가능한 의뢰' : '변호사 매칭 의뢰글'}
            </h1>
            <p className="mb-header__sub">
              {lawyer
                ? '고객이 등록한 의뢰글에 입찰하세요'
                : '의뢰글을 확인하거나 새 의뢰를 등록하세요'}
            </p>
          </div>
          {user && (
            <Link to="/matchboard/write">
              <Button variant="primary" size="sm">의뢰 등록</Button>
            </Link>
          )}
        </div>

          <>
            {/* 필터 영역 */}
            <div className="mb-filter">
              {/* 상태 필터 — 버튼 그룹 */}
              <div className="mb-filter__group">
                <span className="mb-filter__label">상태</span>
                <div className="mb-filter__status-wrap">
                  {STATUS_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      className={`mb-filter__status-btn${filterStatus === opt.value ? ' mb-filter__status-btn--active' : ''}`}
                      onClick={() => handleStatusChange(opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-filter__row">
                {/* 희망 지역 필터 */}
                <div className="mb-filter__group">
                  <span className="mb-filter__label">희망 지역</span>
                  <select
                    className="mb-filter__select"
                    value={filterRegion}
                    onChange={handleRegionChange}
                  >
                    <option value="">전체 지역</option>
                    {SIDO_LIST.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                {/* 최소 희망 보수 필터 */}
                <div className="mb-filter__group">
                  <span className="mb-filter__label">최소 희망 보수</span>
                  <div className="mb-filter__price-wrap">
                    <input
                      className="mb-filter__price-input"
                      type="number"
                      placeholder="예: 500000"
                      min={0}
                      value={filterMinPrice}
                      onChange={e => setFilterMinPrice(e.target.value)}
                      onKeyDown={handleMinPriceKey}
                    />
                    <button className="mb-filter__price-btn" onClick={handleMinPriceApply}>적용</button>
                  </div>
                </div>

                {/* 초기화 */}
                {(filterStatus || filterRegion || filterMinPrice) && (
                  <button className="mb-filter__reset" onClick={resetFilter}>초기화</button>
                )}
              </div>
            </div>

            <div className="mb-count">총 {totalCount}건</div>

            <div className="mb-table">
              <div className="mb-table__head">
                <span>상태</span>
                <span>제목</span>
                <span>방식</span>
                <span>희망 지역</span>
                <span>희망 보수</span>
                <span>등록일</span>
              </div>

              {loading ? (
                <div className="mb-empty">의뢰글 불러오는 중...</div>
              ) : items.length === 0 ? (
                <div className="mb-empty">의뢰글이 없습니다.</div>
              ) : (
                items.map(item => {
                  const st = STATUS_MAP[item.status] ?? STATUS_MAP.OPEN;
                  return (
                    <div key={item.matchId} className="mb-table__row">
                      <div><Badge type={st.color}>{st.label}</Badge></div>
                      <div className="mb-row__title-wrap">
                        <Link
                          to={`/matchboard/${item.matchId}`}
                          className="mb-row__title">
                          {item.title}
                        </Link>
                      </div>
                      <div className="mb-row__type">
                        {item.matchType === 'AUCTION' ? '경매' : '직접'}
                      </div>
                      <div className="mb-row__region">
                        {item.preferredRegion || '지역 무관'}
                      </div>
                      <div className="mb-row__price">
                        ₩{item.price?.toLocaleString()}
                      </div>
                      <div className="mb-row__date">
                        {item.createdAt?.slice(0, 10)}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <Pagination currentPage={page} totalPages={totalPages} onPageChange={handlePageChange} />
          </>
      </div>
    </div>
  );
}
