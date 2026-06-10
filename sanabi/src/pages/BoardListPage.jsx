import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Pagination from '../components/Pagination';
import './BoardPage.css';

const FILTERS = ['전체', '승인', '심사중', '기각'];

const SAMPLE_POSTS = [
  { id:24, title:'요추 추간판 탈출증으로 산재 승인받았습니다', nickname:'김○○', status:'ok',      views:142, date:'2026.06.08' },
  { id:23, title:'건설현장 낙상 사고 후기 공유드려요',         nickname:'이○○', status:'pending', views:87,  date:'2026.06.07' },
  { id:22, title:'산내비 덕분에 증거자료 준비 완료했어요',     nickname:'박○○', status:'ok',      views:203, date:'2026.06.06' },
  { id:21, title:'직업성 난청 산재 신청 경험담',               nickname:'최○○', status:'rejected',views:56,  date:'2026.06.05' },
  { id:20, title:'업무상 스트레스로 인한 심리적 질환',         nickname:'정○○', status:'pending', views:128, date:'2026.06.04' },
];

const STATUS_LABEL = { ok:'승인', pending:'심사중', rejected:'기각' };

export default function BoardListPage({ user }) {
  const isAdmin = user?.role === 'ADMIN';
  const [filter, setFilter] = useState('전체');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [posts, setPosts] = useState(SAMPLE_POSTS);

  const filtered = posts.filter(p => {
    const matchFilter = filter === '전체' || STATUS_LABEL[p.status] === filter;
    const matchSearch = p.title.includes(search) || p.nickname.includes(search);
    return matchFilter && matchSearch;
  });

  const handleDelete = (id) => {
    if (!window.confirm('이 게시글을 삭제하시겠습니까?')) return;
    setPosts(p => p.filter(post => post.id !== id));
  };

  const handleDeleteAll = () => {
    if (!window.confirm('전체 게시글을 삭제하시겠습니까?')) return;
    setPosts([]);
  };

  return (
    <div className="board-page">
      <Navbar user={user} />
      <div className="board-container">
        <div className="board-header">
          <h1 className="board-header__title">후기 게시판</h1>
          <p className="board-header__sub">산재 신청 경험을 공유해 주세요</p>
        </div>

        <div className="board-toolbar">
          <div className="board-search">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              type="text" placeholder="제목, 내용 검색..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="board-search__input"
            />
          </div>
          <div style={{ display:'flex', gap:8 }}>
            {isAdmin && <Button variant="danger" size="sm" onClick={handleDeleteAll}>전체 삭제</Button>}
            <Link to="/board/write"><Button variant="primary" size="sm">글쓰기</Button></Link>
          </div>
        </div>

        <div className="board-chips">
          {FILTERS.map(f => (
            <button key={f} className={`board-chip${filter === f ? ' board-chip--active' : ''}`} onClick={() => setFilter(f)}>{f}</button>
          ))}
        </div>

        <div className="board-table">
          <div className={`board-table__head${isAdmin ? ' board-table__head--admin' : ''}`}>
            <span>No</span><span>제목</span><span>조회</span><span>날짜</span>
            {isAdmin && <span>관리</span>}
          </div>
          {filtered.length === 0 ? (
            <div className="board-empty">게시글이 없습니다.</div>
          ) : (
            filtered.map(post => (
              <div key={post.id} className={`board-table__row${isAdmin ? ' board-table__row--admin' : ''}`}>
                <div className="board-row__num">{post.id}</div>
                <div className="board-row__content">
                  <Link to={`/board/${post.id}`} className="board-row__title">{post.title}</Link>
                  <div className="board-row__meta">
                    <div className="board-row__avatar" />
                    <span className="board-row__name">{post.nickname}</span>
                    <Badge type={post.status}>{STATUS_LABEL[post.status]}</Badge>
                  </div>
                </div>
                <div className="board-row__view">{post.views}</div>
                <div className="board-row__date">{post.date}</div>
                {isAdmin && (
                  <button className="board-row__del" onClick={() => handleDelete(post.id)}>삭제</button>
                )}
              </div>
            ))
          )}
        </div>

        <Pagination currentPage={page} totalPages={5} onPageChange={setPage} />
      </div>
    </div>
  );
}
