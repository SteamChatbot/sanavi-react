// 게시판관리 — 전체 게시글/댓글 조회, 신고 필터, 삭제/복구, 선택 일괄 처리
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Pagination from '../../components/Pagination';
import {
  deleteAdminBoardComment,
  deleteAdminBoardPost,
  getAdminBoardComments,
  getAdminBoardPosts,
  restoreAdminBoardComment,
  restoreAdminBoardPost,
} from '../../api/adminBoardApi';

import AdminLayout from './AdminLayout';
import './AdminPage.css';

const PAGE_SIZE = 10;

const TAB_LABEL = {
  all: '전체글',
  reportedPosts: '신고된 글',
  reportedComments: '신고된 댓글',
};

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: '정상' },
  { value: 'DELETED', label: '삭제됨' },
  { value: 'ALL', label: '전체' },
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

function getStatusBadge(deleted) {
  return Number(deleted) === 0
    ? <Badge type="rejected">삭제됨</Badge>
    : <Badge type="ok">정상</Badge>;
}

export default function AdminBoardPage({ user, onLogout }) {
  const [tab, setTab] = useState('all');
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [page, setPage] = useState(1);

  const [pageData, setPageData] = useState({
    contents: [],
    page: 1,
    size: PAGE_SIZE,
    totalElements: 0,
    totalPages: 0,
  });

  const [reportedPostCount, setReportedPostCount] = useState(0);
  const [reportedCommentCount, setReportedCommentCount] = useState(0);

  const [selectedIds, setSelectedIds] = useState(new Set());

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [actionLoadingKey, setActionLoadingKey] = useState('');

  const isCommentTab = tab === 'reportedComments';

  const contents = pageData.contents ?? [];
  const total = pageData.totalElements ?? 0;
  const totalPages = Math.max(1, pageData.totalPages ?? 0);

  const listParams = useMemo(
    () => ({
      page,
      size: PAGE_SIZE,
      keyword,
      status,
      reportedOnly: tab === 'reportedPosts' || tab === 'reportedComments',
    }),
    [page, keyword, status, tab]
  );

  const getItemId = useCallback(
    (item) => (isCommentTab ? item.commentId : item.boardId),
    [isCommentTab]
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

  const isAllVisibleSelected = contents.length > 0
    && contents.every((item) => selectedIds.has(getItemId(item)));

  const hasActionLoading = Boolean(actionLoadingKey);

  const fetchSummaryCounts = useCallback(async () => {
    try {
      const [postSummary, commentSummary] = await Promise.all([
        getAdminBoardPosts({
          page: 1,
          size: 1,
          status: 'ALL',
          reportedOnly: true,
        }),
        getAdminBoardComments({
          page: 1,
          size: 1,
          status: 'ALL',
          reportedOnly: true,
        }),
      ]);

      setReportedPostCount(postSummary.totalElements ?? 0);
      setReportedCommentCount(commentSummary.totalElements ?? 0);
    } catch (error) {
      console.error(error);
    }
  }, []);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      const response = isCommentTab
        ? await getAdminBoardComments(listParams)
        : await getAdminBoardPosts(listParams);

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
      setErrorMessage(error.message || '게시판관리 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [isCommentTab, listParams, page]);

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

  const handleDeletePost = async (boardId) => {
    if (!window.confirm(`게시글 #${boardId} 를 삭제하시겠습니까?`)) return;

    setActionLoadingKey(`post-delete-${boardId}`);

    try {
      await deleteAdminBoardPost(boardId);
      await reload();
    } catch (error) {
      console.error(error);
      alert(error.message || '게시글 삭제에 실패했습니다.');
    } finally {
      setActionLoadingKey('');
    }
  };

  const handleRestorePost = async (boardId) => {
    if (!window.confirm(`게시글 #${boardId} 를 복구하시겠습니까?`)) return;

    setActionLoadingKey(`post-restore-${boardId}`);

    try {
      await restoreAdminBoardPost(boardId);
      await reload();
    } catch (error) {
      console.error(error);
      alert(error.message || '게시글 복구에 실패했습니다.');
    } finally {
      setActionLoadingKey('');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm(`댓글 #${commentId} 를 삭제하시겠습니까?`)) return;

    setActionLoadingKey(`comment-delete-${commentId}`);

    try {
      await deleteAdminBoardComment(commentId);
      await reload();
    } catch (error) {
      console.error(error);
      alert(error.message || '댓글 삭제에 실패했습니다.');
    } finally {
      setActionLoadingKey('');
    }
  };

  const handleRestoreComment = async (commentId) => {
    if (!window.confirm(`댓글 #${commentId} 를 복구하시겠습니까?`)) return;

    setActionLoadingKey(`comment-restore-${commentId}`);

    try {
      await restoreAdminBoardComment(commentId);
      await reload();
    } catch (error) {
      console.error(error);
      alert(error.message || '댓글 복구에 실패했습니다.');
    } finally {
      setActionLoadingKey('');
    }
  };

  const handleBulkDelete = async () => {
    if (deletableSelectedItems.length === 0) {
      alert('삭제 가능한 항목이 없습니다.');
      return;
    }

    const targetLabel = isCommentTab ? '댓글' : '게시글';

    if (!window.confirm(`선택한 ${targetLabel} ${deletableSelectedItems.length}건을 삭제하시겠습니까?`)) {
      return;
    }

    setActionLoadingKey('bulk-delete');

    try {
      const results = await Promise.allSettled(
        deletableSelectedItems.map((item) => {
          const id = getItemId(item);
          return isCommentTab
            ? deleteAdminBoardComment(id)
            : deleteAdminBoardPost(id);
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

    const targetLabel = isCommentTab ? '댓글' : '게시글';

    if (!window.confirm(`선택한 ${targetLabel} ${restorableSelectedItems.length}건을 복구하시겠습니까?`)) {
      return;
    }

    setActionLoadingKey('bulk-restore');

    try {
      const results = await Promise.allSettled(
        restorableSelectedItems.map((item) => {
          const id = getItemId(item);
          return isCommentTab
            ? restoreAdminBoardComment(id)
            : restoreAdminBoardPost(id);
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
      title="게시판관리"
      description="전체 게시글을 조회·검색하고, 신고가 누적된 게시글·댓글을 우선 확인하여 삭제·복구합니다."
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
              신고된 글 ({reportedPostCount})
            </button>

            <button
              className={`ad-tag${tab === 'reportedComments' ? ' ad-tag--active' : ''}`}
              onClick={() => handleChangeTab('reportedComments')}
            >
              신고된 댓글 ({reportedCommentCount})
            </button>
          </div>
        </div>

        <div className="ad-toolbar">
          <select
            className="ad-select"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
              setSelectedIds(new Set());
            }}
          >
            {STATUS_OPTIONS.map((option) => (
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
              placeholder={isCommentTab ? '댓글 내용, 작성자, 원본 게시글 검색' : '제목, 작성자 검색'}
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
        ) : isCommentTab ? (
          <div className="ad-table-wrap">
            <div className="ad-table ad-table--comments ad-table--selectable">
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
                <span>원본 게시글</span>
                <span>작성자</span>
                <span>내용</span>
                <span>상태</span>
                <span>신고수</span>
                <span>작성일</span>
                <span>관리</span>
              </div>

              {contents.length === 0 ? (
                <div className="ad-empty">조건에 맞는 댓글이 없습니다.</div>
              ) : (
                contents.map((comment) => {
                  const isDeleted = Number(comment.deleted) === 0;
                  const id = comment.commentId;
                  const loadingKey = isDeleted
                    ? `comment-restore-${id}`
                    : `comment-delete-${id}`;

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
                      <div className="ad-table__cell-strong">{comment.boardTitle || '-'}</div>
                      <div>{getAuthorLabel(comment)}</div>
                      <div className="ad-table__cell-muted">{comment.content}</div>
                      <div>{getStatusBadge(comment.deleted)}</div>
                      <div>
                        {comment.reportCount > 0
                          ? <Badge type="rejected">{comment.reportCount}건</Badge>
                          : <span className="ad-table__cell-muted">0건</span>}
                      </div>
                      <div className="ad-table__cell-muted">{formatDate(comment.createdAt)}</div>
                      <div className="ad-table__actions">
                        {isDeleted ? (
                          <Button
                            variant="outline"
                            size="xs"
                            disabled={actionLoadingKey === loadingKey || actionLoadingKey === 'bulk-restore'}
                            onClick={() => handleRestoreComment(id)}
                          >
                            복구
                          </Button>
                        ) : (
                          <Button
                            variant="danger-solid"
                            size="xs"
                            disabled={actionLoadingKey === loadingKey || actionLoadingKey === 'bulk-delete'}
                            onClick={() => handleDeleteComment(id)}
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
            <div className="ad-table ad-table--board ad-table--selectable">
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
                <span>작성자</span>
                <span>작성일</span>
                <span>조회수</span>
                <span>상태</span>
                <span>신고수</span>
                <span>관리</span>
              </div>

              {contents.length === 0 ? (
                <div className="ad-empty">조건에 맞는 게시글이 없습니다.</div>
              ) : (
                contents.map((post) => {
                  const isDeleted = Number(post.deleted) === 0;
                  const id = post.boardId;
                  const loadingKey = isDeleted
                    ? `post-restore-${id}`
                    : `post-delete-${id}`;

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
                      <div className="ad-table__cell-muted">{formatDate(post.createdAt)}</div>
                      <div>{post.viewCount ?? 0}</div>
                      <div>{getStatusBadge(post.deleted)}</div>
                      <div>
                        {post.reportCount > 0
                          ? <Badge type="rejected">{post.reportCount}건</Badge>
                          : <span className="ad-table__cell-muted">0건</span>}
                      </div>
                      <div className="ad-table__actions">
                        {isDeleted ? (
                          <Button
                            variant="outline"
                            size="xs"
                            disabled={actionLoadingKey === loadingKey || actionLoadingKey === 'bulk-restore'}
                            onClick={() => handleRestorePost(id)}
                          >
                            복구
                          </Button>
                        ) : (
                          <Button
                            variant="danger-solid"
                            size="xs"
                            disabled={actionLoadingKey === loadingKey || actionLoadingKey === 'bulk-delete'}
                            onClick={() => handleDeletePost(id)}
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