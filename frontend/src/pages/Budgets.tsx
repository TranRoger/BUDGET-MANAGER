import React from 'react';
import { useBudgets } from '../hooks/useBudgets';
import Card from '../components/Card';
import { formatCurrency } from '../utils/formatters';
import './Budgets.css';

const Budgets: React.FC = () => {
  const { budgets, loading } = useBudgets();

  return (
    <div className="budgets-page">
      <div className="page-header">
        <h1 className="page-title">Budgets</h1>
        <button className="btn-primary">+ Create Budget</button>
      </div>

      <div className="budgets-grid">
        {loading ? (
          <div className="loading">Loading budgets...</div>
        ) : !Array.isArray(budgets) || budgets.length === 0 ? (
          <Card>
            <div className="empty-state">
              <p>No budgets created yet</p>
              <button className="btn-primary">Create Your First Budget</button>
            </div>
          </Card>
        ) : (
          budgets.map((budget) => (
            <Card key={budget.id} className="budget-card">
              <div className="budget-header">
                <h3>Budget #{budget.id}</h3>
                <span className="budget-period">{budget.period}</span>
              </div>
              <div className="budget-amount">
                {formatCurrency(budget.amount)}
              </div>
              <div className="budget-dates">
                {budget.start_date} - {budget.end_date}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Budgets;
