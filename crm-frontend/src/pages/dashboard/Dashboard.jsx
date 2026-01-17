import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { clientAPI, leadAPI, invoiceAPI, amcAPI, taskAPI } from '../../services/apiService';
import {
  FiUsers,
  FiTrendingUp,
  FiDollarSign,
  FiShield,
  FiCalendar,
  FiAlertCircle,
  FiPhone,
  FiCheck,
  FiCreditCard,
  FiFileText,
} from 'react-icons/fi';

// Import Dashboard Components
import StatsCard from '../../components/dashboard/StatsCard';
import RevenueChart from '../../components/dashboard/RevenueChart';
import LeadsChart from '../../components/dashboard/LeadsChart';
import ActivityFeed from '../../components/dashboard/ActivityFeed';
import QuickActions from '../../components/dashboard/QuickActions';
import RecentList from '../../components/dashboard/RecentList';

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalClients: 0,
    totalLeads: 0,
    monthlyRevenue: 0,
    activeAMCs: 0,
    pendingTasks: 0,
    overduePayments: 0,
    totalInvoices: 0,
    completedTasks: 0,
  });
  const [revenueSeries, setRevenueSeries] = useState([]);
  const [revenueChange, setRevenueChange] = useState(null);
  const [leadStageSeries, setLeadStageSeries] = useState([]);
  const [recentLeads, setRecentLeads] = useState([]);
  const [recentTasks, setRecentTasks] = useState([]);
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [clientsRes, leadsRes, invoicesRes, tasksRes, amcsRes] = await Promise.all([
        clientAPI.getAll({ limit: 100 }),
        leadAPI.getAll({ limit: 100 }),
        invoiceAPI.getAll({ limit: 100 }),
        taskAPI.getAll({ limit: 100 }),
        amcAPI.getAll({ limit: 100 }),
      ]);

      const clients = clientsRes?.data?.data || clientsRes?.data || [];
      const leads = leadsRes?.data?.data || leadsRes?.data || [];
      const invoices = invoicesRes?.data?.data || invoicesRes?.data || [];
      const tasks = tasksRes?.data?.data || tasksRes?.data || [];
      const amcs = amcsRes?.data?.data || amcsRes?.data || [];

      const totalClients = clientsRes?.data?.total ?? clients.length;
      const totalLeads = leadsRes?.data?.total ?? leads.length;
      const totalInvoices = invoicesRes?.data?.total ?? invoices.length;
      const activeAMCs = amcs.filter(a => (a.status || '').toLowerCase() === 'active' || (a.status || '').toLowerCase() === 'ongoing').length;
      const pendingTasks = tasks.filter(t => ['pending','open','in progress','todo'].includes((t.status || '').toLowerCase())).length;
      const completedTasks = tasks.filter(t => ['completed','done','closed'].includes((t.status || '').toLowerCase())).length;

      // Revenue calculations (last 6 months)
      const now = new Date();
      const monthKey = (d) => `${d.getFullYear()}-${d.getMonth()+1}`;
      const revenueMap = invoices.reduce((acc, inv) => {
        const date = inv.invoiceDate ? new Date(inv.invoiceDate) : new Date(inv.createdAt || now);
        const key = monthKey(date);
        const amount = inv.grandTotal ?? inv.totalAmount ?? 0;
        acc[key] = (acc[key] || 0) + amount;
        return acc;
      }, {});

      const months = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({ key: monthKey(d), label: d.toLocaleString('en-US', { month: 'short' }) });
      }

      const revenueData = months.map(m => ({ month: m.label, revenue: revenueMap[m.key] || 0, expenses: 0 }));
      setRevenueSeries(revenueData);

      const last = revenueData[revenueData.length - 1]?.revenue || 0;
      const prev = revenueData[revenueData.length - 2]?.revenue || 0;
      const change = prev ? ((last - prev) / prev) * 100 : null;
      setRevenueChange(change);

      // Lead stage distribution
      const stageCounts = leads.reduce((acc, lead) => {
        const key = (lead.status || lead.stage || 'Unknown').trim();
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});
      const leadData = Object.entries(stageCounts).map(([name, value]) => ({ name, value }));
      setLeadStageSeries(leadData);

      // Monthly revenue (last 30 days)
      const thirtyAgo = new Date();
      thirtyAgo.setDate(thirtyAgo.getDate() - 30);
      const monthlyRevenue = invoices
        .filter(inv => new Date(inv.invoiceDate || inv.createdAt || now) >= thirtyAgo)
        .reduce((sum, inv) => sum + (inv.grandTotal ?? inv.totalAmount ?? 0), 0);

      const overduePayments = invoices.filter(inv => {
        const due = inv.dueDate ? new Date(inv.dueDate) : null;
        const balance = (inv.grandTotal ?? inv.totalAmount ?? 0) - (inv.amountPaid ?? 0);
        return due && due < now && balance > 0;
      }).length;

      // Recent lists
      setRecentLeads(leads.slice(0, 5).map(l => ({
        id: l._id,
        name: l.companyName || l.clientName || l.name || l.leadName || 'Lead',
        status: l.status || '—',
        value: l.estimatedValue ? `₹${l.estimatedValue}` : '',
      })));

      setRecentTasks(tasks.slice(0, 5).map(t => ({
        id: t._id,
        title: t.title || t.name || 'Task',
        status: t.status || 'Pending',
        dueDate: t.dueDate ? new Date(t.dueDate) : new Date(),
      })));

      setRecentInvoices(invoices.slice(0, 5).map(inv => ({
        id: inv._id,
        number: inv.invoiceNumber || 'Invoice',
        client: inv.client?.clientName || inv.client?.companyName || 'Client',
        amount: `₹${(inv.grandTotal ?? inv.totalAmount ?? 0).toLocaleString()}`,
        status: inv.status || 'Draft',
      })));

      // Activity feed
      const activityItems = [];
      leads.slice(0, 3).forEach(l => activityItems.push({
        id: `lead-${l._id}`,
        type: 'lead',
        title: 'New lead captured',
        description: l.companyName || l.clientName || l.leadName || 'Lead',
        time: l.createdAt ? new Date(l.createdAt) : new Date(),
        icon: FiUsers,
        color: 'bg-blue-500',
        action: 'View lead',
      }));
      invoices.slice(0, 2).forEach(inv => activityItems.push({
        id: `inv-${inv._id}`,
        type: 'invoice',
        title: 'Invoice created',
        description: inv.invoiceNumber || 'Invoice',
        time: inv.createdAt ? new Date(inv.createdAt) : new Date(),
        icon: FiFileText,
        color: 'bg-purple-500',
        action: 'View invoice',
      }));
      tasks.slice(0, 2).forEach(t => activityItems.push({
        id: `task-${t._id}`,
        type: 'task',
        title: 'Task assigned',
        description: t.title || t.name || 'Task',
        time: t.createdAt ? new Date(t.createdAt) : new Date(),
        icon: FiCalendar,
        color: 'bg-pink-500',
        action: 'View task',
      }));
      setActivities(activityItems);

      setStats({
        totalClients,
        totalLeads,
        monthlyRevenue,
        activeAMCs,
        pendingTasks,
        overduePayments,
        totalInvoices,
        completedTasks,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Role-based stats cards
  const getRoleStats = () => {
    const allStats = {
      'Super Admin': [
        { title: 'Total Clients', value: stats.totalClients, icon: FiUsers, color: 'bg-blue-500', change: null },
        { title: 'Active Leads', value: stats.totalLeads, icon: FiTrendingUp, color: 'bg-green-500', change: null },
        { title: 'Monthly Revenue', value: `₹${stats.monthlyRevenue.toLocaleString()}`, icon: FiDollarSign, color: 'bg-purple-500', change: null },
        { title: 'Active AMCs', value: stats.activeAMCs, icon: FiShield, color: 'bg-orange-500', change: null },
        { title: 'Pending Tasks', value: stats.pendingTasks, icon: FiCalendar, color: 'bg-pink-500', change: null },
        { title: 'Overdue Payments', value: stats.overduePayments, icon: FiAlertCircle, color: 'bg-red-500', change: null },
      ],
      'Admin': [
        { title: 'Total Clients', value: stats.totalClients, icon: FiUsers, color: 'bg-blue-500', change: null },
        { title: 'Active Leads', value: stats.totalLeads, icon: FiTrendingUp, color: 'bg-green-500', change: null },
        { title: 'Monthly Revenue', value: `₹${stats.monthlyRevenue.toLocaleString()}`, icon: FiDollarSign, color: 'bg-purple-500', change: null },
        { title: 'Pending Tasks', value: stats.pendingTasks, icon: FiCalendar, color: 'bg-pink-500', change: null },
      ],
      'Sales Executive': [
        { title: 'My Leads', value: stats.totalLeads, icon: FiTrendingUp, color: 'bg-green-500', change: null },
        { title: 'My Clients', value: stats.totalClients, icon: FiUsers, color: 'bg-blue-500', change: null },
        { title: 'Assigned Tasks', value: stats.pendingTasks, icon: FiCalendar, color: 'bg-pink-500', change: null },
        { title: 'Active Quotations', value: stats.totalInvoices, icon: FiFileText, color: 'bg-indigo-500', change: null },
      ],
      'Accountant': [
        { title: 'Total Invoices', value: stats.totalInvoices, icon: FiFileText, color: 'bg-blue-500', change: null },
        { title: 'Monthly Revenue', value: `₹${stats.monthlyRevenue.toLocaleString()}`, icon: FiDollarSign, color: 'bg-purple-500', change: null },
        { title: 'Overdue Payments', value: stats.overduePayments, icon: FiAlertCircle, color: 'bg-red-500', change: null },
        { title: 'Completed Payments', value: stats.completedTasks, icon: FiCreditCard, color: 'bg-green-500', change: null },
      ],
      'Manager': [
        { title: 'Total Clients', value: stats.totalClients, icon: FiUsers, color: 'bg-blue-500', change: null },
        { title: 'Active Leads', value: stats.totalLeads, icon: FiTrendingUp, color: 'bg-green-500', change: null },
        { title: 'Active AMCs', value: stats.activeAMCs, icon: FiShield, color: 'bg-orange-500', change: null },
        { title: 'Team Tasks', value: stats.pendingTasks, icon: FiCalendar, color: 'bg-pink-500', change: null },
      ],
      'Support Staff': [
        { title: 'Pending Tasks', value: stats.pendingTasks, icon: FiCalendar, color: 'bg-pink-500', change: null },
        { title: 'Recently Assigned Tasks', value: stats.pendingTasks, icon: FiPhone, color: 'bg-indigo-500', change: null },
        { title: 'Completed Tasks', value: stats.completedTasks, icon: FiCheck, color: 'bg-green-500', change: null },
      ],
    };

    return allStats[user?.role] || allStats['Support Staff'];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600 font-medium">Loading dashboard...</p>
      </div>
    );
  }

  const statCards = getRoleStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50 to-purple-50">
      {/* Welcome Header */}
      <div className="mb-8 px-6 py-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg text-white">
        <h1 className="text-4xl font-bold">
          Welcome back, <span className="text-indigo-100">{user?.firstName}!</span> 👋
        </h1>
        <p className="text-indigo-100 mt-2 text-lg">Here's your {user?.role} dashboard overview.</p>
        <div className="mt-4 flex items-center space-x-4">
          <div className="px-4 py-2 bg-white/20 backdrop-blur rounded-lg">
            <p className="text-sm font-medium text-indigo-100">Role: <span className="text-white font-bold">{user?.role}</span></p>
          </div>
          <div className="px-4 py-2 bg-white/20 backdrop-blur rounded-lg">
            <p className="text-sm font-medium text-indigo-100">Email: <span className="text-white font-bold">{user?.email}</span></p>
          </div>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="px-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {statCards.map((stat, index) => (
            <StatsCard key={index} {...stat} />
          ))}
        </div>
      </div>

      {/* Charts Row - Only for roles that have revenue data */}
      {['Super Admin', 'Admin', 'Accountant', 'Manager'].includes(user?.role) && (
        <div className="px-6 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RevenueChart data={revenueSeries} totalRevenue={revenueSeries.reduce((s,i)=>s+(i.revenue||0),0)} totalChange={revenueChange} />
            <LeadsChart data={leadStageSeries} />
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="px-6 mb-8">
        <QuickActions />
      </div>

      {/* Recent Activity and Lists */}
      <div className="px-6 mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ActivityFeed activities={activities} />
          </div>
          <div>
            <RecentList title="Recent Leads" items={recentLeads} type="leads" />
          </div>
        </div>
      </div>

      {/* Bottom Row - Recent Items */}
      <div className="px-6 mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentList title="Recent Tasks" items={recentTasks} type="tasks" />
          <RecentList title="Recent Invoices" items={recentInvoices} type="invoices" />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
