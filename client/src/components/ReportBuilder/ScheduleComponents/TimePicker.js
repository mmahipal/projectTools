import React from 'react';
import './ScheduleComponents.css';

const TimePicker = ({ value, onChange }) => {
  const [hours, minutes] = value ? value.split(':') : ['09', '00'];

  const handleHoursChange = (e) => {
    const newHours = e.target.value.padStart(2, '0');
    onChange(`${newHours}:${minutes}`);
  };

  const handleMinutesChange = (e) => {
    const newMinutes = e.target.value.padStart(2, '0');
    onChange(`${hours}:${newMinutes}`);
  };

  return (
    <div className="time-picker">
      <select
        value={hours}
        onChange={handleHoursChange}
        className="time-picker-select"
      >
        {Array.from({ length: 24 }, (_, i) => {
          const hour = i.toString().padStart(2, '0');
          return (
            <option key={hour} value={hour}>
              {hour}
            </option>
          );
        })}
      </select>
      <span className="time-picker-separator">:</span>
      <select
        value={minutes}
        onChange={handleMinutesChange}
        className="time-picker-select"
      >
        {[0, 15, 30, 45].map(min => {
          const minute = min.toString().padStart(2, '0');
          return (
            <option key={minute} value={minute}>
              {minute}
            </option>
          );
        })}
      </select>
    </div>
  );
};

export default TimePicker;

