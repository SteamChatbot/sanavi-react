import { request } from './http';

// 책임: /api/subscribe 엔드포인트 호출 함수 모음
//       구독 상태 조회 및 플랜 변경 API 래핑
//       subscribe: 0 = Basic(무료·3회 제한) / 1 = Pro(무제한)

// Output: ApiResponse<Integer> — 0(Basic) | 1(Pro)
// 책임:   현재 구독 상태 조회
export function getSubscribeStatus() {
  return request('/api/subscribe');
}

// Output: ApiResponse<Void>
// 책임:   Basic → Pro 업그레이드
export function activateSubscribe() {
  return request('/api/subscribe/activate', { method: 'PATCH' });
}

// Output: ApiResponse<Void>
// 책임:   Pro → Basic 다운그레이드
export function cancelSubscribe() {
  return request('/api/subscribe/cancel', { method: 'PATCH' });
}
