// 401 응답 시 /api/members/refresh 한 번만 시도 후 원래 요청 재시도
// refresh도 실패하면 localStorage 초기화 후 로그인 페이지로 이동

let isRefreshing = false;
let isRedirectingToLogin = false;

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

export async function request(path, options = {}) {
  let response = await fetch(path, buildRequestOptions(options));

  if (response.status === 401) {
    const refreshed = await tryRefresh();

    if (refreshed) {
      response = await fetch(path, buildRequestOptions(options));
    }

    if (!refreshed || response.status === 401) {
      handleSessionExpired();

      throw new Error('세션이 만료되었습니다.');
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