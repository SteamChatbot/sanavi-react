import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Input from '../components/Input';
import Button from '../components/Button';
import './AuthPage.css';

export default function LoginPage({ onLogin }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.id]: e.target.value }));
    setErrors(prev => ({ ...prev, [e.target.id]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.email)    e.email    = '이메일을 입력해 주세요.';
    if (!form.password) e.password = '비밀번호를 입력해 주세요.';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length) { setErrors(e2); return; }
    setLoading(true);
    try {
      // TODO: await api.login(form) → JWT 저장
      await new Promise(r => setTimeout(r, 800));
      onLogin?.({ name: '김', role: 'USER' });
      navigate('/agent');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <Navbar />
      <div className="auth-wrap">
        <div className="auth-card">
          <div className="auth-logo">산내비 <span>AI</span></div>
          <h1 className="auth-title">다시 만나서 반갑습니다</h1>
          <p className="auth-sub">계속하려면 로그인해 주세요</p>

          {/* 소셜 로그인 */}
          <div className="social-grid">
            <button className="social-btn social-btn--kakao">
              <span className="social-btn__icon">🔑</span> 카카오
            </button>
            <button className="social-btn social-btn--naver">
              <span className="social-btn__icon">N</span> 네이버
            </button>
          </div>

          <div className="auth-divider"><span>또는 이메일로</span></div>

          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            <Input
              id="email" label="이메일" type="email"
              placeholder="example@email.com"
              value={form.email} onChange={handleChange}
              state={errors.email ? 'error' : 'default'}
              errorMsg={errors.email}
            />
            <Input
              id="password" label="비밀번호" type="password"
              placeholder="비밀번호 입력"
              value={form.password} onChange={handleChange}
              state={errors.password ? 'error' : 'default'}
              errorMsg={errors.password}
            />
            <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
              로그인
            </Button>
          </form>

          <p className="auth-footer-text">
            계정이 없으신가요? <Link to="/signup" className="auth-link">회원가입</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
