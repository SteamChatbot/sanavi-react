import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import Navbar from '../components/Navbar';
import Button from '../components/Button';
import { getLawyerList } from '../api/requestListApi';

import './LawyerPage.css';

export default function LawyerListPage({ user, onLogout }) {
  const [lawyers, setLawyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const fetchLawyers = async () => {
      try {
        const result = await getLawyerList();
        setLawyers(result.data || []);
      } catch (error) {
        setErrorMessage(error.message || '변호사 목록을 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchLawyers();
  }, []);

  return (
    <div className="lawyer-page">
      <Navbar user={user} onLogout={onLogout} />

      <main className="lawyer-container">
        <div className="lawyer-header">
          <div>
            <h1>변호사 찾기</h1>
            <p>산재 사건 상담이 가능한 변호사를 확인하고 직접 의뢰할 수 있습니다.</p>
          </div>
        </div>

        {loading && (
          <div className="lawyer-state">
            변호사 목록을 불러오는 중입니다.
          </div>
        )}

        {!loading && errorMessage && (
          <div className="lawyer-state lawyer-state--error">
            {errorMessage}
          </div>
        )}

        {!loading && !errorMessage && lawyers.length === 0 && (
          <div className="lawyer-state">
            등록된 변호사가 없습니다.
          </div>
        )}

        {!loading && !errorMessage && lawyers.length > 0 && (
          <div className="lawyer-grid">
            {lawyers.map((lawyer) => (
              <article key={lawyer.lawyerId} className="lawyer-card">
                <div className="lawyer-card__top">
                  <div>
                    <h2>{lawyer.lawyerName}</h2>
                    <p>{lawyer.firmName}</p>
                  </div>

                  <span className="lawyer-card__badge">
                    {lawyer.region}
                  </span>
                </div>

                <div className="lawyer-card__info">
                  <span>경력 {lawyer.experienceYears || 0}년</span>
                  <span>{lawyer.specialty || '산재'}</span>
                </div>

                <Link to={`/lawyers/${lawyer.lawyerId}`}>
                  <Button variant="primary" size="sm" fullWidth>
                    상세 보기
                  </Button>
                </Link>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}