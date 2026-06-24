import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import Navbar from '../components/Navbar';
import Button from '../components/Button';
import MatchRequestForm from '../components/MatchRequestForm';

import {
  getLawyerDetail,
  createDirectRequest,
} from '../api/requestListApi';

import './LawyerPage.css';

export default function LawyerRequestWritePage({ user, onLogout }) {
  const navigate = useNavigate();
  const { lawyerId } = useParams();

  const [lawyer, setLawyer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.userId) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }

    const fetchLawyer = async () => {
      try {
        const result = await getLawyerDetail(lawyerId);
        setLawyer(result.data);
      } catch (error) {
        alert(error.message || '변호사 정보를 불러오지 못했습니다.');
        navigate('/lawyers');
      } finally {
        setLoading(false);
      }
    };

    fetchLawyer();
  }, [lawyerId, user, navigate]);

  const handleSubmit = async ({ form, files }) => {
    if (!user?.userId) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }

    const payload = {
      userId: user.userId,
      lawyerId,
      title: form.title,
      content: form.content,
      price: form.price,
    };

    const result = await createDirectRequest(payload, files);
    const matchId = result.data?.matchId;

    alert('변호사에게 의뢰 요청을 보냈습니다.');

    if (matchId) {
      navigate(`/requestlist/requests/${matchId}`);
    } else {
      navigate('/lawyers');
    }
  };

  return (
    <div className="mw-page">
      <Navbar user={user} onLogout={onLogout} />

      <div className="mw-container">
        <div className="mw-header">
          <h1>변호사 직접 의뢰</h1>
          <p>
            선택한 변호사에게 사건 내용과 첨부파일을 보내 의뢰를 요청합니다.
          </p>
        </div>

        <div className="lawyer-write-top">
          <Link to={`/lawyers/${lawyerId}`}>
            <Button variant="outline" size="sm">
              변호사 상세로
            </Button>
          </Link>
        </div>

        {loading && (
          <div className="lawyer-state">
            의뢰 화면을 준비하는 중입니다.
          </div>
        )}

        {!loading && lawyer && (
          <MatchRequestForm
            initialValues={{
              clientName: user?.name || '',
            }}
            fixedMatchType="DIRECT"
            showMatchType={false}
            submitLabel="변호사에게 의뢰 보내기"
            priceHint="선택한 변호사에게 제안할 희망 보수입니다."
            uploadTitle="첨부파일"
            uploadDescription={
              <>
                진단서, 사고 경위 자료, 산내비 분석 결과 PDF 등을 첨부할 수 있습니다.
                <br />
                필수는 아니지만 첨부하면 변호사가 사건을 더 정확히 검토할 수 있습니다.
              </>
            }
            notice={
              <>
                <strong>직접 의뢰 안내</strong>
                이 의뢰는 선택한 변호사에게 전달되며, 변호사는 의뢰 내용을 확인한 뒤 수락 또는 거절할 수 있습니다.
              </>
            }
            requireFile={false}
            lawyerInfo={{
              lawyerName: lawyer.lawyerName,
              firmName: lawyer.firmName,
            }}
            onSubmit={handleSubmit}
          />
        )}
      </div>
    </div>
  );
}