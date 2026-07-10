import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Button from '../components/Button';
import {
  pollAnalysis,
  sendAdvisorChat,
  saveChecklistChecks,
} from '../api/analysisApi';
import { downloadAnalysisPdf } from '../utils/pdfReport';
import './AnalysisDetailPage.css';

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

function formatDate(isoString) {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  } catch { return ''; }
}

export default function AnalysisDetailPage({ user }) {
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [checklist, setChecklist] = useState([]);
  const [chatMsgs, setChatMsgs] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [pdfDownloading, setPdfDownloading] = useState(false);
  const [checkSaving, setCheckSaving] = useState(false);
  const [checkSaved, setCheckSaved] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const result = await pollAnalysis(id);
        if (result.status !== 'COMPLETED' || !result.data) {
          setError('분석 결과를 불러올 수 없습니다.');
          return;
        }
        const d = result.data;
        setData(d);
        setChecklist((d.checklist || []).map(c => ({ ...c, checked: Boolean(c.checked), })));
        if (d.chat_content) {
          setChatMsgs([{ id: 1, senderType: 'AI', message: d.chat_content }]);
        }
      } catch (e) {
        setError(e.message || '결과를 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const toggleCheck = (cid) => {
    setChecklist(p =>
      p.map(c =>
        c.id === cid
          ? { ...c, checked: !c.checked }
          : c
      )
    );
    setCheckSaved(false);
  };

  const sendChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const question = chatInput.trim();
    setChatInput('');
    setChatMsgs(p => [...p, { id: Date.now(), senderType: 'USER', message: question }]);
    setChatLoading(true);
    try {
      const history = chatMsgs.map(m => ({
        role: m.senderType === 'USER' ? 'user' : 'ai',
        content: m.message,
      }));
      const res = await sendAdvisorChat({
        context: {
          chat_content: data.chat_content,
          checklist: data.checklist,
          warning: data.warning,
        },
        history,
        question,
      });
      setChatMsgs(p => [...p, { id: Date.now() + 1, senderType: 'AI', message: res.answer }]);
    } catch {
      setChatMsgs(p => [...p, { id: Date.now() + 1, senderType: 'AI', message: '답변을 가져오지 못했습니다. 다시 시도해 주세요.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  //downloadPDF Pro 플랜 전용 — 화면 캡처가 아니라 jsPDF로 텍스트를 직접 그리는 방식(utils/pdfReport.js)
  const downloadPDF = async () => {
    if (!user?.subscribe || !data) return;

    setPdfDownloading(true);
    try {
      await downloadAnalysisPdf({
        job: data.job,
        disease: data.disease,
        inspector: data.inspector,
        dateLabel: formatDate(data.createdAt),
        score,
        checklist: checklist.map((c) => ({
          title: c.label, purpose: c.purpose, method: c.method, reason: c.reason,
        })),
        warnings: data.warning || [],
        metaContent: data.meta_content || [],
        filename: `산내비_산재분석_${data.job || '직업'}_${data.disease || '질병'}.pdf`,
      });
    } catch (err) {
      console.error(err);
      alert('PDF 생성에 실패했습니다.');
    } finally {
      setPdfDownloading(false);
    }
  };

  const handleSaveChecklist = async () => {
    if (!user?.userId) {
      alert('로그인이 필요한 기능입니다.');
      return;
    }

    setCheckSaving(true);

    try {
      await saveChecklistChecks(id, checklist);
      setCheckSaved(true);
    } catch (err) {
      alert(err.message || '체크 상태 저장에 실패했습니다.');
    } finally {
      setCheckSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="ad-page">
        <Navbar user={user} />
        <div className="ad-container">
          <div className="mp-loading">분석 결과를 불러오는 중입니다...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ad-page">
        <Navbar user={user} />
        <div className="ad-container">
          <div className="mp-empty">{error}</div>
          <Link to="/mypage"><Button variant="outline" size="sm">마이페이지로 돌아가기</Button></Link>
        </div>
      </div>
    );
  }

  const score = Math.round(data.base_score);
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
          <section className="ad-left">
            <div className="ad-summary-card">
              <div className="ad-summary-left">
                <GaugeCircle score={score} />
                <div className="ad-summary-info">
                  <div className="ad-summary-title">산재 승인 예상 비율</div>
                  <div className="ad-summary-sub">직업·질병 통계 기반 참고 지표</div>
                  <div className="ad-progress">
                    <div className="ad-progress-fill" style={{ width: `${score}%` }} />
                  </div>
                </div>
              </div>
              <div className="ad-summary-right">
                <div className="ad-summary-field"><span>질병명</span><strong>{data.disease || '-'}</strong></div>
                <div className="ad-summary-field"><span>직업</span><strong>{data.job || '-'}</strong></div>
                <div className="ad-summary-field"><span>작성일</span><strong>{formatDate(data.createdAt)}</strong></div>
              </div>
            </div>

            <div className="ad-section">
              <div className="ad-section-header">
                <span className="ad-section-title">📋 증거 준비 체크리스트</span>

                <div className="ad-check-actions">
                  <span className="ad-check-count">
                    {checked}/{checklist.length}
                  </span>

                  <Button
                    variant={checkSaved ? 'success' : 'primary'}
                    size="xs"
                    loading={checkSaving}
                    onClick={handleSaveChecklist}
                  >
                    {checkSaved ? '저장 완료 ✓' : '저장'}
                  </Button>
                </div>
              </div>
              {checklist.map(c => (
                <div key={c.id} className={`ad-cl-item${c.checked ? ' ad-cl-item--done' : ''}`}>
                  <div className="ad-cl-top">
                    <button className={`ad-cl-check${c.checked ? ' ad-cl-check--done' : ''}`}
                      onClick={() => toggleCheck(c.id)}>
                      {c.checked ? '✓' : ''}
                    </button>
                    <span className="ad-cl-title">{c.label}</span>
                  </div>
                  <div className="ad-cl-detail">
                    <p><strong>[방법]</strong> {c.method}</p>
                    <p><strong>[이유]</strong> {c.reason}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="ad-section">
              <div className="ad-section-title">⚠️ 판례 기반 주의사항</div>
              {(data.warning || []).map((w, i) => (
                <div key={i} className="ad-warning-item">{w}</div>
              ))}
            </div>

            <div className="ad-section">
              <div className="ad-section-title">📚 참고 판례</div>
              {(data.meta_content || []).map((m, i) => (
                <div key={i} className="ad-meta-item">{m}</div>
              ))}
            </div>

            <div className="ad-pdf-area">
              {user?.subscribe
                ? (
                  <Button variant="primary" size="md" fullWidth loading={pdfDownloading} onClick={downloadPDF}>
                    📄 PDF 리포트 다운로드
                  </Button>
                )
                : (
                  <div className="ad-pdf-locked">
                    <p>PDF 다운로드는 <strong>Pro 플랜</strong>에서 가능합니다.</p>
                    <Link to="/subscribe"><Button variant="outline" size="sm">Pro 업그레이드</Button></Link>
                  </div>
                )
              }
            </div>
          </section>

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
              {chatLoading && (
                <div className="ad-bubble ad-bubble--bot">답변을 생성 중입니다...</div>
              )}
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
                onKeyDown={e => e.key === 'Enter' && sendChat()}
                disabled={chatLoading} />
              <button className="ad-chat-send" onClick={sendChat} aria-label="전송" disabled={chatLoading}>
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
