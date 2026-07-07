// 시스템 모니터링 — 로그관리 시각화(실시간 폴링 + S3 과거로그 조회) + 하드웨어 리소스(CPU/메모리 등) 실시간 폴링
import React, { useEffect, useMemo, useState } from 'react';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import AdminLayout from './AdminLayout';
import AdminBarChart from './AdminBarChart';
import AdminHardwareGauge from './AdminHardwareGauge';
import { getSystemMetrics, getRecentLogs, getLogHistory, getLogTrend, exportLogHistory } from '../../api/adminSystemApi';
import './AdminPage.css';

// 5초 주기 폴링 기준 60개 = 최근 5분. 서버에 저장하지 않고 브라우저 세션 동안만 프론트에서 들고 있음(새로고침하면 초기화).
const METRICS_HISTORY_CAP = 60;

// 일별 로그 발생 추이 — DailyLogCountDto{date,error,warn,info,total}를 AdminBarChart 시리즈로 매핑
const LOG_TREND_SERIES = [
  { key: 'error', label: 'ERROR', color: 'var(--color-danger)', variant: 'danger' },
  { key: 'warn', label: 'WARN', color: 'var(--color-warning)', variant: 'warn' },
  { key: 'info', label: 'INFO', color: 'var(--color-success)', variant: 'success' },
  { key: 'total', label: '합계', color: 'var(--color-primary)' },
];

const LOG_LEVEL_BADGE = { ERROR: 'rejected', WARN: 'pending', INFO: 'ok' };
const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));

// 실제 존재하는 컨트롤러 목록(도메인별 그룹) — handler 필드가 "컨트롤러명.메서드명" 형태라 컨트롤러명만 골라도 부분일치로 그 안의 모든 메서드가 잡힘
const SERVICE_GROUPS = [
  { label: '회원/인증', controllers: ['MemberController', 'AuthController'] },
  { label: '게시판', controllers: ['BoardController', 'BoardCommentController'] },
  { label: '매칭', controllers: ['MatchController', 'RequestListController'] },
  { label: '구독', controllers: ['SubscribeController'] },
  { label: 'AI 분석', controllers: ['AnalysisController'] },
  { label: '신고', controllers: ['ReportController'] },
  {
    label: '관리자',
    controllers: [
      'AdminSystemController', 'AdminAnalysisController', 'AdminMemberStatsController',
      'AdminLawyerStatsController', 'AdminMatchStatsController', 'AdminAnalysisComboStatsController',
    ],
  },
];

function bytesToGB(bytes) {
  return bytes / 1024 ** 3;
}

// SystemMetricsDto 스냅샷 → 게이지/스파크라인에 쓰는 퍼센트·합산값으로 변환 (현재값 표시와 히스토리 배열 계산 둘 다 재사용)
function derivePercents(m) {
  if (!m) return { cpuPct: 0, memPct: 0, diskPct: 0, netTotalMBps: 0 };
  return {
    cpuPct: Math.round(m.cpuPercent),
    memPct: m.memoryTotalBytes ? Math.round((m.memoryUsedBytes / m.memoryTotalBytes) * 100) : 0,
    diskPct: m.diskTotalBytes ? Math.round((m.diskUsedBytes / m.diskTotalBytes) * 100) : 0,
    netTotalMBps: m.networkSupported ? m.networkRxMBps + m.networkTxMBps : 0,
  };
}

// 출처 컬럼 — handler(컨트롤러.메서드, 서비스 필터가 검색하는 값)를 우선 보여주고, 없으면 logger로 대체
function formatSource(entry) {
  return entry.handler && entry.handler !== '-' ? entry.handler : entry.logger;
}

