import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Button from '../components/Button';
import './BoardPage.css';

export default function BoardWritePage({ user }) {
    const navigate = useNavigate();

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');

    const handleSubmit = () => {
        if (!title.trim()) {
            alert('제목을 입력해 주세요.');
            return;
        }

        if (!content.trim()) {
            alert('내용을 입력해 주세요.');
            return;
        }

        fetch('http://localhost:8080/api/boards', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
            },
            body: JSON.stringify({
                userId: user?.userId || 'testuser',
                nickname: user?.name || 'tester',
                title,
                content,
            }),
        })
            .then((res) => res.json())
            .then(() => {
                alert('게시글이 등록되었습니다.');
                navigate('/board');
            })
            .catch((error) => {
                console.error('게시글 등록 실패:', error);
                alert('게시글 등록에 실패했습니다.');
            });
    };

    return (
        <div className="board-page">
            <Navbar user={user} />

            <div className="board-container board-container--write">
                <div className="breadcrumb">
                    <Link to="/board" className="breadcrumb__link">게시판</Link>
                    <span className="breadcrumb__sep">›</span>
                    <span>글쓰기</span>
                </div>

                <div className="board-header">
                    <h1 className="board-header__title">게시글 작성</h1>
                    <p className="board-header__sub">산재 신청 경험을 공유해 주세요</p>
                </div>

                <form className="board-write" onSubmit={handleSubmit}>
                    <div className="board-write__field">
                        <label className="board-write__label" htmlFor="title">제목</label>
                        <input
                            id="title"
                            className="board-write__input"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="제목을 입력하세요"
                            maxLength={50}
                        />
                        <span className="board-write__count">{title.length}/50</span>
                    </div>

                    <div className="board-write__field">
                        <label className="board-write__label" htmlFor="content">내용</label>
                        <textarea
                            id="content"
                            className="board-write__textarea"
                            value={content}
                            onChange={e => setContent(e.target.value)}
                            placeholder="내용을 입력하세요"
                            maxLength={2000}
                        />
                        <span className="board-write__count">{content.length}/2000</span>
                    </div>

                    <div className="board-write__actions">
                        <Button type="button" variant="ghost" onClick={() => navigate('/board')}>
                            취소
                        </Button>
                        <Button type="submit" variant="primary">
                            등록
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}