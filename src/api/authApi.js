import { request } from './http';

const JSON_HEADERS = {
  'Content-Type': 'application/json',
};

/**
 * 아이디 중복 확인
 * GET /api/members/check-id?userId={userId}
 */
export function checkUserId(userId) {
  const params = new URLSearchParams({
    userId,
  });

  return request(`/api/members/check-id?${params.toString()}`, {
    skipAuthRefresh: true,
  });
}

/**
 * 이메일 인증번호 발송
 * POST /api/members/email/send
 */
export function sendEmailCode(email) {
  return request('/api/members/email/send', {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({
      email,
    }),
    skipAuthRefresh: true,
  });
}

/**
 * 이메일 인증번호 검증
 * POST /api/members/email/verify
 */
export function verifyEmailCode(email, code) {
  return request('/api/members/email/verify', {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({
      email,
      code,
    }),
    skipAuthRefresh: true,
  });
}

/**
 * 회원가입
 * POST /api/members/signup
 */
export function signupMember(payload) {
  return request('/api/members/signup', {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
    skipAuthRefresh: true,
  });
}

/**
 * 로그인
 * POST /api/members/login
 */
export function loginMember(payload) {
  return request('/api/members/login', {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({
      userId: payload.userId,
      password: payload.password,
    }),
    skipAuthRefresh: true,
  });
}

/**
 * 로그아웃 — AT 블랙리스트 등록 + RT 삭제 + 쿠키 초기화
 * POST /api/members/logout
 */
export function logoutMember() {
  return request('/api/members/logout', { method: 'POST' });
}

/**
 * AT 연장 — RT 쿠키로 새 AT 발급 (http.js 인터셉터 우회, 명시적 호출용)
 * POST /api/members/refresh
 */
export async function refreshToken() {
  const res = await fetch('/api/members/refresh', {
    method: 'POST',
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error('토큰 갱신 실패');
  }
}