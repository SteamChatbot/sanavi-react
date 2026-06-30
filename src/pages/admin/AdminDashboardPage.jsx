// 관리자 홈 — 회원/분석/시스템 현황을 한 화면에서 요약
// DOM 단계: 통계·목록은 더미 데이터로 표시, 실제 API 연동은 추후 진행
import React from 'react';
import { Link } from 'react-router-dom';
import Badge from '../../components/Badge';
import AdminLayout from './AdminLayout';
import './AdminPage.css';

const STATS = [
  { label: '전체 회원수', value: '1,284명', delta: '+18 (오늘)', dir: 'up' },
  { label: 'Pro 구독자', value: '212명', delta: '전체의 16.5%', dir: 'up' },
  { label: '오늘 AI 분석횟수', value: '96건', delta: '+12% (어제 대비)', dir: 'up' },
  { label: '신고 누적 게시글', value: '5건', delta: '처리 대기 3건', dir: 'down' },
];

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
  return (
    <AdminLayout
      title="홈"
      description="회원·AI 분석·시스템 현황을 한눈에 확인하는 관리자 대시보드입니다."
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
        <div className="ad-section__body ad-gauge-grid">
          <div className="ad-gauge">
            <div className="ad-gauge__head"><span className="ad-gauge__label">CPU</span><span className="ad-gauge__value">42%</span></div>
            <div className="ad-gauge__track"><div className="ad-gauge__fill" style={{ width: '42%' }} /></div>
          </div>
          <div className="ad-gauge">
            <div className="ad-gauge__head"><span className="ad-gauge__label">메모리</span><span className="ad-gauge__value">67%</span></div>
            <div className="ad-gauge__track"><div className="ad-gauge__fill ad-gauge__fill--warn" style={{ width: '67%' }} /></div>
          </div>
          <div className="ad-gauge">
            <div className="ad-gauge__head"><span className="ad-gauge__label">디스크</span><span className="ad-gauge__value">28%</span></div>
            <div className="ad-gauge__track"><div className="ad-gauge__fill" style={{ width: '28%' }} /></div>
          </div>
          <div className="ad-gauge">
            <div className="ad-gauge__head"><span className="ad-gauge__label">AI 서버 응답</span><span className="ad-gauge__value">정상</span></div>
            <div className="ad-gauge__track"><div className="ad-gauge__fill" style={{ width: '100%' }} /></div>
          </div>
        </div>
      </section>
    </AdminLayout>
  );
}
