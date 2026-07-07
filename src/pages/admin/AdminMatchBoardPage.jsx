// 의뢰글 게시판관리 — 의뢰글/입찰 의견 조회, 신고 필터, 강제마감, 삭제/복구, 선택 일괄 처리
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Pagination from '../../components/Pagination';
import {
  closeAdminMatchPost,
  deleteAdminMatchBid,
  deleteAdminMatchPost,
  getAdminMatchBids,
  getAdminMatchPosts,
  restoreAdminMatchBid,
  restoreAdminMatchPost,
} from '../../api/adminMatchBoardApi';

import AdminLayout from './AdminLayout';
import './AdminPage.css';

const PAGE_SIZE = 10;

const TAB_LABEL = {
  all: '전체 의뢰글',
  reportedPosts: '신고된 의뢰글',
  reportedBids: '신고된 입찰 의견',
};

const DELETED_STATUS_OPTIONS = [
  { value: 'ACTIVE', label: '정상' },
  { value: 'DELETED', label: '삭제됨' },
  { value: 'ALL', label: '전체' },
];

const POST_STATUS_OPTIONS = [
  { value: '', label: '상태 전체' },
  { value: 'OPEN', label: '모집중' },
  { value: 'BIDDING', label: '입찰중' },
  { value: 'PENDING', label: '대기중' },
  { value: 'CLOSED', label: '마감' },
  { value: 'CANCELLED', label: '취소' },
];

const BID_STATUS_OPTIONS = [
  { value: '', label: '상태 전체' },
  { value: 'PENDING', label: '대기중' },
  { value: 'ACCEPTED', label: '수락' },
  { value: 'REJECTED', label: '거절' },
  { value: 'CANCELLED', label: '취소' },
];

function formatDate(value) {
  if (!value) return '-';

  if (Array.isArray(value)) {
    const [year, month, day, hour = 0, minute = 0] = value;
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  }

  return String(value).replace('T', ' ').slice(0, 16);
}

function getAuthorLabel(item) {
  return item.authorName || item.authorId || '-';
}

function isCancelledStatus(status) {
  return status === 'CANCELLED' || status === 'CANCELED';
}

function isClosedOrCancelled(status) {
  return status === 'CLOSED' || isCancelledStatus(status);
}

function getMatchTypeLabel(matchType) {
  if (matchType === 'DIRECT') return '직접';
  if (matchType === 'AUCTION') return '입찰';
  return matchType || '-';
}

function getStatusLabel(status) {
  switch (status) {
    case 'OPEN':
      return '모집중';
    case 'BIDDING':
      return '입찰중';
    case 'PENDING':
      return '대기중';
    case 'CLOSED':
      return '마감';
    case 'ACCEPTED':
      return '수락';
    case 'REJECTED':
      return '거절';
    case 'CANCELLED':
    case 'CANCELED':
      return '취소';
    default:
      return status || '-';
  }
}

function getStatusBadge(status, deleted) {
  if (Number(deleted) === 0) {
    return <Badge type="rejected">삭제됨</Badge>;
  }

  if (status === 'CLOSED' || status === 'ACCEPTED') {
    return <Badge type="ok">{getStatusLabel(status)}</Badge>;
  }

  if (status === 'REJECTED' || isCancelledStatus(status)) {
    return <Badge type="rejected">{getStatusLabel(status)}</Badge>;
  }

  return <Badge type="pending">{getStatusLabel(status)}</Badge>;
}

