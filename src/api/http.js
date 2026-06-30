// 401 응답 시 /api/members/refresh 한 번만 시도 후 원래 요청 재시도
// refresh도 실패하면 localStorage 초기화 후 로그인 페이지로 이동
let isRefreshing = false;

function getSavedUser() {
  try {
    return JSON.parse(localStorage.getItem('sanaviUser'));
  } catch {
    return null;
  }
}

function buildRequestOptions(options = {}) {
  const savedUser = getSavedUser();

  const headers = new Headers(options.headers || {});

  // 로그용 임시 헤더
  // 권한 판단용으로 사용하면 안 됨
  if (savedUser?.userId) {
    headers.set('X-User-Id', savedUser.userId);
  }

  if (savedUser?.role) {
    headers.set('X-User-Role', savedUser.role);
  }

  return {
    ...options,
    credentials: 'include',
    headers,
  };
}

async function tryRefresh() {
  if (isRefreshing) return false;

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

export async function request(path, options = {}) {
  let response = await fetch(path, buildRequestOptions(options));

  if (response.status === 401) {
    const refreshed = await tryRefresh();

    if (refreshed) {
      response = await fetch(path, buildRequestOptions(options));
    }
    // refresh 실패 → 강제 로그아웃    
    if (!refreshed || response.status === 401) {
      localStorage.removeItem('sanaviUser');
      window.location.href = '/login';
      return;
    }
  }

  const body = await parseResponse(response);

  if (!response.ok) {
    throw new Error(body?.message || `요청 실패: ${response.status}`);
  }

  if (body?.success === false) {
    throw new Error(body.message || '요청 처리에 실패했습니다.');
  }

  return body;
}