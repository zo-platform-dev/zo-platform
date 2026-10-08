import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login, loading } = useAuthStore();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(formData.email, formData.password);

    if (result.success) {
      toast.success(t('auth.login_success'));
      navigate('/');
    } else {
      toast.error(result.error || t('auth.login_error'));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white border border-gray-200 rounded-lg">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <span className="w-12 h-12 bg-black text-white flex items-center justify-center rounded text-2xl font-bold">
              Z
            </span>
          </div>
          <h2 className="text-3xl font-bold">{t('auth.signin')}</h2>
          <p className="mt-2 text-sm text-gray-600">{t('common.welcome')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="form-group">
            <label className="label">{t('auth.email')}</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="input"
              required
              placeholder="you@example.com"
            />
          </div>

          <div className="form-group">
            <label className="label">{t('auth.password')}</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="input"
              required
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full"
          >
            {loading ? t('common.loading') : t('auth.login')}
          </button>

          <div className="text-center text-sm">
            <span className="text-gray-600">{t('auth.dont_have_account')}</span>
            {' '}
            <Link to="/register" className="font-medium text-black hover:underline">
              {t('auth.signup')}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;