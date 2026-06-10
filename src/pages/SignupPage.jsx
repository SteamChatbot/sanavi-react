import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Input from '../components/Input';
import Button from '../components/Button';
import './AuthPage.css';

const STEPS = ['기본 정보', '약관 동의', '완료'];

function StepBar({ current }) {
  return (
    <div className="step-bar">
      {STEPS.map((label, i) => {
        const state = i < current ? 'done' : i === current ? 'active' : 'inactive';
        return (
          <React.Fragment key={i}>
            <div className={`step-bar__item step-bar__item--${state}`} title={label}>
              {state === 'done' ? '✓' : i + 1}
            </div>
            {i < STEPS.length - 1 && (
              <div className={`step-bar__line${i < current ? ' step-bar__line--done' : ''}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default function SignupPage({ onLogin }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ name:'', email:'', password:'', birth:'', job:'', gender:'' });
  const [agree, setAgree] = useState({ terms: false, privacy: false, marketing: false });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = e => {
    setForm(p => ({ ...p, [e.target.id]: e.target.value }));
    setErrors(p => ({ ...p, [e.target.id]: '' }));
  };

  const validateStep1 = () => {
    const e = {};
    if (!form.name)     e.name     = '이름을 입력해 주세요.';
    if (!form.email)    e.email    = '이메일을 입력해 주세요.';
    if (!form.password || form.password.length < 8) e.password = '비밀번호는 8자 이상이어야 합니다.';
    if (!form.birth)    e.birth    = '생년월일을 입력해 주세요.';
    if (!form.job)      e.job      = '직업을 입력해 주세요.';
    if (!form.gender)   e.gender   = '성별을 선택해 주세요.';
    return e;
  };

  const handleNext = () => {
    if (step === 0) {
      const e = validateStep1();
      if (Object.keys(e).length) { setErrors(e); return; }
    }
    if (step === 1 && (!agree.terms || !agree.privacy)) {
      alert('필수 약관에 동의해 주세요.'); return;
    }
    setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // TODO: await api.signup(form)
      await new Promise(r => setTimeout(r, 800));
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <Navbar />
      <div className="auth-wrap">
        <div className="auth-card" style={{ maxWidth: 440 }}>
          <div className="auth-logo">산내비 <span>AI</span></div>
          <StepBar current={step} />

          {step === 0 && (
            <>
              <h1 className="auth-title" style={{ textAlign:'left' }}>기본 정보 입력</h1>
              <p className="auth-sub" style={{ textAlign:'left', marginBottom:20 }}>Step 1 — 계정 정보</p>
              <div className="auth-form">
                <Input id="name"     label="이름"     placeholder="홍길동"       value={form.name}     onChange={handleChange} state={errors.name     ? 'error':'default'} errorMsg={errors.name} />
                <Input id="email"    label="이메일"   type="email" placeholder="example@email.com" value={form.email}    onChange={handleChange} state={errors.email    ? 'error':'default'} errorMsg={errors.email} />
                <Input id="password" label="비밀번호" type="password" placeholder="8자 이상" value={form.password} onChange={handleChange} state={errors.password ? 'error':'default'} errorMsg={errors.password} />
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <Input id="birth" label="생년월일" type="date" value={form.birth} onChange={handleChange} state={errors.birth ? 'error':'default'} errorMsg={errors.birth} />
                  <div className="field">
                    <label className="field__label" htmlFor="gender">성별</label>
                    <select id="gender" className="field__input" value={form.gender} onChange={handleChange}>
                      <option value="">선택</option>
                      <option value="M">남성</option>
                      <option value="F">여성</option>
                    </select>
                  </div>
                </div>
                <Input id="job" label="직업" placeholder="예: 건설현장 용접공" value={form.job} onChange={handleChange} state={errors.job ? 'error':'default'} errorMsg={errors.job} />
                <Button variant="primary" size="lg" fullWidth onClick={handleNext}>다음 단계</Button>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h1 className="auth-title" style={{ textAlign:'left' }}>약관 동의</h1>
              <p className="auth-sub" style={{ textAlign:'left', marginBottom:20 }}>Step 2 — 필수 항목에 동의해 주세요</p>
              <div className="agree-list">
                <label className="agree-item agree-item--all">
                  <input type="checkbox" checked={agree.terms && agree.privacy && agree.marketing}
                    onChange={e => setAgree({ terms:e.target.checked, privacy:e.target.checked, marketing:e.target.checked })} />
                  <span>전체 동의</span>
                </label>
                {[
                  { key:'terms',     label:'이용약관 동의', required:true },
                  { key:'privacy',   label:'개인정보 처리방침', required:true },
                  { key:'marketing', label:'마케팅 수신 동의', required:false },
                ].map(({ key, label, required }) => (
                  <label key={key} className="agree-item">
                    <input type="checkbox" checked={agree[key]} onChange={e => setAgree(p => ({ ...p, [key]:e.target.checked }))} />
                    <span>{label} {required && <em className="agree-required">(필수)</em>}</span>
                  </label>
                ))}
              </div>
              <div style={{ display:'flex', gap:10, marginTop:24 }}>
                <Button variant="outline" size="lg" fullWidth onClick={() => setStep(0)}>이전</Button>
                <Button variant="primary" size="lg" fullWidth loading={loading} onClick={handleSubmit}>가입 완료</Button>
              </div>
            </>
          )}

          {step === 2 && (
            <div style={{ textAlign:'center', display:'flex', flexDirection:'column', gap:16, alignItems:'center' }}>
              <div style={{ width:56, height:56, borderRadius:'50%', background:'var(--color-success-light)', border:'2px solid var(--color-success-border)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, color:'var(--color-success)' }}>✓</div>
              <h1 className="auth-title">회원가입 완료!</h1>
              <p className="auth-sub">환영합니다. 이제 산내비 AI를 이용할 수 있습니다.</p>
              <Button variant="primary" size="lg" fullWidth onClick={() => navigate('/agent')}>에이전트 바로가기</Button>
              <Link to="/login" className="auth-link" style={{ fontSize:13 }}>로그인 페이지로</Link>
            </div>
          )}

          {step < 2 && (
            <p className="auth-footer-text">
              이미 계정이 있으신가요? <Link to="/login" className="auth-link">로그인</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
