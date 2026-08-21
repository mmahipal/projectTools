import React from 'react';
import TimePicker from './ScheduleComponents/TimePicker';
import TimezoneSelector from './ScheduleComponents/TimezoneSelector';

const EnhancedScheduleOptions = ({ schedule, scheduleConfig, onScheduleChange, onConfigChange }) => {
  const config = scheduleConfig || {
    time: '09:00',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    daysOfWeek: [],
    dayOfMonth: 1
  };

  const handleConfigChange = (updates) => {
    onConfigChange({ ...config, ...updates });
  };

  const toggleDayOfWeek = (day) => {
    const days = config.daysOfWeek || [];
    const newDays = days.includes(day)
      ? days.filter(d => d !== day)
      : [...days, day].sort();
    handleConfigChange({ daysOfWeek: newDays });
  };

  const weekDays = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Schedule Frequency, Time, and Timezone in a single row for Daily */}
      {schedule === 'daily' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr', gap: '12px', alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '4px' }}>
              Schedule Frequency *
            </label>
            <select
              value={schedule}
              onChange={(e) => {
                onScheduleChange(e.target.value);
                handleConfigChange({
                  time: '09:00',
                  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                  daysOfWeek: [],
                  dayOfMonth: 1
                });
              }}
              style={{
                width: '100%',
                padding: '6px 10px',
                border: '1px solid #d9d9d9',
                borderRadius: '4px',
                fontSize: '12px',
                background: '#fff'
              }}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '4px' }}>
              Time *
            </label>
            <TimePicker
              value={config.time || '09:00'}
              onChange={(time) => handleConfigChange({ time })}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '4px' }}>
              Timezone *
            </label>
            <TimezoneSelector
              value={config.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone}
              onChange={(tz) => handleConfigChange({ timezone: tz })}
            />
          </div>
        </div>
      )}

      {/* Weekly: Schedule + Day(s) in first row, Time + Timezone in second row */}
      {schedule === 'weekly' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px', alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '4px' }}>
                Schedule Frequency *
              </label>
              <select
                value={schedule}
                onChange={(e) => {
                  onScheduleChange(e.target.value);
                  handleConfigChange({
                    time: '09:00',
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    daysOfWeek: [],
                    dayOfMonth: 1
                  });
                }}
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px',
                  fontSize: '12px',
                  background: '#fff'
                }}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '4px' }}>
                Day(s) of Week * (Select one or more)
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {weekDays.map(day => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDayOfWeek(day.value)}
                    style={{
                      padding: '4px 10px',
                      border: `1px solid ${(config.daysOfWeek || []).includes(day.value) ? '#08979C' : '#d9d9d9'}`,
                      borderRadius: '4px',
                      fontSize: '11px',
                      background: (config.daysOfWeek || []).includes(day.value) ? '#08979C' : '#fff',
                      color: (config.daysOfWeek || []).includes(day.value) ? '#fff' : '#666',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      fontFamily: 'Poppins',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {day.label.substring(0, 3)}
                  </button>
                ))}
              </div>
              {(config.daysOfWeek || []).length === 0 && (
                <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>
                  Please select at least one day
                </div>
              )}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '12px', alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '4px' }}>
                Time *
              </label>
              <TimePicker
                value={config.time || '09:00'}
                onChange={(time) => handleConfigChange({ time })}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '4px' }}>
                Timezone *
              </label>
              <TimezoneSelector
                value={config.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone}
                onChange={(tz) => handleConfigChange({ timezone: tz })}
              />
            </div>
          </div>
        </>
      )}

      {/* Monthly: Schedule + Day of Month in first row, Time + Timezone in second row */}
      {schedule === 'monthly' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '4px' }}>
                Schedule Frequency *
              </label>
              <select
                value={schedule}
                onChange={(e) => {
                  onScheduleChange(e.target.value);
                  handleConfigChange({
                    time: '09:00',
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    daysOfWeek: [],
                    dayOfMonth: 1
                  });
                }}
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px',
                  fontSize: '12px',
                  background: '#fff'
                }}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '4px' }}>
                Day of Month *
              </label>
              <select
                value={config.dayOfMonth || 1}
                onChange={(e) => handleConfigChange({ dayOfMonth: parseInt(e.target.value) })}
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px',
                  fontSize: '12px',
                  background: '#fff'
                }}
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '12px', alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '4px' }}>
                Time *
              </label>
              <TimePicker
                value={config.time || '09:00'}
                onChange={(time) => handleConfigChange({ time })}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '4px' }}>
                Timezone *
              </label>
              <TimezoneSelector
                value={config.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone}
                onChange={(tz) => handleConfigChange({ timezone: tz })}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default EnhancedScheduleOptions;

