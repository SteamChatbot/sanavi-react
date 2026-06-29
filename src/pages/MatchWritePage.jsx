// 목적: 의뢰글 작성 페이지 — MatchRequestForm 래핑, 등록 후 /matchboard 이동
// Input:  user (로그인 유저 — 비로그인 시 /login 리다이렉트)
// Output: FormData(title·content·price·matchType·preferredRegion·pdf) → POST /api/matches
import React from 'react';
import { useNavigate } from 'react-router-dom';

import Navbar from '../components/Navbar';
import MatchRequestForm from '../components/MatchRequestForm';
import { createMatch } from '../api/matchApi';

export default function MatchWritePage({ user, onLogout }) {
  const navigate = useNavigate();

  const handleSubmit = async ({ form, files }) => {
    if (!user?.userId) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }

    const formData = new FormData();
    formData.append('userId',    user.userId);
    formData.append('title',     form.title);
    formData.append('clientName', form.clientName);
    formData.append('content',   form.content);
    formData.append('price',     form.price);
    formData.append('matchType', 'AUCTION');
    if (form.preferredRegion) formData.append('preferredRegion', form.preferredRegion);
    if (files?.[0]) formData.append('pdf', files[0]);

    await createMatch(formData);
    alert('의뢰글이 등록되었습니다.');
    navigate('/matchboard');
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
