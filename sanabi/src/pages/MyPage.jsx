import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Input from '../components/Input';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Avatar from '../components/Avatar';
import Pagination from '../components/Pagination';
import './MyPage.css';

const SAMPLE_HISTORY = [
  { id: 1, disease: '요추 추간판 탈출증', job: '건설현장 용접공', score: 72, date: '2026.06.08' },
  { id: 2, disease: '직업성 난청',        job: '제조업 기계 조작', score: 58, date: '2026.06.05' },
  { id: 3, disease: '뇌경색',            job: '장거리 운전기사',  score: 81, date: '2026.05.28' },
];

const SAMPLE_MATCHES = [
  { id: 1, title: '요추 추간판 탈출증 산재 신청', status: 'BIDDING', price: 2000000, date: '2026.06.09' },
  { id: 2, title: '직업성 난청 의뢰',             status: 'CLOSED',  price: 1500000, date: '2026.06.01' },
];

const STATUS_MAP = {
  OPEN: '모집중', BIDDING: '입찰중', CLOSED: '마감', CANCELLED: '취소',
};
const STATUS_BADGE = {
  OPEN: 'primary', BIDDING: 'pending', CLOSED: 'ok', CANCELLED: 'rejected',
};

export default function MyPage({ user, onLogout }) {
  const [tab, setTab] = useState('analysis');
  const [form, setForm] = useState({
    phone: '010-1234-5678', email: 'user@email.com', job: '건설현장 용접공',
  });
  const [saveLoading, setSaveLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [history, setHistory] = useState(SAMPLE_HISTORY);

  const handleChange = e => setForm(p => ({ ...p, [e.target.id]: e.target.value }));

  const handleSave = async () => {
    setSaveLoading(true);
    try {
      // TODO: await api.updateMember(form)
      await new Promise(r => setTimeout(r, 600));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeleteAnalysis = (id) => {
    if (!window.confirm('분석 결과를 삭제하시겠습니까?')) return;
    setHistory(p => p.filter(h => h.id !== id));
    // TODO: await api.deleteAnalysis(id)
  };

  const scoreColor = s => s >= 75 ? '#10b981' : s >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div className="mp-page">
      <Navbar user={user} />
      <div className="mp-container">
        <h1 className="mp-title">마이페이지</h1>

        <div className="mp-layout">
          {/* 좌측 — 내 정보 */}
          <section className="mp-info-card">
            <div className="mp-profile">
              <Avatar name={user?.name || '김'} size="lg" />
              <div className="mp-profile-info">
                <div className="mp-profile-name">{user?.name || '김○○'}님</div>
                <div className="mp-profile-badges">
                  {user?.role === 'ADMIN'  && <Badge type="admin">ADMIN</Badge>}
                  {user?.role === 'LAWYER' && <Badge type="primary">변호사</Badge>}
                  {(!user?.role || user?.role === 'USER') && <Badge type="primary">일반 회원</Badge>}
                  <Badge type={user?.subscribe ? 'pro' : 'primary'}>
                    {user?.subscribe ? 'Pro' : 'Basic'}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="mp-form">
              <div className="field">
                <label className="field__label">이름</label>
                <input className="field__input" value={user?.name || '김○○'} readOnly disabled />
                <p className="mp-readonly-hint">이름은 변경할 수 없습니다.</p>
              </div>
              <Input id="phone" label="전화번호" placeholder="010-0000-0000"
                value={form.phone} onChange={handleChange} />
              <Input id="email" label="이메일" type="email" placeholder="email@example.com"
                value={form.email} onChange={handleChange} />
              <Input id="job" label="직업" placeholder="예: 건설현장 용접공"
                value={form.job} onChange={handleChange} />
              <Button variant={saved ? 'success' : 'primary'} size="md" fullWidth
                loading={saveLoading} onClick={handleSave}>
                {saved ? '저장되었습니다 ✓' : '정보 수정'}
              </Button>
            </div>

            {!user?.subscribe && (
              <div className="mp-subscribe-banner">
                <div className="mp-sub-text">
                  <strong>Basic 플랜</strong>
                  <span>AI 분석 3회/월 · PDF 다운로드 불가</span>
                </div>
                <Link to="/subscribe">
                  <Button variant="primary" size="xs">Pro 업그레이드</Button>
                </Link>
              </div>
            )}
          </section>

          {/* 우측 — 이력 탭 */}
          <section className="mp-history-card">
            <div className="mp-tabs">
              <button className={`mp-tab${tab === 'analysis' ? ' mp-tab--active' : ''}`}
                onClick={() => setTab('analysis')}>
                분석 이력 <span className="mp-tab-count">{history.length}</span>
              </button>
              <button className={`mp-tab${tab === 'match' ? ' mp-tab--active' : ''}`}
                onClick={() => setTab('match')}>
                의뢰 이력 <span className="mp-tab-count">{SAMPLE_MATCHES.length}</span>
              </button>
            </div>

            {tab === 'analysis' && (
              <div className="mp-list">
                {history.length === 0
                  ? <div className="mp-empty">분석 이력이 없습니다.</div>
                  : history.map(h => (
                    <div key={h.id} className="mp-history-row">
                      <div className="mp-history-score" style={{ color: scoreColor(h.score) }}>
                        {h.score}%
                      </div>
                      <div className="mp-history-info">
                        <div className="mp-history-disease">{h.disease}</div>
                        <div className="mp-history-meta">{h.job} · {h.date}</div>
                      </div>
                      <div className="mp-history-actions">
                        <Link to={`/analysis/${h.id}`}>
                          <Button variant="outline" size="xs">상세보기</Button>
                        </Link>
                        <Button variant="danger" size="xs" onClick={() => handleDeleteAnalysis(h.id)}>삭제</Button>
                      </div>
                    </div>
                  ))
                }
                <Pagination currentPage={historyPage} totalPages={3} onPageChange={setHistoryPage} />
              </div>
            )}

            {tab === 'match' && (
              <div className="mp-list">
                {SAMPLE_MATCHES.map(m => (
                  <div key={m.id} className="mp-history-row">
                    <Badge type={STATUS_BADGE[m.status]}>{STATUS_MAP[m.status]}</Badge>
                    <div className="mp-history-info">
                      <div className="mp-history-disease">{m.title}</div>
                      <div className="mp-history-meta">
                        희망 보수 ₩{m.price.toLocaleString()} · {m.date}
                      </div>
                    </div>
                    <Link to={`/match/${m.id}/bids`}>
                      <Button variant="outline" size="xs">입찰 목록</Button>
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
