// 목적: 의뢰글 작성 공용 폼 컴포넌트 — 경매 의뢰(MatchWritePage)·직접 의뢰(LawyerRequestWritePage) 공용
// Input:  initialValues (폼 초기값), fixedMatchType (고정 시 라디오 숨김), requireFile (PDF 필수 여부)
//         priceHint·uploadTitle·notice (페이지별 안내 문구 커스터마이즈)
// Output: onSubmit({ form, files }) 콜백 — 부모가 FormData 조립 후 API 호출
// 기능:   제목·의뢰자명·사건경위·희망보수·희망지역·매칭방식 입력 + PDF 첨부 + 유효성 검사
import React, { useState } from 'react';
import Input from './Input';
import Button from './Button';
import { SIDO_LIST } from '../constants/regions';
import './MatchRequestForm.css';

const DEFAULT_FORM = {
  title: '',
  clientName: '',
  content: '',
  price: '',
  preferredRegion: '',
  matchType: 'AUCTION',
};

const MAX_TOTAL_FILE_SIZE = 50 * 1024 * 1024;
const MAX_TOTAL_FILE_SIZE_MB = 50;

function isSameFile(a, b) {
  return (
    a.name === b.name &&
    a.size === b.size &&
    a.lastModified === b.lastModified
  );
}

function getTotalFileSize(files) {
  return files.reduce((sum, file) => sum + file.size, 0);
}

