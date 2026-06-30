// 통계 — 월별/일별 회원 가입·이탈 추이, AI 분석횟수 통계
// DOM 단계: 차트 라이브러리 없이 CSS 막대그래프(AdminBarChart 공용 컴포넌트)로 표현, 더미 데이터 사용
import React, { useState } from 'react';
import AdminLayout from './AdminLayout';
import AdminBarChart from './AdminBarChart';
import './AdminPage.css';

const DAILY_MEMBER = [
  { label: '6/24', joined: 14, left: 3 },
  { label: '6/25', joined: 18, left: 2 },
  { label: '6/26', joined: 11, left: 5 },
  { label: '6/27', joined: 22, left: 4 },
  { label: '6/28', joined: 19, left: 1 },
  { label: '6/29', joined: 25, left: 3 },
  { label: '6/30', joined: 18, left: 2 },
];

const MONTHLY_MEMBER = [
  { label: '1월', joined: 240, left: 32 },
  { label: '2월', joined: 280, left: 41 },
  { label: '3월', joined: 310, left: 38 },
  { label: '4월', joined: 295, left: 52 },
  { label: '5월', joined: 340, left: 47 },
  { label: '6월', joined: 365, left: 40 },
];

const DAILY_ANALYSIS = [
  { label: '6/24', value: 82 }, { label: '6/25', value: 95 }, { label: '6/26', value: 70 },
  { label: '6/27', value: 110 }, { label: '6/28', value: 101 }, { label: '6/29', value: 124 }, { label: '6/30', value: 96 },
];

const MONTHLY_ANALYSIS = [
  { label: '1월', value: 1240 }, { label: '2월', value: 1380 }, { label: '3월', value: 1510 },
  { label: '4월', value: 1465 }, { label: '5월', value: 1620 }, { label: '6월', value: 1740 },
];

const MEMBER_SERIES = [
  { key: 'joined', label: '가입', color: 'var(--color-primary)' },
  { key: 'left',   label: '이탈', color: 'var(--color-danger-border)', variant: 'secondary' },
];

const SINGLE_SERIES = [{ key: 'value', color: 'var(--color-primary)' }];

const STATS = [
  { label: '이번달 신규가입', value: '365명', dir: 'up', delta: '+7.4% (전월 대비)' },
  { label: '이번달 탈퇴', value: '40명', dir: 'down', delta: '-14.9% (전월 대비)' },
  { label: '이번달 AI 분석횟수', value: '1,740건', dir: 'up', delta: '+7.4% (전월 대비)' },
  { label: 'Pro 전환율', value: '16.5%', dir: 'up', delta: '+1.2%p (전월 대비)' },
];

export default function AdminStatisticsPage({ user, onLogout }) {
  const [range, setRange] = useState('daily');

  const memberData = range === 'daily' ? DAILY_MEMBER : MONTHLY_MEMBER;
  const analysisData = range === 'daily' ? DAILY_ANALYSIS : MONTHLY_ANALYSIS;

  return (
    <AdminLayout
      title="통계"
      description="월별·일별 회원 가입/이탈 추이와 AI 분석 이용 현황을 확인합니다."
      user={user}
      onLogout={onLogout}
    >
      <div className="ad-stats-grid">
        {STATS.map((s) => (
          <div className="ad-stat-card" key={s.label}>
            <div className="ad-stat-card__label">{s.label}</div>
            <div className="ad-stat-card__value">{s.value}</div>
            <div className={`ad-stat-card__delta ad-stat-card__delta--${s.dir}`}>{s.delta}</div>
          </div>
        ))}
      </div>

      <div className="ad-tag-group" style={{ marginBottom: 16 }}>
        <button className={`ad-tag${range === 'daily' ? ' ad-tag--active' : ''}`} onClick={() => setRange('daily')}>일별</button>
        <button className={`ad-tag${range === 'monthly' ? ' ad-tag--active' : ''}`} onClick={() => setRange('monthly')}>월별</button>
      </div>

      <section className="ad-section">
        <div className="ad-section__head">
          <div>
            <div className="ad-section__title">회원 가입 / 이탈 추이</div>
            <div className="ad-section__desc">{range === 'daily' ? '최근 7일' : '최근 6개월'} 기준</div>
          </div>
        </div>
        <div className="ad-section__body">
          <AdminBarChart data={memberData} series={MEMBER_SERIES} />
        </div>
      </section>

      <section className="ad-section">
        <div className="ad-section__head">
          <div>
            <div className="ad-section__title">AI 분석횟수 통계</div>
            <div className="ad-section__desc">{range === 'daily' ? '최근 7일' : '최근 6개월'} 분석 요청 건수</div>
          </div>
        </div>
        <div className="ad-section__body">
          <AdminBarChart data={analysisData} series={SINGLE_SERIES} barWidth={22} />
        </div>
      </section>
    </AdminLayout>
  );
}
