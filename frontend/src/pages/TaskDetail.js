import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HiOutlinePlay, HiOutlinePencil, HiOutlineTrash, HiOutlineDownload } from 'react-icons/hi';
import { useTaskStore } from '../store/taskStore';
import toast from 'react-hot-toast';

function TaskDetail() {
  const { id } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentTask, fetchTask, fetchResults, results, runTask, deleteTask, loading } = useTaskStore();

  useEffect(() => {
    fetchTask(id);
    fetchResults(id, { limit: 10 });
  }, [id]);

  const handleRun = async () => {
    const result = await runTask(id);
    if (result.success) {
      toast.success(t('tasks.task_queued'));
      fetchTask(id);
    } else {
      toast.error(result.error);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(t('tasks.confirm_delete'))) return;
    const result = await deleteTask(id);
    if (result.success) {
      toast.success(t('tasks.task_deleted'));
      navigate('/tasks');
    } else {
      toast.error(result.error);
    }
  };

  const handleExport = (format) => {
    if (results && results.length > 0) {
      const data = results[0].data;
      let content, filename, mimeType;

      if (format === 'json') {
        content = JSON.stringify(data, null, 2);
        filename = `task-${id}-results.json`;
        mimeType = 'application/json';
      } else if (format === 'csv') {
        const items = Array.isArray(data) ? data : [data];
        const headers = Object.keys(items[0] || {});
        const csv = [
          headers.join(','),
          ...items.map(item => headers.map(h => `"${item[h] || ''}"`).join(','))
        ].join('\n');
        content = csv;
        filename = `task-${id}-results.csv`;
        mimeType = 'text/csv';
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  if (loading || !currentTask) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">{currentTask.name}</h1>
          <p className="page-subtitle">{currentTask.description || t('tasks.description')}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleRun} className="btn btn-primary">
            <HiOutlinePlay className="w-5 h-5" />
            {t('tasks.run')}
          </button>
          <button onClick={handleDelete} className="btn btn-danger">
            <HiOutlineTrash className="w-5 h-5" />
            {t('common.delete')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">{t('tasks.config')}</h3>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-600">{t('tasks.type')}</span>
                <span className="font-medium capitalize">{currentTask.type}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-600">{t('tasks.method')}</span>
                <span className="font-medium capitalize">{currentTask.method}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-600">{t('tasks.status')}</span>
                <span className={`badge badge-${
                  currentTask.status === 'completed' ? 'success' :
                  currentTask.status === 'failed' ? 'error' :
                  currentTask.status === 'running' ? 'info' : 'neutral'
                }`}>
                  {currentTask.status}
                </span>
              </div>
              {currentTask.config.url && (
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">{t('tasks.url')}</span>
                  <a href={currentTask.config.url} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:underline">
                    {currentTask.config.url}
                  </a>
                </div>
              )}
              <div className="flex justify-between py-2">
                <span className="text-gray-600">{t('tasks.created_at')}</span>
                <span className="font-medium">{new Date(currentTask.createdAt).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{t('results.title')}</h3>
              {results && results.length > 0 && (
                <div className="flex gap-2">
                  <button onClick={() => handleExport('json')} className="btn btn-sm btn-secondary">
                    <HiOutlineDownload className="w-4 h-4" />
                    JSON
                  </button>
                  <button onClick={() => handleExport('csv')} className="btn btn-sm btn-secondary">
                    <HiOutlineDownload className="w-4 h-4" />
                    CSV
                  </button>
                </div>
              )}
            </div>

            {results && results.length > 0 ? (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-auto">
                  <pre className="text-sm">{JSON.stringify(results[0].data, null, 2)}</pre>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>{t('results.items')}: {results[0].metadata?.totalItems || 0}</span>
                  <span>{t('results.version')}: {results[0].version}</span>
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <p className="text-gray-500">{t('results.no_results')}</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">{t('tasks.schedule')}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">{t('tasks.enable_schedule')}</span>
                <span className="font-medium">{currentTask.schedule?.enabled ? 'Yes' : 'No'}</span>
              </div>
              {currentTask.schedule?.enabled && (
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('tasks.cron_expression')}</span>
                  <span className="font-medium">{currentTask.schedule.cron}</span>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold mb-4">{t('tasks.retry')}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">{t('tasks.enable_retry')}</span>
                <span className="font-medium">{currentTask.retry?.enabled ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('tasks.max_attempts')}</span>
                <span className="font-medium">{currentTask.retry?.maxAttempts || 0}</span>
              </div>
            </div>
          </div>

          {currentTask.result && (
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Last Run</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('results.items')}</span>
                  <span className="font-medium">{currentTask.result.itemCount || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration</span>
                  <span className="font-medium">{currentTask.result.duration || 0}ms</span>
                </div>
                {currentTask.result.completedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Completed</span>
                    <span className="font-medium">{new Date(currentTask.result.completedAt).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TaskDetail;