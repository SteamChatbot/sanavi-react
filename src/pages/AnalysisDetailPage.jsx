import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Badge from '../components/Badge';
import Button from '../components/Button';
import './AnalysisDetailPage.css';

const SAMPLE = {
  id: 1, disease: '요추 추간판 탈출증', job: '건설현장 용접공',
  inspector: '건설현장에서 10년간 용접 작업 중 허리 부상을 입었습니다.',
  score: 72, createdAt: '2026.06.08',
  checklist: [
    { id:1, title:'진단서',        method:'병원에서 초진 기록과 현재 진단서를 함께 발급받으세요.', reason:'질병과 사고 시점의 연결성을 보여주는 핵심 자료입니다.', checked:true },
    { id:2, title:'근무기록',      method:'출퇴근 기록, 작업일지, 배치표를 확보하세요.', reason:'업무 수행 중 발생했다는 점을 설명하는 근거가 됩니다.', checked:true },
    { id:3, title:'목격자 진술',   method:'동료나 현장 책임자의 진술을 정리하세요.', reason:'사고 상황을 보강하는 자료로 활용됩니다.', checked:false },
    { id:4, title:'작업환경 자료', method:'현장 사진, CCTV, 작업환경 측정자료를 확인하세요.', reason:'업무 환경과 질병의 관련성을 설명할 수 있습니다.', checked:false },
  ],
  warnings: [
    '업무 외 시간 발생 사고는 별도 입증 자료 필수',
    '지병이 있을 경우 업무 기여도를 강조해야 합니다',
  ],
  metacontent: ['서울행정법원 2024구합12345', '대법원 2023두98765'],
  chatHistory: [
    { id:1, senderType:'AI',   message:'안녕하세요. 산재 분석 결과를 안내해 드립니다.' },
    { id:2, senderType:'USER', message:'추가로 어떤 서류를 준비하면 좋을까요?' },
    { id:3, senderType:'AI',   message:'목격자 진술과 작업환경 자료를 우선 확보하는 것을 권장드립니다. 특히 현장 사진은 시간이 지날수록 확보가 어려워집니다.' },
  ],
};

function GaugeCircle({ score }) {
  const r = 40, circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);
  const color = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <svg width="96" height="96" viewBox="0 0 96 96">
      <circle cx="48" cy="48" r={r} fill="none" stroke="#e2e8f0" strokeWidth="8" />
      <circle cx="48" cy="48" r={r} fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" transform="rotate(-90 48 48)"
        style={{ transition: 'stroke-dashoffset .8s ease' }} />
      <text x="48" y="48" textAnchor="middle" dominantBaseline="central"
        fontSize="16" fontWeight="800" fill={color}>{score}%</text>
    </svg>
  );
}

