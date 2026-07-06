// 회원상태관리 — 회원 목록 조회/검색, 구독상태 수동변경, AI 사용횟수 초기화
// 강제탈퇴·로그인 제한 처리는 신고관리 페이지에서 처리하고, 이 페이지에서는 상태 조회와 운영성 조치를 담당한다
import React, { useCallback, useEffect, useState } from 'react';

import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Pagination from '../../components/Pagination';
import AdminLayout from './AdminLayout';

import { useAdminPermissions } from '../../contexts/AdminPermissionContext';
import { ADMIN_PERMISSION_CODES } from '../../api/adminRoleApi';

import {
  ADMIN_MEMBER_ROLES,
  ADMIN_MEMBER_STATUS,
  getAdminMembers,
  updateAdminMemberSubscription,
  resetAdminMemberAiCount,
  bulkUpdateAdminMemberSubscription,
  bulkResetAdminMemberAiCount,
} from '../../api/adminMemberApi';

import './AdminPage.css';

const PAGE_SIZE = 10;

const ROLE_OPTIONS = [
  { value: '', label: '회원구분 전체' },
  { value: ADMIN_MEMBER_ROLES.USER, label: '일반회원' },
  { value: ADMIN_MEMBER_ROLES.LAWYER, label: '변호사' },
  { value: ADMIN_MEMBER_ROLES.ADMIN, label: '관리자' },
];

const SUBSCRIBE_OPTIONS = [
  { value: '', label: '구독상태 전체' },
  { value: '1', label: 'Pro' },
  { value: '0', label: 'Basic' },
];

const STATUS_OPTIONS = [
  { value: '', label: '회원상태 전체' },
  { value: ADMIN_MEMBER_STATUS.ACTIVE, label: '정상' },
  { value: ADMIN_MEMBER_STATUS.LOGIN_RESTRICTED, label: '로그인 제한' },
  { value: ADMIN_MEMBER_STATUS.WITHDRAWN, label: '강제탈퇴' },
];

function formatDate(value) {
  if (!value) {
    return '-';
  }

  return String(value).slice(0, 10);
}

function formatDateTime(value) {
  if (!value) {
    return '-';
  }

  return String(value).replace('T', ' ').slice(0, 16);
}

function getRoleLabel(role) {
  switch (role) {
    case 'role_admin':
      return '관리자';
    case 'role_lawyer':
      return '변호사';
    case 'role_user':
      return '일반회원';
    default:
      return role || '-';
  }
}

function getRoleBadgeType(role) {
  switch (role) {
    case 'role_admin':
      return 'admin';
    case 'role_lawyer':
      return 'pending';
    default:
      return 'primary';
  }
}

function getStatusInfo(status) {
  switch (status) {
    case 'LOGIN_RESTRICTED':
      return {
        label: '로그인 제한',
        badge: 'rejected',
      };
    case 'WITHDRAWN':
      return {
        label: '강제탈퇴',
        badge: 'rejected',
      };
    case 'ACTIVE':
      return {
        label: '정상',
        badge: 'ok',
      };
    default:
      return {
        label: status || '-',
        badge: 'primary',
      };
  }
}

function getSubscribeLabel(subscribe) {
  return Number(subscribe) === 1 ? 'Pro' : 'Basic';
}

function getSubscribeBadgeType(subscribe) {
  return Number(subscribe) === 1 ? 'pro' : 'primary';
}

