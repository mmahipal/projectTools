import React, { useState, useEffect } from 'react';
import { X, Loader, Info } from 'lucide-react';
import apiClient from '../../../../config/api';
import toast from 'react-hot-toast';
import '../../../../components/PaymentAdjustments/NewPaymentAdjustmentModal.css';

const ViewPaymentTransactionModal = ({ isOpen, onClose, transactionId }) => {
  const [loading, setLoading] = useState(false);
  const [transaction, setTransaction] = useState(null);

  useEffect(() => {
    if (isOpen && transactionId) {
      fetchTransaction();
    } else {
      setTransaction(null);
    }
  }, [isOpen, transactionId]);

  const fetchTransaction = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/pm-approvals/${transactionId}`);
      if (response.data.success) {
        setTransaction(response.data.record);
      } else {
        toast.error(response.data.error || 'Failed to fetch Payment Transaction details');
        onClose();
      }
    } catch (error) {
      console.error('Error fetching payment transaction:', error);
      toast.error(error.response?.data?.error || 'Failed to fetch Payment Transaction details');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
    } catch (e) {
      return dateString;
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', { 
        month: 'numeric', 
        day: 'numeric', 
        year: 'numeric', 
        hour: 'numeric', 
        minute: '2-digit' 
      });
    } catch (e) {
      return dateString;
    }
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || amount === 0) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatNumber = (num) => {
    if (num === null || num === undefined) return '0';
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  };

  const formatValue = (value) => {
    if (value === null || value === undefined || value === '') {
      return '--';
    }
    return String(value);
  };

  if (!isOpen) return null;

  return (
    <div className="payment-adjustment-modal-overlay" onClick={onClose}>
      <div className="payment-adjustment-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '1200px', width: '95%' }}>
        <div className="payment-adjustment-modal-header">
          <h2>Payment Transactions Needing Approval</h2>
          <button className="payment-adjustment-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="payment-adjustment-modal-body">
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', gap: '16px' }}>
              <Loader className="spinning" size={24} style={{ color: '#08979C' }} />
              <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>Loading Payment Transaction details...</p>
            </div>
          ) : transaction ? (
            <>
              {/* Header with Name/ID */}
              <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#002329' }}>
                    {formatValue(transaction.Name || transaction.Transaction_ID__c || transaction.Id)}
                  </h3>
                </div>
              </div>

              {/* Main Transaction Information Section */}
              <div className="payment-adjustment-section">
                <h3 className="payment-adjustment-section-title">Details</h3>
                <div className="payment-adjustment-form-grid">
                  {/* Left Column */}
                  <div className="payment-adjustment-form-column">
                    <div className="payment-adjustment-form-group">
                      <label>Payment Transactions Needing Approval Name</label>
                      <input
                        type="text"
                        value={formatValue(transaction.Name)}
                        readOnly
                        style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                      />
                    </div>

                    <div className="payment-adjustment-form-group">
                      <label>Transaction ID</label>
                      <input
                        type="text"
                        value={formatValue(transaction.Transaction_ID__c || transaction.Id)}
                        readOnly
                        style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                      />
                    </div>

                    <div className="payment-adjustment-form-group">
                      <label>Contributor Project</label>
                      {transaction.Contributor_Project__r?.Name ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: '#0176d3', textDecoration: 'underline', cursor: 'pointer' }}>
                            {transaction.Contributor_Project__r.Name}
                          </span>
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={formatValue(transaction.Contributor_Project__c)}
                          readOnly
                          style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                        />
                      )}
                    </div>

                    <div className="payment-adjustment-form-group">
                      <label>Prod Week Status</label>
                      <input
                        type="text"
                        value={formatValue(transaction.Prod_Week_Status__c)}
                        readOnly
                        style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                      />
                    </div>

                    <div className="payment-adjustment-form-group">
                      <label>Transaction Date</label>
                      <input
                        type="text"
                        value={formatDate(transaction.Transaction_Date__c || transaction.CreatedDate)}
                        readOnly
                        style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                      />
                    </div>

                    <div className="payment-adjustment-form-group">
                      <label>Transaction Status</label>
                      <input
                        type="text"
                        value={formatValue(transaction.Transaction_Status__c || transaction.Status__c)}
                        readOnly
                        style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                      />
                    </div>

                    <div className="payment-adjustment-form-group">
                      <label>Submitted for Approval Timestamp</label>
                      <input
                        type="text"
                        value={formatDateTime(transaction.Submitted_for_Approval_Timestamp__c)}
                        readOnly
                        style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                      />
                    </div>

                    <div className="payment-adjustment-form-group">
                      <label>Productivity Variance</label>
                      <input
                        type="text"
                        value={transaction.Productivity_Variance__c !== null && transaction.Productivity_Variance__c !== undefined 
                          ? `${formatNumber(transaction.Productivity_Variance__c)}%`
                          : (transaction.Variance_Percent__c !== null && transaction.Variance_Percent__c !== undefined
                            ? `${formatNumber(transaction.Variance_Percent__c)}%`
                            : formatValue(null))}
                        readOnly
                        style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                      />
                    </div>

                    <div className="payment-adjustment-form-group">
                      <label>Self-Reported Hours</label>
                      <input
                        type="text"
                        value={formatNumber(transaction.Self_Reported_Hours__c || transaction.SelfReportedHours__c || 0)}
                        readOnly
                        style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                      />
                    </div>

                    <div className="payment-adjustment-form-group">
                      <label>Self-Reported Units</label>
                      <input
                        type="text"
                        value={formatNumber(transaction.Self_Reported_Units__c || transaction.SelfReportedUnits__c || 0)}
                        readOnly
                        style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                      />
                    </div>

                    <div className="payment-adjustment-form-group">
                      <label>System-tracked Hours</label>
                      <input
                        type="text"
                        value={formatNumber(transaction.System_Tracked_Hours__c || transaction.SystemTrackedHours__c || 0)}
                        readOnly
                        style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                      />
                    </div>

                    <div className="payment-adjustment-form-group">
                      <label>System-tracked Units</label>
                      <input
                        type="text"
                        value={formatNumber(transaction.System_Tracked_Units__c || transaction.SystemTrackedUnits__c || 0)}
                        readOnly
                        style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                      />
                    </div>

                    <div className="payment-adjustment-form-group">
                      <label>Adjusted Hours</label>
                      <input
                        type="text"
                        value={formatNumber(transaction.Adjusted_Hours__c || 0)}
                        readOnly
                        style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                      />
                    </div>

                    <div className="payment-adjustment-form-group">
                      <label>Adjusted Units</label>
                      <input
                        type="text"
                        value={formatNumber(transaction.Adjusted_Units__c || 0)}
                        readOnly
                        style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                      />
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="payment-adjustment-form-column">
                    <div className="payment-adjustment-form-group">
                      <label>Payment Hours</label>
                      <input
                        type="text"
                        value={formatNumber(transaction.Payment_Hours__c || 0)}
                        readOnly
                        style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                      />
                    </div>

                    <div className="payment-adjustment-form-group">
                      <label>Payment Units</label>
                      <input
                        type="text"
                        value={formatNumber(transaction.Payment_Units__c || 0)}
                        readOnly
                        style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                      />
                    </div>

                    <div className="payment-adjustment-form-group">
                      <label>Payrate</label>
                      <input
                        type="text"
                        value={formatNumber(transaction.Payrate__c || transaction.Pay_Rate__c || 0)}
                        readOnly
                        style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                      />
                    </div>

                    <div className="payment-adjustment-form-group">
                      <label>Payment Amount</label>
                      <input
                        type="text"
                        value={formatNumber(transaction.Total_Payment__c || transaction.Payment_Amount__c || 0)}
                        readOnly
                        style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                      />
                    </div>

                    <div className="payment-adjustment-form-group">
                      <label>PM Approver</label>
                      <input
                        type="text"
                        value={formatValue(transaction.PM_Approver__r?.Name || transaction.PM_Approver__c)}
                        readOnly
                        style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                      />
                    </div>

                    <div className="payment-adjustment-form-group">
                      <label>Payment Status</label>
                      <input
                        type="text"
                        value={formatValue(transaction.Payment_Status__c)}
                        readOnly
                        style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                      />
                    </div>

                    <div className="payment-adjustment-form-group">
                      <label>Dispute Resolution Text</label>
                      <input
                        type="text"
                        value={formatValue(transaction.Dispute_Resolution_Text__c)}
                        readOnly
                        style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                      />
                    </div>

                    <div className="payment-adjustment-form-group">
                      <label>Dispute Resolution Picklist</label>
                      <input
                        type="text"
                        value={formatValue(transaction.Dispute_Resolution_Picklist__c)}
                        readOnly
                        style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                      />
                    </div>

                    <div className="payment-adjustment-form-group">
                      <label>Dispute Case</label>
                      <input
                        type="text"
                        value={formatValue(transaction.Dispute_Case__c)}
                        readOnly
                        style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                      />
                    </div>

                    <div className="payment-adjustment-form-group">
                      <label>Contributor Comment</label>
                      <textarea
                        value={formatValue(transaction.Contributor_Comment__c)}
                        readOnly
                        style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed', resize: 'none' }}
                        rows={3}
                      />
                    </div>

                    <div className="payment-adjustment-form-group">
                      <label>Contributor Issue</label>
                      <input
                        type="text"
                        value={formatValue(transaction.Contributor_Issue__c)}
                        readOnly
                        style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                      />
                    </div>

                    <div className="payment-adjustment-form-group">
                      <label>Contributor Approved Timestamp</label>
                      <input
                        type="text"
                        value={formatDateTime(transaction.Contributor_Approved_Timestamp__c)}
                        readOnly
                        style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                      />
                    </div>

                    <div className="payment-adjustment-form-group">
                      <label>Weekending Date</label>
                      <input
                        type="text"
                        value={formatDate(transaction.Weekending_Date__c)}
                        readOnly
                        style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* System Information Section */}
              <div className="payment-adjustment-section" style={{ marginTop: '24px' }}>
                <h3 className="payment-adjustment-section-title">System Information</h3>
                <div className="payment-adjustment-form-grid">
                  <div className="payment-adjustment-form-column">
                    <div className="payment-adjustment-form-group">
                      <label>Created By</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {transaction.CreatedBy?.Name && (
                          <>
                            <div style={{ 
                              width: '24px', 
                              height: '24px', 
                              borderRadius: '50%', 
                              background: '#0176d3', 
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '12px',
                              fontWeight: '600',
                              flexShrink: 0
                            }}>
                              {transaction.CreatedBy.Name.charAt(0).toUpperCase()}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <span style={{ fontSize: '14px', color: '#0176d3' }}>{transaction.CreatedBy.Name}</span>
                              {transaction.CreatedDate && (
                                <span style={{ fontSize: '12px', color: '#666' }}>{formatDateTime(transaction.CreatedDate)}</span>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="payment-adjustment-form-column">
                    <div className="payment-adjustment-form-group">
                      <label>Last Modified By</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {transaction.LastModifiedBy?.Name && (
                          <>
                            <div style={{ 
                              width: '24px', 
                              height: '24px', 
                              borderRadius: '50%', 
                              background: '#0176d3', 
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '12px',
                              fontWeight: '600',
                              flexShrink: 0
                            }}>
                              {transaction.LastModifiedBy.Name.charAt(0).toUpperCase()}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <span style={{ fontSize: '14px', color: '#0176d3' }}>{transaction.LastModifiedBy.Name}</span>
                              {transaction.LastModifiedDate && (
                                <span style={{ fontSize: '12px', color: '#666' }}>{formatDateTime(transaction.LastModifiedDate)}</span>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="payment-adjustment-form-column">
                    <div className="payment-adjustment-form-group">
                      <label>Owner</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {transaction.Owner?.Name && (
                          <>
                            <div style={{ 
                              width: '24px', 
                              height: '24px', 
                              borderRadius: '50%', 
                              background: '#0176d3', 
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '12px',
                              fontWeight: '600',
                              flexShrink: 0
                            }}>
                              {transaction.Owner.Name.charAt(0).toUpperCase()}
                            </div>
                            <span style={{ fontSize: '14px', color: '#0176d3' }}>{transaction.Owner.Name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
              <p>No payment transaction data available</p>
            </div>
          )}
        </div>

        <div className="payment-adjustment-modal-footer">
          <button
            className="payment-adjustment-btn-cancel"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewPaymentTransactionModal;

