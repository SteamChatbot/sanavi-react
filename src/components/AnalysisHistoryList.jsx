import React from 'react';
import { Link } from 'react-router-dom';
import Button from './Button';
import Pagination from './Pagination';

// 날짜 포맷: ISO 문자열 → "YYYY.MM.DD"
function formatDate(isoString) {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}.${m}.${day}`;
  } catch {
    return '';
  }
}

function scoreColor(s) {
  if (s >= 75) return '#10b981';
  if (s >= 50) return '#f59e0b';
  return '#ef4444';
}

//AnalysisHistoryList 분석 이력 목록 컴포넌트 — MyPage 분석 이력 탭에 사용
//INPUT: items(AnalysisHistoryItemDto[] - id,disease,job,baseScore,createdAt), loading(로딩여부), page(현재페이지), totalPages(전체페이지수), onPageChange(페이지변경콜백), onDelete(삭제콜백 - id)
export default function AnalysisHistoryList({
  items = [],
  loading = false,
  page = 1,
  totalPages = 1,
  onPageChange,
  onDelete,
}) {
  if (loading) {
    return <div className="mp-empty">불러오는 중...</div>;
  }

  if (items.length === 0) {
    return <div className="mp-empty">분석 이력이 없습니다.</div>;
  }

  return (
    <div className="mp-list">
      {items.map(h => (
        <div key={h.id} className="mp-history-row">
          <div className="mp-history-score" style={{ color: scoreColor(Math.round(h.baseScore)) }}>
            {Math.round(h.baseScore)}%
          </div>
          <div className="mp-history-info">
            <div className="mp-history-disease">{h.disease}</div>
            <div className="mp-history-meta">{h.job} · {formatDate(h.createdAt)}</div>
          </div>
          <div className="mp-history-actions">
            <Link to={`/analysis/${h.id}`}>
              <Button variant="outline" size="xs">상세보기</Button>
            </Link>
            <Button variant="danger" size="xs" onClick={() => onDelete?.(h.id)}>삭제</Button>
          </div>
        </div>
      ))}
      <Pagination currentPage={page} totalPages={totalPages} onPageChange={onPageChange} />
    </div>
  );
}
