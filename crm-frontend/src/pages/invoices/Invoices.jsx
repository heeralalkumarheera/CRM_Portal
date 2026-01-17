import { useEffect, useState } from 'react';
import { invoiceAPI } from '../../services/apiService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import ErrorBoundary from '../../components/common/ErrorBoundary';
import DataTable from '../../components/common/DataTable';
import InvoiceModal from '../../components/modals/InvoiceModal';

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const res = await invoiceAPI.getAll();
      setInvoices(res?.data?.data || []);
      setError('');
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedInvoice(null);
    setIsModalOpen(true);
  };

  const handleEdit = (invoice) => {
    setSelectedInvoice(invoice);
    setIsModalOpen(true);
  };

  const handleSave = async (formData) => {
    try {
      if (selectedInvoice) {
        await invoiceAPI.update(selectedInvoice._id, formData);
      } else {
        await invoiceAPI.create(formData);
      }
      loadInvoices();
    } catch (error) {
      console.error('Error saving invoice:', error);
      throw error;
    }
  };

  if (loading) return <LoadingSpinner message="Loading invoices..." />;
  if (error) return <ErrorMessage message={error} onRetry={loadInvoices} />;

  return (
    <ErrorBoundary>
      <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-600">Billing and payment tracking</p>
        </div>
        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition" onClick={handleCreate}>
          Create Invoice
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <span className="text-sm text-gray-600">Total: {invoices.length}</span>
          <button onClick={loadInvoices} className="text-sm text-indigo-600 hover:text-indigo-700">Refresh</button>
        </div>

        <DataTable
          columns={[
            { key: 'invoiceNumber', label: 'Number', sortable: true, render: (row) => <span className="font-medium text-gray-900">{row.invoiceNumber}</span> },
            { key: 'client', label: 'Client', sortable: false, render: (row) => <span className="text-gray-700">{row.client?.name || '—'}</span> },
            { key: 'grandTotal', label: 'Total', sortable: true, render: (row) => <span className="text-gray-900 font-semibold">₹{row.grandTotal?.toLocaleString?.() || '0'}</span> },
            { key: 'status', label: 'Status', sortable: true, render: (row) => <span className="px-2 py-1 text-xs rounded-full bg-green-50 text-green-700 font-semibold">{row.status}</span> },
            { key: 'dueDate', label: 'Due', sortable: true, render: (row) => <span className="text-gray-700">{row.dueDate ? new Date(row.dueDate).toLocaleDateString() : '—'}</span> },
            { key: 'updatedAt', label: 'Updated', sortable: true, render: (row) => <span className="text-gray-600">{row.updatedAt ? new Date(row.updatedAt).toLocaleDateString() : '—'}</span> },
          ]}
          data={invoices}
          onRowClick={handleEdit}
          emptyMessage="No invoices found. Create your first invoice."
        />
      </div>

      <InvoiceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        invoice={selectedInvoice}
      />
      </div>
    </ErrorBoundary>
  );
};

export default Invoices;
