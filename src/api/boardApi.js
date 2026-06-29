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

export function createBoard(payload, files = []) {
  const formData = new FormData();

  formData.append('userId', payload.userId);
  formData.append('nickname', payload.nickname);
  formData.append('title', payload.title);
  formData.append('content', payload.content);

  files.forEach((file) => {
    formData.append('files', file);
  });

  return request('/api/boards', {
    method: 'POST',
    body: formData,
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

export function uploadBoardFiles(boardId, files = []) {
  const formData = new FormData();

  files.forEach((file) => {
    formData.append('files', file);
  });

  return request(`/api/boards/${boardId}/files`, {
    method: 'POST',
    body: formData,
  });
}

export function deleteBoardFile(boardId, fileId) {
  return request(`/api/boards/${boardId}/files/${fileId}`, {
    method: 'DELETE',
  });
}

export function getBoardComments(boardId) {
  return request(`/api/boards/${boardId}/comments`);
}

export function createBoardComment(boardId, payload) {
  return request(`/api/boards/${boardId}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

export function deleteBoardComment(boardId, commentId, userId) {
  const params = new URLSearchParams({
    userId,
  });

  return request(`/api/boards/${boardId}/comments/${commentId}?${params.toString()}`, {
    method: 'DELETE',
  });
}