export default function AnalysisDetailPage({ user }) {
  const { id } = useParams();
  const [checklist, setChecklist] = useState(SAMPLE.checklist);
  const [chatMsgs, setChatMsgs] = useState(SAMPLE.chatHistory);
  const [chatInput, setChatInput] = useState('');

  const toggleCheck = (cid) =>
    setChecklist(p => p.map(c => c.id === cid ? { ...c, checked: !c.checked } : c));

  const sendChat = () => {
    if (!chatInput.trim()) return;
    const msg = chatInput.trim();
    setChatMsgs(p => [...p, { id: Date.now(), senderType: 'USER', message: msg }]);
    setChatInput('');
    setTimeout(() => {
      setChatMsgs(p => [...p, { id: Date.now() + 1, senderType: 'AI', message: '네, 말씀하신 내용을 바탕으로 추가 조언을 드릴게요. 구체적인 서류 준비 방법이나 절차에 대해 더 알려드릴까요?' }]);
    }, 600);
  };

  const checked = checklist.filter(c => c.checked).length;

  return (
    <div className="ad-page">
      <Navbar user={user} />
      <div className="ad-container">
        <div className="ad-breadcrumb">
          <Link to="/mypage" className="ad-bc-link">마이페이지</Link>
          <span> › </span>
          <span>분석 이력 상세</span>
        </div>

        <div className="ad-layout">
          {/* 좌측 — 결과 재열람 */}
          <section className="ad-left">
            {/* 요약 카드 */}
            <div className="ad-summary-card">
              <div className="ad-summary-left">
                <GaugeCircle score={SAMPLE.score} />
                <div className="ad-summary-info">
                  <div className="ad-summary-title">산재 승인 예상 비율</div>
                  <div className="ad-summary-sub">직업·질병 통계 기반 참고 지표</div>
                  <div className="ad-progress">
                    <div className="ad-progress-fill" style={{ width: `${SAMPLE.score}%` }} />
                  </div>
                </div>
              </div>
              <div className="ad-summary-right">
                <div className="ad-summary-field"><span>질병명</span><strong>{SAMPLE.disease}</strong></div>
                <div className="ad-summary-field"><span>직업</span><strong>{SAMPLE.job}</strong></div>
                <div className="ad-summary-field"><span>작성일</span><strong>{SAMPLE.createdAt}</strong></div>
              </div>
            </div>

            {/* 체크리스트 */}
            <div className="ad-section">
              <div className="ad-section-header">
                <span className="ad-section-title">📋 증거 준비 체크리스트</span>
                <span className="ad-check-count">{checked}/{checklist.length}</span>
              </div>
              {checklist.map(c => (
                <div key={c.id} className={`ad-cl-item${c.checked ? ' ad-cl-item--done' : ''}`}>
                  <div className="ad-cl-top">
                    <button className={`ad-cl-check${c.checked ? ' ad-cl-check--done' : ''}`}
                      onClick={() => toggleCheck(c.id)}>
                      {c.checked ? '✓' : ''}
                    </button>
                    <span className="ad-cl-title">{c.title}</span>
                  </div>
                  <div className="ad-cl-detail">
                    <p><strong>[방법]</strong> {c.method}</p>
                    <p><strong>[이유]</strong> {c.reason}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* 주의사항 */}
            <div className="ad-section">
              <div className="ad-section-title">⚠️ 판례 기반 주의사항</div>
              {SAMPLE.warnings.map((w, i) => (
                <div key={i} className="ad-warning-item">{w}</div>
              ))}
            </div>

            {/* 참고 판례 */}
            <div className="ad-section">
              <div className="ad-section-title">📚 참고 판례</div>
              {SAMPLE.metacontent.map((m, i) => (
                <div key={i} className="ad-meta-item">{m}</div>
              ))}
            </div>

            {/* PDF 다운로드 */}
            <div className="ad-pdf-area">
              {user?.subscribe
                ? <Button variant="primary" size="md" fullWidth>📄 PDF 리포트 다운로드</Button>
                : (
                  <div className="ad-pdf-locked">
                    <p>PDF 다운로드는 <strong>Pro 플랜</strong>에서 가능합니다.</p>
                    <Link to="/subscribe"><Button variant="outline" size="sm">Pro 업그레이드</Button></Link>
                  </div>
                )
              }
            </div>
          </section>

          {/* 우측 — AI 추가 질의 */}
          <section className="ad-right ad-chat-panel">
            <div className="ad-chat-header">
              <span className="ad-chat-dot" />
              AI 추가 질의
            </div>
            <div className="ad-chat-msgs">
              {chatMsgs.map(m => (
                <div key={m.id} className={`ad-bubble${m.senderType === 'USER' ? ' ad-bubble--user' : ' ad-bubble--bot'}`}>
                  {m.message}
                </div>
              ))}
            </div>
            {!user?.subscribe && (
              <div className="ad-subscribe-notice">
                대화 저장은 Pro 플랜에서 가능합니다.
                <Link to="/subscribe" className="ad-sub-link"> Pro 업그레이드 →</Link>
              </div>
            )}
            <div className="ad-chat-footer">
              <input className="ad-chat-input" type="text"
                placeholder="추가 질문하기..."
                value={chatInput} onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendChat()} />
              <button className="ad-chat-send" onClick={sendChat} aria-label="전송">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
