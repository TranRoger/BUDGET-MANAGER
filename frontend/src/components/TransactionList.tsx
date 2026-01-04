import React from 'react';
import { Transaction } from '../services/transactionService';
import { formatCurrency, formatDate } from '../utils/formatters';
import './TransactionList.css';

interface TransactionListProps {
  transactions: Transaction[];
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (id: number) => void;
}

const TransactionList: React.FC<TransactionListProps> = ({ transactions, onEdit, onDelete }) => {
  if (!Array.isArray(transactions) || transactions.length === 0) {
    return <div className="empty-state">Không có giao dịch nào</div>;
  }

  return (
    <div className="transaction-list">
      {transactions.map((transaction: any) => (
        <div key={transaction.id} className={`transaction-item ${transaction.type}`}>
          <div className="transaction-category-icon" style={{ backgroundColor: transaction.category_color || '#6b7280' }}>
            {transaction.category_icon || '📦'}
          </div>
          <div className="transaction-main">
            <div className="transaction-description">
              {transaction.description || 'Không có mô tả'}
            </div>
            <div className="transaction-meta">
              <span className="transaction-category-name">{transaction.category_name || 'Chưa phân loại'}</span>
              <span className="transaction-date">{formatDate(transaction.date)}</span>
            </div>
          </div>
          <div className="transaction-right">
            <div className={`transaction-amount ${transaction.type}`}>
              {transaction.type === 'income' ? '+' : '-'}
              {formatCurrency(transaction.amount)}
            </div>
            <div className="transaction-actions">
              {onEdit && (
                <button onClick={() => onEdit(transaction)} className="btn-edit">
                  ✏️ Sửa
                </button>
              )}
              {onDelete && (
                <button onClick={() => onDelete(transaction.id)} className="btn-delete">
                  🗑️ Xóa
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TransactionList;
