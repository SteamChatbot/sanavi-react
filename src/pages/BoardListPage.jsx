import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Button from '../components/Button';
import Pagination from '../components/Pagination';
import './BoardPage.css';

export default function BoardListPage({ user }) {
  const isAdmin = user?.role === 'ADMIN';
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [posts, setPosts] = useState([]);
  const [totalCount, setTotalCount] = useState(0);

  const size = 10;

  const fetchBoards = () => {
    fetch(`/api/boards?page=${page}&size=${size}&searchType=all&keyword=${search}`)
      .then((res) => res.json())
      .then((result) => {
        setPosts(result.data.contents);
        setTotalCount(result.data.totalCount);
      })
      .catch((error) => {
        console.error('게시글 목록 조회 실패:', error);
      });
  };

  useEffect(() => {
    fetchBoards();
  }, [page]);

  const handleSearch = (e) => {
    if (e.key !== 'Enter') return;
    setPage(1);
    fetchBoards();
  };

  const handleDelete = (boardId) => {
    if (!window.confirm('이 게시글을 삭제하시겠습니까?')) return;

    fetch(`/api/boards/${boardId}`, {
      method: 'DELETE',
    })
      .then((res) => res.json())
      .then(() => {
        fetchBoards();
      })
      .catch((error) => {
        console.error('게시글 삭제 실패:', error);
      });
  };

  const totalPages = Math.ceil(totalCount / size) || 1;

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
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="제목, 내용 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleSearch}
              className="board-search__input"
            />
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <Link to="/board/write">
              <Button variant="primary" size="sm">글쓰기</Button>
            </Link>
          </div>
        </div>

        <div className="board-table">
          <div className={`board-table__head${isAdmin ? ' board-table__head--admin' : ''}`}>
            <span>No</span>
            <span>제목</span>
            <span>조회</span>
            <span>날짜</span>
            {isAdmin && <span>관리</span>}
          </div>

          {posts.length === 0 ? (
            <div className="board-empty">게시글이 없습니다.</div>
          ) : (
            posts.map((post) => (
              <div key={post.boardId} className={`board-table__row${isAdmin ? ' board-table__row--admin' : ''}`}>
                <div className="board-row__num">{post.boardId}</div>

                <div className="board-row__content">
                  <Link to={`/board/${post.boardId}`} className="board-row__title">
                    {post.title}
                  </Link>
                  <div className="board-row__meta">
                    <div className="board-row__avatar" />
                    <span className="board-row__name">{post.nickname}</span>
                  </div>
                </div>

                <div className="board-row__view">{post.viewCount}</div>
                <div className="board-row__date">
                  {post.createdAt?.slice(0, 10)}
                </div>

                {isAdmin && (
                  <button className="board-row__del" onClick={() => handleDelete(post.boardId)}>
                    삭제
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  );
}