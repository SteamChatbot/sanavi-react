import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import Navbar from '../components/Navbar';
import Input from '../components/Input';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Avatar from '../components/Avatar';
import Pagination from '../components/Pagination';

import {
  getMemberInfo,
  updateMemberInfo,
} from '../api/memberApi';

import './MyPage.css';

const SAMPLE_HISTORY = [
  { id: 1, disease: '요추 추간판 탈출증', job: '건설현장 용접공', score: 72, date: '2026.06.08' },
  { id: 2, disease: '직업성 난청', job: '제조업 기계 조작', score: 58, date: '2026.06.05' },
  { id: 3, disease: '뇌경색', job: '장거리 운전기사', score: 81, date: '2026.05.28' },
];

const SAMPLE_MATCHES = [
  { id: 1, title: '요추 추간판 탈출증 산재 신청', status: 'BIDDING', price: 2000000, date: '2026.06.09' },
  { id: 2, title: '직업성 난청 의뢰', status: 'CLOSED', price: 1500000, date: '2026.06.01' },
];

const STATUS_MAP = {
  OPEN: '모집중',
  BIDDING: '입찰중',
  CLOSED: '마감',
  CANCELLED: '취소',
};

const STATUS_BADGE = {
  OPEN: 'primary',
  BIDDING: 'pending',
  CLOSED: 'ok',
  CANCELLED: 'rejected',
};

function normalizeRole(role) {
  if (!role) return 'USER';

  const normalized = String(role)
    .toUpperCase()
    .replace('ROLE_', '');

  if (normalized === 'USER') return 'USER';
  if (normalized === 'ADMIN') return 'ADMIN';
  if (normalized === 'LAWYER') return 'LAWYER';

  return normalized;
}

function toBooleanSubscribe(value) {
  return value === true || value === 1 || value === '1';
}

