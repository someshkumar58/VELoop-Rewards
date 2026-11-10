import React from 'react';
import Skeleton from './Skeleton';
import EmptyState from './EmptyState';
import styles from './Table.module.css';

const Table = ({
  columns = [],
  data = [],
  loading = false,
  emptyMessage = 'No records found',
  emptyTitle,
  keyField = 'id',
  onRowClick = null,
  className = '',
}) => {
  const safeData = Array.isArray(data) ? data : [];

  return (
    <div className={`${styles.tableWrapper} ${className}`}>
      <table className="table table-hover align-middle mb-0">
        <thead>
          <tr>
            {columns.map((col, index) => (
              <th
                key={col.key || index}
                style={{ width: col.width, textAlign: col.align || 'left' }}
              >
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 5 }).map((_, rIdx) => (
              <tr key={`loading-row-${rIdx}`}>
                {columns.map((col, cIdx) => (
                  <td key={`loading-col-${cIdx}`}>
                    <Skeleton height="20px" width={col.skeletonWidth || '80%'} />
                  </td>
                ))}
              </tr>
            ))
          ) : safeData.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="text-center py-5">
                <EmptyState
                  title={emptyTitle || emptyMessage}
                  description="Try adjusting your filter or search query."
                />
              </td>
            </tr>
          ) : (
            safeData.map((row, rIdx) => (
              <tr
                key={row[keyField] || rIdx}
                onClick={() => onRowClick && onRowClick(row)}
                onKeyDown={(e) => {
                  if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    onRowClick(row);
                  }
                }}
                tabIndex={onRowClick ? 0 : undefined}
                role={onRowClick ? 'button' : undefined}
                className={onRowClick ? styles.clickableRow : ''}
              >
                {columns.map((col, cIdx) => (
                  <td
                    key={col.key || cIdx}
                    style={{ textAlign: col.align || 'left' }}
                  >
                    {col.render ? col.render(row[col.dataIndex], row, rIdx) : row[col.dataIndex]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
