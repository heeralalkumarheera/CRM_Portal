import { useState } from 'react';
import { FiSave, FiPlus, FiX, FiMail, FiShield, FiCheck } from 'react-icons/fi';
import { usePreferences } from '../../context/PreferencesContext';
import { toast } from 'react-toastify';

// General Settings Tab
export const GeneralSettings = ({ settings, onSave, saving, isAdmin }) => {
  const [companyName, setCompanyName] = useState('ACCEPTARE CRM');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY');
  const [currency, setCurrency] = useState('INR');

  return (
    <div className="max-w-4xl">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">General Settings</h2>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Company Name</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              disabled={!isAdmin}
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Timezone</label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                disabled={!isAdmin}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50 disabled:text-gray-500"
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="America/New_York">America/New York (EST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
                <option value="Asia/Dubai">Asia/Dubai (GST)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Date Format</label>
              <select
                value={dateFormat}
                onChange={(e) => setDateFormat(e.target.value)}
                disabled={!isAdmin}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50 disabled:text-gray-500"
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              disabled={!isAdmin}
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50 disabled:text-gray-500"
            >
              <option value="INR">₹ INR - Indian Rupee</option>
              <option value="USD">$ USD - US Dollar</option>
              <option value="EUR">€ EUR - Euro</option>
              <option value="GBP">£ GBP - British Pound</option>
            </select>
          </div>

          {isAdmin && (
            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={() => onSave({ companyName, timezone, dateFormat, currency })}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
              >
                <FiSave className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// CRM Configuration Tab
export const CRMSettings = ({ settings, onSave, saving }) => {
  const [salesStages, setSalesStages] = useState(settings?.salesStages || []);
  const [leadSources, setLeadSources] = useState(settings?.leadSources || []);
  const [lostReasons, setLostReasons] = useState(settings?.lostReasons || []);

  const addItem = (list, setList) => {
    const value = prompt('Enter new value:');
    if (value && value.trim()) {
      setList([...list, value.trim()]);
    }
  };

  const removeItem = (list, setList, index) => {
    setList(list.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    onSave({ salesStages, leadSources, lostReasons });
  };

  return (
    <div className="max-w-6xl">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ConfigCard
          title="Sales Stages"
          items={salesStages}
          onAdd={() => addItem(salesStages, setSalesStages)}
          onRemove={(idx) => removeItem(salesStages, setSalesStages, idx)}
        />
        <ConfigCard
          title="Lead Sources"
          items={leadSources}
          onAdd={() => addItem(leadSources, setLeadSources)}
          onRemove={(idx) => removeItem(leadSources, setLeadSources, idx)}
        />
        <ConfigCard
          title="Lost Reasons"
          items={lostReasons}
          onAdd={() => addItem(lostReasons, setLostReasons)}
          onRemove={(idx) => removeItem(lostReasons, setLostReasons, idx)}
        />
      </div>

      <div className="mt-6">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
        >
          <FiSave className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save All Changes'}
        </button>
      </div>
    </div>
  );
};

const ConfigCard = ({ title, items, onAdd, onRemove }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-bold text-gray-900">{title}</h3>
      <button
        onClick={onAdd}
        className="p-2 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200 transition"
      >
        <FiPlus className="w-4 h-4" />
      </button>
    </div>
    <ul className="space-y-2">
      {items.map((item, idx) => (
        <li key={idx} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg group">
          <span className="text-sm text-gray-700">{item}</span>
          <button
            onClick={() => onRemove(idx)}
            className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-50 rounded transition"
          >
            <FiX className="w-4 h-4" />
          </button>
        </li>
      ))}
    </ul>
  </div>
);

// Notification Settings Tab
export const NotificationSettings = ({ isAdmin }) => {
  const [emailNotif, setEmailNotif] = useState(true);
  const [browserNotif, setBrowserNotif] = useState(true);
  const [leadAssigned, setLeadAssigned] = useState(true);
  const [taskDue, setTaskDue] = useState(true);
  const [invoiceOverdue, setInvoiceOverdue] = useState(true);

  return (
    <div className="max-w-4xl">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Notification Preferences</h2>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-semibold text-gray-900">Email Notifications</h4>
              <p className="text-sm text-gray-600">Receive notifications via email</p>
            </div>
            <ToggleSwitch checked={emailNotif} onChange={setEmailNotif} />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-semibold text-gray-900">Browser Notifications</h4>
              <p className="text-sm text-gray-600">Show desktop notifications</p>
            </div>
            <ToggleSwitch checked={browserNotif} onChange={setBrowserNotif} />
          </div>

          <div className="pt-4 border-t border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">Event Notifications</h3>
            <div className="space-y-4">
              <NotifToggle
                label="Lead Assigned"
                description="Get notified when a lead is assigned to you"
                checked={leadAssigned}
                onChange={setLeadAssigned}
              />
              <NotifToggle
                label="Task Due Soon"
                description="Reminder when tasks are approaching due date"
                checked={taskDue}
                onChange={setTaskDue}
              />
              <NotifToggle
                label="Invoice Overdue"
                description="Alert when invoices become overdue"
                checked={invoiceOverdue}
                onChange={setInvoiceOverdue}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <button className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
              <FiSave className="w-4 h-4" />
              Save Preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const NotifToggle = ({ label, description, checked, onChange }) => (
  <div className="flex items-center justify-between">
    <div>
      <h4 className="font-medium text-gray-900">{label}</h4>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
    <ToggleSwitch checked={checked} onChange={onChange} />
  </div>
);

const ToggleSwitch = ({ checked, onChange }) => (
  <label className="relative inline-flex items-center cursor-pointer">
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="sr-only peer"
    />
    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
  </label>
);

// Email Settings Tab
export const EmailSettings = () => {
  return (
    <div className="max-w-4xl">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Email Configuration</h2>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">SMTP Host</label>
              <input
                type="text"
                placeholder="smtp.gmail.com"
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">SMTP Port</label>
              <input
                type="number"
                placeholder="587"
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">From Email</label>
            <input
              type="email"
              placeholder="noreply@acceptarecrm.com"
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
              <input
                type="text"
                placeholder="your-email@gmail.com"
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <FiMail className="w-5 h-5 text-blue-600" />
            <div className="flex-1">
              <h4 className="font-semibold text-blue-900">Test Email Configuration</h4>
              <p className="text-sm text-blue-700">Send a test email to verify your SMTP settings</p>
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              Send Test
            </button>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <button className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
              <FiSave className="w-4 h-4" />
              Save Email Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Security Settings Tab
export const SecuritySettings = () => {
  const [passwordExpiry, setPasswordExpiry] = useState(90);
  const [sessionTimeout, setSessionTimeout] = useState(30);
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(5);

  return (
    <div className="max-w-4xl">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Security Settings</h2>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password Expiry (days)</label>
              <input
                type="number"
                value={passwordExpiry}
                onChange={(e) => setPasswordExpiry(e.target.value)}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <p className="text-xs text-gray-500 mt-1">Users will be prompted to change password after this period</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Session Timeout (minutes)</label>
              <input
                type="number"
                value={sessionTimeout}
                onChange={(e) => setSessionTimeout(e.target.value)}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <p className="text-xs text-gray-500 mt-1">Auto logout after period of inactivity</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Max Login Attempts</label>
            <input
              type="number"
              value={loginAttempts}
              onChange={(e) => setLoginAttempts(e.target.value)}
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <p className="text-xs text-gray-500 mt-1">Account will be locked after this many failed attempts</p>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-semibold text-gray-900">Two-Factor Authentication</h4>
              <p className="text-sm text-gray-600">Require 2FA for all users</p>
            </div>
            <ToggleSwitch checked={twoFactorAuth} onChange={setTwoFactorAuth} />
          </div>

          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-3">
              <FiShield className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-yellow-900">Security Recommendations</h4>
                <ul className="text-sm text-yellow-800 mt-2 space-y-1">
                  <li className="flex items-center gap-2">
                    <FiCheck className="w-4 h-4" />
                    Enable two-factor authentication for enhanced security
                  </li>
                  <li className="flex items-center gap-2">
                    <FiCheck className="w-4 h-4" />
                    Regularly review user access permissions
                  </li>
                  <li className="flex items-center gap-2">
                    <FiCheck className="w-4 h-4" />
                    Keep session timeout reasonably short (15-30 minutes)
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <button className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
              <FiSave className="w-4 h-4" />
              Save Security Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// User Preferences Tab
export const UserPreferences = () => {
  const { preferences, setTheme, setLanguage, setItemsPerPage, savePreferences } = usePreferences();
  const [theme, setThemeLocal] = useState(preferences.theme);
  const [language, setLanguageLocal] = useState(preferences.language);
  const [itemsPerPage, setItemsPerPageLocal] = useState(preferences.itemsPerPage);

  return (
    <div className="max-w-4xl">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">User Preferences</h2>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Theme</label>
            <select
              value={theme}
              onChange={(e) => setThemeLocal(e.target.value)}
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="auto">Auto (System)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Language</label>
            <select
              value={language}
              onChange={(e) => setLanguageLocal(e.target.value)}
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="en">English</option>
              <option value="hi">हिंदी (Hindi)</option>
              <option value="es">Español (Spanish)</option>
              <option value="fr">Français (French)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Items Per Page</label>
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPageLocal(e.target.value)}
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">Number of records to display in tables</p>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                savePreferences({ theme, language, itemsPerPage });
                setTheme(theme);
                setLanguage(language);
                setItemsPerPage(itemsPerPage);
                toast.success('Preferences saved');
              }}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              <FiSave className="w-4 h-4" />
              Save Preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
