// 변호사 직접 연결 API — 의뢰인이 변호사를 직접 선택해 의뢰 요청을 보내는 흐름
// 상태 전이: PENDING → ACCEPTED(변호사 수락) | REJECTED(변호사 거절) | CANCELLED(의뢰인 취소)
import { request } from './http';

// Input:  { specialty, sido } — 선택 필터 (미전달 시 전체)
// Output: ApiResponse<List<LawyerListResponseDto>>
// 책임:   변호사 목록 조회 (전문분야·지역 필터 포함)
export function getLawyerList({ specialty, sido } = {}) {
  const params = new URLSearchParams();
  if (specialty) params.set('specialty', specialty);
  if (sido)      params.set('sido', sido);
  const qs = params.toString();
  return request(`/api/requestlist/lawyers${qs ? `?${qs}` : ''}`);
}

// 변호사 상세 조회 — LawyerDetailPage에서 사용
export function getLawyerDetail(lawyerId) {
  return request(`/api/requestlist/lawyers/${lawyerId}`);
}

// 직접 의뢰 생성 — multipart/form-data, 첨부파일 없을 경우 files=[] 기본값
// userId는 서버가 JWT로 설정
export function createDirectRequest(payload, files = []) {
  const formData = new FormData();

  formData.append('lawyerId', payload.lawyerId);
  formData.append('title', payload.title);
  formData.append('content', payload.content);
  formData.append('price', payload.price);

  files.forEach((file) => {
    formData.append('files', file);
  });

  return request('/api/requestlist/requests', {
    method: 'POST',
    body: formData,
  });
}

// 의뢰인이 보낸 의뢰 목록 — MyLawyerRequestsPage에서 사용
export function getSentRequests() {
  return request('/api/requestlist/requests/sent');
}

// 변호사가 받은 의뢰 목록 — LawyerReceivedRequestsPage에서 사용
export function getReceivedRequests() {
  return request('/api/requestlist/requests/received');
}

// 의뢰 단건 상세 조회 — DirectRequestDetailPage에서 사용
export function getDirectRequestDetail(matchId) {
  return request(`/api/requestlist/requests/${matchId}`);
}

// 변호사가 의뢰 수락 → 상태 ACCEPTED (서버가 JWT로 lawyerId 확인)
export function acceptDirectRequest(matchId) {
  return request(`/api/requestlist/requests/${matchId}/accept`, {
    method: 'PATCH',
  });
}

// 변호사가 의뢰 거절 → 상태 REJECTED, payload에 거절 사유 포함
export function rejectDirectRequest(matchId, payload) {
  return request(`/api/requestlist/requests/${matchId}/reject`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

// 의뢰인이 의뢰 취소 → 상태 CANCELLED (서버가 JWT로 userId 확인)
export function cancelDirectRequest(matchId) {
  return request(`/api/requestlist/requests/${matchId}/cancel`, {
    method: 'PATCH',
  });
}
