import { request } from './http';

const JSON_HEADERS = {
  'Content-Type': 'application/json',
};

export function getMemberInfo() {
  return request('/api/members/me');
}

export function updateMemberInfo(payload) {
  return request('/api/members/me', {
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