export default function MyPage({ user, onLogout, onUserUpdate }) {
  const navigate = useNavigate();

  const [tab, setTab] = useState('analysis');

  const [member, setMember] = useState(null);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    birth: '',
    job: '',
    gender: '',
  });

  const [pageLoading, setPageLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const [historyPage, setHistoryPage] = useState(1);
  const [history, setHistory] = useState(SAMPLE_HISTORY);

  const userId = user?.userId;

  useEffect(() => {
    if (!userId) {
      alert('로그인이 필요한 페이지입니다.');
      navigate('/login');
      return;
    }

    const fetchMemberInfo = async () => {
      setPageLoading(true);
      setError('');

      try {
        const result = await getMemberInfo(userId);
        const data = result.data;

        setMember(data);

        setForm({
          name: data.name || '',
          phone: data.phone || '',
          email: data.email || '',
          birth: data.birth || '',
          job: data.job || '',
          gender: data.gender || '',
        });
      } catch (err) {
        setError(err.message || '회원 정보를 불러오지 못했습니다.');
      } finally {
        setPageLoading(false);
      }
    };

    fetchMemberInfo();
  }, [userId, navigate]);

  const handleChange = (e) => {
    const { id, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [id]: value,
    }));

    setSaved(false);
    setError('');
  };

  const validate = () => {
    if (!form.name.trim()) return '이름을 입력해 주세요.';
    if (!form.phone.trim()) return '전화번호를 입력해 주세요.';
    if (!form.job.trim()) return '직업을 입력해 주세요.';
    if (!form.gender) return '성별을 선택해 주세요.';

    return '';
  };

  const handleSave = async () => {
    const message = validate();

    if (message) {
      setError(message);
      return;
    }

    setSaveLoading(true);
    setError('');

    try {
      const result = await updateMemberInfo(userId, {
        name: form.name.trim(),
        phone: form.phone.trim(),
        job: form.job.trim(),
        gender: form.gender,
      });

      const updatedMember = result.data;
      setMember(updatedMember);

      setForm({
        name: updatedMember.name || '',
        phone: updatedMember.phone || '',
        email: updatedMember.email || '',
        birth: updatedMember.birth || '',
        job: updatedMember.job || '',
        gender: updatedMember.gender || '',
      });

      const nextUser = {
        ...user,
        userId: updatedMember.userId,
        name: updatedMember.name,
        role: normalizeRole(updatedMember.role),
        subscribe: toBooleanSubscribe(updatedMember.subscribe),
      };

      localStorage.setItem('sanaviUser', JSON.stringify(nextUser));
      onUserUpdate?.(nextUser);

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err.message || '회원 정보 수정에 실패했습니다.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeleteAnalysis = (id) => {
    if (!window.confirm('분석 결과를 삭제하시겠습니까?')) return;

    setHistory((prev) => prev.filter((h) => h.id !== id));
  };

  const scoreColor = (score) => {
    if (score >= 75) return '#10b981';
    if (score >= 50) return '#f59e0b';
    return '#ef4444';
  };

  const displayName = form.name || user?.name || user?.userId || '사용자';
  const role = normalizeRole(member?.role || user?.role);
  const subscribed = toBooleanSubscribe(member?.subscribe ?? user?.subscribe);

  if (pageLoading) {
    return (
      <div className="mp-page">
        <Navbar user={user} onLogout={onLogout} />

        <div className="mp-container">
          <div className="mp-loading">
            회원 정보를 불러오는 중입니다...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mp-page">
      <Navbar user={user} onLogout={onLogout} />

      <div className="mp-container">
        <h1 className="mp-title">마이페이지</h1>

        <div className="mp-layout">
          <section className="mp-info-card">
            <div className="mp-profile">
              <Avatar name={displayName} size="lg" />

              <div className="mp-profile-info">
                <div className="mp-profile-name">
                  {displayName}님
                </div>

                <div className="mp-profile-badges">
                  {role === 'ADMIN' && <Badge type="admin">ADMIN</Badge>}
                  {role === 'LAWYER' && <Badge type="primary">변호사</Badge>}
                  {role === 'USER' && <Badge type="primary">일반 회원</Badge>}

                  <Badge type={subscribed ? 'pro' : 'primary'}>
                    {subscribed ? 'Pro' : 'Basic'}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="mp-form">
              <Input
                id="name"
                label="이름"
                placeholder="이름 입력"
                value={form.name}
                onChange={handleChange}
              />

              <Input
                id="phone"
                label="전화번호"
                placeholder="010-0000-0000"
                value={form.phone}
                onChange={handleChange}
              />

              <div className="field">
                <label className="field__label">이메일</label>
                <input
                  className="field__input"
                  value={form.email}
                  readOnly
                  disabled
                />
                <p className="mp-readonly-hint">
                  이메일 변경은 별도 인증이 필요합니다.
                </p>
              </div>

              <div className="field">
                <label className="field__label">생년월일</label>
                <input
                  className="field__input"
                  value={form.birth}
                  readOnly
                  disabled
                />
                <p className="mp-readonly-hint">
                  생년월일은 변경할 수 없습니다.
                </p>
              </div>

              <Input
                id="job"
                label="직업"
                placeholder="예: 건설현장 용접공"
                value={form.job}
                onChange={handleChange}
              />

              <div className="mp-select-field">
                <label className="field__label" htmlFor="gender">
                  성별
                </label>

                <select
                  id="gender"
                  className="mp-select"
                  value={form.gender}
                  onChange={handleChange}
                >
                  <option value="">선택</option>
                  <option value="M">남성</option>
                  <option value="F">여성</option>
                </select>
              </div>

              {error && (
                <p className="mp-error-message">
                  {error}
                </p>
              )}

              <Button
                variant={saved ? 'success' : 'primary'}
                size="md"
                fullWidth
                loading={saveLoading}
                onClick={handleSave}
              >
                {saved ? '저장되었습니다 ✓' : '정보 수정'}
              </Button>
            </div>

            {!subscribed && (
              <div className="mp-subscribe-banner">
                <div className="mp-sub-text">
                  <strong>Basic 플랜</strong>
                  <span>AI 분석 3회/월 · PDF 다운로드 불가</span>
                </div>

                <Link to="/subscribe">
                  <Button variant="primary" size="xs">
                    Pro 업그레이드
                  </Button>
                </Link>
              </div>
            )}
          </section>

          <section className="mp-history-card">
            <div className="mp-tabs">
              <button
                className={`mp-tab${tab === 'analysis' ? ' mp-tab--active' : ''}`}
                onClick={() => setTab('analysis')}
              >
                분석 이력 <span className="mp-tab-count">{history.length}</span>
              </button>

              <button
                className={`mp-tab${tab === 'match' ? ' mp-tab--active' : ''}`}
                onClick={() => setTab('match')}
              >
                의뢰 이력 <span className="mp-tab-count">{SAMPLE_MATCHES.length}</span>
              </button>
            </div>

            {tab === 'analysis' && (
              <div className="mp-list">
                {history.length === 0 ? (
                  <div className="mp-empty">
                    분석 이력이 없습니다.
                  </div>
                ) : (
                  history.map((h) => (
                    <div key={h.id} className="mp-history-row">
                      <div
                        className="mp-history-score"
                        style={{ color: scoreColor(h.score) }}
                      >
                        {h.score}%
                      </div>

                      <div className="mp-history-info">
                        <div className="mp-history-disease">
                          {h.disease}
                        </div>
                        <div className="mp-history-meta">
                          {h.job} · {h.date}
                        </div>
                      </div>

                      <div className="mp-history-actions">
                        <Link to={`/analysis/${h.id}`}>
                          <Button variant="outline" size="xs">
                            상세보기
                          </Button>
                        </Link>

                        <Button
                          variant="danger"
                          size="xs"
                          onClick={() => handleDeleteAnalysis(h.id)}
                        >
                          삭제
                        </Button>
                      </div>
                    </div>
                  ))
                )}

                <Pagination
                  currentPage={historyPage}
                  totalPages={3}
                  onPageChange={setHistoryPage}
                />
              </div>
            )}

            {tab === 'match' && (
              <div className="mp-list">
                {SAMPLE_MATCHES.map((m) => (
                  <div key={m.id} className="mp-history-row">
                    <Badge type={STATUS_BADGE[m.status]}>
                      {STATUS_MAP[m.status]}
                    </Badge>

                    <div className="mp-history-info">
                      <div className="mp-history-disease">
                        {m.title}
                      </div>

                      <div className="mp-history-meta">
                        희망 보수 ₩{m.price.toLocaleString()} · {m.date}
                      </div>
                    </div>

                    <Link to={`/match/${m.id}/bids`}>
                      <Button variant="outline" size="xs">
                        입찰 목록
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}