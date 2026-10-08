import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

function Settings() {
  const { t, i18n } = useTranslation();
  const { user, updateProfile, changePassword } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [profileForm, setProfileForm] = useState({ name: '', email: '' });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (user) {
      setProfileForm({ name: user.name || '', email: user.email || '' });
    }
  }, [user]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    const result = await updateProfile(profileForm);
    if (result.success) {
      toast.success(t('settings.changes_saved'));
    } else {
      toast.error(result.error);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error(t('auth.passwords_dont_match'));
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error(t('auth.password_too_short'));
      return;
    }
    const result = await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
    if (result.success) {
      toast.success(t('settings.password_changed'));
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } else {
      toast.error(result.error);
    }
  };

  const handleLanguageChange = (lang) => {
    i18n.changeLanguage(lang);
    toast.success('Language changed');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">{t('settings.title')}</h1>
        <p className="page-subtitle">{t('settings.preferences')}</p>
      </div>

      <div className="grid grid-cols-4 gap-6">
        <div className="col-span-1">
          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab('profile')}
              className={`block w-full text-left px-4 py-2 rounded-lg ${
                activeTab === 'profile' ? 'bg-black text-white' : 'hover:bg-gray-100'
              }`}
            >
              {t('settings.account')}
            </button>
            <button
              onClick={() => setActiveTab('preferences')}
              className={`block w-full text-left px-4 py-2 rounded-lg ${
                activeTab === 'preferences' ? 'bg-black text-white' : 'hover:bg-gray-100'
              }`}
            >
              {t('settings.preferences')}
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`block w-full text-left px-4 py-2 rounded-lg ${
                activeTab === 'security' ? 'bg-black text-white' : 'hover:bg-gray-100'
              }`}
            >
              {t('settings.security')}
            </button>
          </nav>
        </div>

        <div className="col-span-3">
          <div className="card">
            {activeTab === 'profile' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">{t('settings.account')}</h3>
                <form onSubmit={handleProfileSubmit}>
                  <div className="space-y-4">
                    <div className="form-group">
                      <label className="label">{t('settings.name')}</label>
                      <input
                        type="text"
                        value={profileForm.name}
                        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                        className="input"
                      />
                    </div>
                    <div className="form-group">
                      <label className="label">{t('settings.email')}</label>
                      <input
                        type="email"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                        className="input"
                      />
                    </div>
                    <div className="flex justify-end">
                      <button type="submit" className="btn btn-primary">
                        {t('settings.save_changes')}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'preferences' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">{t('settings.preferences')}</h3>
                <div className="space-y-6">
                  <div className="form-group">
                    <label className="label">{t('settings.language')}</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleLanguageChange('en')}
                        className={`btn btn-secondary ${i18n.language === 'en' ? 'bg-black text-white' : ''}`}
                      >
                        English
                      </button>
                      <button
                        onClick={() => handleLanguageChange('ar')}
                        className={`btn btn-secondary ${i18n.language === 'ar' ? 'bg-black text-white' : ''}`}
                      >
                        العربية
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="label">{t('settings.theme')}</label>
                    <div className="flex gap-2">
                      <button className="btn btn-secondary bg-white text-black">
                        {t('settings.light')}
                      </button>
                      <button className="btn btn-secondary bg-gray-800 text-white">
                        {t('settings.dark')}
                      </button>
                      <button className="btn btn-secondary">
                        {t('settings.auto')}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="label">{t('settings.notifications')}</label>
                    <div className="space-y-3">
                      <label className="flex items-center gap-3">
                        <input type="checkbox" defaultChecked className="rounded" />
                        <span>{t('settings.email_notifications')}</span>
                      </label>
                      <label className="flex items-center gap-3">
                        <input type="checkbox" className="rounded" />
                        <span>{t('settings.webhook_notifications')}</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">{t('settings.security')}</h3>
                <form onSubmit={handlePasswordSubmit}>
                  <div className="space-y-4">
                    <div className="form-group">
                      <label className="label">{t('settings.current_password')}</label>
                      <input
                        type="password"
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        className="input"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="label">{t('settings.new_password')}</label>
                      <input
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        className="input"
                        required
                        minLength={6}
                      />
                    </div>
                    <div className="form-group">
                      <label className="label">{t('settings.confirm_new_password')}</label>
                      <input
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        className="input"
                        required
                      />
                    </div>
                    <div className="flex justify-end">
                      <button type="submit" className="btn btn-primary">
                        {t('settings.change_password')}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;