import React from 'react';
import { Target, CheckCircle, XCircle, TrendingUp, Info } from 'lucide-react';

const ProjectCoverageAnalytics = ({ data }) => {
  if (!data) return null;

  const { totalRequired, withAccounts, withoutAccounts, coveragePercentage, projectsWithoutAccounts } = data;

  return (
    <div style={{ 
      marginBottom: '32px',
      padding: '20px',
      background: '#fff',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ 
          fontSize: '18px', 
          fontWeight: '600', 
          marginBottom: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Target size={20} color="#0176d3" />
          Contributor Project Coverage
        </h3>
        <div style={{ 
          display: 'flex', 
          alignItems: 'flex-start', 
          gap: '8px',
          padding: '10px 12px',
          background: '#f0f9ff',
          borderRadius: '6px',
          border: '1px solid #bae6fd',
          fontSize: '13px',
          color: '#666',
          lineHeight: '1.5'
        }}>
          <Info size={16} color="#0176d3" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong>What this measures:</strong> This shows how many Contributor Projects that <strong>require</strong> a Client Tool Account actually have one assigned. 
            Coverage = (Projects with accounts assigned) ÷ (Total projects requiring accounts) × 100%
          </div>
        </div>
      </div>

      {/* Coverage Summary */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{ 
          padding: '16px', 
          background: '#f0f9ff', 
          borderRadius: '8px',
          border: '1px solid #bae6fd'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Target size={20} color="#0176d3" />
            <span style={{ fontSize: '14px', fontWeight: '500', color: '#666' }}>Projects Requiring Accounts</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '600', color: '#0176d3' }}>
            {totalRequired}
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            Contributor Projects that need Client Tool Accounts
          </div>
        </div>

        <div style={{ 
          padding: '16px', 
          background: '#f0fdf4', 
          borderRadius: '8px',
          border: '1px solid #bbf7d0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <CheckCircle size={20} color="#059669" />
            <span style={{ fontSize: '14px', fontWeight: '500', color: '#666' }}>Assigned</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '600', color: '#059669' }}>
            {withAccounts}
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            Have Client Tool Account assigned
          </div>
        </div>

        <div style={{ 
          padding: '16px', 
          background: '#fef2f2', 
          borderRadius: '8px',
          border: '1px solid #fecaca'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <XCircle size={20} color="#dc2626" />
            <span style={{ fontSize: '14px', fontWeight: '500', color: '#666' }}>Unassigned</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '600', color: '#dc2626' }}>
            {withoutAccounts}
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            Missing Client Tool Account
          </div>
        </div>

        <div style={{ 
          padding: '16px', 
          background: '#fffbeb', 
          borderRadius: '8px',
          border: '1px solid #fde68a'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <TrendingUp size={20} color="#d97706" />
            <span style={{ fontSize: '14px', fontWeight: '500', color: '#666' }}>Coverage Rate</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '600', color: '#d97706' }}>
            {coveragePercentage}%
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            {coveragePercentage >= 80 ? 'Excellent' : coveragePercentage >= 50 ? 'Good' : 'Needs Improvement'}
          </div>
        </div>
      </div>

      {/* Coverage Progress Bar */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '8px'
        }}>
          <span style={{ fontSize: '14px', fontWeight: '500' }}>Coverage Progress</span>
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#0176d3' }}>
            {coveragePercentage}%
          </span>
        </div>
        <div style={{ 
          width: '100%', 
          height: '24px', 
          background: '#e5e7eb', 
          borderRadius: '12px',
          overflow: 'hidden'
        }}>
          <div style={{ 
            width: `${coveragePercentage}%`, 
            height: '100%', 
            background: coveragePercentage >= 80 ? '#059669' : coveragePercentage >= 50 ? '#d97706' : '#dc2626',
            transition: 'width 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '12px',
            fontWeight: '600'
          }}>
            {coveragePercentage > 10 && `${coveragePercentage}%`}
          </div>
        </div>
      </div>

      {/* Projects Without Accounts */}
      {projectsWithoutAccounts && projectsWithoutAccounts.length > 0 && (
        <div>
          <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
            Contributor Projects Missing Client Tool Accounts
          </h4>
          <p style={{ fontSize: '13px', color: '#666', marginBottom: '12px' }}>
            These {projectsWithoutAccounts.length} Contributor Project{projectsWithoutAccounts.length !== 1 ? 's' : ''} require a Client Tool Account but don't have one assigned yet.
            {projectsWithoutAccounts.length >= 100 && ' (Showing first 100)'}
          </p>
          <div style={{ 
            maxHeight: '300px', 
            overflowY: 'auto',
            border: '1px solid #e5e7eb',
            borderRadius: '6px'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f9fafb', position: 'sticky', top: 0 }}>
                <tr>
                  <th style={{ 
                    padding: '10px 12px', 
                    textAlign: 'left', 
                    fontSize: '12px', 
                    fontWeight: '600',
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    Contributor Project Name
                  </th>
                </tr>
              </thead>
              <tbody>
                {projectsWithoutAccounts.map((project) => (
                  <tr key={project.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '10px 12px', fontSize: '13px' }}>
                      {project.name}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectCoverageAnalytics;

