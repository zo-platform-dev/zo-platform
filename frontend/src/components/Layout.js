import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HiOutlineHome, HiOutlineDocumentText, HiOutlineTemplate, HiOutlineDatabase, HiOutlineKey, HiOutlineCog, HiOutlineLogout } from 'react-icons/hi';
import { useAuthStore } from '../store/authStore';

function Layout() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(newLang);
  };

  const navItems = [
    { path: '/', icon: HiOutlineHome, label: t('dashboard.title') },
    { path: '/tasks', icon: HiOutlineDocumentText, label: t('tasks.title') },
    { path: '/templates', icon: HiOutlineTemplate, label: t('templates.title') },
    { path: '/results', icon: HiOutlineDatabase, label: t('results.title') },
    { path: '/api-keys', icon: HiOutlineKey, label: t('api_keys.title') },
    { path: '/settings', icon: HiOutlineCog, label: t('settings.title') }
  ];

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 border-l border-b border-gray-200 bg-white fixed h-full z-10">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <span className="w-8 h-8 bg-black text-white flex items-center justify-center rounded">Z</span>
            {t('common.app_name')}
          </h1>
        </div>

        <nav className="p-4">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                      isActive
                        ? 'bg-black text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <button
            onClick={toggleLanguage}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 mb-2 text-sm border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
          >
            <span className="font-medium">{i18n.language === 'en' ? 'العربية' : 'English'}</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-600 border border-red-200 rounded-md hover:bg-red-50 transition-colors"
          >
            <HiOutlineLogout className="w-5 h-5" />
            {t('common.logout')}
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-64">
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">{t('dashboard.welcome')}</h2>
              <p className="text-sm text-gray-500">{user?.name || user?.email}</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">
                {new Date().toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
          </div>
        </header>

        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default Layout;