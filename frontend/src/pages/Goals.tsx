import React, { useState, useEffect } from 'react';
import { goalService, FinancialGoal, CreateGoalData } from '../services/goalService';
import { formatCurrency, formatDate } from '../utils/formatters';
import Card from '../components/Card';
import './Goals.css';

const Goals: React.FC = () => {
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<FinancialGoal | null>(null);
  const [showProgressModal, setShowProgressModal] = useState<FinancialGoal | null>(null);
  const [progressAmount, setProgressAmount] = useState<string>('');
  const [formData, setFormData] = useState<CreateGoalData>({
    name: '',
    target_amount: 0,
    current_amount: 0,
    deadline: '',
    priority: 'medium',
    description: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [goalsData, statsData] = await Promise.all([
        goalService.getAll(),
        goalService.getStats()
      ]);
      setGoals(goalsData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to fetch goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingGoal) {
        await goalService.update(editingGoal.id, formData);
      } else {
        await goalService.create(formData);
      }
      setShowForm(false);
      setEditingGoal(null);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Failed to save goal:', error);
    }
  };

  const handleEdit = (goal: FinancialGoal) => {
    setEditingGoal(goal);
    setFormData({
      name: goal.name,
      target_amount: goal.target_amount,
      current_amount: goal.current_amount,
      deadline: goal.deadline || '',
      priority: goal.priority,
      description: goal.description || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this goal?')) {
      try {
        await goalService.delete(id);
        fetchData();
      } catch (error) {
        console.error('Failed to delete goal:', error);
      }
    }
  };

  const handleUpdateProgress = async () => {
    if (!showProgressModal || !progressAmount) return;
    
    try {
      await goalService.updateProgress(showProgressModal.id, parseFloat(progressAmount));
      setShowProgressModal(null);
      setProgressAmount('');
      fetchData();
    } catch (error) {
      console.error('Failed to update progress:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      target_amount: 0,
      current_amount: 0,
      deadline: '',
      priority: 'medium',
      description: '',
    });
  };

  const getProgress = (current: number, target: number) => {
    return Math.min(Math.round((current / target) * 100), 100);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  if (loading) return <div className="loading">Loading goals...</div>;

  return (
    <div className="goals-page">
      <div className="page-header">
        <h1 className="page-title">🎯 Financial Goals</h1>
        <button
          className="btn-primary"
          onClick={() => {
            setShowForm(!showForm);
            if (showForm) {
              setEditingGoal(null);
              resetForm();
            }
          }}
        >
          {showForm ? 'Cancel' : '+ Add Goal'}
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="stats-grid">
          <Card className="stat-card goal-total">
            <div className="stat-icon">🎯</div>
            <div className="stat-label">Total Target</div>
            <div className="stat-value">{formatCurrency(parseFloat(stats.total_target))}</div>
          </Card>
          <Card className="stat-card goal-saved">
            <div className="stat-icon">💰</div>
            <div className="stat-label">Total Saved</div>
            <div className="stat-value">{formatCurrency(parseFloat(stats.total_saved))}</div>
          </Card>
          <Card className="stat-card goal-progress">
            <div className="stat-icon">📊</div>
            <div className="stat-label">Overall Progress</div>
            <div className="stat-value">
              {stats.total_target > 0 ? Math.round((parseFloat(stats.total_saved) / parseFloat(stats.total_target)) * 100) : 0}%
            </div>
          </Card>
          <Card className="stat-card goal-completed">
            <div className="stat-icon">✅</div>
            <div className="stat-label">Completed</div>
            <div className="stat-value">{stats.completed_goals}/{stats.total_goals}</div>
          </Card>
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <div className="form-card-wrapper">
          <Card className="form-card">
            <div className="form-header">
              <div className="form-header-content">
                <div className="form-icon">🎯</div>
                <div>
                  <h2 className="form-title">{editingGoal ? 'Edit Goal' : 'Create New Goal'}</h2>
                  <p className="form-subtitle">Set and track your financial objectives</p>
                </div>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="goal-form">
              <div className="form-group">
                <label htmlFor="name">
                  <span className="label-icon">📌</span>
                  Goal Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Emergency Fund, New Car, Vacation"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="target_amount">
                    <span className="label-icon">🎯</span>
                    Target Amount
                  </label>
                  <input
                    id="target_amount"
                    type="number"
                    step="0.01"
                    value={formData.target_amount}
                    onChange={(e) => setFormData({ ...formData, target_amount: parseFloat(e.target.value) })}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="current_amount">
                    <span className="label-icon">💵</span>
                    Current Amount
                  </label>
                  <input
                    id="current_amount"
                    type="number"
                    step="0.01"
                    value={formData.current_amount}
                    onChange={(e) => setFormData({ ...formData, current_amount: parseFloat(e.target.value) })}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="priority">
                    <span className="label-icon">⭐</span>
                    Priority
                  </label>
                  <select
                    id="priority"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="deadline">
                    <span className="label-icon">📅</span>
                    Deadline
                  </label>
                  <input
                    id="deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="description">
                  <span className="label-icon">📝</span>
                  Description
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Why is this goal important to you?"
                  rows={3}
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setShowForm(false);
                    setEditingGoal(null);
                    resetForm();
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingGoal ? 'Update Goal' : 'Create Goal'}
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Goals List */}
      <div className="goals-grid">
        {goals.length === 0 ? (
          <Card>
            <div className="empty-state">
              <div className="empty-icon">🎯</div>
              <p>No financial goals set yet</p>
              <button className="btn-primary" onClick={() => setShowForm(true)}>
                Create Your First Goal
              </button>
            </div>
          </Card>
        ) : (
          goals.map((goal) => {
            const progress = getProgress(goal.current_amount, goal.target_amount);
            const isCompleted = progress >= 100;
            const remaining = goal.target_amount - goal.current_amount;

            return (
              <Card key={goal.id} className={`goal-card ${isCompleted ? 'completed' : ''}`}>
                <div className="goal-header">
                  <div className="goal-title-section">
                    <h3 className="goal-name">{goal.name}</h3>
                    <span 
                      className="goal-priority" 
                      style={{ backgroundColor: getPriorityColor(goal.priority) }}
                    >
                      {goal.priority}
                    </span>
                  </div>
                  {isCompleted && <div className="goal-completed-badge">✓ Completed</div>}
                </div>

                {goal.description && (
                  <p className="goal-description">{goal.description}</p>
                )}

                <div className="goal-amounts">
                  <div className="amount-item">
                    <span className="amount-label">Current</span>
                    <span className="amount-value current">{formatCurrency(goal.current_amount)}</span>
                  </div>
                  <div className="amount-item">
                    <span className="amount-label">Target</span>
                    <span className="amount-value target">{formatCurrency(goal.target_amount)}</span>
                  </div>
                  <div className="amount-item">
                    <span className="amount-label">Remaining</span>
                    <span className="amount-value remaining">{formatCurrency(Math.max(0, remaining))}</span>
                  </div>
                </div>

                <div className="goal-progress-section">
                  <div className="progress-header">
                    <span className="progress-label">Progress</span>
                    <span className="progress-percentage">{progress}%</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ 
                        width: `${progress}%`,
                        backgroundColor: isCompleted ? '#10b981' : '#6366f1'
                      }}
                    />
                  </div>
                </div>

                {goal.deadline && (
                  <div className="goal-deadline">
                    📅 Deadline: {formatDate(goal.deadline)}
                  </div>
                )}

                <div className="goal-actions">
                  <button 
                    className="btn-progress"
                    onClick={() => setShowProgressModal(goal)}
                  >
                    💰 Update Progress
                  </button>
                  <button onClick={() => handleEdit(goal)} className="btn-edit">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(goal.id)} className="btn-delete">
                    Delete
                  </button>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Progress Modal */}
      {showProgressModal && (
        <div className="modal-overlay" onClick={() => setShowProgressModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Update Progress: {showProgressModal.name}</h3>
            <p className="modal-subtitle">
              Current: {formatCurrency(showProgressModal.current_amount)} / {formatCurrency(showProgressModal.target_amount)}
            </p>
            <div className="modal-form">
              <label htmlFor="progress-amount">Amount to Add/Subtract</label>
              <input
                id="progress-amount"
                type="number"
                step="0.01"
                value={progressAmount}
                onChange={(e) => setProgressAmount(e.target.value)}
                placeholder="Enter positive or negative amount"
                autoFocus
              />
              <p className="modal-hint">
                Use positive values to add, negative to subtract
              </p>
            </div>
            <div className="modal-actions">
              <button 
                className="btn-secondary"
                onClick={() => {
                  setShowProgressModal(null);
                  setProgressAmount('');
                }}
              >
                Cancel
              </button>
              <button 
                className="btn-primary"
                onClick={handleUpdateProgress}
                disabled={!progressAmount}
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Goals;
