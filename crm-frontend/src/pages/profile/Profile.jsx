import { useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorBoundary from '../../components/common/ErrorBoundary';
import { useAuth } from '../../context/AuthContext';

const Profile = () => {
  const { user, loading, updatePassword, logout } = useAuth();
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);

  const displayName = useMemo(() => {
    if (!user) return '—';
    const full = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
    return full || user.name || user.email || '—';
  }, [user]);

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswords(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!passwords.currentPassword || !passwords.newPassword || !passwords.confirmPassword) {
      toast.error('Please fill all password fields');
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error('New password and confirmation do not match');
      return;
    }
    if (passwords.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }

    setSaving(true);
    const payload = { currentPassword: passwords.currentPassword, newPassword: passwords.newPassword };
    const result = await updatePassword(payload);
    setSaving(false);
    if (result?.success) {
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    }
  };

  if (loading) return <LoadingSpinner message="Loading profile..." />;
  if (!user) return <div className="p-6 text-red-600">No user data available. Please log in again.</div>;

  const infoRows = [
    { label: 'Name', value: displayName },
    { label: 'Email', value: user.email || '—' },
    { label: 'Role', value: user.role || '—' },
    { label: 'Phone', value: user.phone || user.mobile || '—' },
    { label: 'Department', value: user.department || '—' },
  ];

  const permissions = Array.isArray(user.permissions) ? user.permissions : [];

  return (
    <ErrorBoundary>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Account</p>
            <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
            <p className="text-gray-600">Manage your account details and security.</p>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Logout
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Profile Details</h2>
                <p className="text-sm text-gray-500">Pulled from your account</p>
              </div>
            </div>

            <div className="divide-y divide-gray-100">
              {infoRows.map(row => (
                <div key={row.label} className="py-3 flex justify-between">
                  <span className="text-sm text-gray-500">{row.label}</span>
                  <span className="text-sm font-medium text-gray-900">{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Security</h2>
            <p className="text-sm text-gray-500">Update your password to keep your account secure.</p>

            <form className="space-y-3" onSubmit={handlePasswordSubmit}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwords.currentPassword}
                  onChange={handlePasswordChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwords.newPassword}
                  onChange={handlePasswordChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwords.confirmPassword}
                  onChange={handlePasswordChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Permissions</h2>
              <p className="text-sm text-gray-500">Capabilities granted to your role.</p>
            </div>
            <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">{permissions.length} permissions</span>
          </div>
          {permissions.length === 0 ? (
            <p className="text-sm text-gray-500">No permissions assigned.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {permissions.map((perm) => (
                <span key={perm} className="text-xs px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 font-medium">
                  {perm}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default Profile;
