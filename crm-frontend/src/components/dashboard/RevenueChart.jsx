import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const RevenueChart = ({ data = [], totalRevenue = 0, totalChange = null }) => {
  const formattedTotal = totalRevenue ? `₹${totalRevenue.toLocaleString()}` : '—';
  const changeText = totalChange != null ? `${totalChange > 0 ? '+' : ''}${totalChange.toFixed(1)}%` : null;
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-white to-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Revenue Overview</h3>
            <p className="text-sm text-gray-600 mt-1">Monthly revenue vs expenses</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-indigo-600">{formattedTotal}</p>
            {changeText && (
              <p className={`text-xs font-medium ${totalChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {changeText} vs last month
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="p-6">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.2}/>
              </linearGradient>
              <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ec4899" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#ec4899" stopOpacity={0.2}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis 
              dataKey="month" 
              stroke="#9ca3af"
              style={{ fontSize: '12px', fontWeight: '500' }}
            />
            <YAxis 
              stroke="#9ca3af"
              style={{ fontSize: '12px', fontWeight: '500' }}
              tickFormatter={(value) => `₹${(value/1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              }}
              formatter={(value) => `₹${(value).toLocaleString()}`}
              labelStyle={{ color: '#374151', fontWeight: 'bold' }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="square"
            />
            <Bar dataKey="revenue" fill="url(#colorRevenue)" radius={[8, 8, 0, 0]} />
            <Bar dataKey="expenses" fill="url(#colorExpenses)" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RevenueChart;
