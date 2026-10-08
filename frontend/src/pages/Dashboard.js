import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { HiOutlinePlay, HiOutlineCheckCircle, HiOutlineExclamationCircle, HiOutlineClock } from 'react-icons/hi';
import { useTaskStore } from '../store/taskStore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function Dashboard() {
  const { t } = useTranslation();
  const { stats, fetchStats, tasks, fetchTasks } = useTaskStore();

  useEffect(() => {
    fetchStats();
    fetchTasks({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' });
  }, []);

  const statusData = stats?.byStatus ? [
    { name: t('dashboard.pending'), value: stats.byStatus.pending || 0, color: '#f59e0b' },
    { name: t('dashboard.running'), value: stats.byStatus.running || 0, color: '#3b82f6' },
    { name: t('dashboard.completed'), value: stats.byStatus.completed || 0, color: '#10b981' },
    { name: t('dashboard.failed'), value: stats.byStatus.failed || 0, color: '#ef4444' }
  ] : [];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <HiOutlineCheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <HiOutlineExclamationCircle className="w-5 h-5 text-red-500" />;
      case 'running':
        return <HiOutlinePlay className="w-5 h-5 text-blue-500" />;
      default:
        return <HiOutlineClock className="w-5 h-5 text-yellow-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">{t('dashboard.title')}</h1>
        <p className="page-subtitle">{t('dashboard.welcome')}</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">{t('dashboard.total_tasks')}</p>
              <p className="text-2xl font-bold">{stats?.total || 0}</p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <HiOutlineDocumentText className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">{t('dashboard.completed')}</p>
              <p className="text-2xl font-bold text-green-600">{stats?.byStatus?.completed || 0}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <HiOutlineCheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">{t('dashboard.running')}</p>
              <p className="text-2xl font-bold text-blue-600">{stats?.byStatus?.running || 0}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <HiOutlinePlay className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">{t('dashboard.failed')}</p>
              <p className="text-2xl font-bold text-red-600">{stats?.byStatus?.failed || 0}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <HiOutlineExclamationCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">{t('dashboard.statistics')}</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    background: '#fff',
                    border: '1px solid #e5e5e5',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="value" fill="#000" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">{t('dashboard.recent_tasks')}</h3>
            <Link to="/tasks" className="text-sm text-gray-500 hover:text-black">
              {t('tasks.view_results')} →
            </Link>
          </div>

          <div className="space-y-3">
            {tasks.length === 0 ? (
              <p className="text-gray-500 text-center py-8">{t('tasks.no_tasks')}</p>
            ) : (
              tasks.map((task) => (
                <Link
                  key={task._id}
                  to={`/tasks/${task._id}`}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(task.status)}
                    <div>
                      <p className="font-medium">{task.name}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(task.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className={`badge badge-${
                    task.status === 'completed' ? 'success' :
                    task.status === 'failed' ? 'error' :
                    task.status === 'running' ? 'info' : 'neutral'
                  }`}>
                    {task.status}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;