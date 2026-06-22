import { request } from './http';

const JSON_HEADERS = { 'Content-Type': 'application/json' };


// 산재 분석 요청
// POST /api/analysis
// user: 로그인 유저 객체 (비로그인 시 null) — userId를 포함해 backend-springboot가 ai_count 체크 후 ai-api 전달
export function submitAnalysis(form, user) {
  return request('/api/analysis', {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({
      name: form.name,
      age: parseInt(form.age, 10), //십진수
      job: form.job,
      disease: form.disease,
      inspector: form.inspector,
      userId: user?.userId || null, //default: null
    }),
  });
}


// 분석 결과 폴링
// GET /api/analysis/:taskId

export function pollAnalysis(taskId) {
  return request(`/api/analysis/${taskId}`);
}


// AI 어드바이저 추가 질의
// POST /api/analysis/chat

export function sendAdvisorChat({ context, history, question }) {
  return request('/api/analysis/chat', {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ context, history, question }),
  });
}


// 내 분석 이력 조회
// GET /api/analysis/history/:userId

export function fetchMyHistory(userId) {
  return request(`/api/analysis/history/${encodeURIComponent(userId)}`);
}


// 분석 결과 논리 삭제
// DELETE /api/analysis/:taskId?userId=:userId

export function deleteMyAnalysis(taskId, userId) {
  return request(`/api/analysis/${taskId}?userId=${encodeURIComponent(userId)}`, {
    method: 'DELETE',
  });
}
