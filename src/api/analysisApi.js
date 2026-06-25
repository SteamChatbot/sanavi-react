import { request } from './http';

// 책임: /api/analysis 엔드포인트 호출 함수 모음
//       산재 분석 요청·폴링·추가 질의·이력 조회·논리 삭제 API 래핑

const JSON_HEADERS = { 'Content-Type': 'application/json' };

// Input:  form { name, age, job, disease, inspector }, user (비로그인 시 null)
// Output: ApiResponse<{ taskId, status }> — status: 'PROCESSING'
// 책임:   산재 분석 요청 — backend-springboot가 ai_count 체크 후 ai-api로 중계
//         비로그인 시 userId=null 전달, DB 저장 없이 분석만 수행
export function submitAnalysis(form, user) {
  return request('/api/analysis', {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({
      name: form.name,
      age: parseInt(form.age, 10),
      job: form.job,
      disease: form.disease,
      inspector: form.inspector,
      userId: user?.userId || null,
    }),
  });
}

// Input:  taskId (String — UUID)
// Output: ApiResponse<{ status, data }> — status: 'PROCESSING' | 'COMPLETED'
// 책임:   20초 간격으로 폴링하여 분석 완료 여부 확인
//         COMPLETED 시 data에 checklist·warning·metacontent·chatContent 포함
export function pollAnalysis(taskId) {
  return request(`/api/analysis/${taskId}`);
}

// Input:  { context, history, question }
// Output: ApiResponse<{ answer }>
// 책임:   분석 결과 기반 AI 추가 질의 — 브라우저 캐시 컨텍스트를 매 요청마다 전송 (stateless)
export function sendAdvisorChat({ context, history, question }) {
  return request('/api/analysis/chat', {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ context, history, question }),
  });
}

// Input:  userId (String)
// Output: ApiResponse<List<AnalysisHistoryItemDto>>
// 책임:   내 분석 이력 조회 — 최신순 정렬
export function fetchMyHistory(userId) {
  return request(`/api/analysis/history/${encodeURIComponent(userId)}`);
}

// Input:  taskId (String), userId (String)
// Output: ApiResponse<Void>
// 책임:   분석 결과 논리 삭제 (deleted=0) — userId 불일치 시 서버에서 404
export function deleteMyAnalysis(taskId, userId) {
  return request(`/api/analysis/${taskId}?userId=${encodeURIComponent(userId)}`, {
    method: 'DELETE',
  });
}
