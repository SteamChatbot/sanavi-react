// 신고관리 — 회원 신고 내역 조회, 블랙리스트 등록·강제탈퇴·반려 처리
// 회원상태관리는 조회/구독/AI횟수 위주로 가볍게 유지하고, 제재성 조치는 이 페이지에 모아둔다
import React, { useMemo, useState } from 'react';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Pagination from '../../components/Pagination';
import AdminLayout from './AdminLayout';
import './AdminPage.css';

const MOCK_REPORTS = [
  { id: 1, targetId: 'unknown99', targetName: '익명99', reporterId: 'jungyr',  reason: '광고/스팸', detail: '게시글에 도배성 광고 링크를 반복 게시함', reportedAt: '2026-06-29 14:02', status: 'PENDING' },
  { id: 2, targetId: 'leesh',     targetName: '이상훈', reporterId: 'parkmj',  reason: '욕설/비방', detail: '댓글에서 다른 회원에게 욕설을 함',         reportedAt: '2026-06-28 19:40', status: 'PENDING' },
  { id: 3, targetId: 'choiwd',    targetName: '최우진', reporterId: 'hanjw',   reason: '허위정보', detail: '허위 산재 정보를 유포한 것으로 의심됨',     reportedAt: '2026-06-27 11:15', status: 'BLACKLISTED' },
  { id: 4, targetId: 'spamlawyer',targetName: '스팸유저01', reporterId: 'songhk', reason: '광고/스팸', detail: '의뢰글에 광고성 댓글을 반복 게시함',       reportedAt: '2026-06-26 09:50', status: 'WITHDRAWN' },
  { id: 5, targetId: 'kimcs01',   targetName: '김철수', reporterId: 'leesh',   reason: '기타', detail: '신고 내용 확인 결과 오인 신고로 판단됨',        reportedAt: '2026-06-25 16:20', status: 'DISMISSED' },
];

const STATUS_INFO = {
  PENDING:     { label: '처리대기',      badge: 'pending'  },
  BLACKLISTED: { label: '블랙리스트 등록', badge: 'rejected' },
  WITHDRAWN:   { label: '강제탈퇴 처리',  badge: 'rejected' },
  DISMISSED:   { label: '반려',          badge: 'ok'       },
};

const TAB_OPTIONS = [
  { value: 'all',     label: '전체' },
  { value: 'pending',  label: '처리대기' },
  { value: 'resolved', label: '처리완료' },
];

export default function AdminMemberReportPage({ user, onLogout }) {
  const [reports, setReports] = useState(MOCK_REPORTS);
  const [tab, setTab] = useState('all');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);

  const pendingCount = useMemo(() => reports.filter((r) => r.status === 'PENDING').length, [reports]);

  const filtered = useMemo(() => {
    return reports.filter((r) => {
      if (tab === 'pending' && r.status !== 'PENDING') return false;
      if (tab === 'resolved' && r.status === 'PENDING') return false;
      if (keyword && !`${r.targetId}${r.targetName}${r.reason}`.toLowerCase().includes(keyword.toLowerCase())) return false;
      return true;
    });
  }, [reports, tab, keyword]);

  const resolve = (id, status) => {
    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  };

  const blacklistTarget = (r) => {
    if (!window.confirm(`${r.targetName}(${r.targetId}) 회원을 블랙리스트에 등록하시겠습니까?`)) return;
    resolve(r.id, 'BLACKLISTED');
  };

  const withdrawTarget = (r) => {
    if (!window.confirm(`${r.targetName}(${r.targetId}) 회원을 강제 탈퇴 처리하시겠습니까?`)) return;
    resolve(r.id, 'WITHDRAWN');
  };

  const dismissReport = (r) => {
    resolve(r.id, 'DISMISSED');
  };

  return (
    <AdminLayout
      title="신고관리"
      description="회원 신고 내역을 검토하여 블랙리스트 등록, 강제탈퇴, 반려 처리를 진행합니다."
      user={user}
      onLogout={onLogout}
    >
      <section className="ad-section">
        <div className="ad-toolbar">
          <div className="ad-tag-group">
            {TAB_OPTIONS.map((o) => (
              <button
                key={o.value}
                className={`ad-tag${tab === o.value ? ' ad-tag--active' : ''}`}
                onClick={() => { setTab(o.value); setPage(1); }}
              >
                {o.label}{o.value === 'pending' ? ` (${pendingCount})` : ''}
              </button>
            ))}
          </div>

          <div className="ad-search">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              placeholder="신고대상 아이디·이름, 사유 검색"
              value={keyword}
              onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
            />
          </div>

          <span className="ad-toolbar__spacer ad-toolbar__count">총 {filtered.length}건</span>
        </div>

        <div className="ad-table ad-table--reports">
          <div className="ad-table__head">
            <span>신고대상</span>
            <span>신고자</span>
            <span>사유</span>
            <span>신고일시</span>
            <span>상태</span>
            <span>관리</span>
          </div>

          {filtered.length === 0 ? (
            <div className="ad-empty">조건에 맞는 신고 내역이 없습니다.</div>
          ) : (
            filtered.map((r) => {
              const info = STATUS_INFO[r.status];
              return (
                <div className="ad-table__row" key={r.id}>
                  <div className="ad-table__cell-strong">{r.targetName} <span className="ad-table__cell-muted">@{r.targetId}</span></div>
                  <div className="ad-table__cell-muted">{r.reporterId}</div>
                  <div>
                    {r.reason}
                    <div className="ad-table__cell-muted">{r.detail}</div>
                  </div>
                  <div className="ad-table__cell-muted">{r.reportedAt}</div>
                  <div><Badge type={info.badge}>{info.label}</Badge></div>
                  <div className="ad-table__actions">
                    {r.status === 'PENDING' ? (
                      <>
                        <Button variant="danger" size="xs" onClick={() => blacklistTarget(r)}>블랙리스트 등록</Button>
                        <Button variant="danger-solid" size="xs" onClick={() => withdrawTarget(r)}>강제탈퇴</Button>
                        <Button variant="outline" size="xs" onClick={() => dismissReport(r)}>반려</Button>
                      </>
                    ) : (
                      <span className="ad-table__cell-muted">처리완료</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="ad-pagination-wrap">
          <Pagination currentPage={page} totalPages={1} onPageChange={setPage} />
        </div>
      </section>
    </AdminLayout>
  );
}
