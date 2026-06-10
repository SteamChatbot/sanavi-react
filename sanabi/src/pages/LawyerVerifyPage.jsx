import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Input from '../components/Input';
import Button from '../components/Button';
import './LawyerVerifyPage.css';

const SPECIALTY_OPTIONS = ['산재', '노동법', '민사', '형사', '행정', '산재·노동법', '노동·민사'];

export function LawyerVerifyPage({ user }) {
  const [form, setForm] = useState({
    name: '', licenseNo: '', firm: '', careerYears: '', bio: '', specialties: [],
  });
  const [certFile,  setCertFile]  = useState(null);
  const [photo,     setPhoto]     = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [errors,    setErrors]    = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading,   setLoading]   = useState(false);

  const handleChange = e => {
    setForm(p => ({ ...p, [e.target.id]: e.target.value }));
    setErrors(p => ({ ...p, [e.target.id]: '' }));
  };

  const toggleSpecialty = s =>
    setForm(p => ({
      ...p,
      specialties: p.specialties.includes(s)
        ? p.specialties.filter(x => x !== s)
        : [...p.specialties, s],
    }));

  const handleCert = e => { const f = e.target.files[0]; if (f) setCertFile(f); };

  const handlePhoto = e => {
    const f = e.target.files[0];
    if (!f) return;
    setPhoto(f);
    const reader = new FileReader();
    reader.onload = ev => setPhotoPreview(ev.target.result);
    reader.readAsDataURL(f);
  };

  const validate = () => {
    const e = {};
    if (!form.name)                    e.name        = '이름을 입력해 주세요.';
    if (!form.licenseNo)               e.licenseNo   = '변호사 등록번호를 입력해 주세요.';
    if (!form.firm)                    e.firm        = '소속 법무법인을 입력해 주세요.';
    if (!form.careerYears || isNaN(form.careerYears) || Number(form.careerYears) < 0)
                                       e.careerYears = '경력을 올바르게 입력해 주세요.';
    if (form.specialties.length === 0) e.specialties = '전문 분야를 1개 이상 선택해 주세요.';
    if (!form.bio || form.bio.length < 20)
                                       e.bio         = '자기소개를 20자 이상 입력해 주세요.';
    if (!certFile)                     e.certFile    = '변호사 자격증 사진을 업로드해 주세요.';
    return e;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      // TODO: await api.postLawyerVerify({ ...form, certFile, photo })
      await new Promise(r => setTimeout(r, 800));
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) return (
    <div className="verify-page">
      <Navbar user={user} />
      <div className="verify-container">
        <div className="verify-success">
          <div className="verify-success__icon">✓</div>
          <h2>인증 신청이 완료되었습니다</h2>
          <p>관리자 검토 후 영업일 1~2일 내에 승인 여부를 알려드립니다.<br />
            승인 후 매칭 서비스에 자동으로 노출됩니다.</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="verify-page">
      <Navbar user={user} />
      <div className="verify-container">

        <div className="verify-header">
          <h1>변호사 인증 신청</h1>
          <p>자격증 사진 업로드 및 프로필 정보를 입력해 주세요.<br />
            관리자 검토 후 매칭 서비스에 노출됩니다. 검토는 영업일 1~2일 소요됩니다.</p>
        </div>

        <form className="verify-layout" onSubmit={handleSubmit} noValidate>

          {/* 좌측 — 인증 정보 + 프로필 */}
          <div className="verify-form">

            <div className="verify-section-title">기본 인증 정보</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <Input id="name"        label="이름"           placeholder="홍길동"
                value={form.name}       onChange={handleChange}
                state={errors.name       ? 'error':'default'} errorMsg={errors.name} />
              <Input id="licenseNo"   label="변호사 등록번호" placeholder="제 12345호"
                value={form.licenseNo}  onChange={handleChange}
                state={errors.licenseNo  ? 'error':'default'} errorMsg={errors.licenseNo} />
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <Input id="firm"        label="소속 법무법인"   placeholder="○○ 법률사무소"
                value={form.firm}       onChange={handleChange}
                state={errors.firm       ? 'error':'default'} errorMsg={errors.firm} />
              <Input id="careerYears" label="경력 (년)"       type="number" placeholder="12"
                value={form.careerYears} onChange={handleChange}
                state={errors.careerYears ? 'error':'default'} errorMsg={errors.careerYears} />
            </div>

            <div className="verify-section-title" style={{ marginTop:8 }}>매칭 프로필 정보</div>

            {/* 전문 분야 */}
            <div className="field">
              <label className="field__label">
                전문 분야 <span className="verify-required">필수 · 복수 선택 가능</span>
              </label>
              <div className="verify-specialty-grid">
                {SPECIALTY_OPTIONS.map(s => (
                  <button key={s} type="button"
                    className={`verify-chip${form.specialties.includes(s) ? ' verify-chip--active' : ''}`}
                    onClick={() => toggleSpecialty(s)}>
                    {s}
                  </button>
                ))}
              </div>
              {errors.specialties && <p className="field__msg field__msg--error">{errors.specialties}</p>}
            </div>

            <Input id="bio" label="자기소개" multiline rows={4}
              placeholder="경력, 주요 사건 경험, 수임 방식 등을 자유롭게 소개해 주세요. (20자 이상)"
              value={form.bio} onChange={handleChange}
              state={errors.bio ? 'error':'default'} errorMsg={errors.bio} />

            <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
              인증 신청하기
            </Button>
          </div>

          {/* 우측 — 자격증 + 프로필 사진 */}
          <div className="verify-upload-col">

            {/* 자격증 사진 */}
            <div className="verify-upload-section">
              <div className="verify-upload-label">
                변호사 자격증 사진 <span className="verify-required">필수</span>
              </div>
              <label
                className={`upload-zone${certFile ? ' upload-zone--done' : ''}${errors.certFile ? ' upload-zone--error' : ''}`}
                htmlFor="cert-file"
              >
                <div className="upload-zone__icon">{certFile ? '✓' : '📄'}</div>
                <div className="upload-zone__title">
                  {certFile ? certFile.name : '자격증 사진 업로드'}
                </div>
                <div className="upload-zone__sub">
                  {certFile
                    ? `${(certFile.size/1024/1024).toFixed(1)}MB · 업로드 완료`
                    : 'JPG, PNG, PDF — 최대 10MB'}
                </div>
                {!certFile && <Button variant="primary" size="sm" style={{ marginTop:8 }} type="button">파일 선택</Button>}
                {certFile  && <Button variant="ghost"   size="sm" style={{ marginTop:8 }} type="button">파일 변경</Button>}
              </label>
              <input id="cert-file" type="file" accept=".jpg,.jpeg,.png,.pdf"
                style={{ display:'none' }} onChange={handleCert} />
              {errors.certFile && <p className="field__msg field__msg--error">{errors.certFile}</p>}
            </div>

            {/* 프로필 사진 */}
            <div className="verify-upload-section">
              <div className="verify-upload-label">
                프로필 사진 <span className="verify-optional">선택</span>
              </div>
              <label className="verify-photo-zone" htmlFor="profile-photo">
                {photoPreview
                  ? <img src={photoPreview} alt="프로필 미리보기" className="verify-photo-preview" />
                  : (
                    <div className="verify-photo-placeholder">
                      <span className="verify-photo-icon">👤</span>
                      <span className="verify-photo-hint">클릭하여 사진 업로드</span>
                      <span className="verify-photo-sub">JPG, PNG · 정방형 권장</span>
                    </div>
                  )
                }
              </label>
              <input id="profile-photo" type="file" accept=".jpg,.jpeg,.png"
                style={{ display:'none' }} onChange={handlePhoto} />
              {photo && (
                <div className="verify-photo-info">
                  <span>{photo.name}</span>
                  <button type="button" className="verify-photo-remove"
                    onClick={() => { setPhoto(null); setPhotoPreview(null); }}>✕</button>
                </div>
              )}
            </div>

            {/* 매칭 미리보기 */}
            <div className="verify-preview-card">
              <div className="verify-preview-label">매칭 목록 미리보기</div>
              <div className="verify-preview-body">
                <div className="verify-preview-avatar">
                  {photoPreview
                    ? <img src={photoPreview} alt="preview" />
                    : <span>{form.name?.charAt(0) || '변'}</span>
                  }
                </div>
                <div className="verify-preview-info">
                  <div className="verify-preview-name">
                    {form.name || '이름'} 변호사
                  </div>
                  <div className="verify-preview-spec">
                    {form.specialties.length > 0 ? form.specialties.join('·') : '전문분야'}
                    {form.careerYears ? ` | 경력 ${form.careerYears}년` : ''}
                  </div>
                  <div className="verify-preview-tags">
                    {form.specialties.slice(0, 3).map(s => (
                      <span key={s} className="verify-preview-tag">{s}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="verify-info-box">
              <strong>노출 안내</strong>
              <ul>
                <li>이름·소속·경력·전문분야·평점이 목록에 노출됩니다</li>
                <li>연락처는 의뢰 확정 후에만 고객에게 공개됩니다</li>
                <li>평점은 의뢰 완료 후 고객 평가로 누적됩니다</li>
              </ul>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}
