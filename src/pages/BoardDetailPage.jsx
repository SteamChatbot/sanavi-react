import React, { useEffect, useRef, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Button from '../components/Button';
import Avatar from '../components/Avatar';
import {
  getBoardDetail,
  deleteBoard,
  getBoardComments,
  createBoardComment,
  deleteBoardComment,
} from '../api/boardApi';
import './BoardPage.css';

export default function BoardDetailPage({ user, onLogout }) {
  const fetchedBoardIdRef = useRef(null);
  const { id } = useParams();
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentInput, setCommentInput] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentSubmitting, setCommentSubmitting] = useState(false);


  const isAuthor = user?.userId && post?.userId === user.userId;
  const isAdmin =
    user?.role === 'ADMIN' ||
    user?.role === 'role_admin';

  //const isAdmin = user?.role === 'ADMIN';
  //  const isAuthor = user?.userId === post.userId;

  const fetchComments = async () => {
    if (!id) return;

    setCommentLoading(true);

    try {
      const result = await getBoardComments(id);
      setComments(result.data || []);
    } catch (error) {
      console.error(error);
      alert(error.message || '댓글 목록을 불러오지 못했습니다.');
    } finally {
      setCommentLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;

    // React StrictMode 개발 모드에서 useEffect가 두 번 실행되는 것 방지
    if (fetchedBoardIdRef.current === id) {
      return;
    }

    fetchedBoardIdRef.current = id;

    const fetchPost = async () => {
      try {
        const result = await getBoardDetail(id);
        setPost(result.data);
      } catch (error) {
        alert(error.message || '게시글을 불러오지 못했습니다.');
        navigate('/board');
      }
    };

    fetchPost();
  }, [id, navigate]);

  useEffect(() => {
    fetchComments();

  }, [id]);

  const handleDeletePost = async () => {
    if (!window.confirm('이 게시글을 삭제하시겠습니까?')) return;

    try {
      await deleteBoard(id);

      alert('게시글이 삭제되었습니다.');
      navigate('/board');
    } catch (error) {
      console.error('게시글 삭제 실패:', error);
      alert(error.message || '게시글 삭제에 실패했습니다.');
    }
  };



  const handleDeleteComment = async (commentId) => {
    if (!user?.userId) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }

    if (!window.confirm('댓글을 삭제하시겠습니까?')) {
      return;
    }

    try {
      await deleteBoardComment(id, commentId, user.userId);

      setComments((prev) =>
        prev.filter((comment) => comment.commentId !== commentId)
      );
    } catch (error) {
      alert(error.message || '댓글 삭제에 실패했습니다.');
    }
  };

  const handleAddComment = async () => {
    if (!user?.userId) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }

    const content = commentInput.trim();

    if (!content) {
      alert('댓글 내용을 입력해 주세요.');
      return;
    }

    if (content.length > 500) {
      alert('댓글은 500자 이하로 입력해 주세요.');
      return;
    }

    const payload = {
      userId: user.userId,
      nickname: user.nickname || user.name || user.userId,
      content,
    };

    setCommentSubmitting(true);

    try {
      await createBoardComment(id, payload);

      setCommentInput('');
      await fetchComments();
    } catch (error) {
      alert(error.message || '댓글 등록에 실패했습니다.');
    } finally {
      setCommentSubmitting(false);
    }
  };

  if (!post) {
    return (
      <div className="board-page">
        <Navbar user={user} onLogout={onLogout} />
        <div className="board-container board-container--detail">
          <div className="board-empty">게시글을 불러오는 중입니다.</div>
        </div>
      </div>
    );
  }


  const createdDate = post.createdAt?.slice(0, 10);

  return (
    <div className="board-page">
      <Navbar user={user} onLogout={onLogout} />
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
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => navigate(`/board/${id}/edit`)}
                    >
                      수정
                    </Button>
                  )}

                  <Button
                    variant="danger"
                    size="xs"
                    onClick={handleDeletePost}
                  >
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

        {post.files && post.files.length > 0 && (
          <section className="board-detail__files">
            <h3 className="board-detail__files-title">첨부파일</h3>

            <div className="board-detail__file-list">
              {post.files.map((file) => (
                <a
                  key={file.fileId}
                  className="board-detail__file"
                  href={file.downloadUrl}
                >
                  <span>{file.originalName}</span>
                  <em>{(file.fileSize / 1024).toFixed(1)} KB</em>
                </a>
              ))}
            </div>
          </section>
        )}

        <div className="detail-comments">
          <h2 className="comments-title">
            댓글 {comments.length}
          </h2>

          <div className="comment-input-row">
            <textarea
              className="comment-input comment-textarea"
              placeholder={
                user?.userId
                  ? '댓글을 입력하세요...'
                  : '로그인 후 댓글을 작성할 수 있습니다.'
              }
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              disabled={!user?.userId || commentSubmitting}
              rows={3}
            />

            <Button
              variant="primary"
              size="sm"
              onClick={handleAddComment}
              disabled={!user?.userId || commentSubmitting}
            >
              {commentSubmitting ? '등록 중' : '등록'}
            </Button>
          </div>

          {commentLoading && (
            <div className="comment-empty">
              댓글을 불러오는 중입니다.
            </div>
          )}

          {!commentLoading && comments.length === 0 && (
            <div className="comment-empty">
              아직 댓글이 없습니다.
            </div>
          )}

          {!commentLoading && comments.length > 0 && (
            <div className="comment-list">
              {comments.map((comment) => {
                const isCommentAuthor =
                  user?.userId && user.userId === comment.userId;

                return (
                  <div key={comment.commentId} className="comment-item">
                    <Avatar name={comment.nickname} size="sm" />

                    <div className="comment-item__body">
                      <div className="comment-item__top">
                        <span className="comment-item__name">
                          {comment.nickname}
                        </span>
                      </div>

                      <p className="comment-item__text">
                        {comment.content}
                      </p>
                    </div>

                    {isCommentAuthor && (
                      <Button
                        variant="danger"
                        size="xs"
                        onClick={() => handleDeleteComment(comment.commentId)}
                      >
                        삭제
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}