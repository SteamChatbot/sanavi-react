// 회원상태관리 — 목록 조회/검색, 구독상태 수동변경, AI 사용횟수 초기화
// 강제탈퇴·블랙리스트 등록은 신고관리 페이지에서 처리 (신고 내역과 함께 검토 후 조치)
// DOM 단계: 더미 데이터 기반, 버튼 클릭 시 콘솔 로그만 남김 (실제 API 연동은 추후)
import React, { useMemo, useState } from 'react';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Pagination from '../../components/Pagination';
import AdminLayout from './AdminLayout';
import './AdminPage.css';

const MOCK_MEMBERS = [
  { id: 'kimcs01', name: '김철수', role: 'USER',   email: 'kimcs01@mail.com', joinedAt: '2026-01-12', subscribe: true,  aiCount: 2, blacklisted: false },
  { id: 'parkmj',  name: '박민지', role: 'USER',   email: 'parkmj@mail.com',  joinedAt: '2026-02-03', subscribe: false, aiCount: 3, blacklisted: false },
  { id: 'leesh',   name: '이상훈', role: 'USER',   email: 'leesh@mail.com',   joinedAt: '2026-02-21', subscribe: false, aiCount: 1, blacklisted: true  },
  { id: 'jungyr',  name: '정유라', role: 'USER',   email: 'jungyr@mail.com',  joinedAt: '2026-03-15', subscribe: true,  aiCount: 0, blacklisted: false },
  { id: 'choiwd',  name: '최우진', role: 'USER',   email: 'choiwd@mail.com',  joinedAt: '2026-04-02', subscribe: false, aiCount: 3, blacklisted: false },
  { id: 'hanjw',   name: '한지원', role: 'LAWYER', email: 'hanjw@mail.com',   joinedAt: '2026-01-28', subscribe: true,  aiCount: 0, blacklisted: false },
  { id: 'songhk',  name: '송혜경', role: 'LAWYER', email: 'songhk@mail.com',  joinedAt: '2026-03-02', subscribe: false, aiCount: 0, blacklisted: false },
];

const ROLE_OPTIONS = [
  { value: '', label: '회원구분 전체' },
  { value: 'USER', label: '일반회원' },
  { value: 'LAWYER', label: '변호사' },
];

const SUBSCRIBE_OPTIONS = [
  { value: '', label: '구독상태 전체' },
  { value: 'pro', label: 'Pro' },
  { value: 'basic', label: 'Basic' },
];

const STATUS_OPTIONS = [
  { value: '', label: '회원상태 전체' },
  { value: 'normal', label: '정상' },
  { value: 'blacklist', label: '블랙리스트' },
];

export default function AdminMemberPage({ user, onLogout }) {
  const [members, setMembers] = useState(MOCK_MEMBERS);
  const [keyword, setKeyword] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [subscribeFilter, setSubscribeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return members.filter((m) => {
      if (keyword && !`${m.name}${m.id}${m.email}`.toLowerCase().includes(keyword.toLowerCase())) return false;
      if (roleFilter && m.role !== roleFilter) return false;
      if (subscribeFilter === 'pro' && !m.subscribe) return false;
      if (subscribeFilter === 'basic' && m.subscribe) return false;
      if (statusFilter === 'blacklist' && !m.blacklisted) return false;
      if (statusFilter === 'normal' && m.blacklisted) return false;
      return true;
    });
  }, [members, keyword, roleFilter, subscribeFilter, statusFilter]);

  const toggleSubscribe = (id) => {
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, subscribe: !m.subscribe } : m)));
  };

  const resetAiCount = (id) => {
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, aiCount: 0 } : m)));
  };

  return (
    <AdminLayout
      title="회원상태관리"
      description="회원 목록을 조회·검색하고 구독상태 변경, AI 사용횟수 초기화를 진행합니다. (강제탈퇴·블랙리스트 등록은 신고관리에서 처리)"
      user={user}
      onLogout={onLogout}
    >
      <section className="ad-section">
        <div className="ad-toolbar">
          <div className="ad-search">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              placeholder="아이디, 이름, 이메일 검색"
              value={keyword}
              onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
            />
          </div>

          <select className="ad-select" value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}>
            {ROLE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          <select className="ad-select" value={subscribeFilter} onChange={(e) => { setSubscribeFilter(e.target.value); setPage(1); }}>
            {SUBSCRIBE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          <select className="ad-select" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          <span className="ad-toolbar__spacer ad-toolbar__count">총 {filtered.length}명</span>
        </div>

        <div className="ad-table ad-table--members">
          <div className="ad-table__head">
            <span>아이디</span>
            <span>구분</span>
            <span>이름</span>
            <span>이메일</span>
            <span>가입일</span>
            <span>구독</span>
            <span>AI 횟수</span>
            <span>관리</span>
          </div>

          {filtered.length === 0 ? (
            <div className="ad-empty">조건에 맞는 회원이 없습니다.</div>
          ) : (
            filtered.map((m) => (
              <div className="ad-table__row" key={m.id}>
                <div className="ad-table__cell-strong">{m.id}</div>
                <div><Badge type={m.role === 'LAWYER' ? 'pending' : 'primary'}>{m.role === 'LAWYER' ? '변호사' : '일반회원'}</Badge></div>
                <div>
                  {m.name}{' '}
                  {m.blacklisted && <Badge type="rejected">블랙리스트</Badge>}
                </div>
                <div className="ad-table__cell-muted">{m.email}</div>
                <div className="ad-table__cell-muted">{m.joinedAt}</div>
                <div><Badge type={m.subscribe ? 'pro' : 'primary'}>{m.subscribe ? 'Pro' : 'Basic'}</Badge></div>
                <div>{m.aiCount} / 3</div>
                <div className="ad-table__actions">
                  <Button variant="outline" size="xs" onClick={() => toggleSubscribe(m.id)}>
                    {m.subscribe ? 'Basic 전환' : 'Pro 전환'}
                  </Button>
                  <Button variant="outline" size="xs" onClick={() => resetAiCount(m.id)}>AI횟수 초기화</Button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="ad-pagination-wrap">
          <Pagination currentPage={page} totalPages={1} onPageChange={setPage} />
        </div>
      </section>
    </AdminLayout>
  );
}
