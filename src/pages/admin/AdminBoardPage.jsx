// 게시판관리 — 전체 게시글 조회/검색, 신고된 글·신고된 댓글 별도 탭, 강제삭제
import React, { useMemo, useState } from 'react';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Pagination from '../../components/Pagination';
import AdminLayout from './AdminLayout';
import './AdminPage.css';

const MOCK_POSTS = [
  { id: 102, title: '산재 승인 받은 후기 공유합니다', author: 'kimcs01', createdAt: '2026-06-30', views: 184, reports: 0 },
  { id: 101, title: '이거 욕설인지 확인좀요 (신고)', author: 'parkmj', createdAt: '2026-06-29', views: 52, reports: 3 },
  { id: 100, title: '변호사님 추천 받습니다', author: 'leesh', createdAt: '2026-06-29', views: 97, reports: 0 },
  { id: 99,  title: '광고성 게시글 의심', author: 'unknown99', createdAt: '2026-06-28', views: 12, reports: 5 },
  { id: 98,  title: '산재 신청 절차 질문있어요', author: 'jungyr', createdAt: '2026-06-28', views: 73, reports: 0 },
];

const MOCK_COMMENTS = [
  { id: 501, postId: 102, postTitle: '산재 승인 받은 후기 공유합니다', author: 'parkmj', content: '축하드려요! 저도 곧 신청하려구요.', createdAt: '2026-06-30', reports: 0 },
  { id: 500, postId: 101, postTitle: '이거 욕설인지 확인좀요 (신고)', author: 'unknown22', content: '욕설성 표현이 포함된 댓글입니다.', createdAt: '2026-06-29', reports: 4 },
  { id: 499, postId: 99,  postTitle: '광고성 게시글 의심', author: 'spamuser', content: '광고 링크가 포함된 댓글입니다.', createdAt: '2026-06-28', reports: 6 },
  { id: 498, postId: 100, postTitle: '변호사님 추천 받습니다', author: 'leesh', content: '저도 같은 고민이에요.', createdAt: '2026-06-29', reports: 0 },
];

const TAB_LABEL = { all: '전체글', reportedPosts: '신고된 글', reportedComments: '신고된 댓글' };

export default function AdminBoardPage({ user, onLogout }) {
  const [posts, setPosts] = useState(MOCK_POSTS);
  const [comments, setComments] = useState(MOCK_COMMENTS);
  const [tab, setTab] = useState('all');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);

  const reportedPostCount = useMemo(() => posts.filter((p) => p.reports > 0).length, [posts]);
  const reportedCommentCount = useMemo(() => comments.filter((c) => c.reports > 0).length, [comments]);

  const filteredPosts = useMemo(() => {
    if (tab === 'reportedComments') return [];
    return posts.filter((p) => {
      if (tab === 'reportedPosts' && p.reports === 0) return false;
      if (keyword && !`${p.title}${p.author}`.toLowerCase().includes(keyword.toLowerCase())) return false;
      return true;
    });
  }, [posts, tab, keyword]);

  const filteredComments = useMemo(() => {
    if (tab !== 'reportedComments') return [];
    return comments.filter((c) => {
      if (c.reports === 0) return false;
      if (keyword && !`${c.content}${c.author}${c.postTitle}`.toLowerCase().includes(keyword.toLowerCase())) return false;
      return true;
    });
  }, [comments, tab, keyword]);

  const deletePost = (id) => {
    if (!window.confirm(`게시글 #${id} 를 삭제하시겠습니까?`)) return;
    setPosts((prev) => prev.filter((p) => p.id !== id));
  };

  const deleteComment = (id) => {
    if (!window.confirm(`댓글 #${id} 를 삭제하시겠습니까?`)) return;
    setComments((prev) => prev.filter((c) => c.id !== id));
  };

  const total = tab === 'reportedComments' ? filteredComments.length : filteredPosts.length;

  return (
    <AdminLayout
      title="게시판관리"
      description="전체 게시글을 조회·검색하고, 신고가 누적된 게시글·댓글을 우선 확인하여 강제삭제합니다."
      user={user}
      onLogout={onLogout}
    >
      <section className="ad-section">
        <div className="ad-toolbar">
          <div className="ad-tag-group">
            <button className={`ad-tag${tab === 'all' ? ' ad-tag--active' : ''}`} onClick={() => { setTab('all'); setPage(1); }}>{TAB_LABEL.all}</button>
            <button className={`ad-tag${tab === 'reportedPosts' ? ' ad-tag--active' : ''}`} onClick={() => { setTab('reportedPosts'); setPage(1); }}>
              신고된 글 ({reportedPostCount})
            </button>
            <button className={`ad-tag${tab === 'reportedComments' ? ' ad-tag--active' : ''}`} onClick={() => { setTab('reportedComments'); setPage(1); }}>
              신고된 댓글 ({reportedCommentCount})
            </button>
          </div>

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
              <span>원본 게시글</span>
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
                  <div className="ad-table__cell-strong">{c.postTitle}</div>
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
          <div className="ad-table ad-table--board">
            <div className="ad-table__head">
              <span>No</span>
              <span>제목</span>
              <span>작성자</span>
              <span>작성일</span>
              <span>조회수</span>
              <span>신고수</span>
              <span>관리</span>
            </div>

            {filteredPosts.length === 0 ? (
              <div className="ad-empty">조건에 맞는 게시글이 없습니다.</div>
            ) : (
              filteredPosts.map((p) => (
                <div className="ad-table__row" key={p.id}>
                  <div className="ad-table__cell-muted">{p.id}</div>
                  <div className="ad-table__cell-strong">{p.title}</div>
                  <div>{p.author}</div>
                  <div className="ad-table__cell-muted">{p.createdAt}</div>
                  <div>{p.views}</div>
                  <div>{p.reports > 0 ? <Badge type="rejected">{p.reports}건</Badge> : <span className="ad-table__cell-muted">0건</span>}</div>
                  <div className="ad-table__actions">
                    <Button variant="danger-solid" size="xs" onClick={() => deletePost(p.id)}>삭제</Button>
                  </div>
                </div>
              ))
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
