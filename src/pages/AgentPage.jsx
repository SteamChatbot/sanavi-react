//분석페이지 폴링방식로딩모달(상태별 전환)+ 추가질의 페이지
import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import Button from '../components/Button';
import Input from '../components/Input';
import Badge from '../components/Badge';
import { ToastContainer } from '../components/Toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { submitAnalysis, pollAnalysis, sendAdvisorChat } from '../api/analysisApi';
import GaugeCard from '../components/GaugeCard';
import ChecklistItem from '../components/ChecklistItem';
import ChatBubble from '../components/ChatBubble';
import { useToast } from '../hooks/useToast';
import './AgentPage.css';

const POLL_INTERVAL_MS = 20_000; //20초 추후 폴링방식대신 서버에서 push방식으로 수정가능

const LOADING_MESSAGES = [
  "입력 정보를 검토하고 있습니다.",
  "유사 직업·질병 조합의 통계를 조회하고 있습니다.",
  "관련 판례와 심사결정서를 찾고 있습니다.",
  "증거 보강 체크리스트를 구성하고 있습니다.",
  "AI 어드바이저 답변을 작성하고 있습니다.",
];
// 메타데이터 판례 url 생성 및 링크로직 (구글검색이동)
function createCaseSearchUrl(caseNumber) {
  return `https://www.google.com/search?q=${encodeURIComponent(`site:law.go.kr ${caseNumber}`)}`;
}