// user_id 컬럼 — 비로그인 요청(anonymous)은 별도 표기
function formatUserId(entry) {
  return entry.userId && entry.userId !== '-' ? entry.userId : '-';
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function minDateStr() {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString().slice(0, 10);
}

// "2026-06-26" -> "06/26" — 바차트 x축 라벨용
function formatDayLabel(dateStr) {
  const [, month, day] = dateStr.split('-');
  return `${month}/${day}`;
}

export default function AdminSystemPage({ user, onLogout }) {
  const [metrics, setMetrics] = useState(null);
  const [metricsError, setMetricsError] = useState('');
  const [metricsHistory, setMetricsHistory] = useState([]); // 최근 5분치 스냅샷(오래된 것 → 최신), 스파크라인용

  const [viewMode, setViewMode] = useState('live'); // 'live' | 'history'
  const [logs, setLogs] = useState([]);
  const [logsError, setLogsError] = useState('');
  // 메시지가 길면 한 줄로 잘라 보여주고, 클릭한 행만 전체 펼침(user_id 등 다른 컬럼이 밀리는 문제 방지)
  const [expandedRowKeys, setExpandedRowKeys] = useState(() => new Set());

  function toggleRowExpanded(key) {
    setExpandedRowKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  const [logTrend, setLogTrend] = useState([]);
  const [logTrendError, setLogTrendError] = useState('');

  // 입력 중인 값(draft) — "조회"를 눌러야 applied*로 커밋되어 실제 요청에 반영됨
  const [draftLevel, setDraftLevel] = useState('');
  const [draftUserId, setDraftUserId] = useState('');
  const [draftHandler, setDraftHandler] = useState('');
  const [draftDate, setDraftDate] = useState(todayStr());
  const [draftHour, setDraftHour] = useState('');

  const [appliedLevel, setAppliedLevel] = useState('');
  const [appliedUserId, setAppliedUserId] = useState('');
  const [appliedHandler, setAppliedHandler] = useState('');
  const [appliedDate, setAppliedDate] = useState(todayStr());
  const [appliedHour, setAppliedHour] = useState('');

  function applyFilters() {
    setAppliedLevel(draftLevel);
    setAppliedUserId(draftUserId.trim());
    setAppliedHandler(draftHandler.trim());
    setAppliedDate(draftDate);
    setAppliedHour(draftHour);
  }

  function handleSearchKeyDown(e) {
    if (e.key === 'Enter') applyFilters();
  }

  const [exporting, setExporting] = useState(false);

  // 현재 조회된 조건(applied*) 그대로 Athena에 다시 물어서 결과 CSV의 presigned URL을 받아 새 탭으로 염
  async function handleExportCsv() {
    setExporting(true);
    try {
      const { downloadUrl } = await exportLogHistory({
        date: appliedDate, hour: appliedHour, level: appliedLevel, userId: appliedUserId, handler: appliedHandler,
      });
      window.open(downloadUrl, '_blank');
    } catch (err) {
      alert(err.message || 'CSV 내보내기에 실패했습니다.');
    } finally {
      setExporting(false);
    }
  }

  // 하드웨어 리소스 5초 주기 폴링
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await getSystemMetrics();
        if (!cancelled) {
          setMetrics(data);
          setMetricsError('');
          setMetricsHistory((prev) => [...prev, data].slice(-METRICS_HISTORY_CAP));
        }
      } catch (err) {
        if (!cancelled) setMetricsError(err.message || '서버 상태를 불러오지 못했습니다.');
      }
    }
    load();
    const id = setInterval(load, 5000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  // 일별 로그 발생 추이 — Athena 집계라 무겁지 않지만, 굳이 폴링할 필요는 없어 마운트 시 1회만 조회
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await getLogTrend();
        if (!cancelled) { setLogTrend(data); setLogTrendError(''); }
      } catch (err) {
        if (!cancelled) setLogTrendError(err.message || '일별 로그 추이를 불러오지 못했습니다.');
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // 실시간 로그 — 4초 주기 배치 폴링 (서버 메모리 링버퍼에서 최신 목록을 통째로 가져와 교체)
  // "조회"로 커밋된 필터(applied*)만 폴링에 반영됨 — draft* 입력 중에는 폴링이 안 끊김
  useEffect(() => {
    if (viewMode !== 'live') return undefined;
    let cancelled = false;
    async function load() {
      try {
        const data = await getRecentLogs({ limit: 100, level: appliedLevel, userId: appliedUserId, handler: appliedHandler });
        if (!cancelled) { setLogs(data); setLogsError(''); }
      } catch (err) {
        if (!cancelled) setLogsError(err.message || '로그를 불러오지 못했습니다.');
      }
    }
    load();
    const id = setInterval(load, 4000);
    return () => { cancelled = true; clearInterval(id); };
  }, [viewMode, appliedLevel, appliedUserId, appliedHandler]);

  // 과거 로그 — applied* 값이 바뀔 때(="조회" 클릭 시) 1회만 Athena로 조회 (폴링 없음)
  useEffect(() => {
    if (viewMode !== 'history') return undefined;
    let cancelled = false;
    async function load() {
      try {
        const data = await getLogHistory({
          date: appliedDate, hour: appliedHour, level: appliedLevel, userId: appliedUserId, handler: appliedHandler,
        });
        if (!cancelled) { setLogs(data); setLogsError(''); }
      } catch (err) {
        if (!cancelled) setLogsError(err.message || '과거 로그를 불러오지 못했습니다.');
      }
    }
    load();
    return () => { cancelled = true; };
  }, [viewMode, appliedDate, appliedHour, appliedLevel, appliedUserId, appliedHandler]);

  const { cpuPct, memPct, diskPct, netTotalMBps } = derivePercents(metrics);
  // 네트워크는 정해진 최대 대역폭이 없어 게이지 바는 1Gbps(≈125MB/s) 기준으로 clamp
  const netPct = Math.min(100, Math.round((netTotalMBps / 125) * 100));

  // 스파크라인용 최근 5분 시계열 — 게이지 4개가 같은 metricsHistory에서 각자 값만 뽑아 씀
  const cpuHistory = useMemo(() => metricsHistory.map((m) => derivePercents(m).cpuPct), [metricsHistory]);
  const memHistory = useMemo(() => metricsHistory.map((m) => derivePercents(m).memPct), [metricsHistory]);
  const diskHistory = useMemo(() => metricsHistory.map((m) => derivePercents(m).diskPct), [metricsHistory]);
  const netHistory = useMemo(() => metricsHistory.map((m) => derivePercents(m).netTotalMBps), [metricsHistory]);

  const filteredCount = useMemo(() => logs.length, [logs]);

  const logTrendChartData = useMemo(
    () => logTrend.map((d) => ({
      label: formatDayLabel(d.date), error: d.error, warn: d.warn, info: d.info, total: d.total,
    })),
    [logTrend],
  );

  return (
    <AdminLayout
      title="시스템 모니터링"
      description="서버 로그 현황을 시각화하고 CPU·메모리 등 하드웨어 리소스 사용량을 모니터링합니다."
      user={user}
      onLogout={onLogout}
    >
      <section className="ad-section">
        <div className="ad-section__head">
          <div>
            <div className="ad-section__title">하드웨어 리소스</div>
            <div className="ad-section__desc">실시간 서버 리소스 사용량 (5초 주기 갱신)</div>
          </div>
        </div>
        {metricsError && <div className="ad-empty">{metricsError}</div>}
        <div className="ad-section__body ad-gauge-grid">
          <AdminHardwareGauge
            label="CPU 사용량"
            value={metrics ? `${cpuPct}%` : '측정 중'}
            pct={metrics ? cpuPct : null}
            history={cpuHistory}
            sparklineMax={100}
            sub={metrics ? `${metrics.cpuCores} core · 평균 부하 ${metrics.loadAverage >= 0 ? metrics.loadAverage.toFixed(2) : '—'} · 최근 5분` : '측정 중...'}
          />
          <AdminHardwareGauge
            label="메모리"
            value={metrics ? `${memPct}%` : '측정 중'}
            pct={metrics ? memPct : null}
            history={memHistory}
            sparklineMax={100}
            sub={metrics ? `${bytesToGB(metrics.memoryUsedBytes).toFixed(1)}GB / ${bytesToGB(metrics.memoryTotalBytes).toFixed(1)}GB · 최근 5분` : '측정 중...'}
          />
          <AdminHardwareGauge
            label="디스크"
            value={metrics ? `${diskPct}%` : '측정 중'}
            pct={metrics ? diskPct : null}
            history={diskHistory}
            sparklineMax={100}
            sub={metrics ? `${bytesToGB(metrics.diskUsedBytes).toFixed(1)}GB / ${bytesToGB(metrics.diskTotalBytes).toFixed(1)}GB · 최근 5분` : '측정 중...'}
          />
          <AdminHardwareGauge
            label="네트워크 I/O"
            value={metrics?.networkSupported ? `${netTotalMBps.toFixed(1)}MB/s` : '—'}
            pct={metrics?.networkSupported ? netPct : null}
            history={netHistory}
            sub={
              !metrics
                ? '측정 중...'
                : metrics.networkSupported
                  ? `수신 ${metrics.networkRxMBps.toFixed(1)}MB/s · 송신 ${metrics.networkTxMBps.toFixed(1)}MB/s · 최근 5분`
                  : '로컬 개발환경 미지원 (Linux 배포 환경에서만 측정)'
            }
          />
        </div>
      </section>

      <section className="ad-section">
        <div className="ad-section__head">
          <div>
            <div className="ad-section__title">일별 로그 발생 추이</div>
            <div className="ad-section__desc">최근 7일 레벨별 건수 + 합계 (Athena 집계)</div>
          </div>
          <div className="ad-section__legend">
            {LOG_TREND_SERIES.map((s) => (
              <span key={s.key}>
                <i className="ad-bar-chart__dot" style={{ background: s.color }} />
                {s.label}
              </span>
            ))}
          </div>
        </div>
        <div className="ad-section__body">
          {logTrendError && <div className="ad-empty">{logTrendError}</div>}
          <AdminBarChart data={logTrendChartData} series={LOG_TREND_SERIES} barWidth={14} showLegend={false} />
        </div>
      </section>

      <section className="ad-section">
        <div className="ad-toolbar">
          <div className="ad-tag-group">
            {[{ key: 'live', label: '실시간' }, { key: 'history', label: '과거로그' }].map((m) => (
              <button
                key={m.key}
                className={`ad-tag${viewMode === m.key ? ' ad-tag--active' : ''}`}
                onClick={() => setViewMode(m.key)}
              >
                {m.label}
              </button>
            ))}
          </div>

          {viewMode === 'history' && (
            <>
              <input
                type="date"
                className="ad-select"
                value={draftDate}
                min={minDateStr()}
                max={todayStr()}
                onChange={(e) => setDraftDate(e.target.value)}
              />
              <select className="ad-select" value={draftHour} onChange={(e) => setDraftHour(e.target.value)}>
                <option value="">전체 시간</option>
                {HOURS.map((h) => (
                  <option key={h} value={h}>{h}시</option>
                ))}
              </select>
            </>
          )}
        </div>

        <div className="ad-toolbar">
          <div className="ad-tag-group">
            {['', 'ERROR', 'WARN', 'INFO'].map((lv) => (
              <button
                key={lv || 'all'}
                className={`ad-tag${draftLevel === lv ? ' ad-tag--active' : ''}`}
                onClick={() => setDraftLevel(lv)}
              >
                {lv || '전체'}
              </button>
            ))}
          </div>
          <div className="ad-search">
            <input
              type="text"
              placeholder="유저 ID 검색"
              value={draftUserId}
              onChange={(e) => setDraftUserId(e.target.value)}
              onKeyDown={handleSearchKeyDown}
            />
          </div>
          <select className="ad-select" value={draftHandler} onChange={(e) => setDraftHandler(e.target.value)}>
            <option value="">전체 서비스</option>
            {SERVICE_GROUPS.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.controllers.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </optgroup>
            ))}
          </select>
          <Button size="sm" onClick={applyFilters}>조회</Button>
          {viewMode === 'history' && (
            <Button size="sm" variant="outline" loading={exporting} onClick={handleExportCsv}>CSV 다운로드</Button>
          )}
          <span className="ad-toolbar__spacer ad-toolbar__count">총 {filteredCount}건</span>
        </div>

        {logsError && <div className="ad-empty">{logsError}</div>}

        <div className="ad-table-scroll">
          <div className="ad-table ad-table--logs">
            <div className="ad-table__head">
              <span>시간</span>
              <span>레벨</span>
              <span>메시지</span>
              <span>user_id</span>
              <span>출처</span>
            </div>

            {logs.length === 0 ? (
              <div className="ad-empty">해당 조건의 로그가 없습니다.</div>
            ) : (
              logs.map((l, i) => {
                const rowKey = `${l.timestamp}-${l.traceId}-${i}`;
                const isExpanded = expandedRowKeys.has(rowKey);
                return (
                  <div className="ad-table__row" key={rowKey}>
                    <div className="ad-table__cell-muted">{l.timestamp}</div>
                    <div><Badge type={LOG_LEVEL_BADGE[l.level] ?? 'pending'}>{l.level}</Badge></div>
                    <div
                      className={isExpanded ? 'ad-table__cell-message ad-table__cell-message--expanded' : 'ad-table__cell-message'}
                      title="클릭하면 전체 메시지가 펼쳐집니다"
                      onClick={() => toggleRowExpanded(rowKey)}
                    >
                      {l.message}
                    </div>
                    <div className="ad-table__cell-muted">{formatUserId(l)}</div>
                    <div className="ad-table__cell-muted">{formatSource(l)}</div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>
    </AdminLayout>
  );
}
