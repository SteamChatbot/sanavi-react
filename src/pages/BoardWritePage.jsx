import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Button from '../components/Button';
import {
    getBoardDetail,
    createBoard,
    updateBoard,
} from '../api/boardApi';
import './BoardPage.css';

export default function BoardWritePage({ user, onLogout }) {
    const { id } = useParams();
    const navigate = useNavigate();

    const isEdit = Boolean(id);

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');

    // 수정 화면일 때 기존 게시글 조회
    useEffect(() => {
        if (!isEdit) return;

        const fetchPost = async () => {
            try {
                const result = await getBoardDetail(id);

                setTitle(result.data.title || '');
                setContent(result.data.content || '');
            } catch (error) {
                console.error('수정할 게시글 조회 실패:', error);
                alert(error.message || '게시글을 불러오지 못했습니다.');
                navigate('/board');
            }
        };

        fetchPost();
    }, [id, isEdit, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!title.trim() || !content.trim()) {
            alert('제목과 내용을 입력해주세요.');
            return;
        }

        const payload = {
            userId: user?.userId || 'testuser',
            nickname: user?.name || 'tester',
            title: title.trim(),
            content: content.trim(),
        };

        try {
            if (isEdit) {
                await updateBoard(id, payload);
            } else {
                await createBoard(payload);
            }

            alert(isEdit ? '게시글이 수정되었습니다.' : '게시글이 등록되었습니다.');
            navigate(isEdit ? `/board/${id}` : '/board');
        } catch (error) {
            console.error('게시글 저장 오류:', error);
            alert(error.message || '게시글 저장에 실패했습니다.');
        }
    };

    const handleCancel = () => {
        navigate(isEdit ? `/board/${id}` : '/board');
    };

    return (
        <div className="board-page">
            <Navbar user={user} onLogout={onLogout} />

            <div className="board-container board-container--write">
                <div className="breadcrumb">
                    <Link to="/board" className="breadcrumb__link">
                        게시판
                    </Link>
                    <span className="breadcrumb__sep">›</span>
                    <span>{isEdit ? '수정' : '글쓰기'}</span>
                </div>

                <div className="board-header">
                    <h1 className="board-header__title">
                        {isEdit ? '게시글 수정' : '게시글 작성'}
                    </h1>
                    <p className="board-header__sub">
                        산재 신청 경험을 공유해 주세요
                    </p>
                </div>

                <form className="board-write" onSubmit={handleSubmit}>
                    <div className="board-write__field">
                        <label className="board-write__label" htmlFor="title">
                            제목
                        </label>
                        <input
                            id="title"
                            className="board-write__input"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="제목을 입력하세요"
                            maxLength={50}
                        />
                        <span className="board-write__count">{title.length}/50</span>
                    </div>

                    <div className="board-write__field">
                        <label className="board-write__label" htmlFor="content">
                            내용
                        </label>
                        <textarea
                            id="content"
                            className="board-write__textarea"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="내용을 입력하세요"
                            maxLength={2000}
                        />
                        <span className="board-write__count">{content.length}/2000</span>
                    </div>

                    <div className="board-write__actions">
                        <Button type="button" variant="ghost" onClick={handleCancel}>
                            취소
                        </Button>

                        <Button type="submit" variant="primary">
                            {isEdit ? '수정' : '등록'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}