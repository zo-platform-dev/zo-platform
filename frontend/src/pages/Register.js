import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { register, loading } = useAuthStore();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error(t('auth.passwords_dont_match'));
      return;
    }

    if (formData.password.length < 6) {
      toast.error(t('auth.password_too_short'));
      return;
    }

    const result = await register(formData.name, formData.email, formData.password);

    if (result.success) {
      toast.success(t('auth.register_success'));
      navigate('/');
    } else {
      toast.error(result.error || t('auth.register_error'));
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
          <h2 className="text-3xl font-bold">{t('auth.signup')}</h2>
          <p className="mt-2 text-sm text-gray-600">{t('common.welcome')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-group">
            <label className="label">{t('auth.name')}</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              required
            />
          </div>

          <div className="form-group">
            <label className="label">{t('auth.email')}</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="input"
              required
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
              minLength={6}
            />
          </div>

          <div className="form-group">
            <label className="label">{t('auth.confirm_password')}</label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="input"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full"
          >
            {loading ? t('common.loading') : t('auth.register')}
          </button>

          <div className="text-center text-sm">
            <span className="text-gray-600">{t('auth.already_have_account')}</span>
            {' '}
            <Link to="/login" className="font-medium text-black hover:underline">
              {t('auth.signin')}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Register;