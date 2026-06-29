import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Input from '../components/Input';
import Button from '../components/Button';
import { loginMember } from '../api/authApi';
import { parseRole } from '../constants/roles';
import { useForm } from '../hooks/useForm';
import './AuthPage.css';

export default function LoginPage({ onLogin }) {
  const { form, errors, setErrors, handleChange } = useForm({
    userId: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const validate = () => {
    const nextErrors = {};

    if (!form.userId.trim()) {
      nextErrors.userId = '아이디를 입력해 주세요.';
    }

    if (!form.password.trim()) {
      nextErrors.password = '비밀번호를 입력해 주세요.';
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

    setLoading(true);

    try {
      const result = await loginMember({
        userId: form.userId.trim(),
        password: form.password,
      });

      const data = result.data || {};

      const loginUser = {
        userId: data.userId || data.loginId || form.userId.trim(),
        name: data.name || data.nickname || form.userId.trim(),
        role: parseRole(data.role),
        subscribe: Boolean(data.subscribe),
      };

      localStorage.setItem('sanaviUser', JSON.stringify(loginUser));

      onLogin?.(loginUser);

      navigate('/agent');
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        submit: error.message || '로그인에 실패했습니다.',
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <Navbar />

      <div className="auth-wrap">
        <div className="auth-card">
          <div className="auth-logo">
            산내비 <span>AI</span>
          </div>

          <h1 className="auth-title">다시 만나서 반갑습니다</h1>
          <p className="auth-sub">계속하려면 로그인해 주세요</p>

          {/* 소셜 로그인 — 미구현 (제외)
          <div className="social-grid">
            <button type="button" className="social-btn social-btn--kakao">
              <span className="social-btn__icon">🔑</span> 카카오
            </button>
            <button type="button" className="social-btn social-btn--naver">
              <span className="social-btn__icon">N</span> 네이버
            </button>
          </div>

          <div className="auth-divider">
            <span>또는 아이디로</span>
          </div>
          */}

          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            <Input
              id="userId"
              label="아이디"
              placeholder="아이디 입력"
              value={form.userId}
              onChange={handleChange}
              state={errors.userId ? 'error' : 'default'}
              errorMsg={errors.userId}
            />

            <Input
              id="password"
              label="비밀번호"
              type="password"
              placeholder="비밀번호 입력"
              value={form.password}
              onChange={handleChange}
              state={errors.password ? 'error' : 'default'}
              errorMsg={errors.password}
            />

            {errors.submit && (
              <p className="auth-error-message">
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
              로그인
            </Button>
          </form>

          <p className="auth-footer-text">
            계정이 없으신가요?{' '}
            <Link to="/signup" className="auth-link">
              회원가입
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}