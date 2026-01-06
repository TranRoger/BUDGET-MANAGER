import React from 'react';
import { Transaction } from '../services/transactionService';
import { formatCurrency, formatDate } from '../utils/formatters';

interface TransactionListProps {
  transactions: Transaction[];
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (id: number) => void;
}

const TransactionList: React.FC<TransactionListProps> = ({ transactions, onEdit, onDelete }) => {
  if (!Array.isArray(transactions) || transactions.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500 italic">
        Không có giao dịch nào
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {transactions.map((transaction: any) => (
        <div 
          key={transaction.id} 
          className={`
            group bg-white rounded-xl p-4 shadow-md hover:shadow-xl 
            transition-all duration-300 border-l-4
            ${transaction.type === 'income' 
              ? 'border-green-500 hover:border-green-600' 
              : 'border-red-500 hover:border-red-600'
            }
          `}
        >
          <div className="flex items-center gap-4">
            {/* Category Icon */}
            <div 
              className="flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center text-2xl shadow-md"
              style={{ backgroundColor: transaction.category_color || '#6b7280' }}
            >
              {transaction.category_icon || '📦'}
            </div>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-gray-900 truncate text-lg">
                {transaction.description || 'Không có mô tả'}
              </div>
              <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                <span className="font-medium">
                  {transaction.category_name || 'Chưa phân loại'}
                </span>
                <span className="text-gray-400">•</span>
                <span>{formatDate(transaction.date)}</span>
              </div>
            </div>

            {/* Amount and Actions */}
            <div className="flex items-center gap-4">
              <div className={`
                text-xl font-bold
                ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}
              `}>
                {transaction.type === 'income' ? '+' : '-'}
                {formatCurrency(transaction.amount)}
              </div>

              <div className="flex gap-2">
                {onEdit && (
                  <button 
                    onClick={() => onEdit(transaction)}
                    className="
                      px-3 py-1.5 rounded-lg font-semibold text-sm
                      bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white
                      transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg
                      flex items-center gap-1
                    "
                  >
                    ✏️ Sửa
                  </button>
                )}
                {onDelete && (
                  <button 
                    onClick={() => onDelete(transaction.id)}
                    className="
                      px-3 py-1.5 rounded-lg font-semibold text-sm
                      bg-red-50 text-red-700 hover:bg-red-600 hover:text-white
                      transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg
                      flex items-center gap-1
                    "
                  >
                    🗑️ Xóa
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TransactionList;
