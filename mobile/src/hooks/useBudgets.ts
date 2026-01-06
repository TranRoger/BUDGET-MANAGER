import { useState, useEffect } from 'react';
import { budgetService, Budget } from '../services/budgetService';

export const useBudgets = () => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const data = await budgetService.getAll();
      setBudgets(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch budgets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, []);

  const createBudget = async (data: any) => {
    const newBudget = await budgetService.create(data);
    setBudgets([...budgets, newBudget]);
    return newBudget;
  };

  const updateBudget = async (id: number, data: any) => {
    const updated = await budgetService.update(id, data);
    setBudgets(budgets.map(b => b.id === id ? updated : b));
    return updated;
  };

  const deleteBudget = async (id: number) => {
    await budgetService.delete(id);
    setBudgets(budgets.filter(b => b.id !== id));
  };

  return {
    budgets,
    loading,
    error,
    refetch: fetchBudgets,
    createBudget,
    updateBudget,
    deleteBudget,
  };
};
