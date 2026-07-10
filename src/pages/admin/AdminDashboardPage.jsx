// 관리자 홈 — 회원/분석/시스템 현황을 한 화면에서 요약
// 상단 통계 카드 4개 + 시스템 상태 게이지는 실 API 연동 완료. 최근 가입 회원/최근 분석 이력 목록은 아직 더미 데이터
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Badge from '../../components/Badge';
import AdminLayout from './AdminLayout';
import { getMemberStats, getAnalysisTrend } from '../../api/adminStatsApi';
import { getSystemMetrics } from '../../api/adminSystemApi';
import { getAdminBoardPosts, getAdminBoardComments } from '../../api/adminBoardApi';
import './AdminPage.css';

const RECENT_MEMBERS = [
  { id: 'kimcs01', name: '김철수', job: '건설 용접공', joinedAt: '2026-06-30 09:12' },
  { id: 'parkmj', name: '박민지', job: '간호조무사', joinedAt: '2026-06-29 21:40' },
  { id: 'leesh', name: '이상훈', job: '화물 운전기사', joinedAt: '2026-06-29 18:05' },
  { id: 'jungyr', name: '정유라', job: '조선소 도장공', joinedAt: '2026-06-29 11:22' },
];

const RECENT_ANALYSIS = [
  { id: 'a1029', disease: '소음성 난청', job: '조선소 용접공', score: 82, createdAt: '2026-06-30 10:02' },
  { id: 'a1028', disease: '근막동통증후군', job: '택배 상하차', score: 64, createdAt: '2026-06-30 08:47' },
  { id: 'a1027', disease: '추간판탈출증', job: '건설 형틀목공', score: 58, createdAt: '2026-06-29 22:13' },
];