export default function AdminMatchBoardPage({ user, onLogout }) {
  const [tab, setTab] = useState('all');
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');
  const [deletedStatus, setDeletedStatus] = useState('ACTIVE');
  const [page, setPage] = useState(1);

  const [pageData, setPageData] = useState({
    contents: [],
    page: 1,
    size: PAGE_SIZE,
    totalElements: 0,
    totalPages: 0,
  });

  const [reportedPostCount, setReportedPostCount] = useState(0);
  const [reportedBidCount, setReportedBidCount] = useState(0);

  const [selectedIds, setSelectedIds] = useState(new Set());

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [actionLoadingKey, setActionLoadingKey] = useState('');

  const isBidTab = tab === 'reportedBids';

  const contents = pageData.contents ?? [];
  const total = pageData.totalElements ?? 0;
  const totalPages = Math.max(1, pageData.totalPages ?? 0);

  const statusOptions = isBidTab ? BID_STATUS_OPTIONS : POST_STATUS_OPTIONS;

  const listParams = useMemo(
    () => ({
      page,
      size: PAGE_SIZE,
      keyword,
      status,
      deletedStatus,
      reportedOnly: tab === 'reportedPosts' || tab === 'reportedBids',
    }),
    [page, keyword, status, deletedStatus, tab]
  );

  const getItemId = useCallback(
    (item) => (isBidTab ? item.bidId : item.matchId),
    [isBidTab]
  );

  const selectedItems = useMemo(
    () => contents.filter((item) => selectedIds.has(getItemId(item))),
    [contents, selectedIds, getItemId]
  );

  const deletableSelectedItems = useMemo(
    () => selectedItems.filter((item) => Number(item.deleted) !== 0),
    [selectedItems]
  );

  const restorableSelectedItems = useMemo(
    () => selectedItems.filter((item) => Number(item.deleted) === 0),
    [selectedItems]
  );

  const closableSelectedPosts = useMemo(
    () => selectedItems.filter((item) => (
      !isBidTab
      && Number(item.deleted) !== 0
      && !isClosedOrCancelled(item.status)
    )),
    [selectedItems, isBidTab]
  );

  const isAllVisibleSelected = contents.length > 0
    && contents.every((item) => selectedIds.has(getItemId(item)));

  const hasActionLoading = Boolean(actionLoadingKey);

  const fetchSummaryCounts = useCallback(async () => {
    try {
      const [postSummary, bidSummary] = await Promise.all([
        getAdminMatchPosts({
          page: 1,
          size: 1,
          deletedStatus: 'ALL',
          reportedOnly: true,
        }),
        getAdminMatchBids({
          page: 1,
          size: 1,
          deletedStatus: 'ALL',
          reportedOnly: true,
        }),
      ]);

      setReportedPostCount(postSummary.totalElements ?? 0);
      setReportedBidCount(bidSummary.totalElements ?? 0);
    } catch (error) {
      console.error(error);
    }
  }, []);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      const response = isBidTab
        ? await getAdminMatchBids(listParams)
        : await getAdminMatchPosts(listParams);

      setPageData(response);
      setSelectedIds(new Set());
    } catch (error) {
      console.error(error);
      setPageData({
        contents: [],
        page,
        size: PAGE_SIZE,
        totalElements: 0,
        totalPages: 0,
      });
      setSelectedIds(new Set());
      setErrorMessage(error.message || '의뢰글 게시판관리 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [isBidTab, listParams, page]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    fetchSummaryCounts();
  }, [fetchSummaryCounts]);

  const reload = async () => {
    await Promise.all([
      fetchList(),
      fetchSummaryCounts(),
    ]);
  };

  const handleChangeTab = (nextTab) => {
    setTab(nextTab);
    setPage(1);
    setStatus('');
    setSelectedIds(new Set());
  };

  const toggleSelected = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  };

  const toggleAllVisible = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);

      if (isAllVisibleSelected) {
        contents.forEach((item) => {
          next.delete(getItemId(item));
        });
      } else {
        contents.forEach((item) => {
          next.add(getItemId(item));
        });
      }

      return next;
    });
  };

  const handleClosePost = async (matchId) => {
    if (!window.confirm(`의뢰글 #${matchId} 를 강제마감하시겠습니까?`)) return;

    setActionLoadingKey(`post-close-${matchId}`);

    try {
      await closeAdminMatchPost(matchId);
      await reload();
    } catch (error) {
      console.error(error);
      alert(error.message || '의뢰글 강제마감에 실패했습니다.');
    } finally {
      setActionLoadingKey('');
    }
  };

  const handleDeletePost = async (matchId) => {
    if (!window.confirm(`의뢰글 #${matchId} 를 삭제하시겠습니까?`)) return;

    setActionLoadingKey(`post-delete-${matchId}`);

    try {
      await deleteAdminMatchPost(matchId);
      await reload();
    } catch (error) {
      console.error(error);
      alert(error.message || '의뢰글 삭제에 실패했습니다.');
    } finally {
      setActionLoadingKey('');
    }
  };

  const handleRestorePost = async (matchId) => {
    if (!window.confirm(`의뢰글 #${matchId} 를 복구하시겠습니까?`)) return;

    setActionLoadingKey(`post-restore-${matchId}`);

    try {
      await restoreAdminMatchPost(matchId);
      await reload();
    } catch (error) {
      console.error(error);
      alert(error.message || '의뢰글 복구에 실패했습니다.');
    } finally {
      setActionLoadingKey('');
    }
  };

  const handleDeleteBid = async (bidId) => {
    if (!window.confirm(`입찰 의견 #${bidId} 를 삭제하시겠습니까?`)) return;

    setActionLoadingKey(`bid-delete-${bidId}`);

    try {
      await deleteAdminMatchBid(bidId);
      await reload();
    } catch (error) {
      console.error(error);
      alert(error.message || '입찰 의견 삭제에 실패했습니다.');
    } finally {
      setActionLoadingKey('');
    }
  };

  const handleRestoreBid = async (bidId) => {
    if (!window.confirm(`입찰 의견 #${bidId} 를 복구하시겠습니까?`)) return;

    setActionLoadingKey(`bid-restore-${bidId}`);

    try {
      await restoreAdminMatchBid(bidId);
      await reload();
    } catch (error) {
      console.error(error);
      alert(error.message || '입찰 의견 복구에 실패했습니다.');
    } finally {
      setActionLoadingKey('');
    }
  };

  const handleBulkClose = async () => {
    if (closableSelectedPosts.length === 0) {
      alert('강제마감 가능한 의뢰글이 없습니다.');
      return;
    }

    if (!window.confirm(`선택한 의뢰글 ${closableSelectedPosts.length}건을 강제마감하시겠습니까?`)) {
      return;
    }

    setActionLoadingKey('bulk-close');

    try {
      const results = await Promise.allSettled(
        closableSelectedPosts.map((post) => closeAdminMatchPost(post.matchId))
      );

      const failedCount = results.filter((result) => result.status === 'rejected').length;

      if (failedCount > 0) {
        alert(`${failedCount}건은 강제마감에 실패했습니다.`);
      }

      await reload();
    } catch (error) {
      console.error(error);
      alert(error.message || '선택 강제마감에 실패했습니다.');
    } finally {
      setActionLoadingKey('');
    }
  };

  const handleBulkDelete = async () => {
    if (deletableSelectedItems.length === 0) {
      alert('삭제 가능한 항목이 없습니다.');
      return;
    }

    const targetLabel = isBidTab ? '입찰 의견' : '의뢰글';

    if (!window.confirm(`선택한 ${targetLabel} ${deletableSelectedItems.length}건을 삭제하시겠습니까?`)) {
      return;
    }

    setActionLoadingKey('bulk-delete');

    try {
      const results = await Promise.allSettled(
        deletableSelectedItems.map((item) => {
          const id = getItemId(item);

          return isBidTab
            ? deleteAdminMatchBid(id)
            : deleteAdminMatchPost(id);
        })
      );

      const failedCount = results.filter((result) => result.status === 'rejected').length;

      if (failedCount > 0) {
        alert(`${failedCount}건은 삭제에 실패했습니다.`);
      }

      await reload();
    } catch (error) {
      console.error(error);
      alert(error.message || '선택 삭제에 실패했습니다.');
    } finally {
      setActionLoadingKey('');
    }
  };

  const handleBulkRestore = async () => {
    if (restorableSelectedItems.length === 0) {
      alert('복구 가능한 항목이 없습니다.');
      return;
    }

    const targetLabel = isBidTab ? '입찰 의견' : '의뢰글';

    if (!window.confirm(`선택한 ${targetLabel} ${restorableSelectedItems.length}건을 복구하시겠습니까?`)) {
      return;
    }

    setActionLoadingKey('bulk-restore');

    try {
      const results = await Promise.allSettled(
        restorableSelectedItems.map((item) => {
          const id = getItemId(item);

          return isBidTab
            ? restoreAdminMatchBid(id)
            : restoreAdminMatchPost(id);
        })
      );

      const failedCount = results.filter((result) => result.status === 'rejected').length;

      if (failedCount > 0) {
        alert(`${failedCount}건은 복구에 실패했습니다.`);
      }

      await reload();
    } catch (error) {
      console.error(error);
      alert(error.message || '선택 복구에 실패했습니다.');
    } finally {
      setActionLoadingKey('');
    }
  };

  return (
    <AdminLayout
      title="의뢰글 게시판관리"
      description="변호사 매칭 의뢰글과 입찰 의견을 조회하고, 신고가 누적된 항목을 강제마감·삭제·복구합니다."
      user={user}
      onLogout={onLogout}
    >
      <section className="ad-section">
        <div className="ad-toolbar">
          <div className="ad-tag-group">
            <button
              className={`ad-tag${tab === 'all' ? ' ad-tag--active' : ''}`}
              onClick={() => handleChangeTab('all')}
            >
              {TAB_LABEL.all}
            </button>

            <button
              className={`ad-tag${tab === 'reportedPosts' ? ' ad-tag--active' : ''}`}
              onClick={() => handleChangeTab('reportedPosts')}
            >
              신고된 의뢰글 ({reportedPostCount})
            </button>

            <button
              className={`ad-tag${tab === 'reportedBids' ? ' ad-tag--active' : ''}`}
              onClick={() => handleChangeTab('reportedBids')}
            >
              신고된 입찰 의견 ({reportedBidCount})
            </button>
          </div>
        </div>

        <div className="ad-toolbar">
          <select
            className="ad-select"
            value={deletedStatus}
            onChange={(event) => {
              setDeletedStatus(event.target.value);
              setPage(1);
              setSelectedIds(new Set());
            }}
          >
            {DELETED_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            className="ad-select"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
              setSelectedIds(new Set());
            }}
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <div className="ad-search">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>

            <input
              placeholder={isBidTab ? '의뢰글, 입찰 메시지, 변호사 검색' : '제목, 의뢰인 검색'}
              value={keyword}
              onChange={(event) => {
                setKeyword(event.target.value);
                setPage(1);
                setSelectedIds(new Set());
              }}
            />
          </div>

          <span className="ad-toolbar__count">
            총 {total}건
          </span>

          <div className="ad-bulk-actions">
            <span className="ad-bulk-actions__count">
              선택 {selectedIds.size}건
            </span>

            {!isBidTab && (
              <Button
                variant="outline"
                size="xs"
                disabled={hasActionLoading || closableSelectedPosts.length === 0}
                onClick={handleBulkClose}
              >
                선택 마감
              </Button>
            )}

            <Button
              variant="danger-solid"
              size="xs"
              disabled={hasActionLoading || deletableSelectedItems.length === 0}
              onClick={handleBulkDelete}
            >
              선택 삭제
            </Button>

            <Button
              variant="outline"
              size="xs"
              disabled={hasActionLoading || restorableSelectedItems.length === 0}
              onClick={handleBulkRestore}
            >
              선택 복구
            </Button>
          </div>
        </div>

        {errorMessage && (
          <div className="ad-empty">
            {errorMessage}
          </div>
        )}

        {loading ? (
          <div className="ad-empty">목록을 불러오는 중입니다.</div>
        ) : isBidTab ? (
          <div className="ad-table-wrap">
            <div className="ad-table ad-table--match-bids ad-table--selectable">
              <div className="ad-table__head">
                <span className="ad-table__check">
                  <input
                    type="checkbox"
                    className="ad-checkbox"
                    checked={isAllVisibleSelected}
                    disabled={contents.length === 0}
                    onChange={toggleAllVisible}
                  />
                </span>
                <span>No</span>
                <span>원본 의뢰글</span>
                <span>작성자</span>
                <span>내용</span>
                <span>상태</span>
                <span>신고수</span>
                <span>작성일</span>
                <span>관리</span>
              </div>

              {contents.length === 0 ? (
                <div className="ad-empty">조건에 맞는 입찰 의견이 없습니다.</div>
              ) : (
                contents.map((bid) => {
                  const isDeleted = Number(bid.deleted) === 0;
                  const id = bid.bidId;
                  const loadingKey = isDeleted
                    ? `bid-restore-${id}`
                    : `bid-delete-${id}`;

                  return (
                    <div className="ad-table__row" key={id}>
                      <div className="ad-table__check">
                        <input
                          type="checkbox"
                          className="ad-checkbox"
                          checked={selectedIds.has(id)}
                          onChange={() => toggleSelected(id)}
                        />
                      </div>

                      <div className="ad-table__cell-muted">{id}</div>
                      <div className="ad-table__cell-strong">{bid.matchTitle || '-'}</div>
                      <div>{getAuthorLabel(bid)}</div>
                      <div className="ad-table__cell-muted">{bid.content}</div>
                      <div>{getStatusBadge(bid.status, bid.deleted)}</div>
                      <div>
                        {bid.reportCount > 0
                          ? <Badge type="rejected">{bid.reportCount}건</Badge>
                          : <span className="ad-table__cell-muted">0건</span>}
                      </div>
                      <div className="ad-table__cell-muted">{formatDate(bid.createdAt)}</div>
                      <div className="ad-table__actions">
                        {isDeleted ? (
                          <Button
                            variant="outline"
                            size="xs"
                            disabled={actionLoadingKey === loadingKey || actionLoadingKey === 'bulk-restore'}
                            onClick={() => handleRestoreBid(id)}
                          >
                            복구
                          </Button>
                        ) : (
                          <Button
                            variant="danger-solid"
                            size="xs"
                            disabled={actionLoadingKey === loadingKey || actionLoadingKey === 'bulk-delete'}
                            onClick={() => handleDeleteBid(id)}
                          >
                            삭제
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          <div className="ad-table-wrap">
            <div className="ad-table ad-table--match-posts ad-table--selectable">
              <div className="ad-table__head">
                <span className="ad-table__check">
                  <input
                    type="checkbox"
                    className="ad-checkbox"
                    checked={isAllVisibleSelected}
                    disabled={contents.length === 0}
                    onChange={toggleAllVisible}
                  />
                </span>
                <span>No</span>
                <span>제목</span>
                <span>의뢰인</span>
                <span>유형</span>
                <span>상태</span>
                <span>입찰</span>
                <span>신고수</span>
                <span>작성일</span>
                <span>관리</span>
              </div>

              {contents.length === 0 ? (
                <div className="ad-empty">조건에 맞는 의뢰글이 없습니다.</div>
              ) : (
                contents.map((post) => {
                  const isDeleted = Number(post.deleted) === 0;
                  const id = post.matchId;
                  const canClose = !isDeleted && !isClosedOrCancelled(post.status);

                  return (
                    <div className="ad-table__row" key={id}>
                      <div className="ad-table__check">
                        <input
                          type="checkbox"
                          className="ad-checkbox"
                          checked={selectedIds.has(id)}
                          onChange={() => toggleSelected(id)}
                        />
                      </div>

                      <div className="ad-table__cell-muted">{id}</div>
                      <div className="ad-table__cell-strong">{post.title}</div>
                      <div>{getAuthorLabel(post)}</div>
                      <div>{getMatchTypeLabel(post.matchType)}</div>
                      <div>{getStatusBadge(post.status, post.deleted)}</div>
                      <div>{post.bidCount ?? 0}</div>
                      <div>
                        {post.reportCount > 0
                          ? <Badge type="rejected">{post.reportCount}건</Badge>
                          : <span className="ad-table__cell-muted">0건</span>}
                      </div>
                      <div className="ad-table__cell-muted">{formatDate(post.createdAt)}</div>
                      <div className="ad-table__actions">
                        {isDeleted ? (
                          <Button
                            variant="outline"
                            size="xs"
                            disabled={actionLoadingKey === `post-restore-${id}` || actionLoadingKey === 'bulk-restore'}
                            onClick={() => handleRestorePost(id)}
                          >
                            복구
                          </Button>
                        ) : (
                          <>
                            {canClose && (
                              <Button
                                variant="outline"
                                size="xs"
                                disabled={actionLoadingKey === `post-close-${id}` || actionLoadingKey === 'bulk-close'}
                                onClick={() => handleClosePost(id)}
                              >
                                마감
                              </Button>
                            )}

                            <Button
                              variant="danger-solid"
                              size="xs"
                              disabled={actionLoadingKey === `post-delete-${id}` || actionLoadingKey === 'bulk-delete'}
                              onClick={() => handleDeletePost(id)}
                            >
                              삭제
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        <div className="ad-pagination-wrap">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={(nextPage) => {
              setPage(nextPage);
              setSelectedIds(new Set());
            }}
          />
        </div>
      </section>
    </AdminLayout>
  );
}