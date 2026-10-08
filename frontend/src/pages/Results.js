import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

function Results() {
  const { t } = useTranslation();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/results`);
      setResults(response.data.results || []);
    } catch (error) {
      console.error('Failed to fetch results');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">{t('results.title')}</h1>
        <p className="page-subtitle">View all scraped data</p>
      </div>

      <div className="card">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="loading-spinner"></div>
          </div>
        ) : results.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📊</div>
            <h3 className="empty-state-title">{t('results.no_results')}</h3>
          </div>
        ) : (
          <div className="space-y-4">
            {results.map((result) => (
              <div key={result._id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Result #{result._id.slice(-6)}</h3>
                    <p className="text-sm text-gray-500">
                      {result.metadata?.totalItems || 0} items • {new Date(result.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button className="btn btn-sm btn-secondary">View</button>
                    <button className="btn btn-sm btn-primary">Export</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Results;