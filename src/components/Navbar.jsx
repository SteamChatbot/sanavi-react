import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Avatar from './Avatar';
import Badge from './Badge';
import Button from './Button';
import './Navbar.css';

const NAV_LINKS = [
  { to: '/', label: '홈' },
  { to: '/agent', label: '에이전트' },
  { to: '/board', label: '게시판' },
  { to: '/subscribe', label: '구독' },
  { to: '/match', label: '매칭' },
];

export default function Navbar({ user = null, onLogout }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('sanaviUser');

    if (onLogout) {
      onLogout();
      navigate('/');
      return;
    }

    window.location.href = '/';
  };

  const displayName = user?.name || user?.nickname || user?.userId || '사용자';
  const role = user?.role || 'USER';

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
                pathname === to ? 'navbar__link--active' : '',
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