import { request } from './http';

// 책임: /api/admin/mail 엔드포인트 호출 함수 모음 (관리자 전용 — 대량 메일 발송)

function filterToParams(filter) {
  const params = new URLSearchParams();
  if (filter.userIds?.length) filter.userIds.forEach((id) => params.append('userIds', id));
  if (filter.subscribe !== undefined && filter.subscribe !== null) params.set('subscribe', String(filter.subscribe));
  if (filter.role) params.set('role', filter.role);
  if (filter.jobs?.length) filter.jobs.forEach((job) => params.append('jobs', job));
  if (filter.createdFrom) params.set('createdFrom', filter.createdFrom);
  if (filter.createdTo) params.set('createdTo', filter.createdTo);
  params.set('excludeBlacklist', String(!!filter.excludeBlacklist));
  params.set('excludeLawyer', String(!!filter.excludeLawyer));
  params.set('excludeAlreadyPro', String(!!filter.excludeAlreadyPro));
  return params;
}

// Output: string[] — 회원 job 컬럼의 distinct 값(직업 다중선택 드롭다운 옵션)
export function getMailJobOptions() {
  return request('/api/admin/mail/jobs');
}

// Input:  MailAudienceFilter — { userIds, subscribe, role, jobs, createdFrom, createdTo, excludeBlacklist, excludeLawyer, excludeAlreadyPro }
// Output: { targetCount }
export function getMailAudienceCount(filter) {
  return request(`/api/admin/mail/audience/count?${filterToParams(filter).toString()}`);
}

// Input:  { filter: MailAudienceFilter, subject, htmlBody }
// Output: { targetCount } — 발송은 서버에서 비동기로 진행, 즉시 대상 인원수만 반환
export function sendBulkMail({ filter, subject, htmlBody }) {
  return request('/api/admin/mail/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filter, subject, htmlBody }),
  });
}
