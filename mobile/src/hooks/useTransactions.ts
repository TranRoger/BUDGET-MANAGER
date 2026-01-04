import { useState, useEffect, useCallback } from 'react';
import { transactionService, Transaction, TransactionFilters } from '../services/transactionService';

export const useTransactions = (filters?: TransactionFilters) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const data = await transactionService.getAll(filters);
      setTransactions(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const createTransaction = async (data: any) => {
    const newTransaction = await transactionService.create(data);
    setTransactions([newTransaction, ...transactions]);
    return newTransaction;
  };

  const updateTransaction = async (id: number, data: any) => {
    const updated = await transactionService.update(id, data);
    setTransactions(transactions.map(t => t.id === id ? updated : t));
    return updated;
  };

  const deleteTransaction = async (id: number) => {
    await transactionService.delete(id);
    setTransactions(transactions.filter(t => t.id !== id));
  };

  return {
    transactions,
    loading,
    error,
    refetch: fetchTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
  };
};
