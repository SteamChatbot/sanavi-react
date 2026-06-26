import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import Navbar from '../components/Navbar';
import Input from '../components/Input';
import Button from '../components/Button';

import {
  checkUserId,
  sendEmailCode,
  verifyEmailCode,
  signupMember,
} from '../api/authApi';

import './AuthPage.css';
import './SignupPage.css';

export default function SignupPage() {
  const navigate = useNavigate();

  const [step, setStep] = useState(0);

  const [form, setForm] = useState({
    userId: '',
    password: '',
    name: '',
    phone: '',
    email: '',
    emailCode: '',
    birth: '',
    job: '',
    gender: '',
  });

  const [agreeAll, setAgreeAll] = useState(false);
  const [agreements, setAgreements] = useState({
    terms: false,
    privacy: false,
    marketing: false,
  });

  const [idChecked, setIdChecked] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);

  const [loading, setLoading] = useState(false);
  const [idCheckLoading, setIdCheckLoading] = useState(false);
  const [emailSendLoading, setEmailSendLoading] = useState(false);
  const [emailVerifyLoading, setEmailVerifyLoading] = useState(false);

  const [errors, setErrors] = useState({});

  const [role, setRole] = useState('role_user');

  const [lawyerInfo, setLawyerInfo] = useState({
    firmName: '',
    region: '전체',
    experienceYears: 0,
    specialty: '산재',
  });

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

    if (id === 'userId') {
      setIdChecked(false);
    }

    if (id === 'email') {
      setEmailSent(false);
      setEmailVerified(false);

      setForm((prev) => ({
        ...prev,
        email: value,
        emailCode: '',
      }));
    }
  };

  const handleCheckUserId = async () => {
    if (!form.userId.trim()) {
      setErrors((prev) => ({
        ...prev,
        userId: '아이디를 입력해 주세요.',
      }));
      return;
    }

    setIdCheckLoading(true);

    try {
      const result = await checkUserId(form.userId.trim());

      if (result.data?.available) {
        setIdChecked(true);
        setErrors((prev) => ({
          ...prev,
          userId: '',
        }));
        alert('사용 가능한 아이디입니다.');
      } else {
        setIdChecked(false);
        setErrors((prev) => ({
          ...prev,
          userId: '이미 사용 중인 아이디입니다.',
        }));
      }
    } catch (error) {
      setIdChecked(false);
      setErrors((prev) => ({
        ...prev,
        userId: error.message || '아이디 중복 확인에 실패했습니다.',
      }));
    } finally {
      setIdCheckLoading(false);
    }
  };

  const handleSendEmailCode = async () => {
    if (!form.email.trim()) {
      setErrors((prev) => ({
        ...prev,
        email: '이메일을 입력해 주세요.',
      }));
      return;
    }

    setEmailSendLoading(true);

    try {
      await sendEmailCode(form.email.trim());

      setEmailSent(true);
      setEmailVerified(false);

      alert('인증번호가 발송되었습니다.');
    } catch (error) {
      setEmailSent(false);
      setEmailVerified(false);

      setErrors((prev) => ({
        ...prev,
        email: error.message || '인증번호 발송에 실패했습니다.',
      }));
    } finally {
      setEmailSendLoading(false);
    }
  };

  const handleVerifyEmailCode = async () => {
    if (!form.email.trim()) {
      setErrors((prev) => ({
        ...prev,
        email: '이메일을 입력해 주세요.',
      }));
      return;
    }

    if (!form.emailCode.trim()) {
      setErrors((prev) => ({
        ...prev,
        emailCode: '인증번호를 입력해 주세요.',
      }));
      return;
    }

    setEmailVerifyLoading(true);

    try {
      await verifyEmailCode(
        form.email.trim(),
        form.emailCode.trim()
      );

      setEmailVerified(true);

      setErrors((prev) => ({
        ...prev,
        emailCode: '',
      }));

      alert('이메일 인증이 완료되었습니다.');
    } catch (error) {
      setEmailVerified(false);

      setErrors((prev) => ({
        ...prev,
        emailCode: error.message || '이메일 인증에 실패했습니다.',
      }));
    } finally {
      setEmailVerifyLoading(false);
    }
  };

  const validateStep0 = () => {
    const nextErrors = {};

    if (!form.userId.trim()) {
      nextErrors.userId = '아이디를 입력해 주세요.';
    } else if (!idChecked) {
      nextErrors.userId = '아이디 중복 확인을 완료해 주세요.';
    }

    if (!form.password.trim()) {
      nextErrors.password = '비밀번호를 입력해 주세요.';
    } else if (form.password.length < 8) {
      nextErrors.password = '비밀번호는 8자 이상이어야 합니다.';
    }

    if (!form.name.trim()) {
      nextErrors.name = '이름을 입력해 주세요.';
    }

    if (!form.phone.trim()) {
      nextErrors.phone = '전화번호를 입력해 주세요.';
    }

    if (!form.email.trim()) {
      nextErrors.email = '이메일을 입력해 주세요.';
    }

    if (!emailVerified) {
      nextErrors.emailCode = '이메일 인증을 완료해 주세요.';
    }

    if (!form.birth) {
      nextErrors.birth = '생년월일을 입력해 주세요.';
    }

    if (!form.job.trim()) {
      nextErrors.job = '직업을 입력해 주세요.';
    }

    if (!form.gender) {
      nextErrors.gender = '성별을 선택해 주세요.';
    }

    if (role === 'role_lawyer') {
      if (!lawyerInfo.firmName.trim()) {
        nextErrors.firmName = '법률사무소명을 입력해 주세요.';
      }

      if (!lawyerInfo.region.trim()) {
        nextErrors.region = '활동 지역을 입력해 주세요.';
      }

      if (
        lawyerInfo.experienceYears === '' ||
        Number.isNaN(Number(lawyerInfo.experienceYears)) ||
        Number(lawyerInfo.experienceYears) < 0
      ) {
        nextErrors.experienceYears = '경력 연수를 올바르게 입력해 주세요.';
      }

      if (!lawyerInfo.specialty.trim()) {
        nextErrors.specialty = '전문 분야를 입력해 주세요.';
      }
    }

    return nextErrors;
  };

  const handleNext = () => {
    const nextErrors = validateStep0();

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setStep(1);
  };

  const handleAgreementChange = (key) => {
    const next = {
      ...agreements,
      [key]: !agreements[key],
    };

    setAgreements(next);

    const allChecked = next.terms && next.privacy && next.marketing;
    setAgreeAll(allChecked);
  };

  const handleAgreeAll = () => {
    const nextValue = !agreeAll;

    setAgreeAll(nextValue);
    setAgreements({
      terms: nextValue,
      privacy: nextValue,
      marketing: nextValue,
    });
  };

  const handleSubmit = async () => {
    if (!agreements.terms || !agreements.privacy) {
      setErrors((prev) => ({
        ...prev,
        submit: '필수 약관에 동의해 주세요.',
      }));
      return;
    }

    setLoading(true);

    try {
      await signupMember({
        userId: form.userId.trim(),
        password: form.password,
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        birth: form.birth,
        job: form.job.trim(),
        gender: form.gender,

        role,

        firmName: role === 'role_lawyer'
          ? lawyerInfo.firmName.trim()
          : null,

        region: role === 'role_lawyer'
          ? lawyerInfo.region.trim()
          : null,

        experienceYears: role === 'role_lawyer'
          ? Number(lawyerInfo.experienceYears || 0)
          : null,

        specialty: role === 'role_lawyer'
          ? lawyerInfo.specialty.trim()
          : null,
      });

      setStep(2);
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        submit: error.message || '회원가입에 실패했습니다.',
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleLawyerInfoChange = (e) => {
    const { id, value } = e.target;

    setLawyerInfo((prev) => ({
      ...prev,
      [id]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [id]: '',
      submit: '',
    }));
  };

  return (
    <div className="auth-page">
      <Navbar />

      <div className="auth-wrap">
        <div className="auth-card">
          <div className="auth-logo">
            산내비 <span>AI</span>
          </div>

          <h1 className="auth-title">회원가입</h1>
          <p className="auth-sub">산내비 AI 서비스를 시작해 보세요</p>

          <div className="step-bar">
            <div className={`step-bar__item ${step >= 0 ? 'step-bar__item--active' : 'step-bar__item--inactive'}`}>
              1
            </div>
            <div className={`step-bar__line ${step >= 1 ? 'step-bar__line--done' : ''}`} />
            <div className={`step-bar__item ${step >= 1 ? 'step-bar__item--active' : 'step-bar__item--inactive'}`}>
              2
            </div>
            <div className={`step-bar__line ${step >= 2 ? 'step-bar__line--done' : ''}`} />
            <div className={`step-bar__item ${step >= 2 ? 'step-bar__item--active' : 'step-bar__item--inactive'}`}>
              3
            </div>
          </div>

          {step === 0 && (
            <div className="auth-form">
              <div className="auth-inline-row">
                <Input
                  id="userId"
                  label="아이디"
                  placeholder="아이디 입력"
                  value={form.userId}
                  onChange={handleChange}
                  state={errors.userId ? 'error' : 'default'}
                  errorMsg={errors.userId}
                />

                <button
                  type="button"
                  className="auth-side-button"
                  onClick={handleCheckUserId}
                  disabled={idCheckLoading}
                >
                  {idCheckLoading ? '확인 중' : idChecked ? '확인됨' : '중복확인'}
                </button>
              </div>

              <Input
                id="password"
                label="비밀번호"
                type="password"
                placeholder="8자 이상 입력"
                value={form.password}
                onChange={handleChange}
                state={errors.password ? 'error' : 'default'}
                errorMsg={errors.password}
              />

              <Input
                id="name"
                label="이름"
                placeholder="홍길동"
                value={form.name}
                onChange={handleChange}
                state={errors.name ? 'error' : 'default'}
                errorMsg={errors.name}
              />

              <Input
                id="phone"
                label="전화번호"
                placeholder="010-1234-5678"
                value={form.phone}
                onChange={handleChange}
                state={errors.phone ? 'error' : 'default'}
                errorMsg={errors.phone}
              />

              <div className="auth-inline-row">
                <Input
                  id="email"
                  label="이메일"
                  type="email"
                  placeholder="example@email.com"
                  value={form.email}
                  onChange={handleChange}
                  state={errors.email ? 'error' : 'default'}
                  errorMsg={errors.email}
                />

                <button
                  type="button"
                  className="auth-side-button"
                  onClick={handleSendEmailCode}
                  disabled={emailSendLoading}
                >
                  {emailSendLoading ? '발송 중' : emailSent ? '재발송' : '인증발송'}
                </button>
              </div>

              <div className="auth-inline-row">
                <Input
                  id="emailCode"
                  label="인증번호"
                  placeholder="6자리 입력"
                  value={form.emailCode}
                  onChange={handleChange}
                  state={errors.emailCode ? 'error' : 'default'}
                  errorMsg={errors.emailCode}
                />

                <button
                  type="button"
                  className="auth-side-button"
                  onClick={handleVerifyEmailCode}
                  disabled={emailVerifyLoading}
                >
                  {emailVerifyLoading ? '확인 중' : emailVerified ? '인증됨' : '인증확인'}
                </button>
              </div>

              {emailVerified && (
                <p className="auth-success-message">
                  이메일 인증이 완료되었습니다.
                </p>
              )}

              <div className="auth-grid-2">
                <Input
                  id="birth"
                  label="생년월일"
                  type="date"
                  value={form.birth}
                  onChange={handleChange}
                  state={errors.birth ? 'error' : 'default'}
                  errorMsg={errors.birth}
                />

                <div className="auth-select-field">
                  <label className="auth-select-label" htmlFor="gender">
                    성별
                  </label>

                  <select
                    id="gender"
                    className={`auth-select ${errors.gender ? 'auth-select--error' : ''}`}
                    value={form.gender}
                    onChange={handleChange}
                  >
                    <option value="">선택</option>
                    <option value="M">남성</option>
                    <option value="F">여성</option>
                  </select>

                  {errors.gender && (
                    <p className="auth-error-message">
                      {errors.gender}
                    </p>
                  )}
                </div>
              </div>

              <Input
                id="job"
                label="직업"
                placeholder="예: 건설현장 용접공"
                value={form.job}
                onChange={handleChange}
                state={errors.job ? 'error' : 'default'}
                errorMsg={errors.job}
              />
              
              <div className="signup-role-section">
                <label className="auth-select-label">
                  가입 유형
                </label>

                <div className="signup-role-box">
                  <label
                    className={`signup-role-option ${role === 'role_user' ? 'signup-role-option--active' : ''
                      }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value="role_user"
                      checked={role === 'role_user'}
                      onChange={() => {
                        setRole('role_user');
                        setErrors((prev) => ({
                          ...prev,
                          firmName: '',
                          region: '',
                          experienceYears: '',
                          specialty: '',
                          submit: '',
                        }));
                      }}
                    />

                    <div>
                      <strong>일반 사용자</strong>
                      <span>
                        산재 분석, 게시판, 변호사 의뢰 기능을 이용합니다.
                      </span>
                    </div>
                  </label>

                  <label
                    className={`signup-role-option ${role === 'role_lawyer' ? 'signup-role-option--active' : ''
                      }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value="role_lawyer"
                      checked={role === 'role_lawyer'}
                      onChange={() => setRole('role_lawyer')}
                    />

                    <div>
                      <strong>변호사</strong>
                      <span>
                        사용자가 보낸 의뢰를 확인하고 수락 또는 거절할 수 있습니다.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {role === 'role_lawyer' && (
                <div className="lawyer-signup-fields">
                  <div className="lawyer-signup-guide">
                    변호사 회원은 가입 후 변호사 목록에 노출됩니다.
                  </div>

                  <Input
                    id="firmName"
                    label="법률사무소명"
                    placeholder="예: 산내비 법률사무소"
                    value={lawyerInfo.firmName}
                    onChange={handleLawyerInfoChange}
                    state={errors.firmName ? 'error' : 'default'}
                    errorMsg={errors.firmName}
                  />

                  <div className="auth-grid-2">
                    <Input
                      id="region"
                      label="활동 지역"
                      placeholder="예: 서울"
                      value={lawyerInfo.region}
                      onChange={handleLawyerInfoChange}
                      state={errors.region ? 'error' : 'default'}
                      errorMsg={errors.region}
                    />

                    <Input
                      id="experienceYears"
                      label="경력 연수"
                      type="number"
                      placeholder="예: 5"
                      value={lawyerInfo.experienceYears}
                      onChange={handleLawyerInfoChange}
                      state={errors.experienceYears ? 'error' : 'default'}
                      errorMsg={errors.experienceYears}
                    />
                  </div>

                  <Input
                    id="specialty"
                    label="전문 분야"
                    placeholder="예: 산업재해, 직업병, 요양급여"
                    value={lawyerInfo.specialty}
                    onChange={handleLawyerInfoChange}
                    state={errors.specialty ? 'error' : 'default'}
                    errorMsg={errors.specialty}
                  />
                </div>
              )}

              <Button
                type="button"
                variant="primary"
                size="lg"
                fullWidth
                onClick={handleNext}
              >
                다음 단계
              </Button>
            </div>
          )}

          {step === 1 && (
            <div className="auth-form">
              <div className="agree-list">
                <label className="agree-item agree-item--all">
                  <input
                    type="checkbox"
                    checked={agreeAll}
                    onChange={handleAgreeAll}
                  />
                  전체 동의
                </label>

                <label className="agree-item">
                  <input
                    type="checkbox"
                    checked={agreements.terms}
                    onChange={() => handleAgreementChange('terms')}
                  />
                  이용약관 동의 <em className="agree-required">필수</em>
                </label>

                <label className="agree-item">
                  <input
                    type="checkbox"
                    checked={agreements.privacy}
                    onChange={() => handleAgreementChange('privacy')}
                  />
                  개인정보 수집 및 이용 동의 <em className="agree-required">필수</em>
                </label>

                <label className="agree-item">
                  <input
                    type="checkbox"
                    checked={agreements.marketing}
                    onChange={() => handleAgreementChange('marketing')}
                  />
                  마케팅 정보 수신 동의 선택
                </label>
              </div>

              {errors.submit && (
                <p className="auth-error-message">
                  {errors.submit}
                </p>
              )}

              <div className="auth-action-row">
                <Button
                  type="button"
                  variant="ghost"
                  size="lg"
                  fullWidth
                  onClick={() => setStep(0)}
                >
                  이전
                </Button>

                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={loading}
                  onClick={handleSubmit}
                >
                  가입하기
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="auth-form">
              <div className="auth-complete">
                <div className="auth-complete__icon">✓</div>
                <h2 className="auth-complete__title">
                  회원가입이 완료되었습니다
                </h2>
                <p className="auth-complete__text">
                  이제 로그인 후 산내비 AI 서비스를 이용할 수 있습니다.
                </p>
              </div>

              <Button
                type="button"
                variant="primary"
                size="lg"
                fullWidth
                onClick={() => navigate('/login')}
              >
                로그인하러 가기
              </Button>
            </div>
          )}

          {step !== 2 && (
            <p className="auth-footer-text">
              이미 계정이 있으신가요?{' '}
              <Link to="/login" className="auth-link">
                로그인
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}