import { request } from './http';

// 책임: /api/matches 엔드포인트 호출 함수 모음
//       의뢰글 CRUD + 입찰 등록·목록·확정 API 래핑

// Input:  { page, size, userId } — userId 없으면 전체 조회 (변호사용), 있으면 해당 유저 필터 (고객용)
// Output: ApiResponse<PageResponse<MatchListResponseDto>>
// 책임:   의뢰글 목록 조회
export function getMatchList({ page = 1, size = 10, userId } = {}) {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (userId) params.set('userId', userId);
  return request(`/api/matches?${params.toString()}`);
}

// Input:  matchId (Number)
// Output: ApiResponse<MatchResponseDto> — 첨부파일 목록·의뢰자 정보 포함
// 책임:   의뢰글 단건 상세 조회
export function getMatchDetail(matchId) {
  return request(`/api/matches/${matchId}`);
}

// Input:  formData (FormData — userId·title·content·price·matchType + pdf 파일)
// Output: ApiResponse<Void>
// 책임:   의뢰글 작성 (multipart/form-data, Content-Type 브라우저 자동 설정)
export function createMatch(formData) {
  return request('/api/matches', {
    method: 'POST',
    body: formData,
  });
}

// Input:  matchId (Number), status (String — OPEN·BIDDING·CLOSED·CANCELLED)
// Output: ApiResponse<Void>
// 책임:   의뢰글 상태 직접 변경 (취소·마감 등)
export function updateMatchStatus(matchId, status, userId) {
  return request(`/api/matches/${matchId}/status?status=${status}&userId=${userId}`, {
    method: 'PATCH',
  });
}

// Input:  matchId (Number)
// Output: ApiResponse<Void>
// 책임:   의뢰글 + 첨부파일 논리 삭제
export function deleteMatch(matchId) {
  return request(`/api/matches/${matchId}`, { method: 'DELETE' });
}

// Input:  matchId (Number)
// Output: ApiResponse<List<MatchBidResponseDto>> — 입찰가 낮은 순 정렬
// 책임:   해당 의뢰글의 입찰 목록 조회
export function getBidList(matchId) {
  return request(`/api/matches/${matchId}/bids`);
}

// Input:  matchId (Number), payload { lawyerId, bidPrice, message }
// Output: ApiResponse<Void>
// 책임:   입찰 등록, 첫 입찰이면 서버에서 BIDDING 상태 자동 전환
export function createBid(matchId, payload) {
  return request(`/api/matches/${matchId}/bids`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

// Input:  matchId (Number), bidId (Number)
// Output: ApiResponse<Void>
// 책임:   입찰 확정 — 선택 SELECTED, 나머지 REJECTED, 의뢰글 CLOSED 서버 처리
export function selectBid(matchId, bidId) {
  return request(`/api/matches/${matchId}/bids/${bidId}/select`, {
    method: 'PATCH',
  });
}

// Input:  fileId (Number)
// Output: ApiResponse<String> — 15분 유효 Presigned URL
// 책임:   비공개 S3 파일 다운로드용 임시 서명 URL 발급
export function getFileDownloadUrl(fileId) {
  return request(`/api/matches/files/${fileId}/download`);
}

// Input:  matchId, bidId, userId (의뢰글 소유자)
// Output: ApiResponse<Void>
// 책임:   의뢰글 작성자가 특정 입찰 거절
export function rejectBid(matchId, bidId, userId) {
  return request(`/api/matches/${matchId}/bids/${bidId}/reject?userId=${userId}`, {
    method: 'PATCH',
  });
}

// Input:  bidId, lawyerId (입찰 취소 — 변호사 본인만)
// Output: ApiResponse<Void>
export function cancelBid(bidId, lawyerId) {
  return request(`/api/matches/bids/${bidId}?lawyerId=${lawyerId}`, {
    method: 'DELETE',
  });
}
