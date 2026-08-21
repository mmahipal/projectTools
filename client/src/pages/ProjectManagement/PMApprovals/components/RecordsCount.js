import React from 'react';
import { Loader } from 'lucide-react';
import './RecordsCount.css';

const RecordsCount = ({ count, total, duplicates, loading, isLoadingMore }) => {
  const formatNumber = (num) => {
    if (num === null || num === undefined || isNaN(num)) return '0';
    const numValue = typeof num === 'number' ? num : parseInt(num, 10);
    if (isNaN(numValue)) return '0';
    return new Intl.NumberFormat('en-US').format(numValue);
  };

  // Ensure all values are numbers
  const countNum = typeof count === 'number' ? count : (parseInt(count, 10) || 0);

  // Display unique count as the main total
  const displayText = formatNumber(countNum);

  return (
    <div className="records-count">
      <div className="records-count-label">No. of records</div>
      <div className="records-count-value-container">
        <div className="records-count-value">
          {displayText}
          {isLoadingMore && (
            <Loader className="records-count-loader spinning" size={14} />
          )}
        </div>
      </div>
    </div>
  );
};

export default RecordsCount;

