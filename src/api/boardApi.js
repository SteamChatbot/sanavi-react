import { request } from './http';

const JSON_HEADERS = {
  'Content-Type': 'application/json',
};

export function getBoardList({
  page = 1,
  size = 10,
  searchType = 'all',
  keyword = '',
} = {}) {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
    searchType,
    keyword,
  });

  return request(`/api/boards?${params.toString()}`);
}

export function getBoardDetail(boardId) {
  return request(`/api/boards/${boardId}`);
}

export function createBoard(payload) {
  return request('/api/boards', {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
  });
}

export function updateBoard(boardId, payload) {
  return request(`/api/boards/${boardId}`, {
    method: 'PATCH',
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
  });
}

export function deleteBoard(boardId) {
  return request(`/api/boards/${boardId}`, {
    method: 'DELETE',
  });
}