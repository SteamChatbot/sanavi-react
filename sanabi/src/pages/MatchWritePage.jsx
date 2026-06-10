import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Input from '../components/Input';
import Button from '../components/Button';
import './MatchWritePage.css';

export default function MatchWritePage({ user }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '', clientName: '', content: '', price: '', matchType: 'AUCTION',
  });
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = e =>
    setForm(p => ({ ...p, [e.target.id]: e.target.value }));

  const handleFile = e => {
    const f = e.target.files[0];
    if (f) setFile(f);
  };

  const validate = () => {
    const e = {};
    if (!form.title)       e.title      = '제목을 입력해 주세요.';
    if (!form.clientName)  e.clientName = '의뢰자명을 입력해 주세요.';
    if (!form.content || form.content.length < 20)
                           e.content    = '사건 경위를 20자 이상 입력해 주세요.';
    if (!form.price || isNaN(form.price) || Number(form.price) <= 0)
                           e.price      = '희망 보수를 올바르게 입력해 주세요.';
    if (!file)             e.file       = '분석 결과 PDF를 첨부해 주세요.';
    return e;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      // TODO: await api.postMatch(form, file)
      await new Promise(r => setTimeout(r, 800));
      navigate('/match');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mw-page">
      <Navbar user={user} />
      <div className="mw-container">
        <div className="mw-header">
          <h1>변호사 매칭 의뢰</h1>
          <p>사건 정보와 분석 결과 PDF를 첨부하면 변호사가 더 정확히 파악할 수 있습니다.</p>
        </div>

        <form className="mw-layout" onSubmit={handleSubmit} noValidate>
          {/* 좌측 폼 */}
          <div className="mw-form-area">
            <Input id="title" label="제목" placeholder="의뢰 제목을 입력해 주세요"
              value={form.title} onChange={handleChange}
              state={errors.title ? 'error' : 'default'} errorMsg={errors.title} />

            <Input id="clientName" label="의뢰자명" placeholder="홍길동"
              value={form.clientName} onChange={handleChange}
              state={errors.clientName ? 'error' : 'default'} errorMsg={errors.clientName} />

            <Input id="content" label="사건 경위" multiline rows={5}
              placeholder="언제, 어디서, 어떻게 발생했는지 상세히 작성해 주세요. (20자 이상)"
              value={form.content} onChange={handleChange}
              state={errors.content ? 'error' : 'default'} errorMsg={errors.content} />

            <Input id="price" label="희망 보수 (원)" type="number" placeholder="1500000"
              value={form.price} onChange={handleChange}
              state={errors.price ? 'error' : 'default'} errorMsg={errors.price} />
            <p className="mw-hint">경매 방식에서 변호사 입찰의 상한선이 됩니다.</p>

            <div className="field">
              <label className="field__label">매칭 방식</label>
              <div className="mw-radio-group">
                <label className={`mw-radio${form.matchType === 'AUCTION' ? ' mw-radio--active' : ''}`}>
                  <input type="radio" name="matchType" value="AUCTION"
                    checked={form.matchType === 'AUCTION'}
                    onChange={() => setForm(p => ({ ...p, matchType: 'AUCTION' }))} />
                  <div>
                    <strong>경매 방식</strong>
                    <span>변호사들이 희망 보수보다 낮은 금액으로 입찰 — 최저가 선택 가능</span>
                  </div>
                </label>
                <label className={`mw-radio${form.matchType === 'DIRECT' ? ' mw-radio--active' : ''}`}>
                  <input type="radio" name="matchType" value="DIRECT"
                    checked={form.matchType === 'DIRECT'}
                    onChange={() => setForm(p => ({ ...p, matchType: 'DIRECT' }))} />
                  <div>
                    <strong>직접 선택</strong>
                    <span>변호사 목록에서 원하는 변호사를 직접 선택하여 의뢰</span>
                  </div>
                </label>
              </div>
            </div>

            <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
              의뢰 등록하기
            </Button>
          </div>

          {/* 우측 PDF 첨부 */}
          <div className="mw-upload-area">
            <div className="mw-upload-title">
              분석 결과 PDF 첨부 <span className="mw-required">필수</span>
            </div>
            <p className="mw-upload-desc">
              산내비 AI 분석 결과를 PDF로 다운로드하여 첨부해 주세요.<br />
              변호사가 사건을 더 정확히 파악하는 데 도움이 됩니다.
            </p>

            <label
              className={`mw-upload-zone${file ? ' mw-upload-zone--done' : ''}${errors.file ? ' mw-upload-zone--error' : ''}`}
              htmlFor="match-file"
            >
              <div className="mw-upload-icon">{file ? '✓' : '📎'}</div>
              <div className="mw-upload-name">
                {file ? file.name : '파일을 클릭하거나 드래그하세요'}
              </div>
              <div className="mw-upload-sub">
                {file
                  ? `${(file.size / 1024 / 1024).toFixed(1)}MB · 업로드 완료`
                  : 'PDF 필수 · JPG, PNG 허용 · 최대 50MB'}
              </div>
              {!file && <Button variant="primary" size="sm" style={{ marginTop: 8 }} type="button">파일 선택</Button>}
              {file  && <Button variant="ghost"   size="sm" style={{ marginTop: 8 }} type="button">파일 변경</Button>}
            </label>
            <input id="match-file" type="file" accept=".pdf,.jpg,.jpeg,.png"
              style={{ display: 'none' }} onChange={handleFile} />
            {errors.file && <p className="field__msg field__msg--error">{errors.file}</p>}

            <div className="mw-notice">
              <strong>열람 안내</strong>
              의뢰글은 인증된 변호사(role_lawyer)만 열람할 수 있습니다.
              일반 사용자에게는 노출되지 않습니다.
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
