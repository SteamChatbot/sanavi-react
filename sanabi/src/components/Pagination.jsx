import React from 'react';
import './Pagination.css';

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  return (
    <div className="pagination" role="navigation" aria-label="페이지 탐색">
      <button
        className="pagination__btn"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="이전"
      >‹</button>
      {pages.map(p => (
        <button
          key={p}
          className={['pagination__btn', p === currentPage ? 'pagination__btn--active' : ''].filter(Boolean).join(' ')}
          onClick={() => onPageChange(p)}
          aria-current={p === currentPage ? 'page' : undefined}
        >{p}</button>
      ))}
      <button
        className="pagination__btn"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="다음"
      >›</button>
    </div>
  );
}
