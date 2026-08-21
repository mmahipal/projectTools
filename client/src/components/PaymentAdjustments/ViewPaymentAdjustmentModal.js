import React, { useState, useEffect } from 'react';
import { X, Loader, Info } from 'lucide-react';
import apiClient from '../../config/api';
import toast from 'react-hot-toast';
import './NewPaymentAdjustmentModal.css';

const ViewPaymentAdjustmentModal = ({ isOpen, onClose, paymentAdjustmentId }) => {
  const [loading, setLoading] = useState(false);
  const [paymentAdjustment, setPaymentAdjustment] = useState(null);

  useEffect(() => {
    if (isOpen && paymentAdjustmentId) {
      fetchPaymentAdjustment();
    } else {
      setPaymentAdjustment(null);
    }
  }, [isOpen, paymentAdjustmentId]);

  const fetchPaymentAdjustment = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/payment-adjustments/${paymentAdjustmentId}`);
      if (response.data.success) {
        setPaymentAdjustment(response.data.record);
      } else {
        toast.error(response.data.error || 'Failed to fetch Payment Adjustment details');
        onClose();
      }
    } catch (error) {
      console.error('Error fetching payment adjustment:', error);
      toast.error(error.response?.data?.error || 'Failed to fetch Payment Adjustment details');
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

  const formatValue = (value) => {
    if (value === null || value === undefined || value === '') {
      return '--';
    }
    return String(value);
  };

  if (!isOpen) return null;

  return (
    <div className="payment-adjustment-modal-overlay" onClick={onClose}>
      <div className="payment-adjustment-modal" onClick={(e) => e.stopPropagation()}>
        <div className="payment-adjustment-modal-header">
          <h2>Payment Adjustment Details</h2>
          <button className="payment-adjustment-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="payment-adjustment-modal-body">
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', gap: '16px' }}>
              <Loader className="spinning" size={24} style={{ color: '#08979C' }} />
              <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>Loading Payment Adjustment details...</p>
            </div>
          ) : paymentAdjustment ? (
            <>
              {/* Information Section */}
              <div className="payment-adjustment-section">
                <h3 className="payment-adjustment-section-title">Information</h3>
                <div className="payment-adjustment-form-grid">
                  {/* Left Column */}
                  <div className="payment-adjustment-form-column">
                    <div className="payment-adjustment-form-group">
                      <label>Payment Adjustment Name</label>
                      <input
                        type="text"
                        value={formatValue(paymentAdjustment.Name)}
                        readOnly
                        style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                      />
                    </div>

                    <div className="payment-adjustment-form-group">
                      <label>Contributor</label>
                      <input
                        type="text"
                        value={formatValue(paymentAdjustment.Contributor__r?.Name || paymentAdjustment.Contributor__c)}
                        readOnly
                        style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                      />
                    </div>

                    <div className="payment-adjustment-form-group">
                      <label>Contributor Project</label>
                      <input
                        type="text"
                        value={formatValue(paymentAdjustment.Contributor_Project__r?.Name || paymentAdjustment.Contributor_Project__c)}
                        readOnly
                        style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                      />
                    </div>

                    <div className="payment-adjustment-form-group">
                      <label>Adjustment Type</label>
                      <input
                        type="text"
                        value={formatValue(paymentAdjustment.Adjustment_Type__c)}
                        readOnly
                        style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                      />
                    </div>

                    <div className="payment-adjustment-form-group">
                      <label>Payment ID</label>
                      <input
                        type="text"
                        value={formatValue(paymentAdjustment.Payment_ID__c)}
                        readOnly
                        style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                      />
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="payment-adjustment-form-column">
                    <div className="payment-adjustment-form-group">
                      <label>Contributor Facing Project Name</label>
                      <input
                        type="text"
                        value={formatValue(paymentAdjustment.Contributor_Facing_Project_Name__c)}
                        readOnly
                        style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                      />
                    </div>

                    <div className="payment-adjustment-form-group">
                      <label>Status</label>
                      <input
                        type="text"
                        value={formatValue(paymentAdjustment.Status__c)}
                        readOnly
                        style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                      />
                    </div>

                    <div className="payment-adjustment-form-group">
                      <label>
                        Payment Adjustment Date
                        <Info size={14} style={{ marginLeft: '4px', color: '#666', cursor: 'help' }} title="The date for this payment adjustment" />
                      </label>
                      <input
                        type="text"
                        value={formatDate(paymentAdjustment.Payment_Adjustment_Date__c)}
                        readOnly
                        style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                      />
                    </div>

                    <div className="payment-adjustment-form-group">
                      <label>Payment Adjustment Date Text</label>
                      <input
                        type="text"
                        value={formatValue(paymentAdjustment.Payment_Adjustment_Date_Text__c)}
                        readOnly
                        style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                      />
                    </div>

                    <div className="payment-adjustment-form-group">
                      <label>Payment Adjustment Amount</label>
                      <input
                        type="text"
                        value={formatValue(paymentAdjustment.Payment_Adjustment_Amount__c)}
                        readOnly
                        style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                      />
                    </div>

                    <div className="payment-adjustment-form-group" style={{ gridColumn: '1 / -1' }}>
                      <label>Adjustment Notes</label>
                      <textarea
                        value={formatValue(paymentAdjustment.Adjustment_Notes__c)}
                        readOnly
                        style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed', resize: 'none' }}
                        rows={4}
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
                        {paymentAdjustment.CreatedBy?.Name && (
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
                              {paymentAdjustment.CreatedBy.Name.charAt(0).toUpperCase()}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <span style={{ fontSize: '14px', color: '#0176d3' }}>{paymentAdjustment.CreatedBy.Name}</span>
                              {paymentAdjustment.CreatedDate && (
                                <span style={{ fontSize: '12px', color: '#666' }}>{formatDateTime(paymentAdjustment.CreatedDate)}</span>
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
                        {paymentAdjustment.LastModifiedBy?.Name && (
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
                              {paymentAdjustment.LastModifiedBy.Name.charAt(0).toUpperCase()}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <span style={{ fontSize: '14px', color: '#0176d3' }}>{paymentAdjustment.LastModifiedBy.Name}</span>
                              {paymentAdjustment.LastModifiedDate && (
                                <span style={{ fontSize: '12px', color: '#666' }}>{formatDateTime(paymentAdjustment.LastModifiedDate)}</span>
                              )}
                            </div>
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
              <p>No payment adjustment data available</p>
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

export default ViewPaymentAdjustmentModal;





