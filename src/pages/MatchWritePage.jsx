import React from 'react';
import { useNavigate } from 'react-router-dom';

import Navbar from '../components/Navbar';
import MatchRequestForm from '../components/MatchRequestForm';

export default function MatchWritePage({ user, onLogout }) {
  const navigate = useNavigate();

  const handleSubmit = async ({ form, files }) => {
    if (!user?.userId) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }

    const payload = {
      userId: user.userId,
      title: form.title,
      clientName: form.clientName,
      content: form.content,
      price: form.price,
      matchType: 'AUCTION',
    };

    console.log('requestboard payload:', payload);
    console.log('requestboard files:', files);

    // await requestBoardApi.createAuctionRequest(payload, files);

    await new Promise((resolve) => setTimeout(resolve, 800));

    alert('의뢰글이 등록되었습니다.');
    navigate('/match');
  };

  return (
    <div className="mw-page">
      <Navbar user={user} onLogout={onLogout} />

      <div className="mw-container">
        <div className="mw-header">
          <h1>변호사 매칭 의뢰</h1>
          <p>
            사건 정보와 분석 결과 PDF를 첨부하면 변호사가 더 정확히 파악할 수 있습니다.
          </p>
        </div>

        <MatchRequestForm
          initialValues={{
            clientName: user?.name || '',
          }}
          fixedMatchType="AUCTION"
          showMatchType={false}
          submitLabel="의뢰 등록하기"
          priceHint="공개 의뢰글에서 변호사 입찰의 기준 금액이 됩니다."
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}