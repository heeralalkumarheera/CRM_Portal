import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { 
  FiSettings, 
  FiDatabase, 
  FiBell, 
  FiMail, 
  FiShield, 
  FiUsers,
  FiRefreshCw,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { 
  GeneralSettings, 
  CRMSettings, 
  NotificationSettings, 
  EmailSettings, 
  SecuritySettings, 
  UserPreferences 
} from './SettingsComponents';

const Settings = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isAdmin = user?.role === 'Super Admin' || user?.role === 'Admin';

  const tabs = [
    { id: 'general', label: 'General', icon: FiSettings, adminOnly: false },
    { id: 'crm', label: 'CRM Configuration', icon: FiDatabase, adminOnly: true },
    { id: 'notifications', label: 'Notifications', icon: FiBell, adminOnly: false },
    { id: 'email', label: 'Email', icon: FiMail, adminOnly: true },
    { id: 'security', label: 'Security', icon: FiShield, adminOnly: true },
    { id: 'users', label: 'User Preferences', icon: FiUsers, adminOnly: false },
  ];

  const visibleTabs = tabs.filter(tab => !tab.adminOnly || isAdmin);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get(isAdmin ? '/settings' : '/settings/public');
      setSettings(res?.data?.data || res?.data || {});
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load settings');
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (updates) => {
    if (!isAdmin) {
      toast.error('You do not have permission to update settings');
      return;
    }
    
    try {
      setSaving(true);
      await api.put('/settings', updates);
      toast.success('Settings saved successfully');
      await loadSettings();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto" />
          <p className="mt-4 text-gray-600 font-medium">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg">
          <p className="font-medium">Error loading settings</p>
          <p className="text-sm mt-1">{error}</p>
          <button onClick={loadSettings} className="mt-3 text-sm underline hover:no-underline">
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-600 mt-1">Manage your CRM system configuration and preferences</p>
            </div>
            <button 
              onClick={loadSettings} 
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
            >
              <FiRefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>

          {/* Tabs */}
          <div className="mt-6 flex gap-2 overflow-x-auto">
            {visibleTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'general' && <GeneralSettings settings={settings} onSave={saveSettings} saving={saving} isAdmin={isAdmin} />}
        {activeTab === 'crm' && <CRMSettings settings={settings} onSave={saveSettings} saving={saving} />}
        {activeTab === 'notifications' && <NotificationSettings settings={settings} onSave={saveSettings} saving={saving} isAdmin={isAdmin} />}
        {activeTab === 'email' && <EmailSettings settings={settings} onSave={saveSettings} saving={saving} />}
        {activeTab === 'security' && <SecuritySettings settings={settings} onSave={saveSettings} saving={saving} />}
        {activeTab === 'users' && <UserPreferences settings={settings} />}
      </div>
    </div>
  );
};

export default Settings;
