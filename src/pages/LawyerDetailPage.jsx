import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import Navbar from '../components/Navbar';
import Button from '../components/Button';
import ReportModal from '../components/ReportModal';
import { getLawyerDetail } from '../api/requestListApi';
import { REPORT_TARGET_TYPES } from '../api/reportApi';

import './LawyerPage.css';

export default function LawyerDetailPage({ user, onLogout }) {
  const navigate = useNavigate();
  const { lawyerId } = useParams();

  const [lawyer, setLawyer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [reportOpen, setReportOpen] = useState(false);

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

  const getTargetUserId = () => {
    return lawyer?.userId ?? lawyer?.lawyerId ?? lawyerId;
  };

  const handleRequestClick = () => {
    if (!user?.userId) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }

    navigate(`/lawyers/${lawyerId}/request`);
  };

  const handleReportClick = () => {
    if (!user?.userId) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }

    const targetUserId = getTargetUserId();

    if (!targetUserId) {
      alert('신고 대상 정보를 확인할 수 없습니다.');
      return;
    }

    if (targetUserId === user.userId) {
      alert('본인은 신고할 수 없습니다.');
      return;
    }

    setReportOpen(true);
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
              <Button
                variant="outline"
                size="md"
                onClick={handleReportClick}
              >
                변호사 신고
              </Button>

              <Button
                variant="primary"
                size="md"
                onClick={handleRequestClick}
              >
                이 변호사에게 의뢰하기
              </Button>
            </div>
          </section>
        )}

        {reportOpen && lawyer && (
          <ReportModal
            targetUserId={getTargetUserId()}
            targetName={lawyer.lawyerName}
            targetType={REPORT_TARGET_TYPES.LAWYER}
            onClose={() => setReportOpen(false)}
          />
        )}
      </main>
    </div>
  );
}