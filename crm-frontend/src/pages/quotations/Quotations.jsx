import { useEffect, useState } from 'react';
import { quotationAPI } from '../../services/apiService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import DataTable from '../../components/common/DataTable';
import QuotationModal from '../../components/modals/QuotationModal';

const Quotations = () => {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState(null);

  useEffect(() => {
    loadQuotations();
  }, []);

  const loadQuotations = async () => {
    try {
      setLoading(true);
      const res = await quotationAPI.getAll();
      setQuotations(res?.data?.data || []);
      setError('');
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load quotations');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedQuotation(null);
    setIsModalOpen(true);
  };

  const handleEdit = (quotation) => {
    setSelectedQuotation(quotation);
    setIsModalOpen(true);
  };

  const handleSave = async (formData) => {
    try {
      if (selectedQuotation) {
        await quotationAPI.update(selectedQuotation._id, formData);
      } else {
        await quotationAPI.create(formData);
      }
      loadQuotations();
    } catch (error) {
      console.error('Error saving quotation:', error);
      throw error;
    }
  };

  if (loading) return <LoadingSpinner message="Loading quotations..." />;
  if (error) return <ErrorMessage message={error} onRetry={loadQuotations} />;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quotations</h1>
          <p className="text-gray-600">Quotes and proposals</p>
        </div>
        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition" onClick={handleCreate}>
          New Quotation
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <span className="text-sm text-gray-600">Total: {quotations.length}</span>
          <button onClick={loadQuotations} className="text-sm text-indigo-600 hover:text-indigo-700">Refresh</button>
        </div>

        <DataTable
          columns={[
            { key: 'quotationNumber', label: 'Number', sortable: true, render: (row) => <span className="font-medium text-gray-900">{row.quotationNumber}</span> },
            { key: 'client', label: 'Client', sortable: false, render: (row) => <span className="text-gray-700">{row.client?.name || '—'}</span> },
            { key: 'subject', label: 'Subject', sortable: true, render: (row) => <span className="text-gray-700">{row.subject}</span> },
            { key: 'grandTotal', label: 'Total', sortable: true, render: (row) => <span className="text-gray-900 font-semibold">₹{row.grandTotal?.toLocaleString?.() || '0'}</span> },
            { key: 'status', label: 'Status', sortable: true, render: (row) => <span className="px-2 py-1 text-xs rounded-full bg-blue-50 text-blue-700 font-semibold">{row.status}</span> },
            { key: 'quotationDate', label: 'Date', sortable: true, render: (row) => <span className="text-gray-600">{row.quotationDate ? new Date(row.quotationDate).toLocaleDateString() : '—'}</span> },
          ]}
          data={quotations}
          onRowClick={handleEdit}
          emptyMessage="No quotations found. Create your first quotation."
        />
      </div>

      <QuotationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        quotation={selectedQuotation}
      />
    </div>
  );
};

export default Quotations;
