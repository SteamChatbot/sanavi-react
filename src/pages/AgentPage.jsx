import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import Button from '../components/Button';
import Input from '../components/Input';
import Badge from '../components/Badge';
import { ToastContainer } from '../components/Toast';
import './AgentPage.css';

const POLL_INTERVAL_MS = 20_000; //20초 추후 폴링방식대신 서버에서 push방식으로 수정가능

const LOADING_MESSAGES = [
  "입력 정보를 검토하고 있습니다.",
  "유사 직업·질병 조합의 통계를 조회하고 있습니다.",
  "관련 판례와 심사결정서를 찾고 있습니다.",
  "증거 보강 체크리스트를 구성하고 있습니다.",
  "AI 어드바이저 답변을 작성하고 있습니다.",
];

function createCaseSearchUrl(caseNumber) {
  return `https://www.google.com/search?q=${encodeURIComponent(`site:law.go.kr ${caseNumber}`)}`;
}

function GaugeCard({ score }) {
  const r = 45, circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);
  const color = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
  const level = score >= 75 ? '높음' : score >= 50 ? '보통' : '낮음';
  return (
    <div className="gauge-card">
      <div className="gauge-card__circle-wrap">
        <svg viewBox="0 0 100 100" width="150" height="150">
          <circle cx="50" cy="50" r={r} fill="none" stroke="#e2e8f0" strokeWidth="9" />
          <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="9"
            strokeDasharray={circ} strokeDashoffset={offset}
            strokeLinecap="round" transform="rotate(-90 50 50)"
            style={{ transition:'stroke-dashoffset 1s ease-out' }} />
        </svg>
        <div className="gauge-card__overlay">
          <span className="gauge-card__score" style={{ color }}>{score}<small>%</small></span>
          <span className="gauge-card__level" style={{ background:`${color}22`, color }}>{level}</span>
        </div>
      </div>
      <div className="gauge-card__title">산재 승인 예상 비율</div>
      <div className="gauge-card__sub">
        직업·질병 조합 통계 기반 참고 지표 — 실제 결과와 다를 수 있습니다
      </div>
    </div>
  );
}

function ChecklistItem({ title, purpose, method, reason, checked, onToggle }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`checklist-item${checked ? ' checklist-item--checked' : ''}`}>
      <div className="checklist-item__top">
        <button
          className={`checklist-item__check${checked ? ' checklist-item__check--done' : ''}`}
          onClick={onToggle} aria-label={checked ? '완료 취소' : '완료 표시'}
        >{checked ? '✓' : ''}</button>
        <button className="checklist-item__text-btn" onClick={onToggle}>
          <span className="checklist-item__title">{title}</span>
          {purpose && <span className="checklist-item__purpose">{purpose}</span>}
        </button>
        <button
          className="checklist-item__toggle"
          onClick={() => setOpen(o => !o)}
          aria-expanded={open}
        >
          자세히 보기 <span className="checklist-item__arrow">{open ? '▲' : '▼'}</span>
        </button>
      </div>
      {open && (
        <div className="checklist-item__detail">
          {purpose && <p><strong>[목적]</strong> {purpose}</p>}
          <p><strong>[방법]</strong> {method}</p>
          <p><strong>[이유]</strong> {reason}</p>
        </div>
      )}
    </div>
  );
}

function ChatBubble({ message, senderType }) {
  const isUser = senderType === 'USER';
  return (
    <div className={`chat-bubble${isUser ? ' chat-bubble--user' : ' chat-bubble--bot'}`}>
      {message}
    </div>
  );
}

