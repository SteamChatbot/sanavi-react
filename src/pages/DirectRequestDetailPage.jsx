import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import Navbar from '../components/Navbar';
import Button from '../components/Button';
import {
    acceptDirectRequest,
    cancelDirectRequest,
    getDirectRequestDetail,
    rejectDirectRequest,
} from '../api/requestListApi';

import './LawyerPage.css';

function getStatusLabel(status) {
    switch (status) {
        case 'PENDING':
            return '대기중';
        case 'ACCEPTED':
            return '수락';
        case 'REJECTED':
            return '거절';
        case 'CANCELED':
            return '취소';
        default:
            return status || '-';
    }
}

export default function DirectRequestDetailPage({ user, onLogout }) {
    const navigate = useNavigate();
    const { matchId } = useParams();

    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');

    const fetchRequest = async () => {
        try {
            const result = await getDirectRequestDetail(matchId);
            setRequest(result.data);
        } catch (error) {
            setErrorMessage(error.message || '의뢰 상세 정보를 불러오지 못했습니다.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequest();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [matchId]);

    const handleCancel = async () => {
        if (!user?.userId) {
            alert('로그인이 필요합니다.');
            navigate('/login');
            return;
        }

        if (!window.confirm('이 의뢰를 취소하시겠습니까?')) {
            return;
        }

        try {
            await cancelDirectRequest(matchId, user.userId);
            alert('의뢰가 취소되었습니다.');
            await fetchRequest();
        } catch (error) {
            alert(error.message || '의뢰 취소에 실패했습니다.');
        }
    };

    const handleAccept = async () => {
        if (!user?.userId) {
            alert('로그인이 필요합니다.');
            navigate('/login');
            return;
        }

        if (!window.confirm('이 의뢰를 수락하시겠습니까?')) {
            return;
        }

        try {
            await acceptDirectRequest(matchId, user.userId);
            alert('의뢰를 수락했습니다.');
            await fetchRequest();
        } catch (error) {
            alert(error.message || '의뢰 수락에 실패했습니다.');
        }
    };

    const handleReject = async () => {
        if (!user?.userId) {
            alert('로그인이 필요합니다.');
            navigate('/login');
            return;
        }

        const message = window.prompt('거절 사유를 입력해 주세요.', '');

        if (message === null) {
            return;
        }

        try {
            await rejectDirectRequest(matchId, {
                lawyerId: user.userId,
                message,
            });

            alert('의뢰를 거절했습니다.');
            await fetchRequest();
        } catch (error) {
            alert(error.message || '의뢰 거절에 실패했습니다.');
        }
    };

    const isOwner = user?.userId && request?.userId === user.userId;
    const canCancel = isOwner && request?.requestStatus === 'PENDING';
    const isReceiverLawyer = user?.userId && request?.lawyerId === user.userId;
    const canRespond = isReceiverLawyer && request?.requestStatus === 'PENDING';

    return (
        <div className="lawyer-page">
            <Navbar user={user} onLogout={onLogout} />

            <main className="lawyer-container">
                <div className="lawyer-header">
                    <div>
                        <h1>의뢰 상세</h1>
                        <p>변호사에게 보낸 직접 의뢰 내용을 확인합니다.</p>
                    </div>

                    <Link to="/my-lawyer-requests">
                        <Button variant="outline" size="sm">
                            내 의뢰 목록
                        </Button>
                    </Link>
                </div>

                {loading && (
                    <div className="lawyer-state">
                        의뢰 정보를 불러오는 중입니다.
                    </div>
                )}

                {!loading && errorMessage && (
                    <div className="lawyer-state lawyer-state--error">
                        {errorMessage}
                    </div>
                )}

                {!loading && !errorMessage && request && (
                    <section className="request-detail">
                        <div className="request-detail__head">
                            <div>
                                <h2>{request.title}</h2>
                                <p>
                                    {request.lawyerName} · {request.firmName}
                                </p>
                            </div>

                            <span className={`request-status request-status--${request.requestStatus?.toLowerCase()}`}>
                                {getStatusLabel(request.requestStatus)}
                            </span>
                        </div>

                        <div className="request-detail__meta">
                            <div>
                                <span>의뢰자</span>
                                <strong>{request.requesterName}</strong>
                            </div>

                            <div>
                                <span>희망 보수</span>
                                <strong>{Number(request.price || 0).toLocaleString()}원</strong>
                            </div>

                            <div>
                                <span>작성일</span>
                                <strong>
                                    {request.createdAt ? request.createdAt.replace('T', ' ').slice(0, 16) : '-'}
                                </strong>
                            </div>
                        </div>

                        <div className="request-detail__section">
                            <h3>의뢰 내용</h3>
                            <p>{request.content}</p>
                        </div>

                        <div className="request-detail__section">
                            <h3>첨부파일</h3>

                            {request.files && request.files.length > 0 ? (
                                <div className="request-file-list">
                                    {request.files.map((file) => (
                                        <a
                                            key={file.fileId}
                                            className="request-file"
                                            href={file.downloadUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            <span>{file.originalName}</span>
                                            <strong>{(file.fileSize / 1024).toFixed(1)} KB</strong>
                                        </a>
                                    ))}
                                </div>
                            ) : (
                                <p className="request-empty-text">
                                    첨부파일이 없습니다.
                                </p>
                            )}
                        </div>

                        {(canCancel || canRespond) && (
                            <div className="request-detail__actions">
                                {canCancel && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="md"
                                        onClick={handleCancel}
                                    >
                                        의뢰 취소
                                    </Button>
                                )}

                                {canRespond && (
                                    <>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="md"
                                            onClick={handleReject}
                                        >
                                            거절
                                        </Button>

                                        <Button
                                            type="button"
                                            variant="primary"
                                            size="md"
                                            onClick={handleAccept}
                                        >
                                            수락
                                        </Button>
                                    </>
                                )}
                            </div>
                        )}
                    </section>
                )}
            </main>
        </div>
    );
}