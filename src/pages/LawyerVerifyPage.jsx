// LawyerVerifyPage.jsx
import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Input from '../components/Input';
import Button from '../components/Button';
import './LawyerVerifyPage.css';

export function LawyerVerifyPage({ user }) {
  const [form, setForm] = useState({ name:'', licenseNo:'', firm:'', specialty:'', phone:'' });
  const [file, setFile] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = e => setForm(p => ({ ...p, [e.target.id]: e.target.value }));

  const handleFile = e => {
    const f = e.target.files[0];
    if (f) setFile(f);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) { alert('자격증 사진을 업로드해 주세요.'); return; }
    await new Promise(r => setTimeout(r, 800));
    setSubmitted(true);
  };

  if (submitted) return (
    <div className="verify-page">
      <Navbar user={user} />
      <div className="verify-container">
        <div className="verify-success">
          <div className="verify-success__icon">✓</div>
          <h2>인증 신청이 완료되었습니다</h2>
          <p>관리자 검토 후 영업일 1~2일 내에 승인 여부를 알려드립니다.</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="verify-page">
      <Navbar user={user} />
      <div className="verify-container">
        <div className="verify-notice">
          <h2 className="verify-notice__title">변호사 인증 안내</h2>
          <p className="verify-notice__text">변호사 자격증 사진을 업로드하면 관리자 검토 후 매칭 서비스에 등록됩니다. 검토는 영업일 1~2일 소요됩니다.</p>
        </div>

        <div className="verify-layout">
          <form className="verify-form" onSubmit={handleSubmit}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              <Input id="name"      label="이름"           placeholder="홍길동"    value={form.name}      onChange={handleChange} />
              <Input id="licenseNo" label="변호사 등록번호" placeholder="제 12345호" value={form.licenseNo} onChange={handleChange} />
            </div>
            <Input id="firm"      label="소속 법무법인" placeholder="○○ 법률사무소"   value={form.firm}      onChange={handleChange} />
            <Input id="specialty" label="전문 분야"     placeholder="산재·노동법 전문" value={form.specialty} onChange={handleChange} />
            <Input id="phone"     label="전화번호 (선택)" placeholder="010-0000-0000" value={form.phone}     onChange={handleChange} />
            <Button type="submit" variant="primary" size="lg" fullWidth>인증 신청</Button>
          </form>

          <div className="verify-upload">
            <label
              className={`upload-zone${file ? ' upload-zone--done' : ''}`}
              htmlFor="cert-file"
            >
              <div className="upload-zone__icon">{file ? '✓' : '📎'}</div>
              <div className="upload-zone__title">{file ? file.name : '변호사 자격증 사진 업로드'}</div>
              <div className="upload-zone__sub">
                {file ? `${(file.size/1024/1024).toFixed(1)}MB · 업로드 완료` : 'JPG, PNG, PDF — 최대 10MB\n클릭 또는 드래그하여 업로드'}
              </div>
              {!file && <Button variant="primary" size="sm" style={{ marginTop:8 }}>파일 선택</Button>}
              {file  && <Button variant="ghost"   size="sm" style={{ marginTop:8 }}>파일 변경</Button>}
            </label>
            <input id="cert-file" type="file" accept=".jpg,.jpeg,.png,.pdf" style={{ display:'none' }} onChange={handleFile} />
          </div>
        </div>
      </div>
    </div>
  );
}
