import React, { useState } from 'react';
import { ChevronUp, ChevronDown, Loader } from 'lucide-react';
import DualProductivityCell from './DualProductivityCell';
import StatusBadge from './StatusBadge';
import './ApprovalsTable.css';

// Map Salesforce field names to client-side field names for sorting
const mapSalesforceToClientField = (salesforceFieldName) => {
  const reverseMap = {
    'Transaction_ID__c': 'transactionId',
    'Contact__r.Name': 'contributorName',
    'Contact__r.Email': 'email',
    'Project_Objective__r.Name': 'projectObjectiveName',
    'Transaction_Date__c': 'transactionDate',
    'Variance_Percent__c': 'variancePercent',
    'Payrate__c': 'payrate',
    'Total_Payment__c': 'totalPayment',
    'Status__c': 'status'
  };
  return reverseMap[salesforceFieldName] || salesforceFieldName;
};

const ApprovalsTable = ({ 
  records, 
  loading, 
  onRowClick,
  onSort,
  sortBy,
  sortOrder,
  selectedRows,
  onRowSelect,
  onTransactionClick
}) => {
  const [hoveredRow, setHoveredRow] = useState(null);

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || amount === 0) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0]; // YYYY-MM-DD format
    } catch {
      return '';
    }
  };

  const formatNumber = (num) => {
    if (num === null || num === undefined) return '0';
    return new Intl.NumberFormat('en-US').format(num);
  };

  const handleSort = (column) => {
    if (onSort) {
      // Map Salesforce field name to client-side field name
      const clientField = mapSalesforceToClientField(column);
      const currentClientField = mapSalesforceToClientField(sortBy);
      const newOrder = currentClientField === clientField && sortOrder === 'DESC' ? 'ASC' : 'DESC';
      onSort(clientField, newOrder);
    }
  };

  const handleRowClick = (record) => {
    if (onRowClick) {
      onRowClick(record);
    }
  };

  const handleRowSelect = (e, recordId) => {
    e.stopPropagation();
    if (onRowSelect) {
      onRowSelect(recordId);
    }
  };

  const isRowSelected = (recordId) => {
    return selectedRows && selectedRows.includes(recordId);
  };

  const SortIcon = ({ column }) => {
    // Map both to client-side field names for comparison
    const clientColumn = mapSalesforceToClientField(column);
    if (sortBy !== clientColumn) return null;
    return sortOrder === 'ASC' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  if (loading && records.length === 0) {
    return (
      <div className="approvals-table-loading">
        <Loader className="spinning" size={24} />
        <p>Loading approvals...</p>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="approvals-table-empty">
        <p>No records found</p>
      </div>
    );
  }

  return (
    <div className="approvals-table-container">
      <div className="approvals-table-scroll-wrapper">
        <table className="approvals-table">
        <thead>
          <tr>
            <th rowSpan="2" className="table-checkbox-col">
              <input
                type="checkbox"
                checked={selectedRows && selectedRows.length === records.length && records.length > 0}
                onChange={(e) => {
                  if (e.target.checked) {
                    onRowSelect && records.forEach(r => onRowSelect(r.id));
                  } else {
                    onRowSelect && selectedRows?.forEach(id => onRowSelect(id));
                  }
                }}
              />
            </th>
            <th 
              rowSpan="2"
              className="sortable" 
              onClick={() => handleSort('Transaction_ID__c')}
            >
              <span>Transaction ID</span>
              <SortIcon column="Transaction_ID__c" />
            </th>
            <th 
              rowSpan="2"
              className="sortable" 
              onClick={() => handleSort('Contact__r.Name')}
            >
              <span>Contributor</span>
              <SortIcon column="Contact__r.Name" />
            </th>
            <th 
              rowSpan="2"
              className="sortable col-email" 
              onClick={() => handleSort('Contact__r.Email')}
            >
              <span>Email</span>
              <SortIcon column="Contact__r.Email" />
            </th>
            <th 
              rowSpan="2"
              className="sortable col-project"
            >
              <span>Project</span>
            </th>
            <th 
              rowSpan="2"
              className="sortable" 
              onClick={() => handleSort('Project_Objective__r.Name')}
            >
              <span>Project Objective</span>
              <SortIcon column="Project_Objective__r.Name" />
            </th>
            <th 
              rowSpan="2"
              className="sortable"
            >
              <span>Account</span>
            </th>
            <th 
              rowSpan="2"
              className="sortable" 
              onClick={() => handleSort('Transaction_Date__c')}
            >
              <span>Transaction Date</span>
              <SortIcon column="Transaction_Date__c" />
            </th>
            <th colSpan="2" className="productivity-header">Productivity</th>
            <th 
              rowSpan="2"
              className="sortable" 
              onClick={() => handleSort('Variance_Percent__c')}
            >
              <span>Variance %</span>
              <SortIcon column="Variance_Percent__c" />
            </th>
            <th 
              rowSpan="2"
              className="sortable" 
              onClick={() => handleSort('Payrate__c')}
            >
              <span>Payrate</span>
              <SortIcon column="Payrate__c" />
            </th>
            <th 
              rowSpan="2"
              className="sortable" 
              onClick={() => handleSort('Total_Payment__c')}
            >
              <span>Total Payment</span>
              <SortIcon column="Total_Payment__c" />
            </th>
            <th 
              rowSpan="2"
              className="sortable" 
              onClick={() => handleSort('Status__c')}
            >
              <span>Status</span>
              <SortIcon column="Status__c" />
            </th>
          </tr>
          <tr>
            <th className="productivity-sub-header">Self-Reported</th>
            <th className="productivity-sub-header">System Tracked</th>
          </tr>
        </thead>
        <tbody>
          {(() => {
            // Final deduplication layer: Filter duplicates by ID before rendering
            // This is a safety net in case duplicates somehow make it through state management
            const seenIds = new Set();
            const uniqueRecords = records.filter(record => {
              if (!record || !record.id) return false;
              if (seenIds.has(record.id)) {
                console.warn(`[ApprovalsTable] Duplicate record filtered in render: ${record.id}`);
                return false;
              }
              seenIds.add(record.id);
              return true;
            });
            
            // Log if duplicates were found
            if (records.length !== uniqueRecords.length) {
              console.warn(`[ApprovalsTable] Deduplication: ${records.length} records received, ${uniqueRecords.length} unique records after filtering`);
            }
            
            return uniqueRecords.map((record) => (
              <tr
                key={record.id}
                className={`table-row ${isRowSelected(record.id) ? 'selected' : ''} ${hoveredRow === record.id ? 'hovered' : ''}`}
                onClick={() => handleRowClick(record)}
                onMouseEnter={() => setHoveredRow(record.id)}
                onMouseLeave={() => setHoveredRow(null)}
              >
              <td className="table-checkbox-col" onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={isRowSelected(record.id)}
                  onChange={(e) => handleRowSelect(e, record.id)}
                />
              </td>
              <td>
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onTransactionClick) {
                      onTransactionClick(record.transactionId || record.id);
                    }
                  }}
                  style={{
                    color: '#0176d3',
                    textDecoration: 'underline',
                    cursor: 'pointer'
                  }}
                >
                  {record.transactionId || record.id}
                </span>
              </td>
              <td>{record.contributorName || ''}</td>
              <td className="col-email">{record.email || ''}</td>
              <td className="col-project">{record.projectName || ''}</td>
              <td>{record.projectObjectiveName || ''}</td>
              <td>{record.accountName || ''}</td>
              <td>{formatDate(record.transactionDate)}</td>
              <td className="productivity-cell productivity-self-reported">
                <DualProductivityCell
                  selfReportedHours={record.selfReportedHours}
                  systemTrackedHours={record.systemTrackedHours}
                  selfReportedUnits={record.selfReportedUnits}
                  systemTrackedUnits={record.systemTrackedUnits}
                  showSelfReported={true}
                />
              </td>
              <td className="productivity-cell productivity-system-tracked">
                <DualProductivityCell
                  selfReportedHours={record.selfReportedHours}
                  systemTrackedHours={record.systemTrackedHours}
                  selfReportedUnits={record.selfReportedUnits}
                  systemTrackedUnits={record.systemTrackedUnits}
                  showSelfReported={false}
                />
              </td>
              <td className={`variance-cell ${record.variancePercent > 0 ? 'positive' : record.variancePercent < 0 ? 'negative' : 'zero'}`}>
                {formatNumber(record.variancePercent)}%
              </td>
              <td>{formatCurrency(record.payrate)}</td>
              <td>{formatCurrency(record.totalPayment)}</td>
              <td>
                <StatusBadge status={record.status} />
              </td>
            </tr>
            ));
          })()}
        </tbody>
      </table>
      </div>
    </div>
  );
};

export default ApprovalsTable;

