import { request } from './http';

const JSON_HEADERS = {
  'Content-Type': 'application/json',
};

export function getMemberInfo(userId) {
  return request(`/api/members/${encodeURIComponent(userId)}`);
}

export function updateMemberInfo(userId, payload) {
  return request(`/api/members/${encodeURIComponent(userId)}`, {
    method: 'PATCH',
    headers: JSON_HEADERS,
    body: JSON.stringify({
      name: payload.name,
      phone: payload.phone,
      job: payload.job,
      gender: payload.gender,
    }),
  });
}