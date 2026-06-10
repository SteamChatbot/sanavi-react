import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Button from '../components/Button';
import Input from '../components/Input';
import Badge from '../components/Badge';
import './AgentPage.css';

function GaugeCard({ score }) {
  const r = 45, circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);
  const color = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <div className="gauge-card">
      <div className="gauge-card__circle">
        <svg viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={r} fill="none" stroke="#e2e8f0" strokeWidth="8" />
          <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={circ} strokeDashoffset={offset}
            strokeLinecap="round" transform="rotate(-90 50 50)"
            style={{ transition:'stroke-dashoffset .8s ease' }} />
          <text x="50" y="50" textAnchor="middle" dominantBaseline="central"
            fontSize="16" fontWeight="800" fill={color}>{score}%</text>
        </svg>
      </div>
      <div className="gauge-card__info">
        <div className="gauge-card__title">산재 승인 예상 비율</div>
        <div className="gauge-card__sub">직업·질병 통계 기반 참고 지표</div>
        <div className="progress-bar">
          <div className="progress-bar__fill" style={{ width:`${score}%`, background:color }} />
        </div>
      </div>
    </div>
  );
}

function ChecklistItem({ title, method, reason, checked, onToggle }) {
  return (
    <div className={`checklist-item${checked ? ' checklist-item--checked' : ''}`}>
      <div className="checklist-item__top">
        <button
          className={`checklist-item__check${checked ? ' checklist-item__check--done' : ''}`}
          onClick={onToggle} aria-label={checked ? '완료 취소' : '완료 표시'}
        >{checked ? '✓' : ''}</button>
        <span className="checklist-item__title">{title}</span>
      </div>
      <div className="checklist-item__detail">
        <p><strong>[방법]</strong> {method}</p>
        <p><strong>[이유]</strong> {reason}</p>
      </div>
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

const SAMPLE_RESULT = {
  score: 72,
  checklist: [
    { id:1, title:'진단서',       method:'병원에서 초진 기록과 현재 진단서를 함께 발급받으세요.', reason:'질병/부상과 사고 시점의 연결성을 보여주는 핵심 자료입니다.', checked:true },
    { id:2, title:'근무기록',     method:'출퇴근 기록, 작업일지, 배치표를 확보하세요.', reason:'업무 수행 중 발생했다는 점을 설명하는 근거가 됩니다.', checked:true },
    { id:3, title:'목격자 진술',  method:'동료나 현장 책임자의 진술을 정리하세요.', reason:'사고 상황을 보강하는 자료로 활용될 수 있습니다.', checked:false },
    { id:4, title:'작업환경 자료',method:'현장 사진, CCTV, 작업환경 측정자료를 확인하세요.', reason:'업무 환경과 질병/부상의 관련성을 설명할 수 있습니다.', checked:false },
  ],
  warnings: ['업무 외 시간 발생 사고는 입증 자료 필수', '지병 있을 경우 업무 기여도 강조 필요'],
};

export default function AgentPage({ user }) {
  const [view, setView] = useState('form'); // 'form' | 'result'
  const [form, setForm] = useState({ name:'', age:'', job:'', disease:'', inspector:'' });
  const [result, setResult] = useState(null);
  const [checklist, setChecklist] = useState([]);
  const [loading, setLoading] = useState(false);
  const [chatMsgs, setChatMsgs] = useState([
    { id:1, senderType:'AI', message:'안녕하세요. 산재 분석을 도와드릴 AI 어드바이저입니다. 왼쪽 폼을 먼저 작성해 주세요.' },
  ]);
  const [chatInput, setChatInput] = useState('');

  const handleChange = e => setForm(p => ({ ...p, [e.target.id]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await new Promise(r => setTimeout(r, 1200));
      setResult(SAMPLE_RESULT);
      setChecklist(SAMPLE_RESULT.checklist);
      setView('result');
      setChatMsgs(p => [...p,
        { id:Date.now(), senderType:'AI', message:`${form.job} 직종의 ${form.disease} 케이스를 분석했습니다. 승인율은 72%로 나타났습니다. 궁금한 점이 있으시면 질문해 주세요.` }
      ]);
    } finally {
      setLoading(false);
    }
  };

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
      {loading && (
        <div className="loading-modal">
          <div className="loading-card">
            <div className="loading-spinner" />
            <h3>산재 분석을 진행하고 있습니다</h3>
            <p>통계, 판례, 심사결정서 기반 자료를 함께 검토하고 있습니다.</p>
          </div>
        </div>
      )}
      <div className="agent-layout">
        {/* 좌 패널 */}
        <section className="agent-left glass-panel">
          {view === 'form' ? (
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
          ) : (
            <>
              <div className="panel-header panel-header--result">
                <div>
                  <Badge type="ok">분석 완료</Badge>
                  <h2 style={{ marginTop:6 }}>분석 결과 리포트</h2>
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <Button variant="outline" size="sm">📄 PDF</Button>
                  <Button variant="ghost" size="sm" onClick={() => setView('form')}>입력 수정</Button>
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
                    <div className="progress-bar__fill" style={{ width:`${(checked/checklist.length)*100}%` }} />
                  </div>
                </div>

                <div className="checklist-area">
                  <h3 className="area-title">📋 증거 보강 체크리스트</h3>
                  {checklist.map(c => (
                    <ChecklistItem key={c.id} {...c} onToggle={() => toggleCheck(c.id)} />
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

        {/* 우 패널 — 채팅 */}
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
        </section>
      </div>
    </div>
  );
}
