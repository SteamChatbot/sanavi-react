// 회원 신고 모달 — 의뢰글 작성자/입찰자, 변호사 등 회원 대상 신고 공용 컴포넌트
// 카테고리가 '기타'일 때만 상세 사유 입력을 필수로 받는다
import React, { useState } from 'react';
import Button from './Button';
import { reportUser, REPORT_CATEGORIES } from '../api/reportApi';
import './ReportModal.css';

export default function ReportModal({ targetUserId, targetName, onClose, onSubmitted }) {
  const [category, setCategory] = useState('');
  const [detail, setDetail] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const detailRequired = category === '기타';

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!category) {
      setError('신고 사유를 선택해 주세요.');
      return;
    }
    if (detailRequired && !detail.trim()) {
      setError('기타 사유는 상세 내용을 입력해 주세요.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await reportUser({ reportedUserId: targetUserId, category, detail: detail.trim() });
      alert('신고가 접수되었습니다.');
      onSubmitted?.();
      onClose();
    } catch (err) {
      setError(err.message || '신고 접수에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="report-modal__overlay" onClick={onClose}>
      <div className="report-modal" onClick={(e) => e.stopPropagation()}>
        <div className="report-modal__header">
          <h2>{targetName ? `${targetName}님 신고하기` : '신고하기'}</h2>
          <button type="button" className="report-modal__close" onClick={onClose} aria-label="닫기">×</button>
        </div>

        <form className="report-modal__form" onSubmit={handleSubmit}>
          <div className="field">
            <label className="field__label">신고 사유</label>
            <select
              className="report-modal__select"
              value={category}
              onChange={(e) => { setCategory(e.target.value); setError(''); }}
            >
              <option value="">선택해 주세요</option>
              {REPORT_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="field">
            <label className="field__label">
              상세 내용 {detailRequired ? '(필수)' : '(선택)'}
            </label>
            <textarea
              className="field__input field__input--textarea"
              rows={4}
              placeholder={detailRequired ? '신고 사유를 구체적으로 입력해 주세요.' : '추가로 전달할 내용이 있다면 입력해 주세요.'}
              value={detail}
              onChange={(e) => { setDetail(e.target.value); setError(''); }}
            />
          </div>

          {error && <p className="report-modal__error">{error}</p>}

          <div className="report-modal__actions">
            <Button type="button" variant="outline" size="md" onClick={onClose}>취소</Button>
            <Button type="submit" variant="danger-solid" size="md" loading={submitting}>신고하기</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
