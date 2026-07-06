// 권한관리 — 최고관리자가 관리자 계정의 세부 역할을 부여/변경/해제하는 페이지
// 권한은 DB에서 자유 편집하지 않고, 백엔드의 고정 역할 템플릿을 조회해 표시한다
// 역할 변경은 실수 방지를 위해 드래그앤드롭 대신 select + 사유 입력 + 확인 모달 방식으로 처리한다
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import Button from '../../components/Button';
import Pagination from '../../components/Pagination';
import AdminLayout from './AdminLayout';

import {
  ADMIN_ROLE_LABELS,
  ADMIN_ROLE_OPTIONS,
  ADMIN_ROLE_TYPES,
  getAdminRoleAssignments,
  getAdminRoleCandidates,
  getAdminRolePermissions,
  revokeAdminRoleAssignment,
  updateAdminRoleAssignment,
} from '../../api/adminRoleApi';

import './AdminPage.css';

const PAGE_SIZE = 10;

function formatDateTime(value) {
  if (!value) {
    return '-';
  }

  return String(value).replace('T', ' ').slice(0, 16);
}

function formatDate(value) {
  if (!value) {
    return '-';
  }

  return String(value).slice(0, 10);
}

function getRoleLabel(roleType) {
  return ADMIN_ROLE_LABELS[roleType] || '미지정';
}

function getRoleBadgeClass(roleType) {
  switch (roleType) {
    case ADMIN_ROLE_TYPES.SUPER_ADMIN:
      return 'ad-role-badge ad-role-badge--super';
    case ADMIN_ROLE_TYPES.OPERATIONS_ADMIN:
      return 'ad-role-badge ad-role-badge--operations';
    case ADMIN_ROLE_TYPES.SUPPORT_ADMIN:
      return 'ad-role-badge ad-role-badge--support';
    default:
      return 'ad-role-badge ad-role-badge--none';
  }
}

