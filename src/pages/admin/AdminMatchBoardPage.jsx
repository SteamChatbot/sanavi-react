// 의뢰글게시판관리 — 변호사 매칭 의뢰글 조회/검색, 상태별 필터, 신고된 의뢰글·댓글 관리, 강제마감·삭제
import React, { useMemo, useState } from 'react';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Pagination from '../../components/Pagination';
import AdminLayout from './AdminLayout';
import './AdminPage.css';

const STATUS_MAP = {
  OPEN:      { label: '모집중', type: 'primary'  },
  BIDDING:   { label: '입찰중', type: 'pending'  },
  CLOSED:    { label: '마감',   type: 'ok'       },
  CANCELLED: { label: '취소',   type: 'rejected' },
};

const STATUS_OPTIONS = [
  { value: '',          label: '상태 전체' },
  { value: 'OPEN',      label: '모집중' },
  { value: 'BIDDING',   label: '입찰중' },
  { value: 'CLOSED',    label: '마감' },
  { value: 'CANCELLED', label: '취소' },
];

const MOCK_MATCH_POSTS = [
  { id: 211, title: '조선소 소음성 난청 산재 변호사 구합니다', author: 'kimcs01', status: 'BIDDING', type: 'AUCTION', bidCount: 4, createdAt: '2026-06-30', reports: 2 },
  { id: 210, title: '추간판탈출증 산재 신청 대리 의뢰', author: 'leesh',   status: 'OPEN',    type: 'AUCTION', bidCount: 0, createdAt: '2026-06-29', reports: 0 },
  { id: 209, title: '특정 변호사님께 직접 의뢰드립니다', author: 'jungyr',  status: 'CLOSED',   type: 'DIRECT',  bidCount: 1, createdAt: '2026-06-28', reports: 0 },
  { id: 208, title: '진폐증 산재 이의신청 대리 구함', author: 'choiwd',  status: 'CANCELLED', type: 'AUCTION', bidCount: 2, createdAt: '2026-06-27', reports: 5 },
];

const MOCK_MATCH_COMMENTS = [
  { id: 601, matchId: 211, matchTitle: '조선소 소음성 난청 산재 변호사 구합니다', author: '변호사B', content: '입찰 관련 욕설성 댓글입니다.', createdAt: '2026-06-30', reports: 3 },
  { id: 600, matchId: 208, matchTitle: '진폐증 산재 이의신청 대리 구함', author: 'spamlawyer', content: '광고 홍보성 댓글입니다.', createdAt: '2026-06-27', reports: 5 },
  { id: 599, matchId: 210, matchTitle: '추간판탈출증 산재 신청 대리 의뢰', author: '변호사C', content: '정상적인 입찰 의견입니다.', createdAt: '2026-06-29', reports: 0 },
];

