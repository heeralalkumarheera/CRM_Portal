import { useEffect, useState } from 'react';
import { amcAPI } from '../../services/apiService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import ErrorBoundary from '../../components/common/ErrorBoundary';
import DataTable from '../../components/common/DataTable';
import AMCModal from '../../components/modals/AMCModal';

const AMC = () => {
  const [amcs, setAmcs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAMC, setSelectedAMC] = useState(null);

  useEffect(() => {
    loadAmcs();
  }, []);

  const loadAmcs = async () => {
    try {
      setLoading(true);
      const res = await amcAPI.getAll();
      setAmcs(res?.data?.data || []);
      setError('');
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load AMCs');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedAMC(null);
    setIsModalOpen(true);
  };

  const handleEdit = (amc) => {
    setSelectedAMC(amc);
    setIsModalOpen(true);
  };

  const handleSave = async (formData) => {
    try {
      if (selectedAMC) {
        await amcAPI.update(selectedAMC._id, formData);
      } else {
        await amcAPI.create(formData);
      }
      loadAmcs();
    } catch (error) {
      console.error('Error saving AMC:', error);
      throw error;
    }
  };

  if (loading) return <LoadingSpinner message="Loading AMCs..." />;
  if (error) return <ErrorMessage message={error} onRetry={loadAmcs} />;

  return (
    <ErrorBoundary>
      <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AMC Management</h1>
          <p className="text-gray-600">Contracts, renewals, and service schedules</p>
        </div>
        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition" onClick={handleCreate}>
          New AMC
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <span className="text-sm text-gray-600">Total: {amcs.length}</span>
          <button onClick={loadAmcs} className="text-sm text-indigo-600 hover:text-indigo-700">Refresh</button>
        </div>

        <DataTable
          columns={[
            { key: 'amcNumber', label: 'AMC #', sortable: true, render: (row) => <span className="font-medium text-gray-900">{row.amcNumber}</span> },
            { key: 'client', label: 'Client', sortable: false, render: (row) => <span className="text-gray-700">{row.client?.name || '—'}</span> },
            { key: 'contractName', label: 'Contract', sortable: true, render: (row) => <span className="text-gray-700">{row.contractName}</span> },
            { key: 'contractValue', label: 'Value', sortable: true, render: (row) => <span className="text-gray-900 font-semibold">₹{row.contractValue?.toLocaleString?.() || '0'}</span> },
            { key: 'status', label: 'Status', sortable: true, render: (row) => <span className="px-2 py-1 text-xs rounded-full bg-purple-50 text-purple-700 font-semibold">{row.status}</span> },
            { key: 'endDate', label: 'Ends', sortable: true, render: (row) => <span className="text-gray-700">{row.endDate ? new Date(row.endDate).toLocaleDateString() : '—'}</span> },
          ]}
          data={amcs}
          onRowClick={handleEdit}
          emptyMessage="No AMCs found. Add your first contract."
        />
      </div>

      <AMCModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        amc={selectedAMC}
      />
      </div>
    </ErrorBoundary>
  );
};

export default AMC;
