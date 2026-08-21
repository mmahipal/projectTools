import React from 'react';
import './FilterBuilder.css';

const DateRangePicker = ({ value, onChange }) => {
  const handleFromChange = (e) => {
    onChange({
      ...value,
      from: e.target.value
    });
  };

  const handleToChange = (e) => {
    onChange({
      ...value,
      to: e.target.value
    });
  };

  return (
    <div className="date-range-picker">
      <input
        type="date"
        value={value?.from || ''}
        onChange={handleFromChange}
        placeholder="From date"
        className="date-range-input"
      />
      <span className="date-range-separator">to</span>
      <input
        type="date"
        value={value?.to || ''}
        onChange={handleToChange}
        placeholder="To date"
        className="date-range-input"
      />
    </div>
  );
};

export default DateRangePicker;

