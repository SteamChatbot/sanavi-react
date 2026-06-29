import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import Navbar from '../components/Navbar';
import { getReceivedRequests } from '../api/requestListApi';
import { isLawyer } from '../constants/roles';

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

export default function LawyerReceivedRequestsPage({ user, onLogout }) {
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!user?.userId) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }

    if (!isLawyer(user.role)) {
      alert('변호사 회원만 접근할 수 있습니다.');
      navigate('/');
      return;
    }

    const fetchRequests = async () => {
      try {
        const result = await getReceivedRequests(user.userId);
        setRequests(result.data || []);
      } catch (error) {
        setErrorMessage(error.message || '받은 의뢰 목록을 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [user, navigate]);

  return (
    <div className="lawyer-page">
      <Navbar user={user} onLogout={onLogout} />

      <main className="lawyer-container">
        <div className="lawyer-header">
          <div>
            <h1>받은 의뢰</h1>
            <p>
              사용자가 직접 보낸 변호사 의뢰 요청을 확인하고 응답할 수 있습니다.
            </p>
          </div>
        </div>

        {loading && (
          <div className="lawyer-state">
            받은 의뢰 목록을 불러오는 중입니다.
          </div>
        )}

        {!loading && errorMessage && (
          <div className="lawyer-state lawyer-state--error">
            {errorMessage}
          </div>
        )}

        {!loading && !errorMessage && requests.length === 0 && (
          <div className="lawyer-state">
            아직 받은 의뢰가 없습니다.
          </div>
        )}

        {!loading && !errorMessage && requests.length > 0 && (
          <div className="request-list">
            {requests.map((request) => (
              <Link
                key={request.matchId}
                to={`/requestlist/requests/${request.matchId}`}
                className="request-card"
              >
                <div className="request-card__main">
                  <div>
                    <h2>{request.title}</h2>
                    <p>
                      의뢰자 {request.requesterName || '-'}
                    </p>
                  </div>

                  <span
                    className={`request-status request-status--${String(
                      request.requestStatus || ''
                    ).toLowerCase()}`}
                  >
                    {getStatusLabel(request.requestStatus)}
                  </span>
                </div>

                <div className="request-card__preview">
                  {request.content}
                </div>

                <div className="request-card__meta">
                  <span>
                    희망 보수 {Number(request.price || 0).toLocaleString()}원
                  </span>
                  <span>
                    {request.createdAt
                      ? request.createdAt.replace('T', ' ').slice(0, 16)
                      : '-'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}