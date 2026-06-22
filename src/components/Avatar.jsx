// 사용자 이니셜 아바타 — 이름 첫 글자 + 색상 자동 배정
import React from 'react';
import './Avatar.css';

const COLORS = ['purple', 'amber', 'teal', 'red'];

function colorFrom(name = '') {
  const code = name.charCodeAt(0) || 0;
  return COLORS[code % COLORS.length];
}

/**
 * Avatar
 * @param {'xl'|'lg'|'md'|'sm'|'xs'} size
 * @param {'purple'|'amber'|'teal'|'red'|'admin'} color  — 생략 시 name에서 자동 배정
 */
export default function Avatar({ name = '', size = 'md', color, src, className = '' }) {
  const initial = name ? name.charAt(0) : '?';
  const c = color || (name === '관' ? 'admin' : colorFrom(name));
  return (
    <div className={['avatar', `avatar--${size}`, `avatar--${c}`, className].filter(Boolean).join(' ')}>
      {src ? <img src={src} alt={name} /> : initial}
    </div>
  );
}
