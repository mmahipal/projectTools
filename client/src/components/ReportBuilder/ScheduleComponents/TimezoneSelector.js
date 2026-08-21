import React from 'react';
import { Globe } from 'lucide-react';
import './ScheduleComponents.css';

// Common timezones
const TIMEZONES = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'America/New_York (EST/EDT)' },
  { value: 'America/Chicago', label: 'America/Chicago (CST/CDT)' },
  { value: 'America/Denver', label: 'America/Denver (MST/MDT)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST/PDT)' },
  { value: 'Europe/London', label: 'Europe/London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Europe/Paris (CET/CEST)' },
  { value: 'Europe/Berlin', label: 'Europe/Berlin (CET/CEST)' },
  { value: 'Asia/Dubai', label: 'Asia/Dubai (GST)' },
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST)' },
  { value: 'Asia/Shanghai', label: 'Asia/Shanghai (CST)' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST)' },
  { value: 'Australia/Sydney', label: 'Australia/Sydney (AEDT/AEST)' }
];

const TimezoneSelector = ({ value, onChange }) => {
  const currentTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const timezones = [
    { value: currentTz, label: `Local (${currentTz})` },
    ...TIMEZONES.filter(tz => tz.value !== currentTz)
  ];

  return (
    <div className="timezone-selector">
      <Globe size={14} className="timezone-icon" />
      <select
        value={value || currentTz}
        onChange={(e) => onChange(e.target.value)}
        className="timezone-select"
      >
        {timezones.map(tz => (
          <option key={tz.value} value={tz.value}>
            {tz.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default TimezoneSelector;

