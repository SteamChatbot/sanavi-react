import { request } from './http';

// 책임: /api/admin/analysis 엔드포인트 호출 함수 모음 (관리자 전용)
//       backend-springboot → ai-api 프록시 — 응답이 ApiResponse로 감싸지지 않고 그대로 전달됨

// Input:  { page, size, keyword, scoreFilter }
// Output: PageResponse<AdminAnalysisItemDto> — { contents, page, size, totalCount, totalPages }
export function getAdminAnalysisList({ page = 1, size = 10, keyword, scoreFilter } = {}) {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (keyword)     params.set('keyword', keyword);
  if (scoreFilter) params.set('scoreFilter', scoreFilter);
  return request(`/api/admin/analysis?${params.toString()}`);
}

// Input:  { keyword, scoreFilter }
// Output: AdminAnalysisStatsDto — { overallAverage, overallCount, filteredAverage, filteredCount }
export function getAdminAnalysisStats({ keyword, scoreFilter } = {}) {
  const params = new URLSearchParams();
  if (keyword)     params.set('keyword', keyword);
  if (scoreFilter) params.set('scoreFilter', scoreFilter);
  const query = params.toString();
  return request(`/api/admin/analysis/stats${query ? `?${query}` : ''}`);
}

// Input:  taskId (String)
// Output: 없음 (204)
// 책임:   소유자 무관 강제삭제
export function forceDeleteAdminAnalysis(taskId) {
  return request(`/api/admin/analysis/${taskId}`, { method: 'DELETE' });
}
