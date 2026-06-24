// 책임: 의뢰글 목록 페이지 (BoardListPage와 유사한 구조)
//       Input:  user (로그인 유저 — role로 변호사/고객 분기)
//       Output: 의뢰글 목록 테이블 + 페이지네이션
//       책임:   변호사(role_lawyer)는 전체 의뢰글 조회·클릭 시 상세(/matchboard/:id)로 이동
//               고객은 본인 의뢰글만 조회·클릭 시 입찰 목록(/matchboard/:id/bids)으로 이동
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Pagination from '../components/Pagination';
import { getMatchList } from '../api/matchApi';
import './MatchBoardPage.css';

const STATUS_MAP = {
  OPEN:      { label: '모집중', color: 'primary'  },
  BIDDING:   { label: '입찰중', color: 'pending'  },
  CLOSED:    { label: '마감',   color: 'ok'       },
  CANCELLED: { label: '취소',   color: 'rejected' },
};

export default function MatchBoardPage({ user }) {
  const isLawyer = user?.role?.toUpperCase().replace('ROLE_', '') === 'LAWYER';
  const [items, setItems]           = useState([]);
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const size = 10;

  const fetchList = async (p = page) => {
    try {
      const res = await getMatchList({ page: p, size });
      setItems(res?.data?.contents ?? []);
      setTotalCount(res?.data?.totalCount ?? 0);
      setTotalPages(res?.data?.totalPages ?? 1);
    } catch (e) {
      console.error(e);
      alert(e.message || '목록을 불러오지 못했습니다.');
    }
  };

  useEffect(() => { fetchList(page); }, [page]);

  const handlePageChange = (p) => { setPage(p); };

  return (
    <div className="mb-page">
      <Navbar user={user} />
      <div className="mb-container">

        <div className="mb-header">
          <div>
            <h1 className="mb-header__title">
              {isLawyer ? '입찰 가능한 의뢰' : '변호사 매칭 의뢰글'}
            </h1>
            <p className="mb-header__sub">
              {isLawyer
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
            <div className="mb-count">총 {totalCount}건</div>

            <div className="mb-table">
              <div className="mb-table__head">
                <span>상태</span>
                <span>제목</span>
                <span>방식</span>
                <span>희망 보수</span>
                <span>등록일</span>
              </div>

              {items.length === 0 ? (
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
