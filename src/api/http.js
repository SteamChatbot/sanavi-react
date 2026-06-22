export async function request(path, options = {}) {
  const response = await fetch(path, options);

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