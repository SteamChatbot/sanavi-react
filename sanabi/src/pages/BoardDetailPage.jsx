import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Avatar from '../components/Avatar';
import './BoardPage.css';

const SAMPLE_POST = {
  id: 24, title: '요추 추간판 탈출증으로 산재 승인받았습니다',
  nickname: '김○○', date: '2026.06.08', views: 142, status: 'ok',
  content: `안녕하세요. 건설현장에서 10년간 일하다 작년에 요추 추간판 탈출증 진단을 받았습니다.\n\n처음엔 산재 신청이 복잡할 것 같아 포기하려 했는데, 산내비 AI를 사용하면서 어떤 서류를 준비해야 하는지 명확하게 알게 되었습니다.\n\nAI가 제안한 체크리스트대로 진단서, 근무기록, 작업환경 자료를 모두 준비했고, 결국 승인을 받을 수 있었습니다. 같은 상황에 계신 분들께 도움이 되길 바랍니다.`,
  files: [
    { id:1, name:'진단서_2026.pdf', size:'1.2MB' },
    { id:2, name:'근무기록_확인서.pdf', size:'840KB' },
  ],
};

const SAMPLE_COMMENTS = [
  { id:1, nickname:'이○○', date:'2026.06.08', text:'저도 비슷한 케이스인데 많은 도움이 됐습니다!' },
  { id:2, nickname:'박○○', date:'2026.06.09', text:'어떤 증거자료가 가장 효과적이었나요?' },
];

export default function BoardDetailPage({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'ADMIN';
  const isAuthor = user?.name === SAMPLE_POST.nickname.charAt(0);
  const [comments, setComments] = useState(SAMPLE_COMMENTS);
  const [commentInput, setCommentInput] = useState('');

  const handleDeletePost = () => {
    if (!window.confirm('이 게시글을 삭제하시겠습니까?')) return;
    navigate('/board');
  };

  const handleDeleteComment = (commentId) => {
    if (!window.confirm('이 댓글을 삭제하시겠습니까?')) return;
    setComments(p => p.filter(c => c.id !== commentId));
  };

  const handleAddComment = () => {
    if (!commentInput.trim()) return;
    setComments(p => [...p, { id: Date.now(), nickname: user?.name || '익명', date: '2026.06.10', text: commentInput.trim() }]);
    setCommentInput('');
  };

  return (
    <div className="board-page">
      <Navbar user={user} />
      <div className="board-container board-container--detail">

        {/* 상단 breadcrumb */}
        <div className="breadcrumb">
          <Link to="/board" className="breadcrumb__link">게시판</Link>
          <span className="breadcrumb__sep">›</span>
          <span>상세보기</span>
        </div>

        {/* 헤더 */}
        <div className="detail-head">
          <Badge type={SAMPLE_POST.status}>
            {{ ok:'산재 승인', pending:'심사중', rejected:'기각' }[SAMPLE_POST.status]}
          </Badge>
          <h1 className="detail-title">{SAMPLE_POST.title}</h1>
          <div className="detail-meta">
            <Avatar name={SAMPLE_POST.nickname} size="sm" />
            <span className="detail-meta__name">{SAMPLE_POST.nickname}</span>
            <span className="detail-meta__date">{SAMPLE_POST.date}</span>
            <span className="detail-meta__views">조회 {SAMPLE_POST.views}</span>
            <div className="detail-meta__actions">
              {(isAuthor || isAdmin) && (
                <>
                  {isAuthor && <Button variant="ghost" size="xs">수정</Button>}
                  <Button variant="danger" size="xs" onClick={handleDeletePost}>삭제</Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 본문 */}
        <div className="detail-body">
          {SAMPLE_POST.content.split('\n').map((line, i) => (
            <p key={i} style={{ minHeight: '1.2em' }}>{line}</p>
          ))}
        </div>

        {/* 첨부파일 */}
        {SAMPLE_POST.files.length > 0 && (
          <div className="detail-attach">
            <div className="detail-attach__label">첨부파일 {SAMPLE_POST.files.length}</div>
            {SAMPLE_POST.files.map(f => (
              <div key={f.id} className="attach-file">
                <div className="attach-file__icon" />
                <span className="attach-file__name">{f.name}</span>
                <span className="attach-file__size">{f.size}</span>
                <button className="attach-file__dl">↓</button>
              </div>
            ))}
          </div>
        )}

        {/* 댓글 */}
        <div className="detail-comments">
          <h2 className="comments-title">댓글 {comments.length}</h2>
          {comments.map(c => (
            <div key={c.id} className="comment-item">
              <Avatar name={c.nickname} size="sm" />
              <div className="comment-item__body">
                <div className="comment-item__top">
                  <span className="comment-item__name">{c.nickname}</span>
                  <span className="comment-item__date">{c.date}</span>
                </div>
                <p className="comment-item__text">{c.text}</p>
              </div>
              {(isAdmin || user?.name === c.nickname.charAt(0)) && (
                <Button variant="danger" size="xs" onClick={() => handleDeleteComment(c.id)}>삭제</Button>
              )}
            </div>
          ))}
          <div className="comment-input-row">
            <input
              className="comment-input"
              type="text"
              placeholder="댓글을 입력하세요..."
              value={commentInput}
              onChange={e => setCommentInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddComment()}
            />
            <Button variant="primary" size="sm" onClick={handleAddComment}>등록</Button>
          </div>
        </div>

      </div>
    </div>
  );
}
