// 시스템 모니터링 — 로그관리 시각화 + 하드웨어 리소스(CPU/메모리 등) 모니터링
import React, { useMemo, useState } from 'react';
import Badge from '../../components/Badge';
import AdminLayout from './AdminLayout';
import AdminBarChart from './AdminBarChart';
import './AdminPage.css';

const MOCK_LOGS = [
  { time: '2026-06-30 10:21:04', level: 'ERROR', message: 'AI 서버 응답 타임아웃 (analysis-svc)', source: 'spring-api' },
  { time: '2026-06-30 10:18:32', level: 'WARN',  message: '로그인 실패 5회 연속 (ip: 121.x.x.x)', source: 'auth-svc' },
  { time: '2026-06-30 10:05:11', level: 'INFO',  message: '회원 가입 완료 (userId: choiwd)', source: 'member-svc' },
  { time: '2026-06-30 09:58:47', level: 'INFO',  message: 'AI 분석 요청 처리 완료 (a1029)', source: 'analysis-svc' },
  { time: '2026-06-30 09:40:02', level: 'ERROR', message: 'DB 커넥션 풀 고갈 경고', source: 'main-db' },
  { time: '2026-06-30 09:12:55', level: 'WARN',  message: 'Redis RefreshToken TTL 임박', source: 'redis' },
];

const LOG_LEVEL_BADGE = { ERROR: 'rejected', WARN: 'pending', INFO: 'ok' };

const LOG_COUNTS = [
  { label: '6/24', value: 12 },
  { label: '6/25', value: 18 },
  { label: '6/26', value: 9 },
  { label: '6/27', value: 24 },
  { label: '6/28', value: 15 },
  { label: '6/29', value: 30 },
  { label: '6/30', value: 21 },
];

const LOG_SERIES = [{ key: 'value', color: 'var(--color-primary)' }];

function fillClass(value) {
  if (value >= 80) return 'ad-gauge__fill ad-gauge__fill--danger';
  if (value >= 60) return 'ad-gauge__fill ad-gauge__fill--warn';
  return 'ad-gauge__fill';
}

export default function AdminSystemPage({ user, onLogout }) {
  const [levelFilter, setLevelFilter] = useState('');

  const filteredLogs = useMemo(
    () => MOCK_LOGS.filter((l) => !levelFilter || l.level === levelFilter),
    [levelFilter],
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
            <div className="ad-section__desc">실시간 서버 리소스 사용량 (5초 주기 갱신 예정)</div>
          </div>
        </div>
        <div className="ad-section__body ad-gauge-grid">
          <div className="ad-gauge">
            <div className="ad-gauge__head"><span className="ad-gauge__label">CPU 사용량</span><span className="ad-gauge__value">42%</span></div>
            <div className="ad-gauge__track"><div className={fillClass(42)} style={{ width: '42%' }} /></div>
            <div className="ad-gauge__sub">4 core · 평균 부하 1.2</div>
          </div>
          <div className="ad-gauge">
            <div className="ad-gauge__head"><span className="ad-gauge__label">메모리</span><span className="ad-gauge__value">67%</span></div>
            <div className="ad-gauge__track"><div className={fillClass(67)} style={{ width: '67%' }} /></div>
            <div className="ad-gauge__sub">10.7GB / 16GB</div>
          </div>
          <div className="ad-gauge">
            <div className="ad-gauge__head"><span className="ad-gauge__label">디스크</span><span className="ad-gauge__value">28%</span></div>
            <div className="ad-gauge__track"><div className={fillClass(28)} style={{ width: '28%' }} /></div>
            <div className="ad-gauge__sub">56GB / 200GB</div>
          </div>
          <div className="ad-gauge">
            <div className="ad-gauge__head"><span className="ad-gauge__label">네트워크 I/O</span><span className="ad-gauge__value">81%</span></div>
            <div className="ad-gauge__track"><div className={fillClass(81)} style={{ width: '81%' }} /></div>
            <div className="ad-gauge__sub">8.1MB/s 송수신</div>
          </div>
        </div>
      </section>

      <section className="ad-section">
        <div className="ad-section__head">
          <div>
            <div className="ad-section__title">일별 로그 발생 추이</div>
            <div className="ad-section__desc">최근 7일 ERROR/WARN/INFO 합산 건수</div>
          </div>
        </div>
        <div className="ad-section__body">
          <AdminBarChart data={LOG_COUNTS} series={LOG_SERIES} barWidth={22} />
        </div>
      </section>

      <section className="ad-section">
        <div className="ad-toolbar">
          <div className="ad-tag-group">
            {['', 'ERROR', 'WARN', 'INFO'].map((lv) => (
              <button
                key={lv || 'all'}
                className={`ad-tag${levelFilter === lv ? ' ad-tag--active' : ''}`}
                onClick={() => setLevelFilter(lv)}
              >
                {lv || '전체'}
              </button>
            ))}
          </div>
          <span className="ad-toolbar__spacer ad-toolbar__count">총 {filteredLogs.length}건</span>
        </div>

        <div className="ad-table ad-table--logs">
          <div className="ad-table__head">
            <span>시간</span>
            <span>레벨</span>
            <span>메시지</span>
            <span>출처</span>
          </div>

          {filteredLogs.length === 0 ? (
            <div className="ad-empty">해당 레벨의 로그가 없습니다.</div>
          ) : (
            filteredLogs.map((l, i) => (
              <div className="ad-table__row" key={i}>
                <div className="ad-table__cell-muted">{l.time}</div>
                <div><Badge type={LOG_LEVEL_BADGE[l.level]}>{l.level}</Badge></div>
                <div>{l.message}</div>
                <div className="ad-table__cell-muted">{l.source}</div>
              </div>
            ))
          )}
        </div>
      </section>
    </AdminLayout>
  );
}
