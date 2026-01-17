import { useEffect, useState } from 'react';
import { leadAPI } from '../../services/apiService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import DataTable from '../../components/common/DataTable';
import LeadModal from './LeadModal';

const Leads = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingLead, setEditingLead] = useState(null);

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    try {
      setLoading(true);
      const res = await leadAPI.getAll();
      setLeads(res?.data?.data || []);
      setError('');
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLead = async (formData) => {
    try {
      if (editingLead) {
        await leadAPI.update(editingLead._id, formData);
      } else {
        await leadAPI.create(formData);
      }
      setShowModal(false);
      setEditingLead(null);
      loadLeads();
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to save lead');
    }
  };

  if (loading) return <LoadingSpinner message="Loading leads..." />;
  if (error) return <ErrorMessage message={error} onRetry={loadLeads} />;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Leads</h1>
          <p className="text-gray-600 dark:text-gray-300">Pipeline and lead tracking</p>
        </div>
        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition" onClick={() => setShowModal(true)}>
          Add Lead
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-300">Total: {leads.length}</span>
          <button onClick={loadLeads} className="text-sm text-indigo-600 hover:text-indigo-700">Refresh</button>
        </div>

        <DataTable
          columns={[
            { key: 'contactName', label: 'Lead', sortable: true, render: (row) => <span className="font-medium text-gray-900 dark:text-gray-100">{row.contactName}</span> },
            { key: 'email', label: 'Email', sortable: true, render: (row) => <span className="text-gray-700 dark:text-gray-200">{row.email}</span> },
            { key: 'phone', label: 'Phone', sortable: false, render: (row) => <span className="text-gray-700 dark:text-gray-200">{row.phone}</span> },
            { key: 'stage', label: 'Stage', sortable: true, render: (row) => <span className="text-gray-700 dark:text-gray-200">{row.stage || 'New'}</span> },
            { key: 'status', label: 'Status', sortable: true, render: (row) => <span className="px-2 py-1 text-xs rounded-full bg-blue-50 text-blue-700 font-semibold">{row.status || 'Open'}</span> },
          ]}
          data={leads}
          onRowClick={(lead) => { setEditingLead(lead); setShowModal(true); }}
          emptyMessage="No leads found. Add your first lead."
        />
      </div>

      <LeadModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingLead(null); }}
        onSave={handleSaveLead}
        lead={editingLead}
      />
    </div>
  );
};

export default Leads;
