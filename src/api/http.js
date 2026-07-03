// 401 응답 시 /api/members/refresh 한 번만 시도 후 원래 요청 재시도
// refresh도 실패하면 localStorage 초기화 후 로그인 페이지로 이동
// 단, 로그인/회원가입/이메일 인증 같은 공개 인증 API는 refresh 대상에서 제외
// 이유: 로그인 제한/비밀번호 오류/이메일 중복 같은 실패를 "세션 만료"로 오해하면 안 됨

let isRefreshing = false;
let isRedirectingToLogin = false;

// refresh 시도에서 제외할 공개 인증 API 목록
const AUTH_REFRESH_EXCLUDED_PATHS = [
  '/api/members/login',
  '/api/members/signup',
  '/api/members/check-id',
  '/api/members/email/send',
  '/api/members/email/verify',
];

function isAuthRefreshExcluded(path, skipAuthRefresh) {
  if (skipAuthRefresh) {
    return true;
  }

  return AUTH_REFRESH_EXCLUDED_PATHS.some((excludedPath) =>
    path.startsWith(excludedPath)
  );
}

function buildRequestOptions(options = {}) {
  const headers = new Headers(options.headers || {});

  return {
    ...options,
    credentials: 'include',
    headers,
  };
}

function handleSessionExpired() {
  if (isRedirectingToLogin) {
    return;
  }

  isRedirectingToLogin = true;

  localStorage.removeItem('sanaviUser');

  alert('세션이 만료되었습니다. 다시 로그인해 주세요.');

  // 뒤로가기로 만료된 페이지에 다시 돌아오는 것 방지
  window.location.replace('/login');
}

async function tryRefresh() {
  if (isRefreshing) {
    return false;
  }

  isRefreshing = true;

  try {
    const res = await fetch('/api/members/refresh', {
      method: 'POST',
      credentials: 'include',
    });

    return res.ok;
  } catch {
    return false;
  } finally {
    isRefreshing = false;
  }
}

async function parseResponse(response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function getErrorMessage(body, status) {
  if (body?.message) {
    return body.message;
  }

  if (body?.error) {
    return body.error;
  }

  if (typeof body === 'string' && body.trim()) {
    return body;
  }

  return `요청 실패: ${status}`;
}

export async function request(path, options = {}) {
  // skipAuthRefresh는 fetch 옵션이 아니라 우리 request 함수 내부 옵션
  // fetch에 그대로 넘기지 않기 위해 분리
  const {
    skipAuthRefresh = false,
    ...fetchOptions
  } = options;

  let response = await fetch(path, buildRequestOptions(fetchOptions));

  const shouldSkipAuthRefresh = isAuthRefreshExcluded(path, skipAuthRefresh);

  if (response.status === 401 && !shouldSkipAuthRefresh) {
    const refreshed = await tryRefresh();

    if (refreshed) {
      response = await fetch(path, buildRequestOptions(fetchOptions));
    }

    if (!refreshed || response.status === 401) {
      handleSessionExpired();

      throw new Error('세션이 만료되었습니다.');
    }
  }

  const body = await parseResponse(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(body, response.status));
  }

  if (body?.success === false) {
    throw new Error(body.message || '요청 처리에 실패했습니다.');
  }

  return body;
}