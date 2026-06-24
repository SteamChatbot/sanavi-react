import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import Navbar from '../components/Navbar';
import Button from '../components/Button';
import { getLawyerDetail } from '../api/requestListApi';

import './LawyerPage.css';

export default function LawyerDetailPage({ user, onLogout }) {
  const navigate = useNavigate();
  const { lawyerId } = useParams();

  const [lawyer, setLawyer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const fetchLawyer = async () => {
      try {
        const result = await getLawyerDetail(lawyerId);
        setLawyer(result.data);
      } catch (error) {
        setErrorMessage(error.message || '변호사 정보를 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchLawyer();
  }, [lawyerId]);

  const handleRequestClick = () => {
    if (!user?.userId) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }

    navigate(`/lawyers/${lawyerId}/request`);
  };

  return (
    <div className="lawyer-page">
      <Navbar user={user} onLogout={onLogout} />

      <main className="lawyer-container">
        <div className="lawyer-header">
          <div>
            <h1>변호사 상세</h1>
            <p>변호사 정보를 확인하고 직접 의뢰 요청을 보낼 수 있습니다.</p>
          </div>

          <Link to="/lawyers">
            <Button variant="outline" size="sm">
              목록으로
            </Button>
          </Link>
        </div>

        {loading && (
          <div className="lawyer-state">
            변호사 정보를 불러오는 중입니다.
          </div>
        )}

        {!loading && errorMessage && (
          <div className="lawyer-state lawyer-state--error">
            {errorMessage}
          </div>
        )}

        {!loading && !errorMessage && lawyer && (
          <section className="lawyer-detail">
            <div className="lawyer-detail__main">
              <h2>{lawyer.lawyerName}</h2>
              <p>{lawyer.firmName}</p>

              <div className="lawyer-detail__meta">
                <span>{lawyer.region}</span>
                <span>경력 {lawyer.experienceYears || 0}년</span>
                <span>{lawyer.specialty || '산재'}</span>
              </div>
            </div>

            <div className="lawyer-detail__box">
              <h3>연락 정보</h3>
              <p>이메일: {lawyer.email || '-'}</p>
              <p>전화번호: {lawyer.phone || '-'}</p>
            </div>

            <div className="lawyer-detail__actions">
              <Button variant="primary" size="md" onClick={handleRequestClick}>
                이 변호사에게 의뢰하기
              </Button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}