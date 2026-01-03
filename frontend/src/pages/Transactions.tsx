import React, { useState } from 'react';
import { useTransactions } from '../hooks/useTransactions';
import Card from '../components/Card';
import TransactionList from '../components/TransactionList';
import './Transactions.css';

const Transactions: React.FC = () => {
  const { transactions, loading, createTransaction, deleteTransaction } = useTransactions();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    type: 'expense' as 'income' | 'expense',
    category_id: 1,
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTransaction({
        ...formData,
        amount: parseFloat(formData.amount),
      });
      setShowForm(false);
      setFormData({
        amount: '',
        type: 'expense',
        category_id: 1,
        description: '',
        date: new Date().toISOString().split('T')[0],
      });
    } catch (error) {
      console.error('Failed to create transaction:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await deleteTransaction(id);
      } catch (error) {
        console.error('Failed to delete transaction:', error);
      }
    }
  };

  return (
    <div className="transactions-page">
      <div className="page-header">
        <h1 className="page-title">Transactions</h1>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add Transaction'}
        </button>
      </div>

      {showForm && (
        <Card title="Add New Transaction" className="form-card">
          <form onSubmit={handleSubmit} className="transaction-form">
            <div className="form-row">
              <div className="form-group">
                <label>Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Description</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>

            <button type="submit" className="btn-primary">
              Add Transaction
            </button>
          </form>
        </Card>
      )}

      <Card title={`All Transactions (${transactions.length})`}>
        {loading ? (
          <div className="loading">Loading transactions...</div>
        ) : (
          <TransactionList
            transactions={transactions}
            onDelete={handleDelete}
          />
        )}
      </Card>
    </div>
  );
};

export default Transactions;
