import { request } from './http';

export function getLawyerList() {
  return request('/api/requestlist/lawyers');
}

export function getLawyerDetail(lawyerId) {
  return request(`/api/requestlist/lawyers/${lawyerId}`);
}

export function createDirectRequest(payload, files = []) {
  const formData = new FormData();

  formData.append('userId', payload.userId);
  formData.append('lawyerId', payload.lawyerId);
  formData.append('title', payload.title);
  formData.append('content', payload.content);
  formData.append('price', payload.price);

  files.forEach((file) => {
    formData.append('files', file);
  });

  return request('/api/requestlist/requests', {
    method: 'POST',
    body: formData,
  });
}

export function getSentRequests(userId) {
  return request(`/api/requestlist/requests/sent?userId=${userId}`);
}

export function getReceivedRequests(lawyerId) {
  return request(`/api/requestlist/requests/received?lawyerId=${lawyerId}`);
}

export function getDirectRequestDetail(matchId) {
  return request(`/api/requestlist/requests/${matchId}`);
}

export function acceptDirectRequest(matchId, lawyerId) {
  return request(`/api/requestlist/requests/${matchId}/accept?lawyerId=${lawyerId}`, {
    method: 'PATCH',
  });
}

export function rejectDirectRequest(matchId, payload) {
  return request(`/api/requestlist/requests/${matchId}/reject`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

export function cancelDirectRequest(matchId, userId) {
  return request(`/api/requestlist/requests/${matchId}/cancel?userId=${userId}`, {
    method: 'PATCH',
  });
}