import { request } from './http';

// 책임: /api/admin/system 엔드포인트 호출 함수 모음 (관리자 전용 — 시스템 모니터링)

// Output: SystemMetricsDto — { cpuPercent, cpuCores, loadAverage, memoryUsedBytes, memoryTotalBytes,
//                               diskUsedBytes, diskTotalBytes, networkRxMBps, networkTxMBps, networkSupported }
export function getSystemMetrics() {
  return request('/api/admin/system/metrics');
}

// Input:  { limit, level, userId, handler } — level/userId/handler 생략 시 전체
// Output: LogEntryDto[] (최신순) — { timestamp, level, logger, message, traceId, clientIp, userId, handler, duration }
export function getRecentLogs({ limit = 100, level, userId, handler } = {}) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (level) params.set('level', level);
  if (userId) params.set('userId', userId);
  if (handler) params.set('handler', handler);
  return request(`/api/admin/system/logs/recent?${params.toString()}`);
}

// Input:  { date(yyyy-MM-dd, 필수), hour(선택, 'HH'), level(선택), userId(선택, 부분일치), handler(선택, 부분일치) }
// Output: LogEntryDto[] (최신순, 최근 7일 이내만 조회 가능, Athena 기반)
export function getLogHistory({ date, hour, level, userId, handler } = {}) {
  const params = new URLSearchParams({ date });
  if (hour) params.set('hour', hour);
  if (level) params.set('level', level);
  if (userId) params.set('userId', userId);
  if (handler) params.set('handler', handler);
  return request(`/api/admin/system/logs/history?${params.toString()}`);
}

// Output: DailyLogCountDto[] (최근 7일, 오래된 날짜 → 최신) — { date, error, warn, info, total }
export function getLogTrend() {
  return request('/api/admin/system/logs/trend');
}

// Input:  getLogHistory와 동일한 필터 파라미터
// Output: LogExportDto — { downloadUrl } — Athena 쿼리결과 CSV의 presigned URL(30분 유효)
export function exportLogHistory({ date, hour, level, userId, handler } = {}) {
  const params = new URLSearchParams({ date });
  if (hour) params.set('hour', hour);
  if (level) params.set('level', level);
  if (userId) params.set('userId', userId);
  if (handler) params.set('handler', handler);
  return request(`/api/admin/system/logs/history/export?${params.toString()}`);
}
