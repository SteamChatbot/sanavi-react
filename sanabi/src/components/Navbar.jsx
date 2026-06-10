import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Avatar from './Avatar';
import Badge from './Badge';
import Button from './Button';
import './Navbar.css';

const NAV_LINKS = [
  { to: '/',          label: '홈' },
  { to: '/agent',     label: '에이전트' },
  { to: '/board',     label: '게시판' },
  { to: '/subscribe', label: '구독' },
  { to: '/match',     label: '매칭' },
];

/**
 * Navbar
 * @param {object|null} user  — null이면 비로그인
 * @param {'USER'|'ADMIN'} user.role
 * @param {string} user.name
 */
export default function Navbar({ user = null }) {
  const { pathname } = useLocation();

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
              className={['navbar__link', pathname === to ? 'navbar__link--active' : ''].filter(Boolean).join(' ')}
            >
              {label}
            </Link>
          ))}
          {user?.role === 'ADMIN' && (
            <Link to="/admin" className={['navbar__link', pathname === '/admin' ? 'navbar__link--active' : ''].filter(Boolean).join(' ')}>
              관리
            </Link>
          )}
        </nav>

        <div className="navbar__right">
          {user ? (
            <>
              {user.role === 'ADMIN' && <Badge type="admin">ADMIN</Badge>}
              <Avatar name={user.name} size="sm" color={user.role === 'ADMIN' ? 'admin' : undefined} />
            </>
          ) : (
            <>
              <Link to="/login"><Button variant="outline" size="sm">로그인</Button></Link>
              <Link to="/signup"><Button variant="primary" size="sm">회원가입</Button></Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
