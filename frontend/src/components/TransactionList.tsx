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
    return <div className="empty-state">No transactions found</div>;
  }

  return (
    <div className="transaction-list">
      {transactions.map((transaction) => (
        <div key={transaction.id} className={`transaction-item ${transaction.type}`}>
          <div className="transaction-main">
            <div className="transaction-description">
              {transaction.description || 'No description'}
            </div>
            <div className="transaction-date">{formatDate(transaction.date)}</div>
          </div>
          <div className="transaction-right">
            <div className={`transaction-amount ${transaction.type}`}>
              {transaction.type === 'income' ? '+' : '-'}
              {formatCurrency(transaction.amount)}
            </div>
            <div className="transaction-actions">
              {onEdit && (
                <button onClick={() => onEdit(transaction)} className="btn-edit">
                  Edit
                </button>
              )}
              {onDelete && (
                <button onClick={() => onDelete(transaction.id)} className="btn-delete">
                  Delete
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
