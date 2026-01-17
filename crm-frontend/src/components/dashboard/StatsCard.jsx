import { FiTrendingUp, FiTrendingDown } from 'react-icons/fi';

const StatsCard = ({ title, value, icon: Icon, color, change, trend = 'up' }) => {
  const bgColor = color.replace('bg-', 'text-');
  const colorClass = color === 'bg-blue-500' ? 'from-blue-600 to-blue-400' : 
                     color === 'bg-green-500' ? 'from-green-600 to-green-400' :
                     color === 'bg-purple-500' ? 'from-purple-600 to-purple-400' :
                     color === 'bg-orange-500' ? 'from-orange-600 to-orange-400' :
                     color === 'bg-pink-500' ? 'from-pink-600 to-pink-400' :
                     color === 'bg-red-500' ? 'from-red-600 to-red-400' :
                     color === 'bg-indigo-500' ? 'from-indigo-600 to-indigo-400' : 
                     'from-gray-600 to-gray-400';

  return (
    <div className="group relative bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 overflow-hidden transform hover:-translate-y-1">
      {/* Background gradient effect */}
      <div className={`absolute inset-0 bg-gradient-to-br ${colorClass} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
      
      <div className="relative z-10">
        {/* Top Section */}
        <div className="flex items-center justify-between mb-4">
          {/* Icon Box */}
          <div className={`${color} bg-opacity-15 p-3 rounded-lg group-hover:bg-opacity-25 transition-all duration-300`}>
            <Icon className={`${bgColor} w-6 h-6 group-hover:scale-110 transition-transform duration-300`} />
          </div>

          {/* Trend Badge */}
          {change && (
            <div className={`flex items-center space-x-1 px-3 py-1 rounded-full ${
              trend === 'up' 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {trend === 'up' ? <FiTrendingUp size={16} /> : <FiTrendingDown size={16} />}
              <span className="text-sm font-semibold">{change}</span>
            </div>
          )}
        </div>

        {/* Content Section */}
        <h3 className="text-gray-600 text-sm font-medium mb-2 group-hover:text-gray-700 transition-colors">{title}</h3>
        <p className="text-3xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{value}</p>

        {/* Bottom Accent */}
        <div className={`mt-4 h-1 w-0 group-hover:w-full bg-gradient-to-r ${colorClass} rounded-full transition-all duration-500`}></div>
      </div>
    </div>
  );
};

export default StatsCard;
