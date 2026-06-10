import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Avatar from '../components/Avatar';
import Pagination from '../components/Pagination';
import './MatchBidListPage.css';

const SAMPLE_MATCH = {
  id: 1, title: '요추 추간판 탈출증 산재 신청 도움 요청',
  clientName: '김○○', price: 2000000, status: 'BIDDING',
  content: '건설현장에서 10년간 용접 작업 중 허리 부상을 입었습니다. 요추 추간판 탈출증 진단 후 산재 신청을 준비하고 있습니다.',
  createdAt: '2026.06.09',
};

const SAMPLE_BIDS = [
  { id: 1, lawyerName: '김○○ 변호사', specialty: '산재·노동법',  career: 12, rating: 4.9, bidPrice: 1200000, status: 'PENDING', message: '산재 전문으로 12년 경력입니다. 유사 케이스 승소율 90% 이상입니다.' },
  { id: 2, lawyerName: '이○○ 변호사', specialty: '산재',          career: 8,  rating: 4.7, bidPrice: 1500000, status: 'PENDING', message: '건설업 산재 전문으로 빠른 처리 가능합니다.' },
  { id: 3, lawyerName: '박○○ 변호사', specialty: '노동·산재',     career: 15, rating: 5.0, bidPrice: 1800000, status: 'PENDING', message: '15년 경력의 노동법 전문 변호사입니다.' },
];

const STATUS_MAP = {
  OPEN: { label: '모집중', color: 'primary' },
  BIDDING: { label: '입찰중', color: 'pending' },
  CLOSED: { label: '마감', color: 'ok' },
  CANCELLED: { label: '취소', color: 'rejected' },
};

export default function MatchBidListPage({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bids, setBids] = useState(SAMPLE_BIDS);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);

  const handleSelect = (bid) => {
    if (!window.confirm(`${bid.lawyerName}을 선택하시겠습니까?\n입찰가: ₩${bid.bidPrice.toLocaleString()}\n선택 후 의뢰가 확정됩니다.`)) return;
    setSelected(bid.id);
    // TODO: await api.selectBid(id, bid.id)
  };

  const handleClose = () => {
    if (!window.confirm('의뢰를 마감하시겠습니까?')) return;
    // TODO: await api.closeBid(id)
    navigate('/match');
  };

  const st = STATUS_MAP[SAMPLE_MATCH.status];

  return (
    <div className="mbl-page">
      <Navbar user={user} />
      <div className="mbl-container">

        {/* 의뢰글 요약 */}
        <div className="mbl-match-card">
          <div className="mbl-match-top">
            <Badge type={st.color}>{st.label}</Badge>
            <span className="mbl-match-date">{SAMPLE_MATCH.createdAt}</span>
          </div>
          <h1 className="mbl-match-title">{SAMPLE_MATCH.title}</h1>
          <div className="mbl-match-meta">
            <span className="mbl-match-price">희망 보수 ₩{SAMPLE_MATCH.price.toLocaleString()}</span>
            <span className="mbl-match-sep">·</span>
            <span className="mbl-match-name">의뢰인 {SAMPLE_MATCH.clientName}</span>
          </div>
          <p className="mbl-match-content">{SAMPLE_MATCH.content}</p>
        </div>

        <div className="mbl-layout">
          {/* 입찰 목록 */}
          <div className="mbl-bid-section">
            <div className="mbl-section-title">
              입찰 변호사 목록
              <span className="mbl-bid-count">{bids.length}건 · 입찰가 낮은 순</span>
            </div>

            <div className="mbl-bid-table">
              <div className="mbl-bid-th">
                <span>입찰가</span><span>변호사</span><span>전문분야</span>
                <span>경력</span><span>평점</span><span>선택</span>
              </div>
              {bids.map((bid, i) => (
                <div key={bid.id} className={`mbl-bid-row${i === 0 ? ' mbl-bid-row--top' : ''}`}>
                  <div className="mbl-bid-price">
                    {i === 0 && <span className="mbl-lowest">최저가</span>}
                    ₩{bid.bidPrice.toLocaleString()}
                  </div>
                  <div className="mbl-bid-lawyer">
                    <Avatar name={bid.lawyerName.charAt(0)} size="sm" />
                    <div>
                      <div className="mbl-lawyer-name">{bid.lawyerName}</div>
                      {bid.message && <div className="mbl-lawyer-msg">{bid.message}</div>}
                    </div>
                  </div>
                  <div className="mbl-bid-specialty">{bid.specialty}</div>
                  <div className="mbl-bid-career">{bid.career}년</div>
                  <div className="mbl-bid-rating">
                    <span className="mbl-stars">★</span>{bid.rating}
                  </div>
                  <div>
                    {selected === bid.id
                      ? <Badge type="ok">선택됨</Badge>
                      : <Button variant="primary" size="xs" onClick={() => handleSelect(bid)}>선택</Button>
                    }
                  </div>
                </div>
              ))}
            </div>
            <Pagination currentPage={page} totalPages={3} onPageChange={setPage} />
          </div>

          {/* 사이드 — 상태 관리 */}
          <aside className="mbl-sidebar">
            <div className="mbl-sidebar-card">
              <div className="mbl-sidebar-title">의뢰 상태</div>
              <div className="mbl-status-info">
                <Badge type={st.color} pill>{st.label}</Badge>
                <span className="mbl-bid-count-sm">입찰 {bids.length}건</span>
              </div>
              <Button variant="danger" size="sm" fullWidth onClick={handleClose} style={{ marginTop: 12 }}>
                의뢰 마감
              </Button>
            </div>

            <div className="mbl-sidebar-card mbl-notice-card">
              <strong>안내</strong>
              <p>입찰가가 낮은 순으로 정렬됩니다.</p>
              <p>변호사를 선택하면 의뢰가 확정되고 추가 입찰이 불가합니다.</p>
            </div>

            {SAMPLE_MATCH.matchType === 'DIRECT' && (
              <div className="mbl-sidebar-card">
                <div className="mbl-sidebar-title">직접 선택</div>
                <p className="mbl-sidebar-desc">변호사 목록에서 원하는 변호사를 직접 선택할 수 있습니다.</p>
                <Link to="/match">
                  <Button variant="outline" size="sm" fullWidth style={{ marginTop: 8 }}>변호사 목록 보기</Button>
                </Link>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
