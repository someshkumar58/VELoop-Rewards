import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './Pagination.module.css';

const Pagination = ({
  currentPage = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
  className = '',
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  if (totalPages <= 1) return null;

  const handlePrev = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  // Generate page numbers
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push(i);
  }

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className={`${styles.paginationContainer} ${className}`}>
      <div className={styles.rangeText}>
        Showing <strong>{startItem}</strong> - <strong>{endItem}</strong> of <strong>{totalItems}</strong> entries
      </div>

      <div className={styles.controls}>
        <button
          type="button"
          className={styles.pageBtn}
          onClick={handlePrev}
          disabled={currentPage === 1}
          aria-label="Previous Page"
        >
          <ChevronLeft size={16} />
        </button>

        {pages.map((p) => (
          <button
            key={p}
            type="button"
            className={`${styles.pageBtn} ${currentPage === p ? styles.active : ''}`}
            onClick={() => onPageChange(p)}
            aria-current={currentPage === p ? 'page' : undefined}
          >
            {p}
          </button>
        ))}

        <button
          type="button"
          className={styles.pageBtn}
          onClick={handleNext}
          disabled={currentPage === totalPages}
          aria-label="Next Page"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
