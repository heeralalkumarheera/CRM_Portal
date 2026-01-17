import { useState, useEffect } from 'react';
import { FiPlus } from 'react-icons/fi';
import { callAPI } from '../../services/apiService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import DataTable from '../../components/common/DataTable';
import CallLogModal from './CallLogModal';

const CallLogs = () => {
  const [callLogs, setCallLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingLog, setEditingLog] = useState(null);

  useEffect(() => {
    loadCallLogs();
  }, []);

  const loadCallLogs = async () => {
    try {
      setLoading(true);
      const res = await callAPI.getAll();
      setCallLogs(res?.data?.data || []);
      setError('');
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load call logs');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCallLog = async (formData) => {
    try {
      if (editingLog) {
        await callAPI.update(editingLog._id, formData);
      } else {
        await callAPI.create(formData);
      }
      setShowModal(false);
      setEditingLog(null);
      loadCallLogs();
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to save call log');
    }
  };

  if (loading) return <LoadingSpinner message="Loading call logs..." />;
  if (error) return <ErrorMessage message={error} onRetry={loadCallLogs} />;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Call Logs</h1>
          <p className="text-gray-600">Track all customer communications</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
          <FiPlus size={18} />
          <span>Log Call</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <span className="text-sm text-gray-600">Total: {callLogs.length}</span>
          <button onClick={loadCallLogs} className="text-sm text-indigo-600 hover:text-indigo-700">Refresh</button>
        </div>

        <DataTable
          columns={[
            { key: 'callNumber', label: 'Call #', sortable: true, render: (row) => <span className="font-medium text-gray-900">{row.callNumber}</span> },
            { key: 'contactPerson', label: 'Contact', sortable: true, render: (row) => <span className="text-gray-700">{row.contactPerson}</span> },
            { key: 'phoneNumber', label: 'Phone', sortable: false, render: (row) => <span className="text-gray-700">{row.phoneNumber}</span> },
            { key: 'callType', label: 'Type', sortable: true, render: (row) => <span className="text-gray-700">{row.callType}</span> },
            { key: 'purpose', label: 'Purpose', sortable: true, render: (row) => <span className="text-gray-700">{row.purpose}</span> },
            { key: 'outcome', label: 'Outcome', sortable: true, render: (row) => <span className="px-2 py-1 text-xs rounded-full bg-green-50 text-green-700 font-semibold">{row.outcome}</span> },
            { key: 'callDate', label: 'Date', sortable: true, render: (row) => <span className="text-gray-700">{row.callDate ? new Date(row.callDate).toLocaleString() : '—'}</span> },
          ]}
          data={callLogs}
          onRowClick={(call) => { setEditingLog(call); setShowModal(true); }}
          emptyMessage="No call logs found. Log your first call."
        />
      </div>

      <CallLogModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingLog(null); }}
        onSave={handleSaveCallLog}
        callLog={editingLog}
      />
    </div>
  );
};

export default CallLogs;
