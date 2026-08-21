import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const STATUS_COLORS = {
  'Matched': '#08979C',
  'Qualified': '#13C2C2',
  'Active': '#36CFC9',
  'Removed': '#5CDBD3'
};

const ProjectRosterFunnelChart = ({ data }) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="no-data-message" style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
        <p>No Project Objectives with contributor data found for this project.</p>
      </div>
    );
  }

  // Prepare chart data - only show Matched, Qualified, Active, and Removed
  const chartData = data.map(item => ({
    name: item.name || 'Unknown',
    Matched: item.Matched || 0,
    Qualified: item.Qualified || 0,
    Active: item.Active || 0,
    Removed: item.Removed || 0
  }));

  // Calculate chart height based on number of items
  const itemHeight = 40;
  const minHeight = 300;
  const maxHeight = 800;
  const chartHeight = Math.min(Math.max(minHeight, chartData.length * itemHeight), maxHeight);

  return (
    <div className="project-roster-funnel-chart-container">
      <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '600', color: '#002329', fontFamily: 'Poppins' }}>
        Project Roster Funnel
      </h3>
      <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: `${maxHeight}px` }}>
        <ResponsiveContainer width="100%" height={chartHeight} minHeight={minHeight}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
            <XAxis 
              type="number"
              tick={{ fontSize: 12, fill: '#374151', fontWeight: 500 }}
              label={{ value: 'Record Count', position: 'insideBottom', offset: -10, style: { fontSize: 13, fontWeight: 600 } }}
            />
            <YAxis 
              type="category"
              dataKey="name"
              width={250}
              tick={{ fontSize: 11, fill: '#1f2937', fontWeight: 500 }}
              dx={-8}
              angle={0}
              textAnchor="end"
              interval={0}
              label={{ value: 'Project Objective: Project Objective Name', angle: -90, position: 'insideLeft', style: { fontSize: 12, fontWeight: 600 } }}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const total = payload.reduce((sum, entry) => sum + (entry.value || 0), 0);
                  return (
                    <div style={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '8px', 
                      padding: '12px',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                    }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>{label}</div>
                      <div style={{ fontSize: '12px', marginBottom: '8px', color: '#6b7280' }}>Total: {total.toLocaleString()}</div>
                      {payload.map((entry, idx) => (
                        <div key={idx} style={{ fontSize: '12px', marginTop: '4px', display: 'flex', alignItems: 'center' }}>
                          <span style={{ 
                            color: entry.color, 
                            marginRight: '6px',
                            fontSize: '16px'
                          }}>●</span>
                          <span style={{ marginRight: '8px', minWidth: '80px' }}>{entry.name}:</span>
                          <span style={{ fontWeight: '600' }}>{entry.value?.toLocaleString() || 0}</span>
                        </div>
                      ))}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              formatter={(value) => <span style={{ fontSize: '12px', fontFamily: 'Poppins' }}>{value}</span>}
            />
            <Bar dataKey="Matched" stackId="a" fill={STATUS_COLORS.Matched} name="Matched" />
            <Bar dataKey="Qualified" stackId="a" fill={STATUS_COLORS.Qualified} name="Qualified" />
            <Bar dataKey="Active" stackId="a" fill={STATUS_COLORS.Active} name="Active" />
            <Bar dataKey="Removed" stackId="a" fill={STATUS_COLORS.Removed} name="Removed" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ProjectRosterFunnelChart;

