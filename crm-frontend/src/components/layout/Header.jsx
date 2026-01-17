import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { FiMenu, FiBell, FiUser, FiSettings, FiLogOut, FiChevronDown, FiClock } from 'react-icons/fi';
import { taskAPI } from '../../services/apiService';

const Header = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [time, setTime] = useState(new Date());
  const [notifications, setNotifications] = useState([]);
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);

  // Update time
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Load notifications
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const res = await taskAPI.getAll({ status: 'To Do', limit: 5 });
        const tasks = res?.data?.data || [];
        setNotifications(tasks.slice(0, 5));
      } catch (err) {
        console.error('Failed to load notifications:', err);
      }
    };
    loadNotifications();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getCurrentGreeting = () => {
    const hour = time.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <header className="bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-sm h-16 flex items-center justify-between px-6 border-b border-gray-200 dark:border-gray-700">
      {/* Left side */}
      <div className="flex items-center space-x-4">
        <button
          onClick={toggleSidebar}
          className="lg:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-indigo-600 transition-all duration-200"
        >
          <FiMenu size={24} />
        </button>
        
        {/* Greeting */}
        <div className="hidden md:block">
          <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">{getCurrentGreeting()}, <span className="text-indigo-600 dark:text-indigo-300 font-semibold">{user?.firstName}</span>!</p>
          <p className="text-xs text-gray-400 dark:text-gray-400 flex items-center space-x-1">
            <FiClock size={12} />
            <span>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </p>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center space-x-6">
        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-indigo-600 transition-all duration-200 group"
          >
            <div className="p-1">
              <FiBell size={20} className="group-hover:scale-110 transition-transform" />
              {notifications.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-gradient-to-br from-red-500 to-red-600 rounded-full text-xs text-white flex items-center justify-center font-semibold shadow-lg">
                  {notifications.length}
                </span>
              )}
            </div>
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-2xl py-2 z-50 border border-gray-100 dark:border-gray-700 max-h-96 overflow-y-auto">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-gray-700 dark:to-gray-700">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Pending Tasks</h3>
              </div>
              
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                  No pending tasks
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {notifications.map((task) => (
                    <Link
                      key={task._id}
                      to="/tasks"
                      onClick={() => setNotifOpen(false)}
                      className="block px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                    >
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{task.title}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{task.taskType} • {task.priority}</p>
                      {task?.relatedTo?.module && task?.relatedTo?.recordId && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {task.relatedTo.module === 'Client' && (task.relatedTo.recordId.clientName || task.relatedTo.recordId.companyName)}
                          {task.relatedTo.module === 'Lead' && task.relatedTo.recordId.contactName}
                          {task.relatedTo.module === 'Invoice' && `Invoice: ${task.relatedTo.recordId.invoiceNumber}`}
                          {task.relatedTo.module === 'Quotation' && `Quotation: ${task.relatedTo.recordId.quotationNumber}`}
                          {task.relatedTo.module === 'AMC' && `AMC: ${task.relatedTo.recordId.amcNumber}`}
                        </p>
                      )}
                      <p className="text-xs text-indigo-600 mt-1">
                        Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
              
              <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700">
                <Link
                  to="/tasks"
                  onClick={() => setNotifOpen(false)}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  View all tasks →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 group"
          >
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg group-hover:shadow-indigo-500/50 transition-shadow">
              <span className="text-white font-semibold text-sm">
                {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
              </span>
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-indigo-600 dark:text-indigo-300 font-medium">{user?.role}</p>
            </div>
            <FiChevronDown 
              size={16} 
              className={`hidden md:block text-gray-500 dark:text-gray-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} 
            />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 border border-gray-100 dark:border-gray-700">
              {/* User Info in Dropdown */}
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-gray-700 dark:to-gray-700">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{user?.email}</p>
                <div className="mt-2 inline-block px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-medium">
                  {user?.role}
                </div>
              </div>

              {/* Menu Items */}
              <Link
                to="/profile"
                className="flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-gray-700 hover:text-indigo-600 transition-all duration-200"
                onClick={() => setDropdownOpen(false)}
              >
                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <FiUser size={16} className="text-indigo-600" />
                </div>
                <span className="font-medium">View Profile</span>
              </Link>

              <Link
                to="/settings"
                className="flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-all duration-200"
                onClick={() => setDropdownOpen(false)}
              >
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FiSettings size={16} className="text-purple-600" />
                </div>
                <span className="font-medium">Settings</span>
              </Link>

              <hr className="my-2 border-gray-100 dark:border-gray-700" />

              <button
                onClick={handleLogout}
                className="flex items-center space-x-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-gray-700 transition-all duration-200 w-full"
              >
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <FiLogOut size={16} className="text-red-600" />
                </div>
                <span className="font-medium">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
