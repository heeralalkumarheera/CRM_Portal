import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiUserPlus, FiTrendingUp, FiFileText, FiDollarSign, FiCalendar, FiShoppingCart, FiArrowRight, FiPhone, FiCheck } from 'react-icons/fi';

const QuickActions = () => {
  const { user } = useAuth();

  // Role-based actions
  const allActions = {
    'Super Admin': [
      { title: 'Add Client', description: 'Create new client', icon: FiUserPlus, color: 'bg-blue-500', link: '/clients?action=new' },
      { title: 'New Lead', description: 'Add new lead', icon: FiTrendingUp, color: 'bg-green-500', link: '/leads?action=new' },
      { title: 'Create Quotation', description: 'Generate quote', icon: FiFileText, color: 'bg-purple-500', link: '/quotations?action=new' },
      { title: 'Create Invoice', description: 'New invoice', icon: FiDollarSign, color: 'bg-orange-500', link: '/invoices?action=new' },
      { title: 'Schedule Task', description: 'Add new task', icon: FiCalendar, color: 'bg-pink-500', link: '/tasks?action=new' },
      { title: 'New AMC', description: 'Create AMC', icon: FiShoppingCart, color: 'bg-teal-500', link: '/amc?action=new' },
    ],
    'Admin': [
      { title: 'Add Client', description: 'Create new client', icon: FiUserPlus, color: 'bg-blue-500', link: '/clients?action=new' },
      { title: 'New Lead', description: 'Add new lead', icon: FiTrendingUp, color: 'bg-green-500', link: '/leads?action=new' },
      { title: 'Create Quotation', description: 'Generate quote', icon: FiFileText, color: 'bg-purple-500', link: '/quotations?action=new' },
      { title: 'Create Invoice', description: 'New invoice', icon: FiDollarSign, color: 'bg-orange-500', link: '/invoices?action=new' },
    ],
    'Sales Executive': [
      { title: 'New Lead', description: 'Add new lead', icon: FiTrendingUp, color: 'bg-green-500', link: '/leads?action=new' },
      { title: 'Add Client', description: 'Create new client', icon: FiUserPlus, color: 'bg-blue-500', link: '/clients?action=new' },
      { title: 'Create Quotation', description: 'Generate quote', icon: FiFileText, color: 'bg-purple-500', link: '/quotations?action=new' },
      { title: 'Schedule Task', description: 'Add new task', icon: FiCalendar, color: 'bg-pink-500', link: '/tasks?action=new' },
    ],
    'Accountant': [
      { title: 'Create Invoice', description: 'New invoice', icon: FiDollarSign, color: 'bg-orange-500', link: '/invoices?action=new' },
      { title: 'Record Payment', description: 'Add payment', icon: FiCheck, color: 'bg-green-500', link: '/payments?action=new' },
      { title: 'View Reports', description: 'Financial reports', icon: FiFileText, color: 'bg-purple-500', link: '/reports' },
      { title: 'Quotation', description: 'View quotations', icon: FiFileText, color: 'bg-blue-500', link: '/quotations' },
    ],
    'Manager': [
      { title: 'New Lead', description: 'Add new lead', icon: FiTrendingUp, color: 'bg-green-500', link: '/leads?action=new' },
      { title: 'Add Client', description: 'Create new client', icon: FiUserPlus, color: 'bg-blue-500', link: '/clients?action=new' },
      { title: 'Schedule Task', description: 'Add new task', icon: FiCalendar, color: 'bg-pink-500', link: '/tasks?action=new' },
      { title: 'New AMC', description: 'Create AMC', icon: FiShoppingCart, color: 'bg-teal-500', link: '/amc?action=new' },
    ],
    'Support Staff': [
      { title: 'Schedule Task', description: 'Add new task', icon: FiCalendar, color: 'bg-pink-500', link: '/tasks?action=new' },
      { title: 'Log Call', description: 'Add call log', icon: FiPhone, color: 'bg-indigo-500', link: '/call-logs?action=new' },
      { title: 'View Tasks', description: 'My tasks', icon: FiCheck, color: 'bg-green-500', link: '/tasks' },
    ],
  };

  const actions = allActions[user?.role] || allActions['Support Staff'];

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-lg transition-all duration-300">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">Quick Actions</h3>
        <span className="text-xs font-semibold px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full">
          {actions.length} Actions
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {actions.map((action, index) => {
          const bgGradient = action.color === 'bg-blue-500' ? 'from-blue-600 to-blue-400' :
                            action.color === 'bg-green-500' ? 'from-green-600 to-green-400' :
                            action.color === 'bg-purple-500' ? 'from-purple-600 to-purple-400' :
                            action.color === 'bg-orange-500' ? 'from-orange-600 to-orange-400' :
                            action.color === 'bg-pink-500' ? 'from-pink-600 to-pink-400' :
                            action.color === 'bg-teal-500' ? 'from-teal-600 to-teal-400' :
                            action.color === 'bg-indigo-500' ? 'from-indigo-600 to-indigo-400' : 
                            'from-gray-600 to-gray-400';

          return (
            <Link
              key={index}
              to={action.link}
              className="group relative overflow-hidden bg-gradient-to-br from-white to-gray-50 rounded-lg border border-gray-200 p-4 hover:border-transparent hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              {/* Background overlay on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${bgGradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>

              <div className="relative z-10">
                {/* Icon */}
                <div className={`${action.color} bg-opacity-15 group-hover:bg-opacity-25 w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-all duration-300 group-hover:scale-110`}>
                  <action.icon className={`${action.color.replace('bg-', 'text-')} w-5 h-5 group-hover:text-white transition-colors duration-300`} />
                </div>

                {/* Text Content */}
                <p className="text-sm font-semibold text-gray-900 mb-1">{action.title}</p>
                <p className="text-xs text-gray-600 mb-3">{action.description}</p>

                {/* Action Arrow */}
                <div className="flex items-center text-xs font-medium text-gray-600 group-hover:text-gray-900 transition-colors">
                  <span>Click to {action.title.toLowerCase()}</span>
                  <FiArrowRight className="ml-1 w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default QuickActions;
