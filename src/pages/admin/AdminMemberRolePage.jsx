// 권한관리 — 관리자 계정별 세부 권한(회원/게시판/AI분석/시스템/통계) 부여
// 일반회원·변호사는 수가 많아 드래그 대상에서 제외하고, 관리자 세부권한 부여에만 집중한다
// DOM 단계: 더미 데이터 기반 HTML5 드래그앤드롭, 실제 권한변경 API 연동은 추후 진행
import React, { useState } from 'react';
import AdminLayout from './AdminLayout';
import './AdminPage.css';

const PERMISSIONS = [
  { key: 'MEMBER',   label: '회원관리' },
  { key: 'BOARD',    label: '게시판관리' },
  { key: 'ANALYSIS', label: 'AI 분석관리' },
  { key: 'SYSTEM',   label: '시스템 모니터링' },
  { key: 'STATS',    label: '통계조회' },
];

const PERMISSION_LABEL = Object.fromEntries(PERMISSIONS.map((p) => [p.key, p.label]));

const MOCK_ADMINS = [
  { id: 'master',       name: '최고관리자',     permissions: ['MEMBER', 'BOARD', 'ANALYSIS', 'SYSTEM', 'STATS'] },
  { id: 'opsadmin',     name: '운영관리자',     permissions: ['MEMBER', 'BOARD'] },
  { id: 'supportadmin', name: '고객지원관리자', permissions: ['BOARD', 'STATS'] },
];

export default function AdminMemberRolePage({ user, onLogout }) {
  const [admins, setAdmins] = useState(MOCK_ADMINS);
  const [draggingPermission, setDraggingPermission] = useState(null);
  const [overAdminId, setOverAdminId] = useState(null);

  const grantPermission = (adminId, permKey) => {
    setAdmins((prev) => prev.map((a) => {
      if (a.id !== adminId || a.permissions.includes(permKey)) return a;
      return { ...a, permissions: [...a.permissions, permKey] };
    }));
  };

  const revokePermission = (adminId, permKey) => {
    setAdmins((prev) => prev.map((a) => (
      a.id === adminId ? { ...a, permissions: a.permissions.filter((p) => p !== permKey) } : a
    )));
  };

  return (
    <AdminLayout
      title="권한관리"
      description="관리자 계정에 부여할 세부 권한을 카드로 드래그하여 지정합니다. 일반회원·변호사 전환은 회원상태관리에서 처리합니다."
      user={user}
      onLogout={onLogout}
    >
      <section className="ad-section">
        <div className="ad-section__head">
          <div>
            <div className="ad-section__title">권한 항목</div>
            <div className="ad-section__desc">아래 권한을 원하는 관리자 카드 위로 드래그하면 부여됩니다.</div>
          </div>
        </div>
        <div className="ad-section__body ad-perm-chip-list">
          {PERMISSIONS.map((p) => (
            <div
              key={p.key}
              className="ad-perm-chip"
              draggable
              onDragStart={() => setDraggingPermission(p.key)}
              onDragEnd={() => { setDraggingPermission(null); setOverAdminId(null); }}
            >
              {p.label}
            </div>
          ))}
        </div>
      </section>

      <div className="ad-perm-board">
        {admins.map((a) => (
          <div
            key={a.id}
            className={`ad-perm-card${overAdminId === a.id ? ' ad-perm-card--over' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setOverAdminId(a.id); }}
            onDragLeave={() => setOverAdminId((prev) => (prev === a.id ? null : prev))}
            onDrop={(e) => {
              e.preventDefault();
              if (draggingPermission) grantPermission(a.id, draggingPermission);
              setOverAdminId(null);
            }}
          >
            <div className="ad-perm-card__head">
              <span className="ad-perm-card__name">{a.name}</span>
              <span className="ad-perm-card__id">@{a.id}</span>
            </div>

            <div className="ad-perm-card__badges">
              {a.permissions.length === 0 ? (
                <span className="ad-perm-empty">부여된 권한 없음</span>
              ) : (
                a.permissions.map((permKey) => (
                  <span className="ad-perm-badge" key={permKey}>
                    {PERMISSION_LABEL[permKey]}
                    <button
                      type="button"
                      className="ad-perm-badge__remove"
                      onClick={() => revokePermission(a.id, permKey)}
                      aria-label={`${PERMISSION_LABEL[permKey]} 권한 회수`}
                    >
                      ×
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