export default function AgentPage({ user }) {
  const [view, setView] = useState('form'); // 'form' | 'pending' | 'result'
  const [form, setForm] = useState({ name:'', age:'', job:'', disease:'', inspector:'' });
  const [taskId, setTaskId] = useState(null);
  const [result, setResult] = useState(null);
  const [checklist, setChecklist] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [chatMsgs, setChatMsgs] = useState([
    { id:1, senderType:'AI', message:'안녕하세요. 산재 분석을 도와드릴 AI 어드바이저입니다. 왼쪽 폼을 먼저 작성해 주세요.' },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [pendingMsgIndex, setPendingMsgIndex] = useState(0);
  const pollIntervalRef = useRef(null);
  const pendingTimerRef = useRef(null);

  useEffect(() => {
    if (view === 'pending') {
      setPendingMsgIndex(0);
      pendingTimerRef.current = setInterval(() => {
        setPendingMsgIndex(i => (i + 1) % LOADING_MESSAGES.length);
      }, 1800);
    } else {
      clearInterval(pendingTimerRef.current);
    }
    return () => clearInterval(pendingTimerRef.current);
  }, [view]);

  const showError = (message) => {
    const id = Date.now();
    setToasts(p => [...p, { id, message, type: 'error' }]);
  };
  const removeToast = (id) => setToasts(p => p.filter(t => t.id !== id));

  const handleChange = e => setForm(p => ({ ...p, [e.target.id]: e.target.value }));

  // 1단계: 분석 요청 → task_id 수신
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          age: parseInt(form.age, 10),
          job: form.job,
          disease: form.disease,
          inspector: form.inspector,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || '분석 요청에 실패했습니다.');
      }
      const accepted = await res.json(); // { task_id, status: "PROCESSING" }
      setTaskId(accepted.task_id);
      setView('pending');
      setChatMsgs(p => [...p, {
        id: Date.now(), senderType: 'AI',
        message: '분석 요청이 접수되었습니다. AI가 판례와 통계를 검토 중입니다. 잠시 기다려 주세요.',
      }]);
    } catch (err) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 2단계: task_id가 생기면 폴링 시작 (20초 간격)
  useEffect(() => {
    if (!taskId) return;

    const poll = async () => {
      try {
        const res = await fetch(`/api/analysis/${taskId}`);
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || '결과 조회에 실패했습니다.');
        }
        const body = await res.json(); // { success, status, message, data }

        if (body.status === 'COMPLETED' && body.data) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;

          const d = body.data;//산출율,판례,주의사항,체크리스트
          setResult({
            score: Math.round(d.base_score),
            warnings: d.warning || [],
            metaContent: d.meta_content || [],
          });
          setChecklist((d.checklist || []).map(c => ({
            id: c.id,
            title: c.label,
            purpose: c.purpose || '',
            method: c.method,
            reason: c.reason,
            checked: false,
          })));
          setView('result');
          setChatMsgs(p => [...p, { id: Date.now(), senderType: 'AI', message: d.chat_content }]);

        } else if (body.status === 'ERROR') {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
          setView('form');
          showError(body.message || '분석 중 오류가 발생했습니다.');
        }
        // PROCESSING이면 계속 폴링
      } catch (err) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
        setView('form');
        showError(err.message);
      }
    };

    poll(); // 즉시 첫 폴링
    pollIntervalRef.current = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    };
  }, [taskId]);

  const toggleCheck = (id) => {
    setChecklist(p => p.map(c => c.id === id ? { ...c, checked: !c.checked } : c));
  };

  const sendChat = () => {
    if (!chatInput.trim()) return;
    const msg = chatInput.trim();
    setChatMsgs(p => [...p, { id:Date.now(), senderType:'USER', message:msg }]);
    setChatInput('');
    setTimeout(() => {
      setChatMsgs(p => [...p, { id:Date.now()+1, senderType:'AI', message:'네, 말씀해 주신 내용을 바탕으로 추가 분석을 진행하겠습니다. 구체적인 서류 준비 방법이나 절차에 대해 더 알려드릴까요?' }]);
    }, 600);
  };

  const checked = checklist.filter(c => c.checked).length;

  return (
    <div className="agent-page">
      <Navbar user={user} />
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      {loading && (
        <div className="loading-modal">
          <div className="loading-card">
            <div className="loading-spinner" />
            <h3>분석 요청을 접수하고 있습니다</h3>
            <p>잠시만 기다려 주세요.</p>
          </div>
        </div>
      )}
      <div className="agent-layout">

        {/* 좌 패널 */}
        <section className="agent-left glass-panel">

          {view === 'form' && (
            <>
              <div className="panel-header">
                <h2>사건 정보 입력</h2>
                <p>정확한 분석을 위해 상세 정보를 입력해 주세요.</p>
              </div>
              <form className="analysis-form" onSubmit={handleSubmit}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <Input id="name" label="이름" placeholder="홍길동" value={form.name} onChange={handleChange} />
                  <Input id="age"  label="나이" type="number" placeholder="45" value={form.age} onChange={handleChange} />
                </div>
                <Input id="job"      label="직업"       placeholder="예: 건설현장 용접공"       value={form.job}      onChange={handleChange} />
                <Input id="disease"  label="질병/부상명" placeholder="예: 요추 추간판 탈출증"   value={form.disease}  onChange={handleChange} />
                <Input id="inspector" label="사고 경위" multiline rows={4} placeholder="언제, 어디서, 어떻게 다치셨나요?" value={form.inspector} onChange={handleChange} />
                <Button type="submit" variant="primary" size="lg" fullWidth>분석 시작하기</Button>
              </form>
            </>
          )}

          {view === 'pending' && (
            <div className="pending-panel">
              <div className="pending-spinner" />
              <h3>AI가 분석 중입니다</h3>
              <p className="pending-msg">{LOADING_MESSAGES[pendingMsgIndex]}</p>
              <div className="pending-dots">
                {LOADING_MESSAGES.map((_, i) => (
                  <span key={i} className={`pending-dot${i === pendingMsgIndex ? ' pending-dot--active' : ''}`} />
                ))}
              </div>
              <div className="pending-job">{form.job} · {form.disease}</div>
            </div>
          )}

          {view === 'result' && (
            <>
              <div className="panel-header panel-header--result">
                <div>
                  <Badge type="ok">분석 완료</Badge>
                  <h2 style={{ marginTop:6 }}>분석 결과 리포트</h2>
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <Button variant="outline" size="sm">📄 PDF</Button>
                  <Button variant="ghost" size="sm" onClick={() => { setView('form'); setTaskId(null); }}>입력 수정</Button>
                </div>
              </div>
              <div className="result-body">
                <GaugeCard score={result.score} />

                <div className="evidence-card">
                  <div className="evidence-card__header">
                    <span className="evidence-card__title">증거 준비 진행도</span>
                    <span className="evidence-card__count">{checked}/{checklist.length}</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-bar__fill" style={{ width:`${checklist.length ? (checked/checklist.length)*100 : 0}%` }} />
                  </div>
                </div>

                <div className="checklist-area">
                  <h3 className="area-title">📋 증거 보강 체크리스트</h3>
                  {checklist.map(c => (
                    <ChecklistItem key={c.id} {...c} onToggle={() => toggleCheck(c.id)} purpose={c.purpose} />
                  ))}
                </div>

                <div className="warning-area">
                  <h3 className="area-title warning-title">⚠️ 판례 기반 주의사항</h3>
                  {result.warnings.map((w, i) => (
                    <div key={i} className="warning-item">{w}</div>
                  ))}
                </div>
              </div>
            </>
          )}
        </section>

        {/* 우 패널 — 채팅 + 참고 판례 */}
        <section className="agent-right glass-panel">
          <div className="chat-header">
            <span className="chat-header__dot" />
            AI 어드바이저
          </div>
          <div className="chat-messages">
            {chatMsgs.map(m => <ChatBubble key={m.id} {...m} />)}
          </div>
          <div className="chat-footer">
            <input
              className="chat-input"
              type="text"
              placeholder="AI에게 질문하기..."
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendChat()}
            />
            <button className="chat-send" onClick={sendChat} aria-label="전송">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
          {result?.metaContent?.length > 0 && (
            <div className="meta-panel">
              <div className="meta-panel__header">📎 참고 판례</div>
              <div className="meta-list">
                {result.metaContent.map((m, i) => (
                  <div key={i} className="meta-item">
                    <span className="meta-item__label">판례 {i + 1}</span>
                    <a
                      href={createCaseSearchUrl(m)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="meta-item__link"
                    >{m}</a>
                    <span className="meta-item__search">↗</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}