export default function MatchRequestForm({
  initialValues = {},
  fixedMatchType = null,
  showMatchType = true,
  submitLabel = '의뢰 등록하기',
  priceHint = '경매 방식에서 변호사 입찰의 상한선이 됩니다.',
  uploadTitle = '분석 결과 PDF 첨부',
  uploadDescription = (
    <>
      산내비 AI 분석 결과를 PDF로 다운로드하여 첨부해 주세요.
      <br />
      변호사가 사건을 더 정확히 파악하는 데 도움이 됩니다.
    </>
  ),
  notice = (
    <>
      <strong>열람 안내</strong>
      의뢰글은 인증된 변호사(role_lawyer)만 열람할 수 있습니다.
      일반 사용자에게는 노출되지 않습니다.
    </>
  ),
  requireFile = true,
  lawyerInfo = null,
  onSubmit,
}) {
  const [form, setForm] = useState({
    ...DEFAULT_FORM,
    ...initialValues,
    matchType: fixedMatchType || initialValues.matchType || DEFAULT_FORM.matchType,
  });

  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const effectiveMatchType = fixedMatchType || form.matchType;

  const handleChange = (e) => {
    const { id, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [id]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [id]: '',
      submit: '',
    }));
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);

    if (selectedFiles.length === 0) {
      return;
    }

    const merged = [...files, ...selectedFiles];

    const uniqueFiles = merged.filter((file, index, self) => {
      return index === self.findIndex((target) => isSameFile(file, target));
    });

    const totalSize = getTotalFileSize(uniqueFiles);

    if (totalSize > MAX_TOTAL_FILE_SIZE) {
      setErrors((prev) => ({
        ...prev,
        file: `첨부파일 전체 용량은 최대 ${MAX_TOTAL_FILE_SIZE_MB}MB까지 업로드할 수 있습니다.`,
        submit: '',
      }));

      e.target.value = '';
      return;
    }

    setFiles(uniqueFiles);

    setErrors((prev) => ({
      ...prev,
      file: '',
      submit: '',
    }));

    e.target.value = '';
  };

  const handleRemoveFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const validate = () => {
    const nextErrors = {};

    if (!form.title.trim()) {
      nextErrors.title = '제목을 입력해 주세요.';
    }

    if (!form.clientName.trim()) {
      nextErrors.clientName = '의뢰자명을 입력해 주세요.';
    }

    if (!form.content.trim() || form.content.trim().length < 20) {
      nextErrors.content = '사건 경위를 20자 이상 입력해 주세요.';
    }

    const priceNum = Number(form.price);
    if (!form.price || Number.isNaN(priceNum) || priceNum <= 0) {
      nextErrors.price = '희망 보수를 올바르게 입력해 주세요.';
    } else if (priceNum > 1_000_000_000_000) {
      nextErrors.price = '희망 보수는 1조 원을 초과할 수 없습니다.';
    }

    if (requireFile && files.length === 0) {
      nextErrors.file = '첨부파일을 1개 이상 등록해 주세요.';
    } else if (getTotalFileSize(files) > MAX_TOTAL_FILE_SIZE) {
      nextErrors.file = `첨부파일 전체 용량은 최대 ${MAX_TOTAL_FILE_SIZE_MB}MB까지 업로드할 수 있습니다.`;
    }

    return nextErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const nextErrors = validate();

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    if (!onSubmit) {
      setErrors({ submit: '저장 로직이 연결되지 않았습니다.' });
      return;
    }

    setLoading(true);

    try {
      await onSubmit({
        form: {
          ...form,
          matchType: effectiveMatchType,
          price: Number(form.price),
        },
        files,
      });
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        submit: error.message || '의뢰 등록에 실패했습니다.',
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="mw-layout" onSubmit={handleSubmit} noValidate>
      <div className="mw-form-area">
        {lawyerInfo && (
          <div className="mw-lawyer-box">
            <strong>{lawyerInfo.lawyerName}</strong>
            <span>{lawyerInfo.firmName}</span>
          </div>
        )}

        <Input
          id="title"
          label="제목"
          placeholder="의뢰 제목을 입력해 주세요"
          value={form.title}
          onChange={handleChange}
          state={errors.title ? 'error' : 'default'}
          errorMsg={errors.title}
        />

        <Input
          id="clientName"
          label="의뢰자명"
          placeholder="홍길동"
          value={form.clientName}
          onChange={handleChange}
          state={errors.clientName ? 'error' : 'default'}
          errorMsg={errors.clientName}
        />

        <Input
          id="content"
          label="사건 경위"
          multiline
          rows={5}
          placeholder="언제, 어디서, 어떻게 발생했는지 상세히 작성해 주세요. (20자 이상)"
          value={form.content}
          onChange={handleChange}
          state={errors.content ? 'error' : 'default'}
          errorMsg={errors.content}
        />

        <Input
          id="price"
          label="희망 보수 (원)"
          type="number"
          placeholder="1500000"
          min={1}
          max={1000000000000}
          value={form.price}
          onChange={handleChange}
          state={errors.price ? 'error' : 'default'}
          errorMsg={errors.price}
        />

        {priceHint && (
          <p className="mw-hint">
            {priceHint}
          </p>
        )}

        <div className="field">
          <label className="field__label" htmlFor="preferredRegion">희망 상담 지역 (선택)</label>
          <select
            id="preferredRegion"
            className="mw-region-select"
            value={form.preferredRegion}
            onChange={handleChange}
          >
            <option value="">지역 무관</option>
            {SIDO_LIST.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        {showMatchType && !fixedMatchType && (
          <div className="field">
            <label className="field__label">매칭 방식</label>

            <div className="mw-radio-group">
              <label className={`mw-radio${form.matchType === 'AUCTION' ? ' mw-radio--active' : ''}`}>
                <input
                  type="radio"
                  name="matchType"
                  value="AUCTION"
                  checked={form.matchType === 'AUCTION'}
                  onChange={() =>
                    setForm((prev) => ({
                      ...prev,
                      matchType: 'AUCTION',
                    }))
                  }
                />
                <div>
                  <strong>경매 방식</strong>
                  <span>변호사들이 희망 보수보다 낮은 금액으로 입찰 — 최저가 선택 가능</span>
                </div>
              </label>

              <label className={`mw-radio${form.matchType === 'DIRECT' ? ' mw-radio--active' : ''}`}>
                <input
                  type="radio"
                  name="matchType"
                  value="DIRECT"
                  checked={form.matchType === 'DIRECT'}
                  onChange={() =>
                    setForm((prev) => ({
                      ...prev,
                      matchType: 'DIRECT',
                    }))
                  }
                />
                <div>
                  <strong>직접 선택</strong>
                  <span>변호사 목록에서 원하는 변호사를 직접 선택하여 의뢰</span>
                </div>
              </label>
            </div>
          </div>
        )}

        {fixedMatchType && (
          <div className="mw-fixed-type">
            <span>매칭 방식</span>
            <strong>
              {fixedMatchType === 'DIRECT' ? '변호사 직접 의뢰' : '게시글 공개 의뢰'}
            </strong>
          </div>
        )}

        {errors.submit && (
          <p className="field__msg field__msg--error">
            {errors.submit}
          </p>
        )}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
        >
          {submitLabel}
        </Button>
      </div>

      <div className="mw-upload-area">
        <div className="mw-upload-title">
          {uploadTitle}
          {requireFile && <span className="mw-required">필수</span>}
        </div>

        <p className="mw-upload-desc">
          {uploadDescription}
        </p>

        <label
          className={`mw-upload-zone${files.length > 0 ? ' mw-upload-zone--done' : ''}${errors.file ? ' mw-upload-zone--error' : ''}`}
          htmlFor="match-files"
        >
          <div className="mw-upload-icon">
            {files.length > 0 ? '✓' : '📎'}
          </div>

          <div className="mw-upload-name">
            {files.length > 0
              ? `${files.length}개 파일 선택됨`
              : '파일을 클릭해서 첨부하세요'}
          </div>

          <div className="mw-upload-sub">
            파일 형식 제한 없음 · 전체 최대 50MB · 1개 이상 필수
          </div>

          <span className="mw-upload-button">
            {files.length > 0 ? '파일 추가' : '파일 선택'}
          </span>
        </label>

        <input
          id="match-files"
          type="file"
          multiple
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        {errors.file && (
          <p className="field__msg field__msg--error">
            {errors.file}
          </p>
        )}

        {files.length > 0 && (
          <div className="mw-file-list">
            {files.map((file, index) => (
              <div
                key={`${file.name}-${file.lastModified}-${index}`}
                className="mw-file-row"
              >
                <div className="mw-file-info">
                  <strong>{file.name}</strong>
                  <span>{(file.size / 1024 / 1024).toFixed(1)}MB</span>
                </div>

                <button
                  type="button"
                  className="mw-file-remove"
                  onClick={() => handleRemoveFile(index)}
                >
                  삭제
                </button>
              </div>
            ))}

            <div className="mw-file-row">
              <div className="mw-file-info">
                <strong>전체 첨부 용량</strong>
                <span>
                  {(getTotalFileSize(files) / 1024 / 1024).toFixed(1)}MB / {MAX_TOTAL_FILE_SIZE_MB}MB
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="mw-notice">
          {notice}
        </div>
      </div>
    </form>
  );
}