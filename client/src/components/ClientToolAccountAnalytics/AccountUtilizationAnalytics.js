import React from 'react';
import { Users, Building2, BarChart3, Link as LinkIcon } from 'lucide-react';

const AccountUtilizationAnalytics = ({ data }) => {
  if (!data) return null;

  const { 
    totalAccounts, 
    assignedAccounts, 
    unassignedAccounts, 
    accountsWithMultipleProjects,
    accountsByTool,
    topContributors,
    topOrganizations,
    assignmentDistribution,
    utilizationRate
  } = data;

  return (
    <div style={{ 
      marginBottom: '32px',
      padding: '20px',
      background: '#fff',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <h3 style={{ 
        fontSize: '18px', 
        fontWeight: '600', 
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <BarChart3 size={20} color="#0176d3" />
        Account Utilization Analytics
      </h3>

      {/* Summary Cards */}
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
            <BarChart3 size={20} color="#0176d3" />
            <span style={{ fontSize: '14px', fontWeight: '500', color: '#666' }}>Total Accounts</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '600', color: '#0176d3' }}>
            {totalAccounts}
          </div>
        </div>

        <div style={{ 
          padding: '16px', 
          background: '#f0fdf4', 
          borderRadius: '8px',
          border: '1px solid #bbf7d0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <LinkIcon size={20} color="#059669" />
            <span style={{ fontSize: '14px', fontWeight: '500', color: '#666' }}>Assigned</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '600', color: '#059669' }}>
            {assignedAccounts}
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            {utilizationRate}% utilization
          </div>
        </div>

        <div style={{ 
          padding: '16px', 
          background: '#fef2f2', 
          borderRadius: '8px',
          border: '1px solid #fecaca'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <BarChart3 size={20} color="#dc2626" />
            <span style={{ fontSize: '14px', fontWeight: '500', color: '#666' }}>Unassigned</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '600', color: '#dc2626' }}>
            {unassignedAccounts}
          </div>
        </div>

        <div style={{ 
          padding: '16px', 
          background: '#fffbeb', 
          borderRadius: '8px',
          border: '1px solid #fde68a'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <LinkIcon size={20} color="#d97706" />
            <span style={{ fontSize: '14px', fontWeight: '500', color: '#666' }}>Multiple Projects</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '600', color: '#d97706' }}>
            {accountsWithMultipleProjects}
          </div>
        </div>
      </div>

      {/* Assignment Distribution */}
      <div style={{ marginBottom: '24px' }}>
        <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
          Assignment Distribution
        </h4>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
          gap: '12px' 
        }}>
          <div style={{ 
            padding: '12px', 
            background: '#f9fafb', 
            borderRadius: '6px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Unassigned</div>
            <div style={{ fontSize: '20px', fontWeight: '600' }}>{assignmentDistribution.unassigned}</div>
          </div>
          <div style={{ 
            padding: '12px', 
            background: '#f9fafb', 
            borderRadius: '6px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Single Project</div>
            <div style={{ fontSize: '20px', fontWeight: '600' }}>{assignmentDistribution.singleProject}</div>
          </div>
          <div style={{ 
            padding: '12px', 
            background: '#f9fafb', 
            borderRadius: '6px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Multiple Projects</div>
            <div style={{ fontSize: '20px', fontWeight: '600' }}>{assignmentDistribution.multipleProjects}</div>
          </div>
        </div>
      </div>

      {/* Two Column Layout for Top Contributors and Organizations */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '24px',
        marginBottom: '24px'
      }}>
        {/* Top Contributors */}
        {topContributors && topContributors.length > 0 && (
          <div>
            <h4 style={{ 
              fontSize: '16px', 
              fontWeight: '600', 
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Users size={18} color="#0176d3" />
              Top Contributors by Account Count
            </h4>
            <div style={{ 
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              overflow: 'hidden'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#f9fafb' }}>
                  <tr>
                    <th style={{ 
                      padding: '10px 12px', 
                      textAlign: 'left', 
                      fontSize: '12px', 
                      fontWeight: '600',
                      borderBottom: '1px solid #e5e7eb'
                    }}>
                      Contributor
                    </th>
                    <th style={{ 
                      padding: '10px 12px', 
                      textAlign: 'right', 
                      fontSize: '12px', 
                      fontWeight: '600',
                      borderBottom: '1px solid #e5e7eb'
                    }}>
                      Accounts
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {topContributors.map((contributor, index) => (
                    <tr key={contributor.name} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '10px 12px', fontSize: '13px' }}>
                        {index + 1}. {contributor.name}
                      </td>
                      <td style={{ padding: '10px 12px', fontSize: '13px', textAlign: 'right', fontWeight: '600' }}>
                        {contributor.count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Top Organizations */}
        {topOrganizations && topOrganizations.length > 0 && (
          <div>
            <h4 style={{ 
              fontSize: '16px', 
              fontWeight: '600', 
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Building2 size={18} color="#0176d3" />
              Top Organizations by Account Count
            </h4>
            <div style={{ 
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              overflow: 'hidden'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#f9fafb' }}>
                  <tr>
                    <th style={{ 
                      padding: '10px 12px', 
                      textAlign: 'left', 
                      fontSize: '12px', 
                      fontWeight: '600',
                      borderBottom: '1px solid #e5e7eb'
                    }}>
                      Organization
                    </th>
                    <th style={{ 
                      padding: '10px 12px', 
                      textAlign: 'right', 
                      fontSize: '12px', 
                      fontWeight: '600',
                      borderBottom: '1px solid #e5e7eb'
                    }}>
                      Accounts
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {topOrganizations.map((org, index) => (
                    <tr key={org.name} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '10px 12px', fontSize: '13px' }}>
                        {index + 1}. {org.name}
                      </td>
                      <td style={{ padding: '10px 12px', fontSize: '13px', textAlign: 'right', fontWeight: '600' }}>
                        {org.count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Accounts by Tool */}
      {accountsByTool && Object.keys(accountsByTool).length > 0 && (
        <div>
          <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
            Accounts by Client Tool
          </h4>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', 
            gap: '12px' 
          }}>
            {Object.entries(accountsByTool).map(([toolName, stats]) => (
              <div 
                key={toolName}
                style={{ 
                  padding: '12px', 
                  background: '#f9fafb', 
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb'
                }}
              >
                <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                  {toolName}
                </div>
                <div style={{ fontSize: '12px', color: '#666', lineHeight: '1.6' }}>
                  <div>Total: {stats.total}</div>
                  <div>Assigned: {stats.assigned}</div>
                  <div>Unassigned: {stats.unassigned}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountUtilizationAnalytics;

