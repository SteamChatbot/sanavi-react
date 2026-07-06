// 신고관리 — 회원 신고 내역 조회, 로그인 제한·강제탈퇴·반려 처리
// PENDING 신고만 선택 가능하며, 선택 신고에 대해 일괄 처리를 지원한다
import React, { useCallback, useEffect, useState } from 'react';

import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Pagination from '../../components/Pagination';
import AdminLayout from './AdminLayout';

import { useAdminPermissions } from '../../contexts/AdminPermissionContext';
import { ADMIN_PERMISSION_CODES } from '../../api/adminRoleApi';

import {
  ADMIN_REPORT_STATUS,
  ADMIN_REPORT_TARGET_TYPES,
  getAdminReports,
  restrictReportLogin,
  withdrawReportedUser,
  dismissAdminReport,
  bulkRestrictReportLogin,
  bulkWithdrawReportedUsers,
  bulkDismissAdminReports,
} from '../../api/adminReportApi';

import './AdminPage.css';

const STATUS_INFO = {
  PENDING: {
    label: '처리대기',
    badge: 'pending',
  },
  LOGIN_RESTRICTED: {
    label: '로그인 제한',
    badge: 'rejected',
  },
  WITHDRAWN: {
    label: '강제탈퇴 처리',
    badge: 'rejected',
  },
  DISMISSED: {
    label: '반려',
    badge: 'ok',
  },
};

const TARGET_TYPE_INFO = {
  MEMBER: '회원',
  LAWYER: '변호사',
  BOARD: '게시글',
  BOARD_COMMENT: '댓글',
  MATCH: '의뢰글',
};

const STATUS_OPTIONS = [
  { value: '', label: '처리상태 전체' },
  { value: ADMIN_REPORT_STATUS.PENDING, label: '처리대기' },
  { value: ADMIN_REPORT_STATUS.LOGIN_RESTRICTED, label: '로그인 제한' },
  { value: ADMIN_REPORT_STATUS.WITHDRAWN, label: '강제탈퇴' },
  { value: ADMIN_REPORT_STATUS.DISMISSED, label: '반려' },
];

const TARGET_TYPE_OPTIONS = [
  { value: '', label: '대상유형 전체' },
  { value: ADMIN_REPORT_TARGET_TYPES.MEMBER, label: '회원' },
  { value: ADMIN_REPORT_TARGET_TYPES.LAWYER, label: '변호사' },
  { value: ADMIN_REPORT_TARGET_TYPES.BOARD, label: '게시글' },
  { value: ADMIN_REPORT_TARGET_TYPES.BOARD_COMMENT, label: '댓글' },
  { value: ADMIN_REPORT_TARGET_TYPES.MATCH, label: '의뢰글' },
];

const BULK_ACTION_OPTIONS = [
  { value: '', label: '일괄 작업 선택' },
  { value: 'LOGIN_RESTRICT_3', label: '선택 신고 3일 로그인 제한' },
  { value: 'LOGIN_RESTRICT_7', label: '선택 신고 7일 로그인 제한' },
  { value: 'LOGIN_RESTRICT_30', label: '선택 신고 30일 로그인 제한' },
  { value: 'WITHDRAW', label: '선택 신고 강제탈퇴' },
  { value: 'DISMISS', label: '선택 신고 반려' },
];

const PAGE_SIZE = 10;

function formatDateTime(value) {
  if (!value) {
    return '-';
  }

  return String(value).replace('T', ' ').slice(0, 16);
}

function getStatusInfo(status) {
  return STATUS_INFO[status] ?? {
    label: status || '-',
    badge: 'primary',
  };
}

function getTargetTypeLabel(targetType) {
  return TARGET_TYPE_INFO[targetType] ?? targetType ?? '-';
}

function getTargetName(report) {
  return report.reportedUserName || report.reportedUserId || '-';
}

function isLoginRestrictBulkAction(value) {
  return value?.startsWith('LOGIN_RESTRICT_');
}

function getBulkActionLabel(value) {
  const option = BULK_ACTION_OPTIONS.find((o) => o.value === value);
  return option?.label || '일괄 작업';
}

