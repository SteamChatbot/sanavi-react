// DB 저장값 — role 컬럼 원본 (소문자+언더스코어)
export const ROLES = {
  USER:   'role_user',
  LAWYER: 'role_lawyer',
  ADMIN:  'role_admin',
};

// DB 원본(role_user / ROLE_LAWYER 등 어떤 형태든) → 'USER' | 'LAWYER' | 'ADMIN'
export function parseRole(role) {
  if (!role) return 'USER';
  const r = String(role).toUpperCase().replace('ROLE_', '');
  if (r === 'ADMIN')  return 'ADMIN';
  if (r === 'LAWYER') return 'LAWYER';
  return 'USER';
}

export const isLawyer = (role) => parseRole(role) === 'LAWYER';
export const isAdmin  = (role) => parseRole(role) === 'ADMIN';
