// 상단 네비게이션 바 — 로그인 상태·현재 경로에 따라 메뉴 및 버튼 전환
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Avatar from './Avatar';
import Badge from './Badge';
import Button from './Button';
import { parseRole, isLawyer as checkIsLawyer } from '../constants/roles';
import { logoutMember, refreshToken } from '../api/authApi';
import './Navbar.css';

const NAV_LINKS = [
  { to: '/', label: '홈' },
  { to: '/agent', label: '에이전트' },
  { to: '/board', label: '게시판' },
  { to: '/matchboard', label: '의뢰글' },
  { to: '/subscribe', label: '구독' },
  { to: '/match', label: '매칭' },
  { to: '/lawyers', label: '변호사 찾기' },
  { to: '/my-lawyer-requests', label: '내 의뢰' },
];

function formatRemaining(secs) {
  const m = String(Math.floor(secs / 60)).padStart(2, '0');
  const s = String(secs % 60).padStart(2, '0');
  return `${m}:${s}`;
}

export default function Navbar({ user = null, onLogout }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // 목적: 연장 후 페이지 이동 시 Navbar 재마운트돼도 갱신된 만료시각 유지
  // 이유: user prop은 App.jsx state 기준 — 연장해도 App 상태 안 바뀌어서 prop으로 읽으면 구버전으로 리셋됨
  // Input: localStorage sanaviUser.atExpiresAt
  // Output: atExpiresAt 초기값 (ms 타임스탬프 or null)
  const [atExpiresAt, setAtExpiresAt] = useState(() => {
    try {
      const saved = localStorage.getItem('sanaviUser');
      return saved ? (JSON.parse(saved).atExpiresAt ?? null) : null;
    } catch { return null; }
  });
  const [remaining, setRemaining] = useState(null);
  const logoutRef = useRef(null);

  // 목적: 서버 로그아웃 → localStorage 제거 → 페이지 이동
  // Input: 없음
  // Output: 없음 (사이드이펙트: 쿠키 삭제 요청, localStorage 초기화, 리다이렉트)
  const handleLogout = useCallback(async () => {
    try { await logoutMember(); } catch (_) {}
    localStorage.removeItem('sanaviUser');

    if (onLogout) {
      onLogout();
      navigate('/');
      return;
    }

    window.location.href = '/';
  }, [onLogout, navigate]);

  // 목적: setInterval 클로저가 오래된 handleLogout 참조하는 문제 방지
  // Input: handleLogout 최신 참조
  // Output: logoutRef.current 갱신
  useEffect(() => { logoutRef.current = handleLogout; }, [handleLogout]);

  // 목적: 로그아웃 시 타이머 즉시 해제
  // Input: user (null = 로그아웃 상태)
  // Output: atExpiresAt → null → remaining → null → 타이머 UI 숨김
  useEffect(() => {
    if (!user) setAtExpiresAt(null);
  }, [user]);

  // 목적: AT 만료까지 남은 시간 1초마다 갱신, 00:00 도달 시 자동 로그아웃
  // Input: atExpiresAt (ms 타임스탬프)
  // Output: remaining (초) — 300초 미만이면 Navbar에 경고 스타일 적용
  useEffect(() => {
    if (!atExpiresAt) { setRemaining(null); return; }
    const update = async () => {
      const secs = Math.max(0, Math.floor((atExpiresAt - Date.now()) / 1000));
      setRemaining(secs);
      if (secs === 0) {
        alert('세션이 만료되었습니다. 다시 로그인해 주세요.');
        await logoutRef.current?.();
      }
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [atExpiresAt]);

  // 목적: 연장 버튼 클릭 시 서버에 새 AT 발급 요청 후 만료시각 갱신
  // Input: 없음 (RT 쿠키는 브라우저가 자동 전송)
  // Output: atExpiresAt state + localStorage 갱신 (현재 시각 + 50분)
  const handleExtend = async () => {
    try {
      await refreshToken();
      const next = Date.now() + 3000000;
      setAtExpiresAt(next);
      const saved = localStorage.getItem('sanaviUser');
      if (saved) {
        localStorage.setItem('sanaviUser', JSON.stringify({ ...JSON.parse(saved), atExpiresAt: next }));
      }
    } catch {
      // refresh 실패 → http.js 401 인터셉터가 로그아웃 처리
    }
  };

  const displayName = user?.name || user?.nickname || user?.userId || '사용자';
  const role = parseRole(user?.role);
  const isLawyer = checkIsLawyer(user?.role);
  const isActiveLink = (to) => {
    if (to === '/') {
      return pathname === '/';
    }

    return pathname === to || pathname.startsWith(`${to}/`);
  };
  return (
    <header className="navbar">
      <div className="navbar__inner">
        <Link to="/" className="navbar__logo">
          산내비 <span>AI</span>
        </Link>

        <nav className="navbar__links">
          {NAV_LINKS.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={[
                'navbar__link',
                isActiveLink(to) ? 'navbar__link--active' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {label}
            </Link>
          ))}

          {role === 'ADMIN' && (
            <Link
              to="/admin"
              className={[
                'navbar__link',
                pathname === '/admin' ? 'navbar__link--active' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              관리
            </Link>
          )}
          {isLawyer && (
            <Link
              to="/lawyer/requests"
              className={[
                'navbar__link',
                pathname === '/lawyer/requests' || pathname.startsWith('/lawyer/requests/')
                  ? 'navbar__link--active'
                  : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              받은 의뢰
            </Link>
          )}
        </nav>

        <div className="navbar__right">
          {user ? (
            <>
              {role === 'ADMIN' && <Badge type="admin">ADMIN</Badge>}

              <Link to="/mypage" className="navbar__user">
                <Avatar
                  name={displayName}
                  size="sm"
                  color={role === 'ADMIN' ? 'admin' : undefined}
                />
                <span className="navbar__username">
                  {displayName}
                </span>
              </Link>

              <Link to="/mypage">
                <Button variant="outline" size="sm">
                  마이페이지
                </Button>
              </Link>

                  {remaining !== null && (
                <>
                  <span className={`navbar__timer${remaining < 300 ? ' navbar__timer--warn' : ''}`}>
                    {formatRemaining(remaining)}
                  </span>
                  <Button variant="outline" size="sm" onClick={handleExtend}>
                    연장
                  </Button>
                </>
              )}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleLogout}
              >
                로그아웃
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="outline" size="sm">
                  로그인
                </Button>
              </Link>

              <Link to="/signup">
                <Button variant="primary" size="sm">
                  회원가입
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}