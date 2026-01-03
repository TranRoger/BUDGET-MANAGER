import React from 'react';
import Card from '../components/Card';
import './Reports.css';

const Reports: React.FC = () => {
  return (
    <div className="reports-page">
      <h1 className="page-title">Reports & Analytics</h1>

      <div className="reports-grid">
        <Card title="Monthly Overview">
          <div className="empty-text">Chart will be displayed here</div>
        </Card>

        <Card title="Category Spending">
          <div className="empty-text">Pie chart will be displayed here</div>
        </Card>

        <Card title="Income vs Expense Trend">
          <div className="empty-text">Line chart will be displayed here</div>
        </Card>

        <Card title="Budget Performance">
          <div className="empty-text">Progress bars will be displayed here</div>
        </Card>
      </div>
    </div>
  );
};

export default Reports;
