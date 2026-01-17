import { Link } from 'react-router-dom';
import { FiArrowRight, FiClock, FiMoreHorizontal } from 'react-icons/fi';

const RecentList = ({ title, items = [], type, emptyMessage = 'No items found' }) => {
  const getStatusColor = (status) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      active: 'bg-green-100 text-green-800 border border-green-200',
      completed: 'bg-blue-100 text-blue-800 border border-blue-200',
      overdue: 'bg-red-100 text-red-800 border border-red-200',
      paid: 'bg-green-100 text-green-800 border border-green-200',
      unpaid: 'bg-red-100 text-red-800 border border-red-200',
      draft: 'bg-gray-100 text-gray-800 border border-gray-200',
      sent: 'bg-blue-100 text-blue-800 border border-blue-200',
    };
    return statusColors[status?.toLowerCase()] || 'bg-gray-100 text-gray-800 border border-gray-200';
  };

  const displayItems = items;

  const getListIcon = () => {
    switch(type) {
      case 'leads': return '📊';
      case 'tasks': return '✓';
      case 'invoices': return '💰';
      default: return '📋';
    }
  };

  const renderItem = (item, index) => {
    switch (type) {
      case 'leads':
        return (
          <div className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center flex-shrink-0 group-hover:from-indigo-200 group-hover:to-purple-200 transition-colors">
              <span className="text-sm font-bold text-indigo-600">{index + 1}</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">{item.name}</p>
              <p className="text-xs text-gray-600">{item.value}</p>
            </div>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
              {item.status}
            </span>
          </div>
        );
      
      case 'tasks':
        return (
          <div className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center flex-shrink-0 group-hover:from-pink-200 group-hover:to-rose-200 transition-colors">
              <span className="text-sm font-bold text-pink-600">{index + 1}</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">{item.title}</p>
              <div className="flex items-center space-x-1 mt-1">
                <FiClock className="w-3 h-3 text-gray-500" />
                <p className="text-xs text-gray-600">
                  {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(item.dueDate)}
                </p>
              </div>
            </div>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
              {item.status}
            </span>
          </div>
        );
      
      case 'invoices':
        return (
          <div className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center flex-shrink-0 group-hover:from-green-200 group-hover:to-emerald-200 transition-colors">
              <span className="text-sm font-bold text-green-600">{index + 1}</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">{item.number}</p>
              <p className="text-xs text-gray-600">{item.client}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900">{item.amount}</p>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                {item.status}
              </span>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  const typeLabels = {
    leads: 'Leads',
    tasks: 'Tasks',
    invoices: 'Invoices',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-white to-gray-50 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{getListIcon()}</span>
          <div>
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            <p className="text-xs text-gray-600 mt-0.5">{typeLabels[type] || 'Items'}</p>
          </div>
        </div>
        <Link
          to={`/${type}`}
          className="p-2 rounded-lg text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 transition-all"
          title="View all"
        >
          <FiMoreHorizontal size={18} />
        </Link>
      </div>
      
      {/* List */}
      {displayItems.length > 0 ? (
        <div className="divide-y divide-gray-100">
          {displayItems.map((item, index) => (
            <div key={item.id} className="px-6 py-3.5 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-transparent transition-all duration-200 group">
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-2">📭</div>
          <p className="text-sm font-medium">{emptyMessage}</p>
        </div>
      )}

      {/* Footer */}
      <div className="px-6 py-3 border-t border-gray-100 bg-gray-50">
        <Link
          to={`/${type}`}
          className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center space-x-1 group transition-colors"
        >
          <span>View all {typeLabels[type]}</span>
          <FiArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
        </Link>
      </div>
    </div>
  );
};

export default RecentList;