//AgentPage 산재 AI 분석 메인 페이지 렌더링함수 (폼입력→폴링대기→결과+추가질의 전체 흐름)
//INPUT: user(로그인 유저 정보)
export default function AgentPage({ user, onLogout }) {
  const [view, setView] = useState('form'); // 'form' | 'pending' | 'result' 상태변화관리
  const [form, setForm] = useState({ name: '', age: '', job: '', disease: '', inspector: '' });
  const [taskId, setTaskId] = useState(null);
  const [result, setResult] = useState(null);
  const [checklist, setChecklist] = useState([]);
  const [loading, setLoading] = useState(false);
  const { toasts, showError, removeToast } = useToast();
  const [chatMsgs, setChatMsgs] = useState([
    { id: 1, senderType: 'AI', message: '안녕하세요. 산재 분석을 도와드릴 AI 어드바이저입니다. 왼쪽 폼을 먼저 작성해 주세요.' },
  ]);
  const [chatInput, setChatInput] = useState('');
  // 브라우저 캐시용 어드바이저 컨텍스트 — 분석 완료 시 저장, 매 채팅 요청에 포함
  const [chatContext, setChatContext] = useState(null);
  // 이번 세션의 Q&A 히스토리 — 서버에 함께 전송해 대화 맥락 유지
  const [advisorHistory, setAdvisorHistory] = useState([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [pendingMsgIndex, setPendingMsgIndex] = useState(0);
  const pollIntervalRef = useRef(null);
  const pendingTimerRef = useRef(null);
  const resultRef = useRef(null); // PDF 캡처 대상 영역
  const pdfPage1Ref = useRef(null); // PDF 전용 1페이지(기본정보+승인율) — 화면엔 안 보임
  const pdfPage2Ref = useRef(null); // PDF 전용 2페이지(체크리스트+주의사항+참고판례) — 화면엔 안 보임

  //pending 상태일 때 1.8초마다 로딩 문구 순환
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

  //handleChange 폼 입력값 업데이트 / INPUT: input onChange 이벤트
  const handleChange = e => setForm(p => ({ ...p, [e.target.id]: e.target.value }));

  // 1단계: 분석 요청 → task_id 수신
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const accepted = await submitAnalysis(form, user); // { task_id, status: "PROCESSING" }
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
        const body = await pollAnalysis(taskId); // { success, status, message, data }

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
          // 어드바이저 컨텍스트를 브라우저에 캐싱 (raw API 포맷 그대로 저장)
          // 추가질의 데이터 input
          //input: chat_content(초기응답),checklist(증거목록),warning(주의사항)
          setChatContext({
            chat_content: d.chat_content,
            checklist: d.checklist || [],
            warning: d.warning || [],
          });
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
  //브라우저 캐시 컨텍스트 + 히스토리를 서버에 전송해 실제 AI 응답 수신
  const sendChat = async () => {
    if (!chatInput.trim() || !chatContext || isChatLoading) return;
    const msg = chatInput.trim();
    setChatMsgs(p => [...p, { id: Date.now(), senderType: 'USER', message: msg }]);
    setChatInput('');
    setIsChatLoading(true);
    try {
      const data = await sendAdvisorChat({ context: chatContext, history: advisorHistory, question: msg });
      setChatMsgs(p => [...p, { id: Date.now(), senderType: 'AI', message: data.answer }]);
      setAdvisorHistory(p => [
        ...p,
        { role: 'user', content: msg },
        { role: 'ai', content: data.answer },
      ]);
    } catch (err) {
      showError(err.message);
    } finally {
      setIsChatLoading(false);
    }
  };

  // 캔버스 하나를 A4 페이지 높이 단위로 잘라 PDF에 순서대로 추가
  // (섹션 하나가 A4 한 장을 넘길 만큼 길 때만 여기서 추가 페이지로 자연스럽게 이어짐)
  const addCanvasAsPages = (pdf, canvas, isFirstPageOfDoc) => {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const pageCanvasHeight = Math.floor((canvasWidth * pageHeight) / pageWidth);

    let renderedHeight = 0;
    let sliceIndex = 0;

    while (renderedHeight < canvasHeight) {
      const pageCanvas = document.createElement('canvas');
      const pageContext = pageCanvas.getContext('2d');

      pageCanvas.width = canvasWidth;
      pageCanvas.height = Math.min(pageCanvasHeight, canvasHeight - renderedHeight);

      pageContext.drawImage(
        canvas,
        0, renderedHeight, canvasWidth, pageCanvas.height,
        0, 0, canvasWidth, pageCanvas.height
      );

      const imageData = pageCanvas.toDataURL('image/png');
      const imageHeight = (pageCanvas.height * pageWidth) / canvasWidth;

      if (!(isFirstPageOfDoc && sliceIndex === 0)) {
        pdf.addPage();
      }

      pdf.addImage(imageData, 'PNG', 0, 0, pageWidth, imageHeight);

      renderedHeight += pageCanvasHeight;
      sliceIndex += 1;
    }
  };

  //downloadPDF Pro 플랜 전용 — 웹 화면을 그대로 캡처하지 않고, PDF 전용으로 짠 별도 레이아웃
  //(pdfPage1Ref: 기본정보+승인율 / pdfPage2Ref: 체크리스트+주의사항+참고판례)을 각각 캡처해 페이지 경계를 명확히 나눔
  //INPUT: user.subscribe(구독여부) — false면 다운로드 차단
  const downloadPDF = async () => {
    if (!user?.subscribe) return;
    if (!pdfPage1Ref.current || !pdfPage2Ref.current) return;

    try {
      const captureOptions = { scale: 2, useCORS: true, backgroundColor: '#ffffff' };

      const page1Canvas = await html2canvas(pdfPage1Ref.current, captureOptions);
      const page2Canvas = await html2canvas(pdfPage2Ref.current, captureOptions);

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      addCanvasAsPages(pdf, page1Canvas, true);
      addCanvasAsPages(pdf, page2Canvas, false);

      const safeJob = form.job || '직업';
      const safeDisease = form.disease || '질병';

      pdf.save(`산내비_산재분석_${safeJob}_${safeDisease}.pdf`);
    } catch (error) {
      console.error(error);
      showError('PDF 생성에 실패했습니다.');
    }
  };

  const checked = checklist.filter(c => c.checked).length;

  return (
    <div className="agent-page">
      <Navbar user={user} onLogout={onLogout} />
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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Input id="name" label="이름" placeholder="홍길동" value={form.name} onChange={handleChange} />
                  <Input id="age" label="나이" type="number" placeholder="45" value={form.age} onChange={handleChange} />
                </div>
                <Input id="job" label="직업" placeholder="예: 건설현장 용접공" value={form.job} onChange={handleChange} />
                <Input id="disease" label="질병/부상명" placeholder="예: 요추 추간판 탈출증" value={form.disease} onChange={handleChange} />
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
                  <h2 style={{ marginTop: 6 }}>분석 결과 리포트</h2>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {user?.subscribe
                    ? <Button variant="outline" size="sm" onClick={downloadPDF}>📄 PDF</Button>
                    : <Button variant="outline" size="sm" onClick={() => showError('PDF 다운로드는 Pro 플랜에서 가능합니다.')}>📄 PDF 🔒</Button>
                  }
                  <Button variant="ghost" size="sm" onClick={() => { setView('form'); setTaskId(null); }}>입력 수정</Button>
                </div>
              </div>
              <div className="result-body" ref={resultRef}>
                <GaugeCard score={result.score} />

                <div className="evidence-card">
                  <div className="evidence-card__header">
                    <span className="evidence-card__title">증거 준비 진행도</span>
                    <span className="evidence-card__count">{checked}/{checklist.length}</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-bar__fill" style={{ width: `${checklist.length ? (checked / checklist.length) * 100 : 0}%` }} />
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
              placeholder={chatContext ? (isChatLoading ? 'AI가 답변 중입니다...' : 'AI에게 질문하기...') : '분석 완료 후 질문할 수 있습니다.'}
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendChat()}
              disabled={!chatContext || isChatLoading}
            />
            <button className="chat-send" onClick={sendChat} aria-label="전송" disabled={!chatContext || isChatLoading}>
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

      {/* PDF 전용 레이아웃 — 화면엔 안 보이고 downloadPDF에서만 캡처 대상으로 사용.
          웹 화면(result-body) 그대로 캡처하던 기존 방식은 카드 사이 여백/그림자 때문에 페이지 경계에서
          내용이 잘리는 문제가 있어서, 인쇄 전용으로 여백·폰트크기를 다시 짠 별도 마크업으로 분리함. */}
      {result && (
        <div style={{ position: 'absolute', left: -9999, top: 0 }} aria-hidden="true">
          <div
            ref={pdfPage1Ref}
            style={{
              width: 794, minHeight: 1000, boxSizing: 'border-box', padding: 56,
              background: '#ffffff', color: '#1a1a1a',
              fontFamily: "'Malgun Gothic','Apple SD Gothic Neo',sans-serif",
            }}
          >
            <div style={{ borderBottom: '3px solid #1a5c38', paddingBottom: 16, marginBottom: 28 }}>
              <div style={{ fontSize: 12, color: '#888' }}>산내비 AI · 산업재해 분석 리포트</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#1a5c38', marginTop: 4 }}>
                AI 산재 승인율 분석 결과
              </div>
              <div style={{ fontSize: 11, color: '#999', marginTop: 6 }}>
                생성일 {new Date().toLocaleDateString('ko-KR')}
              </div>
            </div>

            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>기본 정보</div>
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 24px',
              fontSize: 12.5, marginBottom: 22,
            }}>
              <div><span style={{ color: '#888' }}>이름</span> &nbsp;{form.name || '-'}</div>
              <div><span style={{ color: '#888' }}>나이</span> &nbsp;{form.age ? `${form.age}세` : '-'}</div>
              <div><span style={{ color: '#888' }}>직업</span> &nbsp;{form.job || '-'}</div>
              <div><span style={{ color: '#888' }}>질병/부상명</span> &nbsp;{form.disease || '-'}</div>
            </div>

            <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 8 }}>사고 경위</div>
            <div style={{
              fontSize: 11.5, lineHeight: 1.65, color: '#333', whiteSpace: 'pre-wrap',
              border: '1px solid #eaeaea', borderRadius: 8, padding: 14, marginBottom: 30,
            }}>
              {form.inspector || '-'}
            </div>

            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>AI 예측 산재 승인율</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 42, fontWeight: 800, color: '#1a5c38' }}>{result.score}%</span>
              <span style={{ fontSize: 11, color: '#888' }}>통계·판례 기반 AI 예측치</span>
            </div>
            <div style={{ height: 10, borderRadius: 6, background: '#eee', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${result.score}%`, background: '#1a5c38' }} />
            </div>

            <div style={{ fontSize: 10, color: '#aaa', marginTop: 60 }}>
              본 리포트는 AI 통계·판례 분석에 기반한 참고 자료이며 법적 효력을 갖지 않습니다. — 1 / 2
            </div>
          </div>

          <div
            ref={pdfPage2Ref}
            style={{
              width: 794, minHeight: 1000, boxSizing: 'border-box', padding: 56,
              background: '#ffffff', color: '#1a1a1a',
              fontFamily: "'Malgun Gothic','Apple SD Gothic Neo',sans-serif",
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>
              📋 증거 보강 체크리스트 ({checklist.length}건)
            </div>
            {checklist.map((c, i) => (
              <div key={c.id} style={{ borderBottom: '1px solid #eee', padding: '9px 0' }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 3 }}>{i + 1}. {c.title}</div>
                {c.purpose && (
                  <div style={{ fontSize: 11, color: '#777', marginBottom: 2 }}>목적 — {c.purpose}</div>
                )}
                <div style={{ fontSize: 11, color: '#777', marginBottom: 2 }}>확인 방법 — {c.method}</div>
                <div style={{ fontSize: 11, color: '#777' }}>사유 — {c.reason}</div>
              </div>
            ))}

            <div style={{ fontSize: 15, fontWeight: 700, margin: '26px 0 12px' }}>⚠ 판례 기반 주의사항</div>
            {result.warnings.map((w, i) => (
              <div key={i} style={{ fontSize: 11.5, lineHeight: 1.6, marginBottom: 6 }}>· {w}</div>
            ))}

            {result.metaContent.length > 0 && (
              <>
                <div style={{ fontSize: 15, fontWeight: 700, margin: '26px 0 12px' }}>📎 참고 판례</div>
                {result.metaContent.map((m, i) => (
                  <div key={i} style={{ fontSize: 11.5, marginBottom: 4 }}>판례 {i + 1}. {m}</div>
                ))}
              </>
            )}

            <div style={{ fontSize: 10, color: '#aaa', marginTop: 32 }}>2 / 2</div>
          </div>
        </div>
      )}
    </div>
  );
}