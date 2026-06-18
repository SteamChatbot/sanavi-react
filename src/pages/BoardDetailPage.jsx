import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Button from '../components/Button';
import Avatar from '../components/Avatar';
import './BoardPage.css';

export default function BoardDetailPage({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const isAdmin = user?.role === 'ADMIN';

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentInput, setCommentInput] = useState('');

  useEffect(() => {
    fetch(`http://localhost:8080/api/boards/${id}`)
      .then((res) => res.json())
      .then((result) => {
        setPost(result.data);
      })
      .catch((error) => {
        console.error('게시글 상세 조회 실패:', error);
      });
  }, [id]);

  const handleDeletePost = () => {
    if (!window.confirm('이 게시글을 삭제하시겠습니까?')) return;

    fetch(`http://localhost:8080/api/boards/${id}`, {
      method: 'DELETE',
    })
      .then((res) => res.json())
      .then(() => {
        navigate('/board');
      })
      .catch((error) => {
        console.error('게시글 삭제 실패:', error);
      });
  };

  const handleDeleteComment = (commentId) => {
    if (!window.confirm('이 댓글을 삭제하시겠습니까?')) return;
    setComments((prev) => prev.filter((comment) => comment.id !== commentId));
  };

  const handleAddComment = () => {
    if (!commentInput.trim()) return;

    setComments((prev) => [
      ...prev,
      {
        id: Date.now(),
        nickname: user?.name || '익명',
        date: new Date().toISOString().slice(0, 10),
        text: commentInput.trim(),
      },
    ]);

    setCommentInput('');
  };

  if (!post) {
    return (
      <div className="board-page">
        <Navbar user={user} />
        <div className="board-container board-container--detail">
          <div className="board-empty">게시글을 불러오는 중입니다.</div>
        </div>
      </div>
    );
  }

  const isAuthor = user?.userId === post.userId;
  const createdDate = post.createdAt?.slice(0, 10);

  return (
    <div className="board-page">
      <Navbar user={user} />
      <div className="board-container board-container--detail">

        <div className="breadcrumb">
          <Link to="/board" className="breadcrumb__link">게시판</Link>
          <span className="breadcrumb__sep">›</span>
          <span>상세보기</span>
        </div>

        <div className="detail-head">
          <h1 className="detail-title">{post.title}</h1>

          <div className="detail-meta">
            <Avatar name={post.nickname} size="sm" />
            <span className="detail-meta__name">{post.nickname}</span>
            <span className="detail-meta__date">{createdDate}</span>
            <span className="detail-meta__views">조회 {post.viewCount}</span>

            <div className="detail-meta__actions">
              {(isAuthor || isAdmin) && (
                <>
                  {isAuthor && (
                    <Button variant="ghost" size="xs">
                      수정
                    </Button>
                  )}
                  <Button variant="danger" size="xs" onClick={handleDeletePost}>
                    삭제
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="detail-body">
          {post.content?.split('\n').map((line, index) => (
            <p key={index} style={{ minHeight: '1.2em' }}>
              {line}
            </p>
          ))}
        </div>

        <div className="detail-comments">
          <h2 className="comments-title">댓글 {comments.length}</h2>

          {comments.map((comment) => (
            <div key={comment.id} className="comment-item">
              <Avatar name={comment.nickname} size="sm" />

              <div className="comment-item__body">
                <div className="comment-item__top">
                  <span className="comment-item__name">{comment.nickname}</span>
                  <span className="comment-item__date">{comment.date}</span>
                </div>
                <p className="comment-item__text">{comment.text}</p>
              </div>

              {(isAdmin || user?.name === comment.nickname.charAt(0)) && (
                <Button variant="danger" size="xs" onClick={() => handleDeleteComment(comment.id)}>
                  삭제
                </Button>
              )}
            </div>
          ))}

          <div className="comment-input-row">
            <input
              className="comment-input"
              type="text"
              placeholder="댓글을 입력하세요..."
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
            />
            <Button variant="primary" size="sm" onClick={handleAddComment}>
              등록
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}