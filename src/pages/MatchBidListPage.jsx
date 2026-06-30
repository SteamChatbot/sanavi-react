import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Avatar from '../components/Avatar';
import Pagination from '../components/Pagination';
import ReportModal from '../components/ReportModal';
import {
  getMatchDetail, getBidList, selectBid, rejectBid, cancelBid,
  updateMatchStatus, createBid, getFileDownloadUrl,
} from '../api/matchApi';
import { parseRole, isLawyer } from '../constants/roles';
import './MatchBidListPage.css';

const STATUS_MAP = {
  OPEN:      { label: '모집중', color: 'primary'  },
  BIDDING:   { label: '입찰중', color: 'pending'  },
  CLOSED:    { label: '마감',   color: 'ok'       },
  CANCELLED: { label: '취소',   color: 'rejected' },
};

export default function MatchBidListPage({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const role     = parseRole(user?.role);
  const lawyer   = isLawyer(user?.role);

  const [match, setMatch]     = useState(null);
  const [bids, setBids]       = useState([]);
  const [page, setPage]       = useState(1);
  const [loading, setLoading] = useState(true);

  const [showBidForm, setShowBidForm]   = useState(false);
  const [bidForm, setBidForm]           = useState({ bidPrice: '', message: '' });
  const [bidErrors, setBidErrors]       = useState({});
  const [submitting, setSubmitting]     = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [matchRes, bidsRes] = await Promise.all([
          getMatchDetail(Number(id)),
          getBidList(Number(id)),
        ]);
        setMatch(matchRes?.data ?? null);
        setBids(bidsRes?.data ?? []);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleDownload = async (fileId) => {
    try {
      const res = await getFileDownloadUrl(fileId);
      window.open(res.data, '_blank');
    } catch {
      alert('파일 다운로드에 실패했습니다.');
    }
  };

  const handleCancelMatch = async () => {
    if (!window.confirm('의뢰를 취소하시겠습니까?')) return;
    await updateMatchStatus(Number(id), 'CANCELLED', user?.userId);
    navigate('/matchboard');
  };

  // 의뢰글 작성자 — 확정
  const handleSelect = async (bid) => {
    if (!window.confirm(`${bid.lawyerName}님을 확정하시겠습니까?\n확정 후 추가 입찰이 불가합니다.`)) return;
    await selectBid(Number(id), bid.bidId);
    setBids(prev => prev.map(b => ({
      ...b,
      status: b.bidId === bid.bidId ? 'SELECTED' : 'REJECTED',
    })));
    setMatch(prev => prev ? { ...prev, status: 'CLOSED' } : prev);
  };

  // 의뢰글 작성자 — 거절
  const handleReject = async (bid) => {
    if (!window.confirm(`${bid.lawyerName}님의 입찰을 거절하시겠습니까?`)) return;
    await rejectBid(Number(id), bid.bidId, user?.userId);
    setBids(prev => prev.map(b =>
      b.bidId === bid.bidId ? { ...b, status: 'REJECTED' } : b
    ));
  };

  // 변호사 — 본인 입찰 취소
  const handleCancelBid = async (bid) => {
    if (!window.confirm('입찰을 취소하시겠습니까?')) return;
    await cancelBid(bid.bidId, user?.userId);
    setBids(prev => prev.filter(b => b.bidId !== bid.bidId));
  };

  // 변호사 — 입찰 등록
  const validateBid = () => {
    const e = {};
    const p = Number(bidForm.bidPrice);
    if (!bidForm.bidPrice || isNaN(p) || p <= 0)
      e.bidPrice = '입찰가를 올바르게 입력해 주세요.';
    else if (p > 1_000_000_000_000)
      e.bidPrice = '입찰가는 1조 원을 초과할 수 없습니다.';
    return e;
  };

  const handleBidSubmit = async (e) => {
    e.preventDefault();
    const errs = validateBid();
    if (Object.keys(errs).length) { setBidErrors(errs); return; }
    setSubmitting(true);
    try {
      await createBid(Number(id), {
        lawyerId: user?.userId,
        bidPrice: Number(bidForm.bidPrice),
        message: bidForm.message,
      });
      alert('입찰이 등록되었습니다.');
      navigate('/matchboard');
    } catch (err) {
      alert(err.message || '입찰 등록에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="mbl-page"><Navbar user={user} /><div className="mbl-loading">불러오는 중...</div></div>;
  if (!match)  return <div className="mbl-page"><Navbar user={user} /><div className="mbl-loading">의뢰글을 찾을 수 없습니다.</div></div>;

  const st       = STATUS_MAP[match.status] ?? STATUS_MAP.OPEN;
  const isClosed = match.status === 'CLOSED' || match.status === 'CANCELLED';
  const isOwner  = user?.userId === match?.userId;

  return (
    <div className="mbl-page">
      <Navbar user={user} />
      <div className="mbl-container">
        <button className="mbl-back" onClick={() => navigate('/matchboard')}>← 목록으로</button>

        <div className="mbl-layout">
          <div>
            {/* 의뢰글 상세 */}
            <div className="mbl-match-card mbl-detail-card">
              <div className="mbl-match-top">
                <Badge type={st.color}>{st.label}</Badge>
                <span className="mbl-type">{match.matchType === 'AUCTION' ? '경매 방식' : '직접 선택'}</span>
                <span className="mbl-match-date">{match.createdAt?.slice(0, 10)}</span>
              </div>
              <h1 className="mbl-match-title">{match.title}</h1>
              <div className="mbl-match-meta">
                <span className="mbl-match-price">희망 보수 ₩{match.price?.toLocaleString()}</span>
                <span className="mbl-match-sep">·</span>
                <span className="mbl-match-region">희망 지역 {match.preferredRegion || '무관'}</span>
                <span className="mbl-match-sep">·</span>
                <span className="mbl-match-name">의뢰인 {match.requesterName}</span>
                {user?.userId && user.userId !== match.userId && (
                  <button
                    type="button"
                    className="mbl-report-btn"
                    onClick={() => setShowReportModal(true)}
                  >
                    신고
                  </button>
                )}
              </div>
              <p className="mbl-match-content">{match.content}</p>
              {match.files?.length > 0 && (
                <div className="mbl-files">
                  <div className="mbl-files__label">첨부파일</div>
                  {match.files.map(f => (
                    <button key={f.fileId} onClick={() => handleDownload(f.fileId)} className="mbl-file-item mbl-file-link">
                      📎 {f.originalName}
                      <span className="mbl-file-size">({(f.fileSize / 1024 / 1024).toFixed(1)}MB)</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 입찰 변호사 목록 */}
            <div className="mbl-bid-section">
              <div className="mbl-section-title">
                <span>입찰 변호사 목록</span>
                <span className="mbl-bid-count">{bids.length}건 · 입찰가 낮은 순</span>
                {lawyer && !isClosed && (
                  <Button
                    variant={showBidForm ? 'outline' : 'primary'}
                    size="xs"
                    onClick={() => { setShowBidForm(p => !p); setBidErrors({}); }}
                  >
                    {showBidForm ? '닫기' : '입찰'}
                  </Button>
                )}
              </div>

              {/* 변호사 입찰 폼 — 인라인 */}
              {lawyer && showBidForm && (
                <form className="mbl-bid-form-inline" onSubmit={handleBidSubmit} noValidate>
                  <div className="mbl-bid-form-row">
                    <div className="mbl-field" style={{ flex: 1 }}>
                      <label className="mbl-label">입찰가 (원)</label>
                      <input
                        className={`mbl-input${bidErrors.bidPrice ? ' mbl-input--error' : ''}`}
                        type="number"
                        placeholder={`${match.price?.toLocaleString()} 미만`}
                        min={1}
                        max={1000000000000}
                        value={bidForm.bidPrice}
                        onChange={e => { setBidForm(p => ({ ...p, bidPrice: e.target.value })); setBidErrors({}); }}
                      />
                      {bidErrors.bidPrice && <p className="mbl-error">{bidErrors.bidPrice}</p>}
                    </div>
                    <div className="mbl-field" style={{ flex: 2 }}>
                      <label className="mbl-label">소개 메시지 (선택)</label>
                      <input
                        className="mbl-input"
                        type="text"
                        placeholder="경력, 유사 사건 경험 등"
                        value={bidForm.message}
                        onChange={e => setBidForm(p => ({ ...p, message: e.target.value }))}
                      />
                    </div>
                    <Button type="submit" variant="primary" size="sm" loading={submitting} style={{ alignSelf: 'flex-end' }}>
                      입찰 등록
                    </Button>
                  </div>
                </form>
              )}

              <div className="mbl-bid-table">
                <div className="mbl-bid-th">
                  <span>입찰가</span><span>변호사</span><span>전문분야</span>
                  <span>경력</span><span>액션</span>
                </div>
                {bids.length === 0 ? (
                  <div className="mbl-bid-empty">아직 입찰한 변호사가 없습니다.</div>
                ) : bids.map((bid, i) => (
                  <div key={bid.bidId} className={`mbl-bid-row${i === 0 ? ' mbl-bid-row--top' : ''}`}>
                    <div className="mbl-bid-price">
                      {i === 0 && <span className="mbl-lowest">최저가</span>}
                      ₩{bid.bidPrice?.toLocaleString()}
                    </div>
                    <div className="mbl-bid-lawyer">
                      <Avatar name={bid.lawyerName?.charAt(0)} size="sm" />
                      <div>
                        <div className="mbl-lawyer-name">{bid.lawyerName}</div>
                        {bid.message && <div className="mbl-lawyer-msg">{bid.message}</div>}
                      </div>
                    </div>
                    <div className="mbl-bid-specialty">{bid.lawyerJob}</div>
                    <div className="mbl-bid-career">{bid.careerYears != null ? `${bid.careerYears}년` : '-'}</div>
                    <div className="mbl-bid-actions">
                      {bid.status === 'SELECTED' && <Badge type="ok">확정됨</Badge>}
                      {bid.status === 'REJECTED' && <Badge type="rejected">거절됨</Badge>}
                      {bid.status === 'PENDING' && (
                        <>
                          {/* 의뢰글 작성자 */}
                          {isOwner && !isClosed && (
                            <>
                              <Button variant="primary" size="xs" onClick={() => handleSelect(bid)}>확정하기</Button>
                              <Button variant="danger" size="xs" onClick={() => handleReject(bid)}>거절하기</Button>
                            </>
                          )}
                          {/* 변호사 본인 입찰 취소 */}
                          {lawyer && bid.lawyerId === user?.userId && (
                            <Button variant="outline" size="xs" onClick={() => handleCancelBid(bid)}>취소</Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <Pagination currentPage={page} totalPages={Math.ceil(bids.length / 10) || 1} onPageChange={setPage} />
            </div>
          </div>

          {/* 사이드바 */}
          <aside className="mbl-sidebar">
            <div className="mbl-sidebar-card">
              <div className="mbl-sidebar-title">의뢰 상태</div>
              <div className="mbl-status-info">
                <Badge type={st.color}>{st.label}</Badge>
                <span className="mbl-bid-count-sm">입찰 {bids.length}건</span>
              </div>
              {isOwner && !isClosed && (
                <Button variant="danger" size="sm" fullWidth onClick={handleCancelMatch} style={{ marginTop: 12 }}>
                  의뢰 취소
                </Button>
              )}
            </div>
            <div className="mbl-sidebar-card mbl-notice-card">
              <strong>안내</strong>
              <p>입찰가가 낮은 순으로 정렬됩니다.</p>
              <p>변호사를 확정하면 의뢰가 마감되고 추가 입찰이 불가합니다.</p>
            </div>
          </aside>
        </div>
      </div>

      {showReportModal && (
        <ReportModal
          targetUserId={match.userId}
          targetName={match.requesterName}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
}