export default function AdminMemberReportPage({ user, onLogout }) {
  const { hasPermission } = useAdminPermissions();

  const canProcessReport = hasPermission(
    ADMIN_PERMISSION_CODES.REPORT_PROCESS
  );
  const [filters, setFilters] = useState({
    status: '',
    targetType: '',
    keyword: '',
  });

  const [query, setQuery] = useState({
    status: '',
    targetType: '',
    keyword: '',
  });

  const [reports, setReports] = useState([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [selectedReportIds, setSelectedReportIds] = useState([]);
  const [bulkAction, setBulkAction] = useState('');

  const [processModal, setProcessModal] = useState(null);
  const [processDays, setProcessDays] = useState(7);
  const [processReason, setProcessReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      const result = await getAdminReports({
        page,
        size: PAGE_SIZE,
        status: query.status,
        targetType: query.targetType,
        keyword: query.keyword,
      });

      setReports(Array.isArray(result.content) ? result.content : []);
      setTotalCount(result.totalCount ?? 0);
      setTotalPages(Math.max(result.totalPages ?? 1, 1));
    } catch (error) {
      console.error(error);
      setErrorMessage(error.message || '신고 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [page, query]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const pendingReports = reports.filter(
    (report) => report.status === ADMIN_REPORT_STATUS.PENDING
  );

  const pendingReportIds = pendingReports.map((report) => report.reportId);

  const allVisiblePendingSelected =
    pendingReportIds.length > 0 &&
    pendingReportIds.every((reportId) => selectedReportIds.includes(reportId));

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSearch = () => {
    setPage(1);
    setSelectedReportIds([]);
    setBulkAction('');
    setQuery({
      status: filters.status,
      targetType: filters.targetType,
      keyword: filters.keyword.trim(),
    });
  };

  const handleReset = () => {
    const empty = {
      status: '',
      targetType: '',
      keyword: '',
    };

    setFilters(empty);
    setQuery(empty);
    setPage(1);
    setSelectedReportIds([]);
    setBulkAction('');
  };

  const handlePageChange = (nextPage) => {
    setSelectedReportIds([]);
    setBulkAction('');
    setPage(nextPage);
  };

  const handleToggleSelectAllVisible = () => {
    if (allVisiblePendingSelected) {
      setSelectedReportIds((prev) =>
        prev.filter((reportId) => !pendingReportIds.includes(reportId))
      );
      return;
    }

    setSelectedReportIds((prev) => {
      const merged = new Set([...prev, ...pendingReportIds]);
      return Array.from(merged);
    });
  };

  const handleToggleSelectReport = (report) => {
    if (report.status !== ADMIN_REPORT_STATUS.PENDING) {
      return;
    }

    setSelectedReportIds((prev) => {
      if (prev.includes(report.reportId)) {
        return prev.filter((id) => id !== report.reportId);
      }

      return [...prev, report.reportId];
    });
  };

  const openProcessModal = (mode, report) => {
    setProcessModal({
      mode,
      report,
      reports: [],
      isBulk: false,
    });

    setProcessDays(7);
    setProcessReason('');
  };

  const openBulkProcessModal = () => {
    if (selectedReportIds.length === 0) {
      alert('선택된 신고가 없습니다.');
      return;
    }

    if (!bulkAction) {
      alert('일괄 작업을 선택해 주세요.');
      return;
    }

    const selectedReports = reports.filter((report) =>
      selectedReportIds.includes(report.reportId)
    );

    const invalidReports = selectedReports.filter(
      (report) => report.status !== ADMIN_REPORT_STATUS.PENDING
    );

    if (invalidReports.length > 0) {
      alert('처리대기 상태의 신고만 일괄 처리할 수 있습니다.');
      return;
    }

    if (isLoginRestrictBulkAction(bulkAction)) {
      const days = Number(bulkAction.replace('LOGIN_RESTRICT_', ''));

      setProcessModal({
        mode: 'loginRestrict',
        report: null,
        reports: selectedReports,
        isBulk: true,
      });

      setProcessDays(days);
      setProcessReason('');
      return;
    }

    setProcessModal({
      mode: bulkAction === 'WITHDRAW' ? 'withdraw' : 'dismiss',
      report: null,
      reports: selectedReports,
      isBulk: true,
    });

    setProcessDays(7);
    setProcessReason('');
  };

  const closeProcessModal = () => {
    if (processing) {
      return;
    }

    setProcessModal(null);
    setProcessReason('');
    setProcessDays(7);
  };

  const getProcessTitle = () => {
    if (!processModal) {
      return '';
    }

    const prefix = processModal.isBulk ? '일괄 ' : '';

    if (processModal.mode === 'loginRestrict') {
      return `${prefix}로그인 제한 처리`;
    }

    if (processModal.mode === 'withdraw') {
      return `${prefix}강제탈퇴 처리`;
    }

    return `${prefix}신고 반려 처리`;
  };

  const getProcessTargetText = () => {
    if (!processModal) {
      return '';
    }

    if (processModal.isBulk) {
      return `선택 신고 ${processModal.reports.length}건`;
    }

    return `${getTargetName(processModal.report)} @${processModal.report.reportedUserId}`;
  };

  const submitSingleProcess = async (reason) => {
    const { mode, report } = processModal;

    const targetName = getTargetName(report);
    const confirmMessage =
      mode === 'loginRestrict'
        ? `${targetName}(${report.reportedUserId}) 회원을 ${processDays}일 로그인 제한 처리하시겠습니까?`
        : mode === 'withdraw'
          ? `${targetName}(${report.reportedUserId}) 회원을 강제탈퇴 처리하시겠습니까?`
          : '해당 신고를 반려 처리하시겠습니까?';

    if (!window.confirm(confirmMessage)) {
      return;
    }

    if (mode === 'loginRestrict') {
      await restrictReportLogin(report.reportId, {
        days: Number(processDays),
        reason,
      });

      alert('로그인 제한 처리가 완료되었습니다.');
    }

    if (mode === 'withdraw') {
      await withdrawReportedUser(report.reportId, {
        reason,
      });

      alert('강제탈퇴 처리가 완료되었습니다.');
    }

    if (mode === 'dismiss') {
      await dismissAdminReport(report.reportId, {
        reason,
      });

      alert('신고가 반려 처리되었습니다.');
    }
  };

  const submitBulkProcess = async (reason) => {
    const reportIds = processModal.reports.map((report) => report.reportId);

    const confirmMessage =
      processModal.mode === 'loginRestrict'
        ? `선택 신고 ${reportIds.length}건을 ${processDays}일 로그인 제한 처리하시겠습니까?`
        : processModal.mode === 'withdraw'
          ? `선택 신고 ${reportIds.length}건을 강제탈퇴 처리하시겠습니까?`
          : `선택 신고 ${reportIds.length}건을 반려 처리하시겠습니까?`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    let results = [];

    if (processModal.mode === 'loginRestrict') {
      results = await bulkRestrictReportLogin(reportIds, {
        days: Number(processDays),
        reason,
      });
    }

    if (processModal.mode === 'withdraw') {
      results = await bulkWithdrawReportedUsers(reportIds, {
        reason,
      });
    }

    if (processModal.mode === 'dismiss') {
      results = await bulkDismissAdminReports(reportIds, {
        reason,
      });
    }

    const successCount = results.filter((result) => result.success).length;
    const failCount = results.length - successCount;

    if (failCount > 0) {
      alert(`일괄 처리 완료: 성공 ${successCount}건, 실패 ${failCount}건`);
    } else {
      alert(`일괄 처리 완료: 성공 ${successCount}건`);
    }

    setSelectedReportIds([]);
    setBulkAction('');
  };

  const submitProcess = async (e) => {
    e.preventDefault();

    if (!processModal) {
      return;
    }

    const reason = processReason.trim();

    if (!reason) {
      alert('처리 사유를 입력해 주세요.');
      return;
    }

    setProcessing(true);

    try {
      if (processModal.isBulk) {
        await submitBulkProcess(reason);
      } else {
        await submitSingleProcess(reason);
      }

      setProcessModal(null);
      setProcessReason('');
      setProcessDays(7);

      await fetchReports();
    } catch (error) {
      alert(error.message || '신고 처리에 실패했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <AdminLayout
      title="신고관리"
      description="신고 내역을 검토하여 로그인 제한, 강제탈퇴, 반려 처리를 진행합니다."
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
              placeholder="신고대상·신고자·사유 검색"
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
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          <select
            className="ad-select"
            value={filters.targetType}
            onChange={(e) => handleFilterChange('targetType', e.target.value)}
          >
            {TARGET_TYPE_OPTIONS.map((o) => (
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

          {canProcessReport && (
            <>
              <select
                className="ad-select"
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value)}
              >
                {BULK_ACTION_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>

              <Button
                variant="primary"
                size="sm"
                disabled={selectedReportIds.length === 0 || !bulkAction}
                onClick={openBulkProcessModal}
              >
                일괄 적용
              </Button>

              <span className="ad-toolbar__count">
                선택 {selectedReportIds.length}건
              </span>
            </>
          )}

          <span className="ad-toolbar__spacer ad-toolbar__count">
            총 {totalCount}건
          </span>
        </div>

        <div className="ad-table ad-table--reports">
          <div className="ad-table__head">
            <span className="ad-table__checkbox">
              <input
                type="checkbox"
                className="ad-checkbox"
                checked={allVisiblePendingSelected}
                disabled={pendingReportIds.length === 0 || !canProcessReport}
                onChange={handleToggleSelectAllVisible}
              />
            </span>
            <span>신고대상</span>
            <span>신고자</span>
            <span>사유</span>
            <span>신고일시</span>
            <span>상태</span>
            <span>관리</span>
          </div>

          {loading && (
            <div className="ad-empty">
              신고 목록을 불러오는 중입니다.
            </div>
          )}

          {!loading && errorMessage && (
            <div className="ad-empty">
              {errorMessage}
            </div>
          )}

          {!loading && !errorMessage && reports.length === 0 && (
            <div className="ad-empty">
              조건에 맞는 신고 내역이 없습니다.
            </div>
          )}

          {!loading && !errorMessage && reports.map((report) => {
            const statusInfo = getStatusInfo(report.status);
            const isPending = report.status === ADMIN_REPORT_STATUS.PENDING;

            return (
              <div className="ad-table__row" key={report.reportId}>
                <div className="ad-table__checkbox">
                  <input
                    type="checkbox"
                    className="ad-checkbox"
                    checked={selectedReportIds.includes(report.reportId)}
                    disabled={!isPending || !canProcessReport}
                    onChange={() => handleToggleSelectReport(report)}
                  />
                </div>

                <div>
                  <div className="ad-table__cell-strong">
                    {getTargetName(report)}
                    {' '}
                    <span className="ad-table__cell-muted">
                      @{report.reportedUserId}
                    </span>
                  </div>

                  <div className="ad-table__cell-muted">
                    {getTargetTypeLabel(report.targetType)}
                    {' '}
                    #{report.targetId}
                  </div>
                </div>

                <div>
                  <div className="ad-table__cell-muted">
                    {report.reportUserId}
                  </div>

                  {report.reportUserName && (
                    <div className="ad-table__cell-muted">
                      {report.reportUserName}
                    </div>
                  )}
                </div>

                <div>
                  {report.category || '-'}

                  <div className="ad-table__cell-muted">
                    {report.detail || '상세 내용 없음'}
                  </div>
                </div>

                <div className="ad-table__cell-muted">
                  {formatDateTime(report.createdAt)}
                </div>

                <div>
                  <Badge type={statusInfo.badge}>
                    {statusInfo.label}
                  </Badge>

                  {report.processedAt && (
                    <div className="ad-table__cell-muted">
                      {formatDateTime(report.processedAt)}
                    </div>
                  )}
                </div>

                <div className="ad-table__actions">
                  {isPending && canProcessReport ? (
                    <>
                      <Button
                        variant="danger"
                        size="xs"
                        onClick={() => openProcessModal('loginRestrict', report)}
                      >
                        로그인 제한
                      </Button>

                      <Button
                        variant="danger-solid"
                        size="xs"
                        onClick={() => openProcessModal('withdraw', report)}
                      >
                        강제탈퇴
                      </Button>

                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => openProcessModal('dismiss', report)}
                      >
                        반려
                      </Button>
                    </>
                  ) : (
                    <span className="ad-table__cell-muted">
                      {isPending ? '처리 권한 없음' : '처리완료'}
                    </span>
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
            onPageChange={handlePageChange}
          />
        </div>
      </section>

      {processModal && (
        <div className="ad-modal__overlay" onClick={closeProcessModal}>
          <div className="ad-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ad-modal__head">
              <div>
                <h2>{getProcessTitle()}</h2>
                <p>{getProcessTargetText()}</p>

                {processModal.isBulk && bulkAction && (
                  <p>{getBulkActionLabel(bulkAction)}</p>
                )}
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
              {processModal.mode === 'loginRestrict' && (
                <div className="ad-modal__field">
                  <label>로그인 제한 기간</label>

                  <select
                    className="ad-select"
                    value={processDays}
                    onChange={(e) => setProcessDays(Number(e.target.value))}
                  >
                    <option value={3}>3일</option>
                    <option value={7}>7일</option>
                    <option value={30}>30일</option>
                  </select>
                </div>
              )}

              <div className="ad-modal__field">
                <label>처리 사유</label>

                <textarea
                  className="ad-modal__textarea"
                  rows={5}
                  value={processReason}
                  onChange={(e) => setProcessReason(e.target.value)}
                  placeholder="관리자 조치 사유를 입력해 주세요."
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
                    processModal.mode === 'dismiss'
                      ? 'primary'
                      : 'danger-solid'
                  }
                  size="md"
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