import { FiUser, FiDollarSign, FiFileText, FiCheckCircle, FiAlertCircle, FiArrowRight } from 'react-icons/fi';

const ActivityFeed = ({ activities = [] }) => {
  const displayActivities = activities;

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + 'y ago';
    
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + 'mo ago';
    
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + 'd ago';
    
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + 'h ago';
    
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + 'm ago';
    
    return 'Just now';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-white to-gray-50">
        <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
        <p className="text-sm text-gray-600 mt-1">Latest updates from your business</p>
      </div>

      {/* Activity List */}
      <div className="divide-y divide-gray-100">
        {displayActivities.length === 0 && (
          <div className="px-6 py-8 text-center text-gray-500">No recent activity yet.</div>
        )}
        {displayActivities.map((activity) => {
          const bgGradient = activity.color === 'bg-blue-500' ? 'from-blue-50 to-transparent' :
                            activity.color === 'bg-green-500' ? 'from-green-50 to-transparent' :
                            activity.color === 'bg-purple-500' ? 'from-purple-50 to-transparent' :
                            activity.color === 'bg-red-500' ? 'from-red-50 to-transparent' :
                            'from-teal-50 to-transparent';

          return (
            <div 
              key={activity.id} 
              className="px-6 py-4 hover:bg-gradient-to-r hover:from-gray-50 hover:to-transparent transition-all duration-200 group"
            >
              <div className="flex items-start space-x-4">
                {/* Icon */}
                <div className={`${activity.color} bg-opacity-15 group-hover:bg-opacity-25 p-2.5 rounded-lg flex-shrink-0 transition-all duration-300 group-hover:scale-110`}>
                  <activity.icon className={`${activity.color.replace('bg-', 'text-')} w-5 h-5`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                        {activity.title}
                      </p>
                      <p className="text-sm text-gray-600 truncate mt-1">{activity.description}</p>
                    </div>
                    <span className="text-xs font-medium text-gray-500 whitespace-nowrap ml-2 px-2 py-1 bg-gray-100 group-hover:bg-indigo-100 group-hover:text-indigo-600 rounded transition-colors">
                      {getTimeAgo(activity.time)}
                    </span>
                  </div>

                  {/* Action Link */}
                  <button className="mt-2 text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>{activity.action}</span>
                    <FiArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
        <button className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors flex items-center space-x-1">
          <span>View All Activity</span>
          <FiArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};

export default ActivityFeed;
