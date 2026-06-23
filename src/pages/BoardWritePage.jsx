import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import Navbar from '../components/Navbar';
import Button from '../components/Button';
import {
    getBoardDetail,
    createBoard,
    updateBoard,
    uploadBoardFiles,
    deleteBoardFile,
} from '../api/boardApi';

import './BoardPage.css';

export default function BoardWritePage({ user, onLogout }) {
    const navigate = useNavigate();
    const { id } = useParams();

    const isEdit = Boolean(id);

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');

    const [files, setFiles] = useState([]);
    const [existingFiles, setExistingFiles] = useState([]);

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isEdit) return;

        const fetchPost = async () => {
            try {
                const result = await getBoardDetail(id);
                const data = result.data;

                setTitle(data.title || '');
                setContent(data.content || '');
                setExistingFiles(data.files || []);
            } catch (error) {
                alert(error.message || '게시글 정보를 불러오지 못했습니다.');
                navigate('/board');
            }
        };

        fetchPost();
    }, [id, isEdit, navigate]);

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files || []);

        setFiles((prev) => {
            const merged = [...prev, ...selectedFiles];

            // 같은 파일 중복 선택 방지
            const uniqueFiles = merged.filter((file, index, self) => {
                return (
                    index ===
                    self.findIndex(
                        (f) =>
                            f.name === file.name &&
                            f.size === file.size &&
                            f.lastModified === file.lastModified
                    )
                );
            });

            return uniqueFiles;
        });

        // 같은 파일을 다시 선택할 수 있게 input 값 초기화
        e.target.value = '';
    };

    const handleRemoveSelectedFile = (index) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!user?.userId) {
            alert('로그인이 필요합니다.');
            navigate('/login');
            return;
        }

        if (!title.trim()) {
            alert('제목을 입력해 주세요.');
            return;
        }

        if (!content.trim()) {
            alert('내용을 입력해 주세요.');
            return;
        }

        const payload = {
            userId: user.userId,
            nickname: user.name || user.nickname || user.userId,
            title: title.trim(),
            content: content.trim(),
        };

        setLoading(true);

        try {
            if (isEdit) {
                await updateBoard(id, payload);

                if (files.length > 0) {
                    await uploadBoardFiles(id, files);
                }

                alert('게시글이 수정되었습니다.');
                navigate(`/board/${id}`);
                return;
            }

            const result = await createBoard(payload, files);
            const createdBoardId = result.data?.boardId;

            alert('게시글이 등록되었습니다.');

            if (createdBoardId) {
                navigate(`/board/${createdBoardId}`);
            } else {
                navigate('/board');
            }
        } catch (error) {
            alert(error.message || '게시글 저장에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteExistingFile = async (fileId) => {
        if (!window.confirm('이 첨부파일을 삭제하시겠습니까?')) return;

        try {
            await deleteBoardFile(id, fileId);

            setExistingFiles((prev) =>
                prev.filter((file) => file.fileId !== fileId)
            );

            alert('첨부파일이 삭제되었습니다.');
        } catch (error) {
            alert(error.message || '첨부파일 삭제에 실패했습니다.');
        }
    };

    return (
        <div className="board-page">
            <Navbar user={user} onLogout={onLogout} />

            <main className="board-container board-container--write">
                <div className="board-write">
                    <div className="board-write__header">
                        <div>
                            <h1 className="board-write__title">
                                {isEdit ? '게시글 수정' : '게시글 작성'}
                            </h1>
                            <p className="board-write__sub">
                                산재 관련 질문과 경험을 자유롭게 공유해 주세요.
                            </p>
                        </div>

                        <Link to="/board">
                            <Button variant="outline" size="sm">
                                목록으로
                            </Button>
                        </Link>
                    </div>

                    <form className="board-write__form" onSubmit={handleSubmit}>
                        <div className="board-write__field">
                            <label className="board-write__label" htmlFor="title">
                                제목
                            </label>
                            <input
                                id="title"
                                className="board-write__input"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="제목을 입력해 주세요"
                            />
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
                                placeholder="내용을 입력해 주세요"
                            />
                        </div>

                        <div className="board-write__field">
                            <label className="board-write__label" htmlFor="files">
                                첨부파일
                            </label>

                            {isEdit && (
                                <div className="board-file-box">
                                    <div className="board-file-box__title">
                                        기존 첨부파일
                                    </div>

                                    {existingFiles.length > 0 ? (
                                        existingFiles.map((file) => (
                                            <div key={file.fileId} className="board-file-item">
                                                <a
                                                    className="board-file-link"
                                                    href={file.downloadUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    {file.originalName}
                                                </a>

                                                <div className="board-file-item__right">
                                                    <span>
                                                        {(file.fileSize / 1024).toFixed(1)} KB
                                                    </span>

                                                    <button
                                                        type="button"
                                                        className="board-file-remove"
                                                        onClick={() => handleDeleteExistingFile(file.fileId)}
                                                    >
                                                        삭제
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="board-file-empty">
                                            기존 첨부파일이 없습니다.
                                        </div>
                                    )}
                                </div>
                            )}

                            <input
                                id="files"
                                type="file"
                                multiple
                                className="board-write__file"
                                onChange={handleFileChange}
                            />

                            {files.length > 0 && (
                                <div className="board-file-box">
                                    <div className="board-file-box__title">
                                        {isEdit ? '새로 추가할 파일' : '선택된 파일'}
                                    </div>

                                    {files.map((file, index) => (
                                        <div key={`${file.name}-${index}`} className="board-file-item">
                                            <span>
                                                {file.name}
                                            </span>

                                            <div className="board-file-item__right">
                                                <span>
                                                    {(file.size / 1024).toFixed(1)} KB
                                                </span>

                                                <button
                                                    type="button"
                                                    className="board-file-remove"
                                                    onClick={() => handleRemoveSelectedFile(index)}
                                                >
                                                    삭제
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="board-write__actions">
                            <Link to="/board">
                                <Button variant="outline" size="md" type="button">
                                    취소
                                </Button>
                            </Link>

                            <Button
                                variant="primary"
                                size="md"
                                type="submit"
                                loading={loading}
                            >
                                {isEdit ? '수정하기' : '등록하기'}
                            </Button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}