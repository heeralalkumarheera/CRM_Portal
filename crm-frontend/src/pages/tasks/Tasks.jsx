import { useEffect, useState } from 'react';
import { taskAPI } from '../../services/apiService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import DataTable from '../../components/common/DataTable';
import TaskModal from './TaskModal';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const res = await taskAPI.getAll();
      setTasks(res?.data?.data || []);
      setError('');
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTask = async (formData) => {
    try {
      if (editingTask) {
        await taskAPI.update(editingTask._id, formData);
      } else {
        await taskAPI.create(formData);
      }
      setShowModal(false);
      setEditingTask(null);
      loadTasks();
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to save task');
    }
  };

  if (loading) return <LoadingSpinner message="Loading tasks..." />;
  if (error) return <ErrorMessage message={error} onRetry={loadTasks} />;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-600">Assignments and follow-ups</p>
        </div>
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
          New Task
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <span className="text-sm text-gray-600">Total: {tasks.length}</span>
          <button onClick={loadTasks} className="text-sm text-indigo-600 hover:text-indigo-700">Refresh</button>
        </div>

        <DataTable
          columns={[
            { key: 'title', label: 'Task', sortable: true, render: (row) => <span className="font-medium text-gray-900">{row.title}</span> },
            { key: 'taskType', label: 'Type', sortable: true, render: (row) => <span className="text-gray-700">{row.taskType}</span> },
            { key: 'related', label: 'Related', sortable: false, render: (row) => {
              const mod = row?.relatedTo?.module;
              const rec = row?.relatedTo?.recordId;
              if (!mod || !rec) return <span className="text-gray-400">—</span>;
              if (mod === 'Client') return <span className="text-gray-700">{rec.clientName || rec.companyName}</span>;
              if (mod === 'Lead') return <span className="text-gray-700">{rec.contactName}</span>;
              if (mod === 'Invoice') return <span className="text-gray-700">Invoice: {rec.invoiceNumber}</span>;
              if (mod === 'Quotation') return <span className="text-gray-700">Quotation: {rec.quotationNumber}</span>;
              if (mod === 'AMC') return <span className="text-gray-700">AMC: {rec.amcNumber}</span>;
              return <span className="text-gray-400">—</span>;
            } },
            { key: 'priority', label: 'Priority', sortable: true, render: (row) => <span className="px-2 py-1 text-xs rounded-full bg-orange-50 text-orange-700 font-semibold">{row.priority}</span> },
            { key: 'status', label: 'Status', sortable: true, render: (row) => <span className="px-2 py-1 text-xs rounded-full bg-blue-50 text-blue-700 font-semibold">{row.status}</span> },
            { key: 'dueDate', label: 'Due', sortable: true, render: (row) => <span className="text-gray-700">{row.dueDate ? new Date(row.dueDate).toLocaleDateString() : '—'}</span> },
          ]}
          data={tasks}
          onRowClick={(task) => { setEditingTask(task); setShowModal(true); }}
          emptyMessage="No tasks found. Create your first task."
        />
      </div>

      <TaskModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingTask(null); }}
        onSave={handleSaveTask}
        task={editingTask}
      />
    </div>
  );
};

export default Tasks;
