import { useEffect, useMemo, useState } from 'react';
import { 
  FiCalendar, 
  FiChevronLeft, 
  FiChevronRight, 
  FiPlus,
  FiClock,
  FiFilter,
  FiList,
  FiGrid,
  FiRefreshCw
} from 'react-icons/fi';
import { taskAPI } from '../../services/apiService';
import toast from 'react-hot-toast';

const Calendar = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month'); // 'month' or 'agenda'
  const [selectedDate, setSelectedDate] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await taskAPI.getAll({ limit: 500 });
      setTasks(res?.data?.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load calendar items');
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = useMemo(() => {
    let filtered = tasks.filter((t) => t.dueDate);
    if (filterStatus !== 'all') {
      filtered = filtered.filter(t => t.status?.toLowerCase() === filterStatus);
    }
    return filtered;
  }, [tasks, filterStatus]);

  const upcomingTasks = useMemo(() => {
    return filteredTasks
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 20);
  }, [filteredTasks]);

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const getTasksForDate = (date) => {
    return filteredTasks.filter(task => {
      const taskDate = new Date(task.dueDate);
      return (
        taskDate.getDate() === date.getDate() &&
        taskDate.getMonth() === date.getMonth() &&
        taskDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getStatusColor = (status) => {
    const statusLower = (status || '').toLowerCase();
    if (['completed', 'done', 'closed'].includes(statusLower)) return 'bg-green-100 text-green-800 border-green-200';
    if (['in progress', 'in-progress', 'ongoing'].includes(statusLower)) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (['pending', 'open', 'todo'].includes(statusLower)) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getPriorityColor = (priority) => {
    const priorityLower = (priority || '').toLowerCase();
    if (priorityLower === 'high' || priorityLower === 'urgent') return 'text-red-600';
    if (priorityLower === 'medium') return 'text-orange-600';
    return 'text-blue-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto" />
          <p className="mt-4 text-gray-600 font-medium">Loading calendar...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg">
          <p className="font-medium">Error loading calendar</p>
          <p className="text-sm mt-1">{error}</p>
          <button onClick={loadTasks} className="mt-3 text-sm underline hover:no-underline">
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
        <div className="px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Calendar</h1>
              <p className="text-gray-600 mt-1">Manage your tasks and schedule</p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={goToToday}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
              >
                Today
              </button>
              <button
                onClick={loadTasks}
                className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
              >
                <FiRefreshCw className="w-5 h-5" />
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
                <FiPlus className="w-4 h-4" />
                New Task
              </button>
            </div>
          </div>

          {/* Controls */}
          <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Month Navigation */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigateMonth(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <FiChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-bold text-gray-900 min-w-[200px] text-center">
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
              <button
                onClick={() => navigateMonth(1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <FiChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* View Toggle & Filter */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setView('month')}
                  className={`px-3 py-1.5 rounded-md transition flex items-center gap-2 ${
                    view === 'month' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-600'
                  }`}
                >
                  <FiGrid className="w-4 h-4" />
                  Month
                </button>
                <button
                  onClick={() => setView('agenda')}
                  className={`px-3 py-1.5 rounded-md transition flex items-center gap-2 ${
                    view === 'agenda' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-600'
                  }`}
                >
                  <FiList className="w-4 h-4" />
                  Agenda
                </button>
              </div>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {view === 'month' ? (
          <MonthView 
            currentDate={currentDate} 
            getDaysInMonth={getDaysInMonth}
            getTasksForDate={getTasksForDate}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            getStatusColor={getStatusColor}
            getPriorityColor={getPriorityColor}
          />
        ) : (
          <AgendaView 
            upcomingTasks={upcomingTasks}
            getStatusColor={getStatusColor}
            getPriorityColor={getPriorityColor}
          />
        )}

        {/* Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            label="Total Tasks"
            value={filteredTasks.length}
            icon={FiCalendar}
            color="bg-blue-500"
          />
          <StatCard
            label="Pending"
            value={filteredTasks.filter(t => ['pending', 'open', 'todo'].includes(t.status?.toLowerCase())).length}
            icon={FiClock}
            color="bg-yellow-500"
          />
          <StatCard
            label="In Progress"
            value={filteredTasks.filter(t => ['in progress', 'in-progress', 'ongoing'].includes(t.status?.toLowerCase())).length}
            icon={FiFilter}
            color="bg-indigo-500"
          />
          <StatCard
            label="Completed"
            value={filteredTasks.filter(t => ['completed', 'done', 'closed'].includes(t.status?.toLowerCase())).length}
            icon={FiCalendar}
            color="bg-green-500"
          />
        </div>
      </div>
    </div>
  );
};

const MonthView = ({ currentDate, getDaysInMonth, getTasksForDate, selectedDate, setSelectedDate, getStatusColor, getPriorityColor }) => {
  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate);
  const days = [];
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Add empty cells for days before the first day of the month
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  const today = new Date();
  const isToday = (day) => {
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Week days header */}
      <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
        {weekDays.map((day) => (
          <div key={day} className="p-3 text-center text-sm font-semibold text-gray-700">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 auto-rows-fr">
        {days.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="border border-gray-100 bg-gray-50 min-h-[120px]" />;
          }

          const date = new Date(year, month, day);
          const tasksForDay = getTasksForDate(date);
          const isSelected = selectedDate && 
            selectedDate.getDate() === day &&
            selectedDate.getMonth() === month &&
            selectedDate.getFullYear() === year;

          return (
            <div
              key={day}
              onClick={() => setSelectedDate(date)}
              className={`border border-gray-100 p-2 min-h-[120px] cursor-pointer hover:bg-gray-50 transition ${
                isToday(day) ? 'bg-indigo-50' : ''
              } ${isSelected ? 'ring-2 ring-indigo-500' : ''}`}
            >
              <div className={`text-sm font-semibold mb-2 ${
                isToday(day) 
                  ? 'inline-flex items-center justify-center w-7 h-7 rounded-full bg-indigo-600 text-white' 
                  : 'text-gray-700'
              }`}>
                {day}
              </div>
              <div className="space-y-1">
                {tasksForDay.slice(0, 3).map((task) => (
                  <div
                    key={task._id}
                    className={`text-xs p-1 rounded truncate border ${getStatusColor(task.status)}`}
                    title={task.title}
                  >
                    <span className={`font-semibold ${getPriorityColor(task.priority)}`}>●</span> {task.title}
                  </div>
                ))}
                {tasksForDay.length > 3 && (
                  <div className="text-xs text-gray-500 font-medium">
                    +{tasksForDay.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const AgendaView = ({ upcomingTasks, getStatusColor, getPriorityColor }) => {
  if (upcomingTasks.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <FiCalendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No scheduled tasks</h3>
        <p className="text-gray-600">Create tasks with due dates to see them in your calendar.</p>
      </div>
    );
  }

  // Group tasks by date
  const groupedTasks = upcomingTasks.reduce((acc, task) => {
    const dateKey = new Date(task.dueDate).toLocaleDateString();
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(task);
    return acc;
  }, {});

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-200">
      {Object.entries(groupedTasks).map(([date, tasks]) => (
        <div key={date} className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FiCalendar className="w-5 h-5 text-indigo-600" />
            {date}
          </h3>
          <div className="space-y-3">
            {tasks.map((task) => (
              <div
                key={task._id}
                className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
              >
                <div className={`w-1 h-16 rounded-full ${
                  task.priority?.toLowerCase() === 'high' ? 'bg-red-500' :
                  task.priority?.toLowerCase() === 'medium' ? 'bg-orange-500' :
                  'bg-blue-500'
                }`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-gray-500">{task.taskNumber}</span>
                    <span className={`px-2 py-0.5 text-xs rounded-full border ${getStatusColor(task.status)}`}>
                      {task.status}
                    </span>
                    <span className={`text-xs font-semibold ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </div>
                  <h4 className="font-semibold text-gray-900">{task.title}</h4>
                  <p className="text-sm text-gray-600">{task.taskType}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">
                    {new Date(task.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const StatCard = ({ label, value, icon: Icon, color }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-600 mb-1">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
      <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </div>
);

export default Calendar;
