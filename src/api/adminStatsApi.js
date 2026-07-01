import { request } from './http';

// 책임: 관리자 통계 페이지 — 회원/매칭/변호사풀/AI분석 통계 엔드포인트 모음
//       회원·매칭·변호사풀 컨트롤러는 ApiResponse로 감싸져 있어 .data를 꺼내 반환
//       AI분석 추이/랭킹은 ai-api 프록시(AdminAnalysisController)라 감싸지지 않은 원본 그대로 반환

export async function getMemberTrend(range = 'daily') {
  const res = await request(`/api/admin/members/trend?range=${range}`);
  return res?.data ?? [];
}

export async function getMemberStats() {
  const res = await request('/api/admin/members/stats');
  return res?.data ?? null;
}

export async function getMatchStats() {
  const res = await request('/api/admin/matches/stats');
  return res?.data ?? null;
}

export async function getLawyerStats() {
  const res = await request('/api/admin/lawyers/stats');
  return res?.data ?? null;
}

export function getAnalysisTrend(range = 'daily') {
  return request(`/api/admin/analysis/trend?range=${range}`);
}

export function getAnalysisRanking(by = 'disease', limit = 10) {
  return request(`/api/admin/analysis/ranking?by=${by}&limit=${limit}`);
}

// 다중필터 조합 검색의 "직업" 드롭다운 후보 — member.job이 자유입력이라 빈도 TOP N 단어를 내려줌
export async function getTopJobKeywords(limit = 20) {
  const res = await request(`/api/admin/members/jobs/top?limit=${limit}`);
  return res?.data ?? [];
}

// 다중필터 조합 검색 — backend-springboot가 main_db(구독여부·유저타입·직업)로 후보를 추린 뒤
// ai-api(분석횟수)와 조합해 계산한 결과라 ApiResponse로 감싸져 있음 (analysis 프록시 계열과 다름)
// subscribe/role/job이 undefined면 쿼리스트링에서 아예 빠짐(=해당 조건 "전체")
export async function searchAnalysisCombo({ range = 'week', subscribe, role, job, limit = 100 } = {}) {
  const params = new URLSearchParams({ range, limit });
  if (subscribe !== undefined) params.set('subscribe', subscribe);
  if (role) params.set('role', role);
  if (job) params.set('job', job);
  const res = await request(`/api/admin/analysis/combo/search?${params.toString()}`);
  return res?.data ?? null;
}