export default function AdminMatchBoardPage({ user, onLogout }) {
  const [posts, setPosts] = useState(MOCK_MATCH_POSTS);
  const [comments, setComments] = useState(MOCK_MATCH_COMMENTS);
  const [tab, setTab] = useState('all');
  const [statusFilter, setStatusFilter] = useState('');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);

  const reportedPostCount = useMemo(() => posts.filter((p) => p.reports > 0).length, [posts]);
  const reportedCommentCount = useMemo(() => comments.filter((c) => c.reports > 0).length, [comments]);

  const filteredPosts = useMemo(() => {
    if (tab === 'reportedComments') return [];
    return posts.filter((p) => {
      if (tab === 'reportedPosts' && p.reports === 0) return false;
      if (statusFilter && p.status !== statusFilter) return false;
      if (keyword && !`${p.title}${p.author}`.toLowerCase().includes(keyword.toLowerCase())) return false;
      return true;
    });
  }, [posts, tab, statusFilter, keyword]);

  const filteredComments = useMemo(() => {
    if (tab !== 'reportedComments') return [];
    return comments.filter((c) => {
      if (c.reports === 0) return false;
      if (keyword && !`${c.content}${c.author}${c.matchTitle}`.toLowerCase().includes(keyword.toLowerCase())) return false;
      return true;
    });
  }, [comments, tab, keyword]);

  const forceClose = (id) => {
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, status: 'CLOSED' } : p)));
  };

  const deletePost = (id) => {
    if (!window.confirm(`의뢰글 #${id} 를 삭제하시겠습니까?`)) return;
    setPosts((prev) => prev.filter((p) => p.id !== id));
  };

  const deleteComment = (id) => {
    if (!window.confirm(`댓글 #${id} 를 삭제하시겠습니까?`)) return;
    setComments((prev) => prev.filter((c) => c.id !== id));
  };

  const total = tab === 'reportedComments' ? filteredComments.length : filteredPosts.length;

  return (
    <AdminLayout
      title="의뢰글게시판관리"
      description="변호사 매칭 의뢰글을 조회·검색하고, 신고가 누적된 의뢰글·댓글을 우선 확인하여 강제마감·삭제합니다."
      user={user}
      onLogout={onLogout}
    >
      <section className="ad-section">
        <div className="ad-toolbar">
          <div className="ad-tag-group">
            <button className={`ad-tag${tab === 'all' ? ' ad-tag--active' : ''}`} onClick={() => { setTab('all'); setPage(1); }}>전체 의뢰글</button>
            <button className={`ad-tag${tab === 'reportedPosts' ? ' ad-tag--active' : ''}`} onClick={() => { setTab('reportedPosts'); setPage(1); }}>
              신고된 의뢰글 ({reportedPostCount})
            </button>
            <button className={`ad-tag${tab === 'reportedComments' ? ' ad-tag--active' : ''}`} onClick={() => { setTab('reportedComments'); setPage(1); }}>
              신고된 댓글 ({reportedCommentCount})
            </button>
          </div>
        </div>

        <div className="ad-toolbar">
          {tab !== 'reportedComments' && (
            <select className="ad-select" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
              {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          )}

          <div className="ad-search">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              placeholder={tab === 'reportedComments' ? '댓글 내용, 작성자 검색' : '제목, 작성자 검색'}
              value={keyword}
              onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
            />
          </div>

          <span className="ad-toolbar__spacer ad-toolbar__count">총 {total}건</span>
        </div>

        {tab === 'reportedComments' ? (
          <div className="ad-table ad-table--comments">
            <div className="ad-table__head">
              <span>No</span>
              <span>원본 의뢰글</span>
              <span>작성자</span>
              <span>내용</span>
              <span>신고수</span>
              <span>작성일</span>
              <span>관리</span>
            </div>

            {filteredComments.length === 0 ? (
              <div className="ad-empty">신고된 댓글이 없습니다.</div>
            ) : (
              filteredComments.map((c) => (
                <div className="ad-table__row" key={c.id}>
                  <div className="ad-table__cell-muted">{c.id}</div>
                  <div className="ad-table__cell-strong">{c.matchTitle}</div>
                  <div>{c.author}</div>
                  <div className="ad-table__cell-muted">{c.content}</div>
                  <div><Badge type="rejected">{c.reports}건</Badge></div>
                  <div className="ad-table__cell-muted">{c.createdAt}</div>
                  <div className="ad-table__actions">
                    <Button variant="danger-solid" size="xs" onClick={() => deleteComment(c.id)}>삭제</Button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="ad-table ad-table--matchboard">
            <div className="ad-table__head">
              <span>제목</span>
              <span>작성자</span>
              <span>상태</span>
              <span>방식</span>
              <span>입찰수</span>
              <span>등록일</span>
              <span>관리</span>
            </div>

            {filteredPosts.length === 0 ? (
              <div className="ad-empty">조건에 맞는 의뢰글이 없습니다.</div>
            ) : (
              filteredPosts.map((p) => {
                const st = STATUS_MAP[p.status];
                return (
                  <div className="ad-table__row" key={p.id}>
                    <div className="ad-table__cell-strong">
                      {p.title}{' '}
                      {p.reports > 0 && <Badge type="rejected">신고 {p.reports}건</Badge>}
                    </div>
                    <div>{p.author}</div>
                    <div><Badge type={st.type}>{st.label}</Badge></div>
                    <div className="ad-table__cell-muted">{p.type === 'AUCTION' ? '경매' : '직접'}</div>
                    <div>{p.bidCount}건</div>
                    <div className="ad-table__cell-muted">{p.createdAt}</div>
                    <div className="ad-table__actions">
                      {p.status !== 'CLOSED' && (
                        <Button variant="outline" size="xs" onClick={() => forceClose(p.id)}>강제마감</Button>
                      )}
                      <Button variant="danger-solid" size="xs" onClick={() => deletePost(p.id)}>삭제</Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        <div className="ad-pagination-wrap">
          <Pagination currentPage={page} totalPages={1} onPageChange={setPage} />
        </div>
      </section>
    </AdminLayout>
  );
}
