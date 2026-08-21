import React, { useState } from 'react';
import { Eye, RotateCcw, CheckCircle, XCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

const HistoryTable = ({ history, onViewDetails, onRevert, reverting }) => {
  const [expandedSections, setExpandedSections] = useState({});

  const toggleSection = (key) => {
    setExpandedSections(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };
  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle size={14} style={{ color: '#52c41a' }} />;
      case 'failed':
        return <XCircle size={14} style={{ color: '#ff4d4f' }} />;
      case 'partial':
        return <AlertCircle size={14} style={{ color: '#faad14' }} />;
      default:
        return <AlertCircle size={14} style={{ color: '#999' }} />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'success':
        return 'Success';
      case 'failed':
        return 'Failed';
      case 'partial':
        return 'Partial';
      default:
        return status || 'Unknown';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getOperationLabel = (operation) => {
    const labels = {
      create: 'Create',
      update: 'Update',
      delete: 'Delete',
      revert: 'Revert'
    };
    return labels[operation] || operation;
  };

  const getObjectTypeLabel = (objectType) => {
    // Map API names to readable labels
    const objectTypeMap = {
      'Client_Tool_Account__c': 'Client Tool Account',
      'Project__c': 'Project',
      'Project_Objective__c': 'Project Objective',
      'Project_Qualification_Step__c': 'Project Qualification Step',
      'Project_Page__c': 'Project Page',
      'Project_Team__c': 'Project Team',
      'Contributor_Project__c': 'Contributor Project',
      'Workstream__c': 'Workstream',
      'Project_Workstream__c': 'Project Workstream'
    };
    return objectTypeMap[objectType] || objectType;
  };

  // Calculate column widths for consistent alignment across sections
  const columnWidths = {
    name: '25%',
    user: '20%',
    date: '20%',
    records: '10%',
    status: '15%',
    actions: '10%'
  };

  return (
    <div>
      {history.map((group, groupIndex) => {
        const sectionKey = `${group.objectType}_${group.operation}`;
        const isExpanded = expandedSections[sectionKey] !== false; // Default to expanded (undefined means expanded)

        return (
          <div key={sectionKey} style={{ marginBottom: '8px' }}>
            <div 
              style={{ 
                padding: '6px 10px',
                background: '#f5f5f5',
                borderRadius: '4px',
                borderLeft: '3px solid #08979C',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'background-color 0.2s'
              }}
              onClick={() => toggleSection(sectionKey)}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e8e8e8'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {isExpanded ? (
                    <ChevronUp size={14} style={{ color: '#08979C' }} />
                  ) : (
                    <ChevronDown size={14} style={{ color: '#08979C' }} />
                  )}
                  <h3 style={{ 
                    margin: 0, 
                    fontSize: '13px', 
                    fontWeight: 600, 
                    color: '#002329',
                    fontFamily: 'Poppins',
                    lineHeight: '1.2'
                  }}>
                    {getObjectTypeLabel(group.objectType)} - {getOperationLabel(group.operation)}
                  </h3>
                </div>
              </div>
            </div>

            {isExpanded && (
              <div style={{ 
                background: '#fff',
                border: '1px solid #e0e0e0',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#fafafa', borderBottom: '1px solid #e0e0e0' }}>
                      <th style={{ 
                        padding: '6px 10px', 
                        textAlign: 'left', 
                        fontSize: '11px', 
                        fontWeight: 600,
                        color: '#002329',
                        width: columnWidths.name,
                        lineHeight: '1.2'
                      }}>
                        Name
                      </th>
                      <th style={{ 
                        padding: '6px 10px', 
                        textAlign: 'left', 
                        fontSize: '11px', 
                        fontWeight: 600,
                        color: '#002329',
                        width: columnWidths.user,
                        lineHeight: '1.2'
                      }}>
                        User
                      </th>
                      <th style={{ 
                        padding: '6px 10px', 
                        textAlign: 'left', 
                        fontSize: '11px', 
                        fontWeight: 600,
                        color: '#002329',
                        width: columnWidths.date,
                        lineHeight: '1.2'
                      }}>
                        Date
                      </th>
                      <th style={{ 
                        padding: '6px 10px', 
                        textAlign: 'left', 
                        fontSize: '11px', 
                        fontWeight: 600,
                        color: '#002329',
                        width: columnWidths.records,
                        lineHeight: '1.2'
                      }}>
                        Records
                      </th>
                      <th style={{ 
                        padding: '6px 10px', 
                        textAlign: 'left', 
                        fontSize: '11px', 
                        fontWeight: 600,
                        color: '#002329',
                        width: columnWidths.status,
                        lineHeight: '1.2'
                      }}>
                        Status
                      </th>
                      <th style={{ 
                        padding: '6px 10px', 
                        textAlign: 'center', 
                        fontSize: '11px', 
                        fontWeight: 600,
                        color: '#002329',
                        width: columnWidths.actions,
                        lineHeight: '1.2'
                      }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.transactions.map((transaction, index) => (
                      <tr 
                        key={transaction.id}
                        style={{ 
                          borderBottom: index < group.transactions.length - 1 ? '1px solid #f0f0f0' : 'none'
                        }}
                      >
                        <td style={{ padding: '6px 10px', fontSize: '12px', color: '#002329', fontFamily: 'Poppins', lineHeight: '1.2' }}>
                          {transaction.name}
                        </td>
                        <td style={{ padding: '6px 10px', fontSize: '12px', color: '#666', fontFamily: 'Poppins', lineHeight: '1.2' }}>
                          {transaction.publisher}
                        </td>
                        <td style={{ padding: '6px 10px', fontSize: '12px', color: '#666', fontFamily: 'Poppins', lineHeight: '1.2' }}>
                          {formatDate(transaction.publishedAt)}
                        </td>
                        <td style={{ padding: '6px 10px', fontSize: '12px', color: '#666', textAlign: 'center', fontFamily: 'Poppins', lineHeight: '1.2' }}>
                          {transaction.recordCount || 1}
                        </td>
                        <td style={{ padding: '6px 10px', fontSize: '12px', fontFamily: 'Poppins', lineHeight: '1.2' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {getStatusIcon(transaction.status)}
                            <span style={{ color: '#666', fontSize: '12px' }}>{getStatusText(transaction.status)}</span>
                          </div>
                        </td>
                        <td style={{ padding: '6px 10px', textAlign: 'center', lineHeight: '1.2' }}>
                          <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', flexWrap: 'nowrap' }}>
                            <button
                              onClick={() => onViewDetails(transaction)}
                              style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '4px',
                                fontSize: '11px',
                                padding: '4px 8px',
                                borderRadius: '3px',
                                border: '1px solid #d9d9d9',
                                background: '#f5f5f5',
                                color: '#002329',
                                cursor: 'pointer',
                                fontFamily: 'Poppins',
                                transition: 'all 0.2s',
                                lineHeight: '1.2',
                                whiteSpace: 'nowrap',
                                flexShrink: 0
                              }}
                              onMouseEnter={(e) => e.target.style.background = '#e6e6e6'}
                              onMouseLeave={(e) => e.target.style.background = '#f5f5f5'}
                              title="View details"
                            >
                              <Eye size={12} />
                              <span style={{ whiteSpace: 'nowrap' }}>View Details</span>
                            </button>
                            {/* Only show revert button for successful non-revert operations */}
                            {/* Revert entries should not have a revert button to prevent reverting a revert */}
                            {transaction.status === 'success' && transaction.operation && transaction.operation !== 'revert' && (
                              <button
                                onClick={() => onRevert(transaction)}
                                disabled={reverting[transaction.id]}
                                style={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: '4px',
                                  fontSize: '11px',
                                  padding: '4px 8px',
                                  borderRadius: '3px',
                                  border: 'none',
                                  background: reverting[transaction.id] ? '#ccc' : '#08979C',
                                  color: '#fff',
                                  cursor: reverting[transaction.id] ? 'not-allowed' : 'pointer',
                                  fontFamily: 'Poppins',
                                  transition: 'all 0.2s',
                                  lineHeight: '1.2',
                                  whiteSpace: 'nowrap',
                                  flexShrink: 0
                                }}
                                onMouseEnter={(e) => !reverting[transaction.id] && (e.target.style.background = '#067a7f')}
                                onMouseLeave={(e) => !reverting[transaction.id] && (e.target.style.background = '#08979C')}
                                title="Revert transaction"
                              >
                                {reverting[transaction.id] ? (
                                  <>
                                    <div className="spinner" style={{ width: '12px', height: '12px', border: '2px solid #f3f3f3', borderTop: '2px solid #fff', borderRadius: '50%' }}></div>
                                    <span style={{ whiteSpace: 'nowrap' }}>Reverting...</span>
                                  </>
                                ) : (
                                  <>
                                    <RotateCcw size={12} />
                                    <span style={{ whiteSpace: 'nowrap' }}>Revert</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default HistoryTable;

