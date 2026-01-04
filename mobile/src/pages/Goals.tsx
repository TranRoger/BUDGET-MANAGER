import React, { useState, useEffect } from 'react';
import { goalService, FinancialGoal, CreateGoalData } from '../services/goalService';
import { formatCurrency, formatDate } from '../utils/formatters';
import Card from '../components/Card';

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
      case 'high': return 'bg-red-100 text-red-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'low': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-gray-500">Loading goals...</div>;

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">🎯 Mục Tiêu Tài Chính</h1>
        <button
          className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl shadow-lg hover:-translate-y-0.5 transform transition-all duration-200 font-semibold"
          onClick={() => {
            setShowForm(!showForm);
            if (showForm) {
              setEditingGoal(null);
              resetForm();
            }
          }}
        >
          {showForm ? '✕ Đóng' : '+ Thêm Mục Tiêu'}
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
            <div className="text-4xl mb-2">🎯</div>
            <div className="text-sm text-gray-600 mb-1">Total Target</div>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(parseFloat(stats.total_target))}</div>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-green-100">
            <div className="text-4xl mb-2">💰</div>
            <div className="text-sm text-gray-600 mb-1">Total Saved</div>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(parseFloat(stats.total_saved))}</div>
          </Card>
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
            <div className="text-4xl mb-2">📊</div>
            <div className="text-sm text-gray-600 mb-1">Overall Progress</div>
            <div className="text-2xl font-bold text-purple-600">
              {stats.total_target > 0 ? Math.round((parseFloat(stats.total_saved) / parseFloat(stats.total_target)) * 100) : 0}%
            </div>
          </Card>
          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100">
            <div className="text-4xl mb-2">✅</div>
            <div className="text-sm text-gray-600 mb-1">Completed</div>
            <div className="text-2xl font-bold text-yellow-600">{stats.completed_goals}/{stats.total_goals}</div>
          </Card>
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <Card className="mb-8">
          <div className="mb-6">
            <div className="flex items-center gap-4">
              <div className="text-4xl">🎯</div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{editingGoal ? 'Edit Goal' : 'Create New Goal'}</h2>
                <p className="text-gray-500 text-sm">Set and track your financial objectives</p>
              </div>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                <span className="mr-2">📌</span>
                Goal Name
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Emergency Fund, New Car, Vacation"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="target_amount" className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="mr-2">🎯</span>
                  Target Amount
                </label>
                <input
                  id="target_amount"
                  type="number"
                  step="0.01"
                  value={formData.target_amount}
                  onChange={(e) => setFormData({ ...formData, target_amount: parseFloat(e.target.value) })}
                  placeholder="0.00"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  required
                />
              </div>

              <div>
                <label htmlFor="current_amount" className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="mr-2">💵</span>
                  Current Amount
                </label>
                <input
                  id="current_amount"
                  type="number"
                  step="0.01"
                  value={formData.current_amount}
                  onChange={(e) => setFormData({ ...formData, current_amount: parseFloat(e.target.value) })}
                  placeholder="0.00"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="mr-2">⭐</span>
                  Priority
                </label>
                <select
                  id="priority"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div>
                <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="mr-2">📅</span>
                  Deadline
                </label>
                <input
                  id="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                <span className="mr-2">📝</span>
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Why is this goal important to you?"
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-xl font-semibold transition-all"
                onClick={() => {
                  setShowForm(false);
                  setEditingGoal(null);
                  resetForm();
                }}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl shadow-lg hover:-translate-y-0.5 transform transition-all duration-200 font-semibold"
              >
                {editingGoal ? 'Update Goal' : 'Create Goal'}
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* Goals List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.length === 0 ? (
          <Card className="col-span-full">
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎯</div>
              <p className="text-gray-500 mb-6">No financial goals set yet</p>
              <button 
                className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl shadow-lg hover:-translate-y-0.5 transform transition-all duration-200 font-semibold"
                onClick={() => setShowForm(true)}
              >
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
              <Card key={goal.id} className={isCompleted ? 'border-2 border-green-500' : ''}>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{goal.name}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(goal.priority)}`}>
                    {goal.priority}
                  </span>
                </div>
                {isCompleted && (
                  <div className="mb-4 px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-semibold text-center">
                    ✓ Completed
                  </div>
                )}

                {goal.description && (
                  <p className="text-gray-600 text-sm mb-4">{goal.description}</p>
                )}

                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="text-center">
                    <div className="text-xs text-gray-500 mb-1">Current</div>
                    <div className="text-sm font-semibold text-green-600">{formatCurrency(goal.current_amount)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-500 mb-1">Target</div>
                    <div className="text-sm font-semibold text-blue-600">{formatCurrency(goal.target_amount)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-500 mb-1">Remaining</div>
                    <div className="text-sm font-semibold text-orange-600">{formatCurrency(Math.max(0, remaining))}</div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-gray-600">Progress</span>
                    <span className="text-xs font-semibold text-gray-900">{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-green-500' : 'bg-primary-600'}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {goal.deadline && (
                  <div className="text-xs text-gray-500 mb-4">
                    📅 Deadline: {formatDate(goal.deadline)}
                  </div>
                )}

                <div className="flex gap-2">
                  <button 
                    className="flex-1 px-4 py-2 bg-primary-50 hover:bg-primary-100 text-primary-700 rounded-lg text-sm font-semibold transition-all"
                    onClick={() => setShowProgressModal(goal)}
                  >
                    💰 Cập Nhật
                  </button>
                  <button 
                    onClick={() => handleEdit(goal)} 
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold transition-all"
                  >
                    ✏️
                  </button>
                  <button 
                    onClick={() => handleDelete(goal.id)} 
                    className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-sm font-semibold transition-all"
                  >
                    🗑️
                  </button>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Progress Modal */}
      {showProgressModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowProgressModal(null)}>
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Update Progress: {showProgressModal.name}</h3>
            <p className="text-gray-600 mb-6">
              Current: {formatCurrency(showProgressModal.current_amount)} / {formatCurrency(showProgressModal.target_amount)}
            </p>
            <div className="mb-6">
              <label htmlFor="progress-amount" className="block text-sm font-medium text-gray-700 mb-2">Amount to Add/Subtract</label>
              <input
                id="progress-amount"
                type="number"
                step="0.01"
                value={progressAmount}
                onChange={(e) => setProgressAmount(e.target.value)}
                placeholder="Enter positive or negative amount"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                autoFocus
              />
              <p className="text-sm text-gray-500 mt-2">
                Use positive values to add, negative to subtract
              </p>
            </div>
            <div className="flex gap-3">
              <button 
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-xl font-semibold transition-all"
                onClick={() => {
                  setShowProgressModal(null);
                  setProgressAmount('');
                }}
              >
                Cancel
              </button>
              <button 
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl shadow-lg hover:-translate-y-0.5 transform transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
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
