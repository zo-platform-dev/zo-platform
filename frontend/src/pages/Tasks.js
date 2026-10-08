import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { HiOutlinePlus, HiOutlinePlay, HiOutlinePencil, HiOutlineTrash, HiOutlineEye } from 'react-icons/hi';
import { useTaskStore } from '../store/taskStore';
import toast from 'react-hot-toast';

function Tasks() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { tasks, loading, fetchTasks, deleteTask, pagination } = useTaskStore();
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState({ status: '', type: '' });

  useEffect(() => {
    fetchTasks({ page: 1, limit: 10 });
  }, []);

  useEffect(() => {
    fetchTasks({ ...filter, page: 1 });
  }, [filter.status, filter.type]);

  const handleDelete = async (taskId) => {
    if (!window.confirm(t('tasks.confirm_delete'))) return;

    const result = await deleteTask(taskId);
    if (result.success) {
      toast.success(t('tasks.task_deleted'));
    } else {
      toast.error(result.error);
    }
  };

  const handleRun = async (taskId) => {
    const { runTask } = useTaskStore.getState();
    const result = await runTask(taskId);
    if (result.success) {
      toast.success(t('tasks.task_queued'));
    } else {
      toast.error(result.error);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'badge-warning',
      queued: 'badge-info',
      running: 'badge-info',
      completed: 'badge-success',
      failed: 'badge-error',
      cancelled: 'badge-neutral'
    };
    return styles[status] || 'badge-neutral';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">{t('tasks.title')}</h1>
          <p className="page-subtitle">{t('dashboard.statistics')}</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn btn-primary"
        >
          <HiOutlinePlus className="w-5 h-5" />
          {t('tasks.create_task')}
        </button>
      </div>

      <div className="card">
        <div className="flex items-center gap-4 mb-4">
          <select
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            className="input w-auto"
          >
            <option value="">{t('tasks.status')}: All</option>
            <option value="pending">{t('dashboard.pending')}</option>
            <option value="running">{t('dashboard.running')}</option>
            <option value="completed">{t('dashboard.completed')}</option>
            <option value="failed">{t('dashboard.failed')}</option>
          </select>

          <select
            value={filter.type}
            onChange={(e) => setFilter({ ...filter, type: e.target.value })}
            className="input w-auto"
          >
            <option value="">{t('tasks.type')}: All</option>
            <option value="scrape">{t('tasks.scrape')}</option>
            <option value="api">{t('tasks.api')}</option>
            <option value="automation">{t('tasks.automation')}</option>
            <option value="custom">{t('tasks.custom')}</option>
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="loading-spinner"></div>
          </div>
        ) : tasks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h3 className="empty-state-title">{t('tasks.no_tasks')}</h3>
            <button
              onClick={() => setShowModal(true)}
              className="btn btn-primary"
            >
              <HiOutlinePlus className="w-5 h-5" />
              {t('tasks.create_task')}
            </button>
          </div>
        ) : (
          <>
            <table className="table">
              <thead>
                <tr>
                  <th>{t('tasks.task_name')}</th>
                  <th>{t('tasks.type')}</th>
                  <th>{t('tasks.method')}</th>
                  <th>{t('tasks.status')}</th>
                  <th>{t('tasks.created_at')}</th>
                  <th>{t('tasks.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task._id}>
                    <td>
                      <Link to={`/tasks/${task._id}`} className="font-medium hover:underline">
                        {task.name}
                      </Link>
                      {task.description && (
                        <p className="text-sm text-gray-500">{task.description}</p>
                      )}
                    </td>
                    <td className="capitalize">{task.type}</td>
                    <td className="capitalize">{task.method}</td>
                    <td>
                      <span className={`badge ${getStatusBadge(task.status)}`}>
                        {task.status}
                      </span>
                    </td>
                    <td>{new Date(task.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleRun(task._id)}
                          className="btn btn-sm btn-secondary"
                          title={t('tasks.run')}
                        >
                          <HiOutlinePlay className="w-4 h-4" />
                        </button>
                        <Link
                          to={`/tasks/${task._id}`}
                          className="btn btn-sm btn-secondary"
                          title={t('common.edit')}
                        >
                          <HiOutlineEye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(task._id)}
                          className="btn btn-sm btn-danger"
                          title={t('common.delete')}
                        >
                          <HiOutlineTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                {Array.from({ length: pagination.pages }, (_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => fetchTasks({ ...filter, page: i + 1 })}
                    className={`btn btn-sm ${pagination.page === i + 1 ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {showModal && (
        <TaskModal onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}

function TaskModal({ onClose }) {
  const { t } = useTranslation();
  const { createTask } = useTaskStore();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'scrape',
    method: 'cheerio',
    config: {
      url: '',
      selectors: {}
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await createTask(formData);
    if (result.success) {
      toast.success(t('tasks.task_created'));
      onClose();
      fetchTasks({ page: 1, limit: 10 });
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-lg p-6">
        <h2 className="text-xl font-bold mb-4">{t('tasks.create_task')}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-group">
            <label className="label">{t('tasks.task_name')}</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              required
            />
          </div>

          <div className="form-group">
            <label className="label">{t('tasks.description')}</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label">{t('tasks.type')}</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="input"
              >
                <option value="scrape">{t('tasks.scrape')}</option>
                <option value="api">{t('tasks.api')}</option>
                <option value="automation">{t('tasks.automation')}</option>
                <option value="custom">{t('tasks.custom')}</option>
              </select>
            </div>

            <div className="form-group">
              <label className="label">{t('tasks.method')}</label>
              <select
                value={formData.method}
                onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                className="input"
              >
                <option value="cheerio">Cheerio</option>
                <option value="puppeteer">Puppeteer</option>
                <option value="axios">Axios</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="label">{t('tasks.url')}</label>
            <input
              type="url"
              value={formData.config.url}
              onChange={(e) => setFormData({
                ...formData,
                config: { ...formData.config, url: e.target.value }
              })}
              className="input"
              placeholder="https://example.com"
            />
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              {t('common.cancel')}
            </button>
            <button type="submit" className="btn btn-primary">
              {t('common.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Tasks;