export default function AdminMemberRolePage({ user, onLogout }) {
  const [permissionsData, setPermissionsData] = useState({
    roles: [],
    permissions: [],
  });

  const [assignments, setAssignments] = useState([]);
  const [assignmentKeyword, setAssignmentKeyword] = useState('');
  const [assignmentQuery, setAssignmentQuery] = useState('');

  const [candidates, setCandidates] = useState([]);
  const [candidateKeyword, setCandidateKeyword] = useState('');
  const [candidateQuery, setCandidateQuery] = useState('');
  const [candidatePage, setCandidatePage] = useState(1);
  const [candidateTotalCount, setCandidateTotalCount] = useState(0);
  const [candidateTotalPages, setCandidateTotalPages] = useState(1);

  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [processModal, setProcessModal] = useState(null);
  const [selectedRoleType, setSelectedRoleType] = useState(
    ADMIN_ROLE_TYPES.SUPPORT_ADMIN
  );
  const [processReason, setProcessReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const permissionMap = useMemo(() => {
    return Object.fromEntries(
      permissionsData.permissions.map((permission) => [
        permission.code,
        permission,
      ])
    );
  }, [permissionsData.permissions]);

  const roleTemplateMap = useMemo(() => {
    return Object.fromEntries(
      permissionsData.roles.map((role) => [
        role.adminRoleType,
        role,
      ])
    );
  }, [permissionsData.roles]);

  const fetchPermissions = useCallback(async () => {
    setLoadingPermissions(true);
    setErrorMessage('');

    try {
      const result = await getAdminRolePermissions();
      setPermissionsData({
        roles: Array.isArray(result.roles) ? result.roles : [],
        permissions: Array.isArray(result.permissions) ? result.permissions : [],
      });
    } catch (error) {
      console.error(error);
      setErrorMessage(error.message || '권한 템플릿을 불러오지 못했습니다.');
    } finally {
      setLoadingPermissions(false);
    }
  }, []);

  const fetchAssignments = useCallback(async () => {
    setLoadingAssignments(true);
    setErrorMessage('');

    try {
      const result = await getAdminRoleAssignments(assignmentQuery);
      setAssignments(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error(error);
      setErrorMessage(error.message || '관리자 목록을 불러오지 못했습니다.');
    } finally {
      setLoadingAssignments(false);
    }
  }, [assignmentQuery]);

  const fetchCandidates = useCallback(async () => {
    setLoadingCandidates(true);
    setErrorMessage('');

    try {
      const result = await getAdminRoleCandidates({
        page: candidatePage,
        size: PAGE_SIZE,
        keyword: candidateQuery,
      });

      setCandidates(Array.isArray(result.content) ? result.content : []);
      setCandidateTotalCount(result.totalCount ?? 0);
      setCandidateTotalPages(Math.max(result.totalPages ?? 1, 1));
    } catch (error) {
      console.error(error);
      setErrorMessage(error.message || '관리자 후보 목록을 불러오지 못했습니다.');
    } finally {
      setLoadingCandidates(false);
    }
  }, [candidatePage, candidateQuery]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  const refreshAfterProcess = async () => {
    await Promise.all([
      fetchAssignments(),
      fetchCandidates(),
    ]);
  };

  const getRolePermissions = (roleType) => {
    const template = roleTemplateMap[roleType];

    if (!template || !Array.isArray(template.permissionCodes)) {
      return [];
    }

    return template.permissionCodes.map((code) => ({
      code,
      label: permissionMap[code]?.label || code,
      description: permissionMap[code]?.description || '',
    }));
  };

  const getRoleCount = (roleType) => {
    return assignments.filter(
      (assignment) =>
        assignment.active === 1 &&
        assignment.adminRoleType === roleType
    ).length;
  };

  const handleAssignmentSearch = () => {
    setAssignmentQuery(assignmentKeyword.trim());
  };

  const handleAssignmentReset = () => {
    setAssignmentKeyword('');
    setAssignmentQuery('');
  };

  const handleCandidateSearch = () => {
    setCandidatePage(1);
    setCandidateQuery(candidateKeyword.trim());
  };

  const handleCandidateReset = () => {
    setCandidateKeyword('');
    setCandidateQuery('');
    setCandidatePage(1);
  };

  const openAssignModal = (candidate) => {
    setProcessModal({
      mode: 'assign',
      target: candidate,
    });

    setSelectedRoleType(ADMIN_ROLE_TYPES.SUPPORT_ADMIN);
    setProcessReason('');
  };

  const openChangeModal = (assignment) => {
    setProcessModal({
      mode: 'change',
      target: assignment,
    });

    setSelectedRoleType(
      assignment.adminRoleType || ADMIN_ROLE_TYPES.OPERATIONS_ADMIN
    );
    setProcessReason('');
  };

  const openRevokeModal = (assignment) => {
    setProcessModal({
      mode: 'revoke',
      target: assignment,
    });

    setSelectedRoleType('');
    setProcessReason('');
  };

  const closeProcessModal = () => {
    if (processing) {
      return;
    }

    setProcessModal(null);
    setSelectedRoleType(ADMIN_ROLE_TYPES.SUPPORT_ADMIN);
    setProcessReason('');
  };

  const getModalTitle = () => {
    if (!processModal) {
      return '';
    }

    if (processModal.mode === 'assign') {
      return '관리자 역할 부여';
    }

    if (processModal.mode === 'change') {
      return '관리자 역할 변경';
    }

    return '관리자 권한 해제';
  };

  const getModalDescription = () => {
    if (!processModal?.target) {
      return '';
    }

    const target = processModal.target;
    return `${target.name || '-'} @${target.userId}`;
  };

  const submitProcess = async (e) => {
    e.preventDefault();

    if (!processModal?.target) {
      return;
    }

    const reason = processReason.trim();

    if (!reason) {
      alert('처리 사유를 입력해 주세요.');
      return;
    }

    const target = processModal.target;

    if (processModal.mode !== 'revoke' && !selectedRoleType) {
      alert('관리자 역할을 선택해 주세요.');
      return;
    }

    const confirmMessage =
      processModal.mode === 'assign'
        ? `${target.name}(${target.userId}) 회원에게 ${getRoleLabel(selectedRoleType)} 역할을 부여하시겠습니까?`
        : processModal.mode === 'change'
          ? `${target.name}(${target.userId}) 관리자의 역할을 ${getRoleLabel(selectedRoleType)}로 변경하시겠습니까?`
          : `${target.name}(${target.userId}) 관리자의 권한을 해제하시겠습니까?`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setProcessing(true);

    try {
      if (processModal.mode === 'assign' || processModal.mode === 'change') {
        await updateAdminRoleAssignment(target.userId, {
          adminRoleType: selectedRoleType,
          reason,
        });

        alert('관리자 역할이 변경되었습니다.');
      }

      if (processModal.mode === 'revoke') {
        await revokeAdminRoleAssignment(target.userId, {
          reason,
        });

        alert('관리자 권한이 해제되었습니다.');
      }

      setProcessModal(null);
      setSelectedRoleType(ADMIN_ROLE_TYPES.SUPPORT_ADMIN);
      setProcessReason('');

      await refreshAfterProcess();
    } catch (error) {
      alert(error.message || '권한 처리에 실패했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <AdminLayout
      title="권한관리"
      description="최고관리자가 관리자 계정의 역할을 부여하고, 역할별 권한 범위를 확인합니다."
      user={user}
      onLogout={onLogout}
    >
      {errorMessage && (
        <section className="ad-section">
          <div className="ad-empty">
            {errorMessage}
          </div>
        </section>
      )}

      <section className="ad-section">
        <div className="ad-section__head">
          <div>
            <div className="ad-section__title">관리자 역할 템플릿</div>
            <div className="ad-section__desc">
              권한은 고정 템플릿으로 관리되며, 관리자는 역할만 부여받습니다.
            </div>
          </div>
        </div>

        <div className="ad-section__body">
          {loadingPermissions ? (
            <div className="ad-empty">
              권한 템플릿을 불러오는 중입니다.
            </div>
          ) : (
            <div className="ad-role-template-grid">
              {permissionsData.roles.map((role) => {
                const rolePermissions = getRolePermissions(role.adminRoleType);

                return (
                  <div
                    className="ad-role-template-card"
                    key={role.adminRoleType}
                  >
                    <div className="ad-role-template-card__head">
                      <div>
                        <span className={getRoleBadgeClass(role.adminRoleType)}>
                          {role.label}
                        </span>

                        <div className="ad-role-template-card__count">
                          현재 {getRoleCount(role.adminRoleType)}명
                        </div>
                      </div>
                    </div>

                    <p className="ad-role-template-card__desc">
                      {role.description}
                    </p>

                    <div className="ad-role-permission-list">
                      {rolePermissions.map((permission) => (
                        <span
                          className="ad-role-permission-chip"
                          key={permission.code}
                          title={permission.description}
                        >
                          {permission.label}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}

              {permissionsData.roles.length === 0 && (
                <div className="ad-empty">
                  등록된 권한 템플릿이 없습니다.
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="ad-section">
        <div className="ad-section__head">
          <div>
            <div className="ad-section__title">관리자 목록</div>
            <div className="ad-section__desc">
              현재 role_admin 회원과 세부 관리자 역할을 조회합니다.
            </div>
          </div>
        </div>

        <div className="ad-toolbar">
          <div className="ad-search">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>

            <input
              placeholder="관리자 아이디, 이름, 이메일 검색"
              value={assignmentKeyword}
              onChange={(e) => setAssignmentKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAssignmentSearch();
                }
              }}
            />
          </div>

          <Button variant="primary" size="sm" onClick={handleAssignmentSearch}>
            조회
          </Button>

          <Button variant="outline" size="sm" onClick={handleAssignmentReset}>
            초기화
          </Button>

          <span className="ad-toolbar__spacer ad-toolbar__count">
            총 {assignments.length}명
          </span>
        </div>

        <div className="ad-table ad-table--admin-roles">
          <div className="ad-table__head">
            <span>관리자</span>
            <span>현재 역할</span>
            <span>부여/수정일</span>
            <span>권한 요약</span>
            <span>관리</span>
          </div>

          {loadingAssignments && (
            <div className="ad-empty">
              관리자 목록을 불러오는 중입니다.
            </div>
          )}

          {!loadingAssignments && assignments.length === 0 && (
            <div className="ad-empty">
              조건에 맞는 관리자가 없습니다.
            </div>
          )}

          {!loadingAssignments && assignments.map((admin) => {
            const rolePermissions = getRolePermissions(admin.adminRoleType);

            return (
              <div className="ad-table__row" key={admin.userId}>
                <div>
                  <div className="ad-table__cell-strong">
                    {admin.name || '-'}
                    {' '}
                    <span className="ad-table__cell-muted">
                      @{admin.userId}
                    </span>
                  </div>

                  <div className="ad-table__cell-muted">
                    {admin.email || '-'}
                  </div>
                </div>

                <div>
                  <span className={getRoleBadgeClass(admin.adminRoleType)}>
                    {admin.adminRoleLabel || getRoleLabel(admin.adminRoleType)}
                  </span>
                </div>

                <div className="ad-table__cell-muted">
                  <div>
                    부여 {formatDateTime(admin.assignedAt)}
                  </div>
                  <div>
                    수정 {formatDateTime(admin.updatedAt)}
                  </div>
                </div>

                <div className="ad-role-summary">
                  {rolePermissions.length === 0 ? (
                    <span className="ad-table__cell-muted">
                      세부 역할 미지정
                    </span>
                  ) : (
                    rolePermissions.slice(0, 5).map((permission) => (
                      <span
                        className="ad-role-permission-chip"
                        key={permission.code}
                      >
                        {permission.label}
                      </span>
                    ))
                  )}

                  {rolePermissions.length > 5 && (
                    <span className="ad-table__cell-muted">
                      +{rolePermissions.length - 5}
                    </span>
                  )}
                </div>

                <div className="ad-table__actions">
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => openChangeModal(admin)}
                  >
                    역할 변경
                  </Button>

                  <Button
                    variant="danger"
                    size="xs"
                    onClick={() => openRevokeModal(admin)}
                  >
                    관리자 해제
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="ad-section">
        <div className="ad-section__head">
          <div>
            <div className="ad-section__title">관리자 승격 후보</div>
            <div className="ad-section__desc">
              일반 회원(role_user) 중 관리자로 승격할 계정을 선택합니다.
            </div>
          </div>
        </div>

        <div className="ad-toolbar">
          <div className="ad-search">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>

            <input
              placeholder="후보 아이디, 이름, 이메일 검색"
              value={candidateKeyword}
              onChange={(e) => setCandidateKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCandidateSearch();
                }
              }}
            />
          </div>

          <Button variant="primary" size="sm" onClick={handleCandidateSearch}>
            조회
          </Button>

          <Button variant="outline" size="sm" onClick={handleCandidateReset}>
            초기화
          </Button>

          <span className="ad-toolbar__spacer ad-toolbar__count">
            총 {candidateTotalCount}명
          </span>
        </div>

        <div className="ad-table ad-table--admin-candidates">
          <div className="ad-table__head">
            <span>회원</span>
            <span>이메일</span>
            <span>가입일</span>
            <span>관리</span>
          </div>

          {loadingCandidates && (
            <div className="ad-empty">
              후보 목록을 불러오는 중입니다.
            </div>
          )}

          {!loadingCandidates && candidates.length === 0 && (
            <div className="ad-empty">
              조건에 맞는 후보 회원이 없습니다.
            </div>
          )}

          {!loadingCandidates && candidates.map((candidate) => (
            <div className="ad-table__row" key={candidate.userId}>
              <div>
                <div className="ad-table__cell-strong">
                  {candidate.name || '-'}
                  {' '}
                  <span className="ad-table__cell-muted">
                    @{candidate.userId}
                  </span>
                </div>

                <div className="ad-table__cell-muted">
                  {candidate.role}
                </div>
              </div>

              <div className="ad-table__cell-muted">
                {candidate.email || '-'}
              </div>

              <div className="ad-table__cell-muted">
                {formatDate(candidate.createdAt)}
              </div>

              <div className="ad-table__actions">
                <Button
                  variant="primary"
                  size="xs"
                  onClick={() => openAssignModal(candidate)}
                >
                  관리자 지정
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="ad-pagination-wrap">
          <Pagination
            currentPage={candidatePage}
            totalPages={candidateTotalPages}
            onPageChange={setCandidatePage}
          />
        </div>
      </section>

      {processModal && (
        <div className="ad-modal__overlay" onClick={closeProcessModal}>
          <div className="ad-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ad-modal__head">
              <div>
                <h2>{getModalTitle()}</h2>
                <p>{getModalDescription()}</p>
              </div>

              <button
                type="button"
                className="ad-modal__close"
                onClick={closeProcessModal}
              >
                ×
              </button>
            </div>

            <form className="ad-modal__body" onSubmit={submitProcess}>
              {processModal.mode !== 'revoke' && (
                <div className="ad-modal__field">
                  <label>관리자 역할</label>

                  <select
                    className="ad-select"
                    value={selectedRoleType}
                    onChange={(e) => setSelectedRoleType(e.target.value)}
                  >
                    {ADMIN_ROLE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="ad-modal__field">
                <label>
                  {processModal.mode === 'revoke' ? '해제 사유' : '변경 사유'}
                </label>

                <textarea
                  className="ad-modal__textarea"
                  rows={5}
                  value={processReason}
                  onChange={(e) => setProcessReason(e.target.value)}
                  placeholder="권한 변경 사유를 입력해 주세요."
                />
              </div>

              <div className="ad-modal__actions">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={closeProcessModal}
                >
                  취소
                </Button>

                <Button
                  type="submit"
                  variant={
                    processModal.mode === 'revoke'
                      ? 'danger-solid'
                      : 'primary'
                  }
                  size="md"
                  disabled={processing}
                >
                  {processing ? '처리 중' : '처리하기'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}