export default function AdminDashboardPage({ user, onLogout }) {
  const [memberStats, setMemberStats] = useState(null);
  const [memberStatsError, setMemberStatsError] = useState('');
  const [metrics, setMetrics] = useState(null);
  const [metricsError, setMetricsError] = useState('');
  const [analysisTrend, setAnalysisTrend] = useState(null);
  const [analysisTrendError, setAnalysisTrendError] = useState('');
  const [reportedCount, setReportedCount] = useState(null);
  const [reportedCountError, setReportedCountError] = useState('');

  // 오늘 AI 분석횟수 — 일별 추이의 마지막(가장 최근) 포인트를 오늘로 취급
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await getAnalysisTrend('daily');
        if (!cancelled) setAnalysisTrend(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!cancelled) setAnalysisTrendError(err.message || 'AI 분석 추이를 불러오지 못했습니다.');
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // 신고 누적 게시글 — 신고된 게시글/댓글 목록을 size=1로만 조회해 totalElements(전체 건수)만 사용
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [postSummary, commentSummary] = await Promise.all([
          getAdminBoardPosts({ page: 1, size: 1, status: 'ALL', reportedOnly: true }),
          getAdminBoardComments({ page: 1, size: 1, status: 'ALL', reportedOnly: true }),
        ]);
        if (!cancelled) {
          setReportedCount({
            posts: postSummary?.totalElements ?? 0,
            comments: commentSummary?.totalElements ?? 0,
          });
        }
      } catch (err) {
        if (!cancelled) setReportedCountError(err.message || '신고 현황을 불러오지 못했습니다.');
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await getMemberStats();
        if (!cancelled) setMemberStats(data);
      } catch (err) {
        if (!cancelled) setMemberStatsError(err.message || '회원 통계를 불러오지 못했습니다.');
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // 시스템 모니터링 페이지(/admin/system)와 같은 API — 대시보드에선 스냅샷 1회만 조회(폴링 없음)
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await getSystemMetrics();
        if (!cancelled) setMetrics(data);
      } catch (err) {
        if (!cancelled) setMetricsError(err.message || '시스템 상태를 불러오지 못했습니다.');
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const cpuPct = metrics ? Math.round(metrics.cpuPercent) : 0;
  const memPct = metrics?.memoryTotalBytes
    ? Math.round((metrics.memoryUsedBytes / metrics.memoryTotalBytes) * 100)
    : 0;
  const diskPct = metrics?.diskTotalBytes
    ? Math.round((metrics.diskUsedBytes / metrics.diskTotalBytes) * 100)
    : 0;
  const netTotalMBps = metrics?.networkSupported
    ? (metrics.networkRxMBps + metrics.networkTxMBps)
    : null;

  function gaugeFillClass(pct) {
    if (pct >= 85) return 'ad-gauge__fill ad-gauge__fill--danger';
    if (pct >= 65) return 'ad-gauge__fill ad-gauge__fill--warn';
    return 'ad-gauge__fill';
  }

  const proRate = memberStats?.totalCount
    ? `전체의 ${((memberStats.proCount / memberStats.totalCount) * 100).toFixed(1)}%`
    : '-';

  const stats = [
    {
      label: '전체 회원수',
      value: memberStats ? `${memberStats.totalCount.toLocaleString()}명` : (memberStatsError ? '-' : '불러오는 중...'),
      delta: memberStats ? `Pro ${memberStats.proCount} · Basic ${memberStats.basicCount}` : (memberStatsError || ''),
      dir: 'up',
    },
    {
      label: 'Pro 구독자',
      value: memberStats ? `${memberStats.proCount.toLocaleString()}명` : (memberStatsError ? '-' : '불러오는 중...'),
      delta: memberStats ? proRate : (memberStatsError || ''),
      dir: 'up',
    },
    (() => {
      const points = analysisTrend || [];
      const today = points[points.length - 1];
      const yesterday = points[points.length - 2];
      const diff = today && yesterday ? today.count - yesterday.count : null;
      return {
        label: '오늘 AI 분석횟수',
        value: today ? `${today.count}건` : (analysisTrendError ? '-' : '불러오는 중...'),
        delta: diff != null ? `${diff >= 0 ? '+' : ''}${diff} (어제 대비)` : (analysisTrendError || ''),
        dir: diff != null && diff < 0 ? 'down' : 'up',
      };
    })(),
    {
      label: '신고 누적 게시글',
      value: reportedCount ? `${reportedCount.posts}건` : (reportedCountError ? '-' : '불러오는 중...'),
      delta: reportedCount ? `댓글 신고 ${reportedCount.comments}건` : (reportedCountError || ''),
      dir: 'down',
    },
  ];

  return (
    <AdminLayout
      title="홈"
      description="회원·AI 분석·시스템 현황을 한눈에 확인하는 관리자 대시보드입니다."
      user={user}
      onLogout={onLogout}
    >
      <div className="ad-stats-grid">
        {stats.map((s) => (
          <div className="ad-stat-card" key={s.label}>
            <div className="ad-stat-card__label">{s.label}</div>
            <div className="ad-stat-card__value">{s.value}</div>
            <div className={`ad-stat-card__delta ad-stat-card__delta--${s.dir}`}>{s.delta}</div>
          </div>
        ))}
      </div>

      <div className="ad-grid-2">
        <section className="ad-section">
          <div className="ad-section__head">
            <div>
              <div className="ad-section__title">최근 가입 회원</div>
              <div className="ad-section__desc">최근 가입한 회원 4명</div>
            </div>
            <Link to="/admin/members"><Badge type="primary">회원관리 →</Badge></Link>
          </div>
          <div>
            {RECENT_MEMBERS.map((m) => (
              <div className="ad-table__row" key={m.id} style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                <div className="ad-table__cell-strong">{m.name} <span className="ad-table__cell-muted">@{m.id}</span></div>
                <div>{m.job}</div>
                <div className="ad-table__cell-muted">{m.joinedAt}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="ad-section">
          <div className="ad-section__head">
            <div>
              <div className="ad-section__title">최근 AI 분석 이력</div>
              <div className="ad-section__desc">최근 분석 요청 3건</div>
            </div>
            <Link to="/admin/analysis"><Badge type="primary">분석관리 →</Badge></Link>
          </div>
          <div>
            {RECENT_ANALYSIS.map((a) => (
              <div className="ad-table__row" key={a.id} style={{ gridTemplateColumns: '70px 1fr 1fr 1fr' }}>
                <div className="ad-table__cell-strong">{a.score}%</div>
                <div>{a.disease}</div>
                <div className="ad-table__cell-muted">{a.job}</div>
                <div className="ad-table__cell-muted">{a.createdAt}</div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="ad-section">
        <div className="ad-section__head">
          <div>
            <div className="ad-section__title">시스템 상태 요약</div>
            <div className="ad-section__desc">서버 리소스 현재 사용량</div>
          </div>
          <Link to="/admin/system"><Badge type="primary">시스템 모니터링 →</Badge></Link>
        </div>
        {metricsError && <div className="ad-empty">{metricsError}</div>}
        <div className="ad-section__body ad-gauge-grid">
          <div className="ad-gauge">
            <div className="ad-gauge__head"><span className="ad-gauge__label">CPU</span><span className="ad-gauge__value">{metrics ? `${cpuPct}%` : '-'}</span></div>
            <div className="ad-gauge__track"><div className={gaugeFillClass(cpuPct)} style={{ width: `${cpuPct}%` }} /></div>
          </div>
          <div className="ad-gauge">
            <div className="ad-gauge__head"><span className="ad-gauge__label">메모리</span><span className="ad-gauge__value">{metrics ? `${memPct}%` : '-'}</span></div>
            <div className="ad-gauge__track"><div className={gaugeFillClass(memPct)} style={{ width: `${memPct}%` }} /></div>
          </div>
          <div className="ad-gauge">
            <div className="ad-gauge__head"><span className="ad-gauge__label">디스크</span><span className="ad-gauge__value">{metrics ? `${diskPct}%` : '-'}</span></div>
            <div className="ad-gauge__track"><div className={gaugeFillClass(diskPct)} style={{ width: `${diskPct}%` }} /></div>
          </div>
          <div className="ad-gauge">
            <div className="ad-gauge__head"><span className="ad-gauge__label">네트워크</span><span className="ad-gauge__value">{netTotalMBps != null ? `${netTotalMBps.toFixed(1)} MB/s` : '-'}</span></div>
            <div className="ad-gauge__track"><div className="ad-gauge__fill" style={{ width: netTotalMBps != null ? `${Math.min(100, netTotalMBps * 10)}%` : '0%' }} /></div>
          </div>
        </div>
      </section>
    </AdminLayout>
  );
}
