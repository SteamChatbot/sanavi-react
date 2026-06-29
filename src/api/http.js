// 401 응답 시 /api/members/refresh 한 번만 시도 후 원래 요청 재시도
// refresh도 실패하면 localStorage 초기화 후 로그인 페이지로 이동
let isRefreshing = false;

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

export async function request(path, options = {}) {
  const response = await fetch(path, { credentials: 'include', ...options });

  if (response.status === 401) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      // 새 AT 쿠키 세팅 완료 — 원래 요청 재시도
      const retry = await fetch(path, { credentials: 'include', ...options });
      if (retry.ok) {
        const text = await retry.text();
        if (!text) return null;
        try { return JSON.parse(text); } catch { return text; }
      }
    }
    // refresh 실패 → 강제 로그아웃
    localStorage.removeItem('sanaviUser');
    window.location.href = '/login';
    return;
  }

  const text = await response.text();

  let body = null;

  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  if (!response.ok) {
    throw new Error(body?.message || `요청 실패: ${response.status}`);
  }

  if (body?.success === false) {
    throw new Error(body.message || '요청 처리에 실패했습니다.');
  }

  return body;
}
