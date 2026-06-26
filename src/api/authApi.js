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

  return request(`/api/members/check-id?${params.toString()}`);
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
  });
}