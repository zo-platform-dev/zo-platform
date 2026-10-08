import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../config/api';

function Templates() {
  const { t } = useTranslation();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    fetchTemplates();
  }, [selectedCategory]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const params = selectedCategory ? { category: selectedCategory } : {};
      const response = await axios.get(`${API_BASE_URL}/templates`, { params });
      setTemplates(response.data.templates);
    } catch (error) {
      toast.error('Failed to fetch templates');
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { value: '', label: 'All Categories' },
    { value: 'social-media', label: t('templates.social_media') },
    { value: 'ecommerce', label: t('templates.ecommerce') },
    { value: 'news', label: t('templates.news') },
    { value: 'jobs', label: t('templates.jobs') },
    { value: 'real-estate', label: t('templates.real_estate') },
    { value: 'travel', label: t('templates.travel') },
    { value: 'finance', label: t('templates.finance') },
    { value: 'general', label: t('templates.general') }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">{t('templates.title')}</h1>
          <p className="page-subtitle">{t('templates.browse_templates')}</p>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center gap-4 mb-6">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="input w-auto"
          >
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="loading-spinner"></div>
          </div>
        ) : templates.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h3 className="empty-state-title">{t('templates.no_templates')}</h3>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {templates.map(template => (
              <div key={template._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold">{template.name}</h3>
                  <span className="badge badge-neutral capitalize">{template.category}</span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">
                    {template.method} • {template.type}
                  </span>
                  <span className="text-gray-500">
                    Used {template.usage?.timesUsed || 0} times
                  </span>
                </div>
                <button className="btn btn-primary w-full mt-3">
                  {t('templates.use_template')}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Templates;