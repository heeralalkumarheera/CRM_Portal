import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  FiHome,
  FiUsers,
  FiTrendingUp,
  FiFileText,
  FiDollarSign,
  FiClipboard,
  FiCreditCard,
  FiShield,
  FiSettings,
  FiX,
  FiPhone,
  FiLogOut,
  FiBriefcase,
  FiCalendar,
} from 'react-icons/fi';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Show all menu items to all users
  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: FiHome },
    { name: 'Clients', path: '/clients', icon: FiUsers },
    { name: 'Leads', path: '/leads', icon: FiTrendingUp },
    { name: 'Quotations', path: '/quotations', icon: FiFileText },
    { name: 'Invoices', path: '/invoices', icon: FiDollarSign },
    { name: 'AMC', path: '/amc', icon: FiShield },
    { name: 'Tasks', path: '/tasks', icon: FiClipboard },
    { name: 'Payments', path: '/payments', icon: FiCreditCard },
    { name: 'Call Logs', path: '/call-logs', icon: FiPhone },
    { name: 'Calendar', path: '/calendar', icon: FiCalendar },
    { name: 'Settings', path: '/settings', icon: FiSettings },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-30
          w-64 bg-gradient-to-b from-slate-800 to-slate-900 shadow-2xl transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col h-screen
        `}
      >
        {/* Logo Section */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-700">
          <Link to="/dashboard" className="flex items-center space-x-3 group">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-indigo-500/50 transition-shadow">
              <FiBriefcase className="text-white" size={18} />
            </div>
            <div>
              <span className="text-white font-bold text-sm">ACCEPTARE</span>
              <p className="text-xs text-indigo-300">CRM</p>
            </div>
          </Link>
          <button
            onClick={toggleSidebar}
            className="lg:hidden text-gray-400 hover:text-white transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* User Info Section */}
        <div className="px-4 py-4 border-b border-slate-700 bg-slate-900/50">
          <div className="bg-slate-700/50 rounded-lg p-3 backdrop-blur">
            <p className="text-sm font-semibold text-white truncate">{user?.firstName} {user?.lastName}</p>
            <p className="text-xs text-indigo-400 mt-1 font-medium">{user?.role}</p>
            <p className="text-xs text-gray-400 mt-1 truncate">{user?.email}</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={() => toggleSidebar()}
                    className={`
                      flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-all duration-200 group
                      ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/50'
                          : 'text-gray-300 hover:bg-slate-700 hover:text-white'
                      }
                    `}
                  >
                    <Icon size={20} className={isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'} />
                    <span className="text-sm font-medium">{item.name}</span>
                    {isActive && (
                      <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-slate-700 bg-slate-900/50">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg transition-all duration-200 font-medium shadow-lg hover:shadow-red-600/50"
          >
            <FiLogOut size={18} />
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
