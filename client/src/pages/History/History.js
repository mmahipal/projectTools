import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../config/api';
import toast from 'react-hot-toast';
import HistoryTable from './components/HistoryTable';
import ViewDetailsModal from './components/ViewDetailsModal';
import ConfirmModal from './components/ConfirmModal';
import { Download, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx';
import './History.css';

const History = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [reverting, setReverting] = useState({});
  const [showRevertConfirm, setShowRevertConfirm] = useState(false);
  const [transactionToRevert, setTransactionToRevert] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/history');
      if (response.data.success) {
        setHistory(response.data.history || []);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
      toast.error('Failed to fetch history');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (transaction) => {
    try {
      const response = await apiClient.get(`/history/${transaction.id}`);
      if (response.data.success) {
        setSelectedTransaction(response.data.transaction);
        setShowDetailsModal(true);
      }
    } catch (error) {
      console.error('Error fetching transaction details:', error);
      toast.error('Failed to fetch transaction details');
    }
  };

  const handleRevertClick = (transaction) => {
    setTransactionToRevert(transaction);
    setShowRevertConfirm(true);
  };

  const handleRevertConfirm = async () => {
    if (!transactionToRevert) return;

    setShowRevertConfirm(false);
    setReverting(prev => ({ ...prev, [transactionToRevert.id]: true }));
    
    try {
      const response = await apiClient.post(`/history/${transactionToRevert.id}/revert`);
      if (response.data.success) {
        toast.success(response.data.message || 'Transaction reverted successfully');
        fetchHistory(); // Refresh history
      } else {
        toast.error(response.data.error || 'Failed to revert transaction');
      }
    } catch (error) {
      console.error('Error reverting transaction:', error);
      const errorMessage = error.response?.data?.error || 'Failed to revert transaction';
      toast.error(errorMessage);
    } finally {
      setReverting(prev => ({ ...prev, [transactionToRevert.id]: false }));
      setTransactionToRevert(null);
    }
  };

  const handleRevertCancel = () => {
    setShowRevertConfirm(false);
    setTransactionToRevert(null);
  };

  const handleExport = async () => {
    try {
      // Export the same data structure that's shown in UI table (matching table columns)
      const exportData = [];
      
      history.forEach(group => {
        group.transactions.forEach(transaction => {
          exportData.push({
            'Name': transaction.name || 'Untitled',
            'User': transaction.publisher || 'Unknown',
            'Date': transaction.publishedAt ? new Date(transaction.publishedAt).toLocaleString() : 'N/A',
            'Records': transaction.recordCount || 1,
            'Status': transaction.status === 'success' ? 'Success' : transaction.status === 'failed' ? 'Failed' : transaction.status === 'partial' ? 'Partial' : transaction.status
          });
        });
      });

      if (exportData.length === 0) {
        toast.error('No data to export');
        return;
      }

      // Create workbook and worksheet
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'History');

      // Generate filename with timestamp
      const filename = `History_Export_${new Date().toISOString().split('T')[0]}.xlsx`;

      // Write and download
      XLSX.writeFile(wb, filename);
      toast.success(`Exported ${exportData.length} records to Excel`);
    } catch (error) {
      console.error('Error exporting history:', error);
      toast.error('Failed to export history');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ 
          border: '2px solid #f3f3f3',
          borderTop: '2px solid #08979C',
          borderRadius: '50%',
          width: '24px',
          height: '24px',
          animation: 'spin 1s linear infinite',
          margin: '0 auto'
        }}></div>
        <p style={{ marginTop: '16px', color: '#666', fontFamily: 'Poppins' }}>Loading history...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '12px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '12px'
      }}>
        <div>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 600, color: '#002329', fontFamily: 'Poppins', lineHeight: '1.2' }}>
            Transaction History
          </h2>
          <p style={{ margin: 0, fontSize: '12px', color: '#666', fontFamily: 'Poppins', lineHeight: '1.2' }}>
            View all published items synced to Salesforce
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={fetchHistory}
            disabled={loading}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              whiteSpace: 'nowrap',
              padding: '8px 16px',
              borderRadius: '4px',
              border: '1px solid #d9d9d9',
              background: '#f5f5f5',
              color: '#002329',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '13px',
              fontFamily: 'Poppins',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => !loading && (e.target.style.background = '#e6e6e6')}
            onMouseLeave={(e) => !loading && (e.target.style.background = '#f5f5f5')}
            title="Refresh history"
          >
            <RefreshCw size={16} className={loading ? 'spinning' : ''} />
            Refresh
          </button>
          <button
            onClick={handleExport}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              whiteSpace: 'nowrap',
              padding: '8px 16px',
              borderRadius: '4px',
              border: '1px solid #d9d9d9',
              background: '#f5f5f5',
              color: '#002329',
              cursor: 'pointer',
              fontSize: '13px',
              fontFamily: 'Poppins',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = '#e6e6e6'}
            onMouseLeave={(e) => e.target.style.background = '#f5f5f5'}
            title="Export history to Excel"
          >
            <Download size={16} />
            Export to Excel
          </button>
        </div>
      </div>

      {history.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
          <p>No history records found.</p>
        </div>
      ) : (
        <HistoryTable
          history={history}
          onViewDetails={handleViewDetails}
          onRevert={handleRevertClick}
          reverting={reverting}
        />
      )}

      {showDetailsModal && selectedTransaction && (
        <ViewDetailsModal
          transaction={selectedTransaction}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedTransaction(null);
          }}
        />
      )}

      <ConfirmModal
        show={showRevertConfirm}
        message="Are you sure you want to revert this transaction? This will undo the changes made in Salesforce."
        onConfirm={handleRevertConfirm}
        onCancel={handleRevertCancel}
        confirmText="Revert"
        cancelText="Cancel"
        type="warning"
      />
    </div>
  );
};

export default History;

