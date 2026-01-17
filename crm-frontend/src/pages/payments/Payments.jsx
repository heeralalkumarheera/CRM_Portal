import { useState, useEffect } from 'react';
import { FiPlus } from 'react-icons/fi';
import { paymentAPI } from '../../services/apiService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import ErrorBoundary from '../../components/common/ErrorBoundary';
import DataTable from '../../components/common/DataTable';
import PaymentModal from '../../components/modals/PaymentModal';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const res = await paymentAPI.getAll();
      setPayments(res?.data?.data || []);
      setError('');
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedPayment(null);
    setIsModalOpen(true);
  };

  const handleEdit = (payment) => {
    setSelectedPayment(payment);
    setIsModalOpen(true);
  };

  const handleSave = async (formData) => {
    try {
      if (selectedPayment) {
        await paymentAPI.update(selectedPayment._id, formData);
      } else {
        await paymentAPI.create(formData);
      }
      loadPayments();
    } catch (error) {
      console.error('Error saving payment:', error);
      throw error;
    }
  };

  if (loading) return <LoadingSpinner message="Loading payments..." />;
  if (error) return <ErrorMessage message={error} onRetry={loadPayments} />;

  return (
    <ErrorBoundary>
      <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-600">Payment records and receipts</p>
        </div>
        <button className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition" onClick={handleCreate}>
          <FiPlus size={18} />
          <span>Add Payment</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <span className="text-sm text-gray-600">Total: {payments.length}</span>
          <button onClick={loadPayments} className="text-sm text-indigo-600 hover:text-indigo-700">Refresh</button>
        </div>

        <DataTable
          columns={[
            { key: 'paymentNumber', label: 'Payment #', sortable: true, render: (row) => <span className="font-medium text-gray-900">{row.paymentNumber}</span> },
            { key: 'client', label: 'Client', sortable: false, render: (row) => <span className="text-gray-700">{row.client?.name || '—'}</span> },
            { key: 'invoice', label: 'Invoice', sortable: false, render: (row) => <span className="text-gray-700">{row.invoice?.invoiceNumber || '—'}</span> },
            { key: 'amount', label: 'Amount', sortable: true, render: (row) => <span className="text-gray-900 font-semibold">₹{row.amount?.toLocaleString?.() || '0'}</span> },
            { key: 'paymentMode', label: 'Mode', sortable: true, render: (row) => <span className="text-gray-700">{row.paymentMode}</span> },
            { key: 'status', label: 'Status', sortable: true, render: (row) => <span className="px-2 py-1 text-xs rounded-full bg-green-50 text-green-700 font-semibold">{row.status}</span> },
            { key: 'paymentDate', label: 'Date', sortable: true, render: (row) => <span className="text-gray-700">{row.paymentDate ? new Date(row.paymentDate).toLocaleDateString() : '—'}</span> },
          ]}
          data={payments}
          onRowClick={handleEdit}
          emptyMessage="No payments found. Add your first payment."
        />
      </div>

      <PaymentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        payment={selectedPayment}
      />
      </div>
    </ErrorBoundary>
  );
};

export default Payments;