export default function AdminMemberPage({ user, onLogout }) {

  const { hasPermission } = useAdminPermissions();

  const canManageSubscription = hasPermission(
    ADMIN_PERMISSION_CODES.SUBSCRIPTION_MANAGE
  );

  const canManageMemberStatus = hasPermission(
    ADMIN_PERMISSION_CODES.MEMBER_STATUS_MANAGE
  );
  
  const [filters, setFilters] = useState({
    keyword: '',
    role: '',
    subscribe: '',
    status: '',
  });

  const [query, setQuery] = useState({
    keyword: '',
    role: '',
    subscribe: '',
    status: '',
  });

  const [members, setMembers] = useState([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [actionLoadingUserId, setActionLoadingUserId] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [bulkProcessing, setBulkProcessing] = useState(false);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      const result = await getAdminMembers({
        page,
        size: PAGE_SIZE,
        keyword: query.keyword,
        role: query.role,
        subscribe: query.subscribe,
        status: query.status,
      });

      setMembers(Array.isArray(result.content) ? result.content : []);
      setTotalCount(result.totalCount ?? 0);
      setTotalPages(Math.max(result.totalPages ?? 1, 1));
    } catch (error) {
      console.error(error);
      setErrorMessage(error.message || '회원 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [page, query]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSearch = () => {
    setPage(1);
    setQuery({
      keyword: filters.keyword.trim(),
      role: filters.role,
      subscribe: filters.subscribe,
      status: filters.status,
    });
  };

  const handleReset = () => {
    const empty = {
      keyword: '',
      role: '',
      subscribe: '',
      status: '',
    };

    setFilters(empty);
    setQuery(empty);
    setPage(1);
  };

  const handleToggleSubscribe = async (member) => {
    if (member.status === ADMIN_MEMBER_STATUS.WITHDRAWN) {
      alert('강제탈퇴 처리된 회원은 구독 상태를 변경할 수 없습니다.');
      return;
    }

    const nextSubscribe = Number(member.subscribe) === 1 ? 0 : 1;
    const nextLabel = getSubscribeLabel(nextSubscribe);

    if (!window.confirm(`${member.name} 회원을 ${nextLabel}으로 전환하시겠습니까?`)) {
      return;
    }

    setActionLoadingUserId(member.userId);

    try {
      await updateAdminMemberSubscription(member.userId, nextSubscribe);
      alert('구독 상태가 변경되었습니다.');
      await fetchMembers();
    } catch (error) {
      alert(error.message || '구독 상태 변경에 실패했습니다.');
    } finally {
      setActionLoadingUserId('');
    }
  };

  const selectableMembers = members.filter(
    (member) => member.status !== ADMIN_MEMBER_STATUS.WITHDRAWN
  );

  const selectableUserIds = selectableMembers.map((member) => member.userId);

  const allVisibleSelected =
    selectableUserIds.length > 0 &&
    selectableUserIds.every((userId) => selectedUserIds.includes(userId));

  const handleToggleSelectAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedUserIds((prev) =>
        prev.filter((userId) => !selectableUserIds.includes(userId))
      );
      return;
    }

    setSelectedUserIds((prev) => {
      const merged = new Set([...prev, ...selectableUserIds]);
      return Array.from(merged);
    });
  };

  const handleToggleSelectUser = (userId) => {
    setSelectedUserIds((prev) => {
      if (prev.includes(userId)) {
        return prev.filter((id) => id !== userId);
      }

      return [...prev, userId];
    });
  };

  const handleResetAiCount = async (member) => {
    if (member.status === ADMIN_MEMBER_STATUS.WITHDRAWN) {
      alert('강제탈퇴 처리된 회원은 AI 횟수를 초기화할 수 없습니다.');
      return;
    }

    if (!window.confirm(`${member.name} 회원의 AI 사용횟수를 초기화하시겠습니까?`)) {
      return;
    }

    setActionLoadingUserId(member.userId);

    try {
      await resetAdminMemberAiCount(member.userId);
      alert('AI 사용횟수가 초기화되었습니다.');
      await fetchMembers();
    } catch (error) {
      alert(error.message || 'AI 횟수 초기화에 실패했습니다.');
    } finally {
      setActionLoadingUserId('');
    }
  };

  const handleBulkAction = async () => {
    if (selectedUserIds.length === 0) {
      alert('선택된 회원이 없습니다.');
      return;
    }

    if (!bulkAction) {
      alert('일괄 작업을 선택해 주세요.');
      return;
    }

    const selectedMembers = members.filter((member) =>
      selectedUserIds.includes(member.userId)
    );

    const withdrawnMembers = selectedMembers.filter(
      (member) => member.status === ADMIN_MEMBER_STATUS.WITHDRAWN
    );

    if (withdrawnMembers.length > 0) {
      alert('강제탈퇴 처리된 회원은 일괄 작업 대상에서 제외해 주세요.');
      return;
    }

    const actionLabel =
      bulkAction === 'SUBSCRIBE_PRO'
        ? 'Pro 전환'
        : bulkAction === 'SUBSCRIBE_BASIC'
          ? 'Basic 전환'
          : 'AI 횟수 초기화';

    if (!window.confirm(`선택한 ${selectedUserIds.length}명에게 "${actionLabel}" 작업을 적용하시겠습니까?`)) {
      return;
    }

    setBulkProcessing(true);

    try {
      let results = [];

      if (bulkAction === 'SUBSCRIBE_PRO') {
        results = await bulkUpdateAdminMemberSubscription(selectedUserIds, 1);
      }

      if (bulkAction === 'SUBSCRIBE_BASIC') {
        results = await bulkUpdateAdminMemberSubscription(selectedUserIds, 0);
      }

      if (bulkAction === 'RESET_AI_COUNT') {
        results = await bulkResetAdminMemberAiCount(selectedUserIds);
      }

      const successCount = results.filter((r) => r.success).length;
      const failCount = results.length - successCount;

      if (failCount > 0) {
        alert(`일괄 작업 완료: 성공 ${successCount}건, 실패 ${failCount}건`);
      } else {
        alert(`일괄 작업 완료: 성공 ${successCount}건`);
      }

      setSelectedUserIds([]);
      setBulkAction('');

      await fetchMembers();
    } catch (error) {
      alert(error.message || '일괄 작업에 실패했습니다.');
    } finally {
      setBulkProcessing(false);
    }
  };

  return (
    <AdminLayout
      title="회원상태관리"
      description="회원 목록을 조회·검색하고 구독상태 변경, AI 사용횟수 초기화, 강제 로그아웃을 진행합니다."
      user={user}
      onLogout={onLogout}
    >
      <section className="ad-section">
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
              placeholder="아이디, 이름, 이메일 검색"
              value={filters.keyword}
              onChange={(e) => handleFilterChange('keyword', e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
            />
          </div>

          <select
            className="ad-select"
            value={filters.role}
            onChange={(e) => handleFilterChange('role', e.target.value)}
          >
            {ROLE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          <select
            className="ad-select"
            value={filters.subscribe}
            onChange={(e) => handleFilterChange('subscribe', e.target.value)}
          >
            {SUBSCRIBE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          <select
            className="ad-select"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          <Button variant="primary" size="sm" onClick={handleSearch}>
            조회
          </Button>

          <Button variant="outline" size="sm" onClick={handleReset}>
            초기화
          </Button>

          <select
            className="ad-select"
            value={bulkAction}
            onChange={(e) => setBulkAction(e.target.value)}
          >
            <option value="">일괄 작업 선택</option>

            {canManageSubscription && (
              <>
                <option value="SUBSCRIBE_PRO">선택 회원 Pro 전환</option>
                <option value="SUBSCRIBE_BASIC">선택 회원 Basic 전환</option>
              </>
            )}

            {canManageMemberStatus && (
              <option value="RESET_AI_COUNT">선택 회원 AI횟수 초기화</option>
            )}
          </select>

          <Button
            variant="primary"
            size="sm"
            disabled={bulkProcessing || selectedUserIds.length === 0}
            onClick={handleBulkAction}
          >
            {bulkProcessing ? '처리 중' : '일괄 적용'}
          </Button>

          <span className="ad-toolbar__count">
            선택 {selectedUserIds.length}명
          </span>

          <span className="ad-toolbar__spacer ad-toolbar__count">
            총 {totalCount}명
          </span>
        </div>

        <div className="ad-table ad-table--members">
          <div className="ad-table__head">
            <span className="ad-table__checkbox">
              <input
                type="checkbox"
                className="ad-checkbox"
                checked={allVisibleSelected}
                onChange={handleToggleSelectAllVisible}
              />
            </span>
            <span>아이디</span>
            <span>구분</span>
            <span>이름</span>
            <span>이메일</span>
            <span>가입일</span>
            <span>구독</span>
            <span>AI 횟수</span>
            <span>관리</span>
          </div>

          {loading && (
            <div className="ad-empty">
              회원 목록을 불러오는 중입니다.
            </div>
          )}

          {!loading && errorMessage && (
            <div className="ad-empty">
              {errorMessage}
            </div>
          )}

          {!loading && !errorMessage && members.length === 0 && (
            <div className="ad-empty">
              조건에 맞는 회원이 없습니다.
            </div>
          )}

          {!loading && !errorMessage && members.map((member) => {
            const statusInfo = getStatusInfo(member.status);
            const isActionLoading = actionLoadingUserId === member.userId;
            const isWithdrawn = member.status === ADMIN_MEMBER_STATUS.WITHDRAWN;

            return (
              <div className="ad-table__row" key={member.userId}>
                <div className="ad-table__checkbox">
                  <input
                    type="checkbox"
                    className="ad-checkbox"
                    checked={selectedUserIds.includes(member.userId)}
                    disabled={member.status === ADMIN_MEMBER_STATUS.WITHDRAWN}
                    onChange={() => handleToggleSelectUser(member.userId)}
                  />
                </div>

                <div>
                  <div className="ad-table__cell-strong">
                    {member.userId}
                  </div>

                  {member.reportReceivedCount > 0 && (
                    <div className="ad-table__cell-muted">
                      신고 {member.reportReceivedCount}건
                    </div>
                  )}
                </div>

                <div>
                  <Badge type={getRoleBadgeType(member.role)}>
                    {getRoleLabel(member.role)}
                  </Badge>
                </div>

                <div>
                  <div className="ad-table__cell-strong">
                    {member.name}
                  </div>

                  <Badge type={statusInfo.badge}>
                    {statusInfo.label}
                  </Badge>

                  {member.status === ADMIN_MEMBER_STATUS.LOGIN_RESTRICTED && (
                    <div className="ad-table__cell-muted">
                      만료 {formatDateTime(member.loginRestrictedUntil)}
                    </div>
                  )}
                </div>

                <div className="ad-table__cell-muted">
                  {member.email}
                </div>

                <div className="ad-table__cell-muted">
                  {formatDate(member.createdAt)}
                </div>

                <div>
                  <Badge type={getSubscribeBadgeType(member.subscribe)}>
                    {getSubscribeLabel(member.subscribe)}
                  </Badge>
                </div>

                <div>
                  {member.aiCount ?? 0} / 3
                </div>

                <div className="ad-table__actions">
                  {canManageSubscription && (
                    <Button
                      variant="outline"
                      size="xs"
                      disabled={isActionLoading || isWithdrawn}
                      onClick={() => handleToggleSubscribe(member)}
                    >
                      {Number(member.subscribe) === 1 ? 'Basic 전환' : 'Pro 전환'}
                    </Button>
                  )}

                  {canManageMemberStatus && (
                    <Button
                      variant="outline"
                      size="xs"
                      disabled={isActionLoading || isWithdrawn}
                      onClick={() => handleResetAiCount(member)}
                    >
                      AI횟수 초기화
                    </Button>
                  )}

                </div>
              </div>
            );
          })}
        </div>

        <div className="ad-pagination-wrap">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      </section>
    </AdminLayout>
  );
}