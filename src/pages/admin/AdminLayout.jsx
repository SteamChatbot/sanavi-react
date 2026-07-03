// 관리자 페이지 공통 셸 — 왼쪽 사이드바 메뉴 + 상단 페이지 타이틀/설명 헤더
// 책임: 사이드바 네비게이션, 현재 경로 active 표시, 상단 헤더(title/description) 렌더
//       각 Admin*Page는 이 레이아웃으로 감싸서 본문(children)만 채우면 됨
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Avatar from '../../components/Avatar';
import Button from '../../components/Button';
import './AdminLayout.css';

const MENU = [
  {
    to: '/admin',
    label: '홈',
    icon: (
      <path d="M3 11l9-8 9 8M5 10v10h14V10" />
    ),
  },
  {
    label: '회원관리',
    icon: (
      <>
        <circle cx="9" cy="8" r="3.2" />
        <path d="M3.5 20c.6-3.6 3-5.5 5.5-5.5s4.9 1.9 5.5 5.5" />
        <path d="M16 4.5c1.5.4 2.5 1.7 2.5 3.3s-1 2.9-2.5 3.3M20.5 20c-.4-2.3-1.5-3.9-3-4.8" />
      </>
    ),
    children: [
      { to: '/admin/members', label: '회원상태관리' },
      { to: '/admin/members/reports', label: '신고관리' },
      { to: '/admin/members/roles', label: '권한관리' },
    ],
  },
  {
    to: '/admin/statistics',
    label: '통계',
    icon: (
      <>
        <path d="M4 20V10M11 20V4M18 20v-7" />
        <path d="M2 20h20" />
      </>
    ),
  },
  {
    to: '/admin/analysis',
    label: 'AI 분석관리',
    icon: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="M20 20l-4-4" />
        <path d="M8.5 11l1.8 1.8L14 9" />
      </>
    ),
  },
  {
    label: '게시판관리',
    icon: (
      <>
        <rect x="3.5" y="4" width="17" height="16" rx="2" />
        <path d="M7.5 9h9M7.5 13h9M7.5 17h5" />
      </>
    ),
    children: [
      { to: '/admin/board', label: '게시판관리' },
      { to: '/admin/board/match', label: '의뢰글게시판관리' },
    ],
  },
  {
    to: '/admin/system',
    label: '시스템 모니터링',
    icon: (
      <>
        <rect x="4" y="4" width="16" height="11" rx="1.5" />
        <path d="M9 20h6M12 15v5" />
        <path d="M8 9.5l1.8 1.8L13 8" />
      </>
    ),
  },
  {
    to: '/admin/mail',
    label: '메일발송',
    icon: (
      <>
        <rect x="3.5" y="5" width="17" height="14" rx="2" />
        <path d="M4 7l8 6 8-6" />
      </>
    ),
  },
];

export default function AdminLayout({ title, description, user, onLogout, children }) {
  const { pathname } = useLocation();
  const isActive = (to) =>
    to === '/admin' ? pathname === '/admin' : pathname === to || pathname.startsWith(`${to}/`);
  // 하위메뉴 항목은 항상 정확히 일치할 때만 active — /admin/members가 /admin/members/reports까지 매칭되는 것 방지
  const isSubActive = (to) => pathname === to;
  const hasActiveChild = (item) => item.children?.some((c) => isSubActive(c.to));

  const [openGroups, setOpenGroups] = useState(() => {
    const init = {};
    MENU.forEach((item) => {
      if (item.children && hasActiveChild(item)) init[item.label] = true;
    });
    return init;
  });

  const toggleGroup = (label) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const displayName = user?.name || user?.userId || '관리자';

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link to="/" className="admin-sidebar__logo">
          산내비 <span>AI</span>
        </Link>
        <div className="admin-sidebar__tag">관리자 모드</div>

        <nav className="admin-sidebar__nav">
          {MENU.map((item) =>
            item.children ? (
              <div className="admin-sidebar__group" key={item.label}>
                <button
                  type="button"
                  className={[
                    'admin-sidebar__link',
                    'admin-sidebar__link--toggle',
                    hasActiveChild(item) ? 'admin-sidebar__link--group-active' : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => toggleGroup(item.label)}
                >
                  <svg className="admin-sidebar__icon" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {item.icon}
                  </svg>
                  {item.label}
                  <svg
                    className={['admin-sidebar__chevron', openGroups[item.label] ? 'admin-sidebar__chevron--open' : ''].filter(Boolean).join(' ')}
                    width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  >
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                </button>

                {openGroups[item.label] && (
                  <div className="admin-sidebar__submenu">
                    {item.children.map((child) => (
                      <Link
                        key={child.to}
                        to={child.to}
                        className={[
                          'admin-sidebar__sublink',
                          isSubActive(child.to) ? 'admin-sidebar__sublink--active' : '',
                        ].filter(Boolean).join(' ')}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link
                key={item.to}
                to={item.to}
                className={[
                  'admin-sidebar__link',
                  isActive(item.to) ? 'admin-sidebar__link--active' : '',
                ].filter(Boolean).join(' ')}
              >
                <svg className="admin-sidebar__icon" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {item.icon}
                </svg>
                {item.label}
              </Link>
            )
          )}
        </nav>

        <Link to="/" className="admin-sidebar__exit">
          ← 사이트로 돌아가기
        </Link>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar__heading">
            <h1 className="admin-topbar__title">{title}</h1>
            {description && <p className="admin-topbar__desc">{description}</p>}
          </div>

          <div className="admin-topbar__user">
            <Avatar name={displayName} size="sm" color="admin" />
            <span className="admin-topbar__username">{displayName}</span>
            <Button variant="outline" size="sm" onClick={onLogout}>로그아웃</Button>
          </div>
        </header>

        <main className="admin-content">
          {children}
        </main>
      </div>
    </div>
  );
}
