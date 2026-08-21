import React from 'react';
import { Activity, AlertTriangle, CheckCircle, XCircle, Shield } from 'lucide-react';

const AccountStatusDashboard = ({ data }) => {
  if (!data) return null;

  const { totalAccounts, statusDistribution, accountsByTool, percentages } = data;

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
        <Activity size={20} color="#0176d3" />
        Account Status Dashboard
      </h3>

      {/* Status Cards */}
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
            <CheckCircle size={20} color="#059669" />
            <span style={{ fontSize: '14px', fontWeight: '500', color: '#666' }}>Active</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '600', color: '#059669' }}>
            {statusDistribution.active}
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            {percentages.active}% of total
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
            <span style={{ fontSize: '14px', fontWeight: '500', color: '#666' }}>Deactivated</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '600', color: '#dc2626' }}>
            {statusDistribution.deactivated}
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            {percentages.deactivated}% of total
          </div>
        </div>

        <div style={{ 
          padding: '16px', 
          background: '#fffbeb', 
          borderRadius: '8px',
          border: '1px solid #fde68a'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <AlertTriangle size={20} color="#d97706" />
            <span style={{ fontSize: '14px', fontWeight: '500', color: '#666' }}>OTP Exceeded</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '600', color: '#d97706' }}>
            {statusDistribution.otpExceeded}
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            {percentages.otpExceeded}% of total
          </div>
        </div>

        <div style={{ 
          padding: '16px', 
          background: '#f0fdf4', 
          borderRadius: '8px',
          border: '1px solid #bbf7d0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Shield size={20} color="#059669" />
            <span style={{ fontSize: '14px', fontWeight: '500', color: '#666' }}>Verified</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '600', color: '#059669' }}>
            {statusDistribution.verified}
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            {percentages.verified}% of total
          </div>
        </div>

        <div style={{ 
          padding: '16px', 
          background: '#fef2f2', 
          borderRadius: '8px',
          border: '1px solid #fecaca'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <AlertTriangle size={20} color="#dc2626" />
            <span style={{ fontSize: '14px', fontWeight: '500', color: '#666' }}>Unverified</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '600', color: '#dc2626' }}>
            {statusDistribution.unverified}
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            {percentages.unverified}% of total
          </div>
        </div>
      </div>

      {/* Total Accounts */}
      <div style={{ 
        padding: '12px 16px', 
        background: '#f5f5f5', 
        borderRadius: '6px',
        marginBottom: '24px'
      }}>
        <span style={{ fontSize: '14px', fontWeight: '500' }}>Total Accounts: </span>
        <span style={{ fontSize: '16px', fontWeight: '600' }}>{totalAccounts}</span>
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
                  <div>Active: {stats.active}</div>
                  <div>Deactivated: {stats.deactivated}</div>
                  {stats.otpExceeded > 0 && <div>OTP Exceeded: {stats.otpExceeded}</div>}
                  {stats.unverified > 0 && <div>Unverified: {stats.unverified}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountStatusDashboard;

