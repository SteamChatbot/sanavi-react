import { request } from './http';

// 책임: /api/subscribe 엔드포인트 호출 함수 모음
//       구독 상태 조회 및 플랜 변경 API 래핑
//       subscribe: 0 = Basic(무료·3회 제한) / 1 = Pro(무제한)

// Input:  userId (String)
// Output: ApiResponse<Integer> — 0(Basic) | 1(Pro)
// 책임:   현재 구독 상태 조회
export function getSubscribeStatus(userId) {
  return request(`/api/subscribe/${userId}`);
}

// Input:  userId (String)
// Output: ApiResponse<Void>
// 책임:   Basic → Pro 업그레이드
export function activateSubscribe(userId) {
  return request(`/api/subscribe/${userId}/activate`, { method: 'PATCH' });
}

// Input:  userId (String)
// Output: ApiResponse<Void>
// 책임:   Pro → Basic 다운그레이드
export function cancelSubscribe(userId) {
  return request(`/api/subscribe/${userId}/cancel`, { method: 'PATCH' });
}
