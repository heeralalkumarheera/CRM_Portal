import { useEffect, useState } from 'react';
import { clientAPI } from '../../services/apiService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import DataTable from '../../components/common/DataTable';
import ClientModal from './ClientModal';

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      const res = await clientAPI.getAll();
      setClients(res?.data?.data || []);
      setError('');
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveClient = async (formData) => {
    try {
      if (editingClient) {
        await clientAPI.update(editingClient._id, formData);
      } else {
        await clientAPI.create(formData);
      }
      setShowModal(false);
      setEditingClient(null);
      loadClients();
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to save client');
    }
  };

  const handleAddClient = () => {
    setEditingClient(null);
    setShowModal(true);
  };

  const handleEditClient = (client) => {
    setEditingClient(client);
    setShowModal(true);
  };

  if (loading) return <LoadingSpinner message="Loading clients..." />;
  if (error) return <ErrorMessage message={error} onRetry={loadClients} />;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Clients</h1>
          <p className="text-gray-600 dark:text-gray-300">Manage all customer records</p>
        </div>
        <button onClick={handleAddClient} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
          Add Client
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-300">Total: {clients.length}</span>
          <button onClick={loadClients} className="text-sm text-indigo-600 hover:text-indigo-700">Refresh</button>
        </div>

        <DataTable
          columns={[
            { key: 'name', label: 'Name', sortable: true, render: (row) => <span className="font-medium text-gray-900 dark:text-gray-100">{row.clientName || row.companyName}</span> },
            { key: 'email', label: 'Email', sortable: true, render: (row) => <span className="text-gray-700 dark:text-gray-200">{row.email}</span> },
            { key: 'phone', label: 'Phone', sortable: false, render: (row) => <span className="text-gray-700 dark:text-gray-200">{row.phone}</span> },
            { key: 'status', label: 'Status', sortable: true, render: (row) => <span className="px-2 py-1 text-xs rounded-full bg-indigo-50 text-indigo-700 font-semibold">{row.status || 'Active'}</span> },
            { key: 'category', label: 'Category', sortable: true, render: (row) => <span className="text-gray-700 dark:text-gray-200">{row.category || 'Standard'}</span> },
          ]}
          data={clients}
          onRowClick={handleEditClient}
          emptyMessage="No clients found. Add your first client."
        />
      </div>

      <ClientModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingClient(null);
        }}
        onSave={handleSaveClient}
        client={editingClient}
      />
    </div>
  );
};

export default Clients;
