import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HiOutlinePlus, HiOutlineTrash, HiOutlineRefresh, HiOutlineClipboardCopy } from 'react-icons/hi';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../config/api';

function ApiKeys() {
  const { t } = useTranslation();
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api-keys`);
      setApiKeys(response.data.apiKeys);
    } catch (error) {
      toast.error('Failed to fetch API keys');
    } finally {
      setLoading(false);
    }
  };

  const createApiKey = async (name) => {
    try {
      const response = await axios.post('/api/api-keys', { name });
      toast.success(t('api_keys.key_created'));
      setShowModal(false);
      fetchApiKeys();
      return response.data.apiKey;
    } catch (error) {
      toast.error('Failed to create API key');
      return null;
    }
  };

  const deleteApiKey = async (keyId) => {
    if (!window.confirm(t('api_keys.confirm_delete'))) return;

    try {
      await axios.delete(`/api/api-keys/${keyId}`);
      toast.success(t('api_keys.key_deleted'));
      fetchApiKeys();
    } catch (error) {
      toast.error('Failed to delete API key');
    }
  };

  const rotateApiKey = async (keyId) => {
    try {
      const response = await axios.put(`/api/api-keys/${keyId}/rotate`);
      toast.success(t('api_keys.key_rotated'));
      fetchApiKeys();
      return response.data.apiKey;
    } catch (error) {
      toast.error('Failed to rotate API key');
      return null;
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success(t('api_keys.copied'));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">{t('api_keys.title')}</h1>
          <p className="page-subtitle">{t('api_keys.manage_keys')}</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          <HiOutlinePlus className="w-5 h-5" />
          {t('api_keys.create_key')}
        </button>
      </div>

      <div className="card">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="loading-spinner"></div>
          </div>
        ) : apiKeys.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔑</div>
            <h3 className="empty-state-title">{t('api_keys.no_keys')}</h3>
            <button onClick={() => setShowModal(true)} className="btn btn-primary">
              {t('api_keys.create_key')}
            </button>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>{t('api_keys.key_name')}</th>
                <th>{t('api_keys.created')}</th>
                <th>{t('api_keys.last_used')}</th>
                <th>{t('api_keys.expires')}</th>
                <th>{t('api_keys.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {apiKeys.map((key, index) => (
                <tr key={index}>
                  <td className="font-medium">{key.name}</td>
                  <td>{new Date(key.createdAt).toLocaleDateString()}</td>
                  <td>{key.lastUsed ? new Date(key.lastUsed).toLocaleDateString() : t('api_keys.never')}</td>
                  <td>{key.expiresAt ? new Date(key.expiresAt).toLocaleDateString() : 'Never'}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => rotateApiKey(index)}
                        className="btn btn-sm btn-secondary"
                        title={t('api_keys.rotate')}
                      >
                        <HiOutlineRefresh className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteApiKey(index)}
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
        )}
      </div>

      {showModal && (
        <CreateKeyModal onClose={() => setShowModal(false)} onCreate={createApiKey} />
      )}
    </div>
  );
}

function CreateKeyModal({ onClose, onCreate }) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [newKey, setNewKey] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const key = await onCreate(name);
    if (key) {
      setNewKey(key);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(newKey);
    toast.success(t('api_keys.copied'));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-6">
        {newKey ? (
          <>
            <h2 className="text-xl font-bold mb-4">{t('api_keys.key_created')}</h2>
            <p className="text-sm text-gray-600 mb-4">
              Please copy your API key now. You won't be able to see it again.
            </p>
            <div className="bg-gray-50 rounded-lg p-3 mb-4 flex items-center justify-between">
              <code className="text-sm break-all">{newKey}</code>
              <button onClick={copyToClipboard} className="ml-2">
                <HiOutlineClipboardCopy className="w-5 h-5" />
              </button>
            </div>
            <button onClick={onClose} className="btn btn-primary w-full">
              {t('common.close')}
            </button>
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold mb-4">{t('api_keys.create_key')}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="label">{t('api_keys.key_name')}</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input"
                  required
                  placeholder="My API Key"
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
          </>
        )}
      </div>
    </div>
  );
}

export default ApiKeys;