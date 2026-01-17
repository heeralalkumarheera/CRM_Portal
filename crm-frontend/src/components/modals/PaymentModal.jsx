import { useState, useEffect } from 'react';
import Modal from '../../components/common/Modal';
import { invoiceAPI } from '../../services/apiService';

const PaymentModal = ({ isOpen, onClose, onSave, payment }) => {
  const [formData, setFormData] = useState({
    invoice: '',
    amount: '',
    paymentMode: 'Cash',
    paymentDate: new Date().toISOString().split('T')[0],
    transactionId: '',
    notes: ''
  });
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      loadInvoices();
      if (payment) {
        setFormData({
          invoice: payment.invoice?._id || '',
          amount: payment.amount || '',
          paymentMode: payment.paymentMode || 'Cash',
          paymentDate: payment.paymentDate?.split('T')[0] || new Date().toISOString().split('T')[0],
          transactionId: payment.transactionId || '',
          notes: payment.notes || ''
        });
      } else {
        setFormData({
          invoice: '',
          amount: '',
          paymentMode: 'Cash',
          paymentDate: new Date().toISOString().split('T')[0],
          transactionId: '',
          notes: ''
        });
      }
      setErrors({});
    }
  }, [isOpen, payment]);

  const loadInvoices = async () => {
    try {
      const response = await invoiceAPI.getAll({ limit: 1000, status: 'Unpaid,Partially Paid' });
      const list = Array.isArray(response?.data?.data) ? response.data.data : Array.isArray(response?.data) ? response.data : [];
      setInvoices(list);
    } catch (error) {
      console.error('Error loading invoices:', error);
      setInvoices([]);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.invoice) newErrors.invoice = 'Invoice is required';
    if (!formData.amount) newErrors.amount = 'Amount is required';
    if (formData.amount <= 0) newErrors.amount = 'Amount must be greater than 0';
    if (!formData.paymentDate) newErrors.paymentDate = 'Payment date is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving payment:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={payment ? 'Edit Payment' : 'Record Payment'} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Invoice Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Invoice <span className="text-red-500">*</span>
          </label>
          <select
            name="invoice"
            value={formData.invoice}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={payment}
          >
            <option value="">Select Invoice</option>
            {(Array.isArray(invoices) ? invoices : []).map(invoice => (
              <option key={invoice._id} value={invoice._id}>
                {invoice.invoiceNumber} - {invoice.client?.clientName} - ₹{invoice.grandTotal || invoice.totalAmount}
              </option>
            ))}
          </select>
          {errors.invoice && <p className="text-red-500 text-sm mt-1">{errors.invoice}</p>}
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount (₹) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0.00"
            min="0"
            step="0.01"
          />
          {errors.amount && <p className="text-red-500 text-sm mt-1">{errors.amount}</p>}
        </div>

        {/* Payment Mode */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Payment Mode <span className="text-red-500">*</span>
          </label>
          <select
            name="paymentMode"
            value={formData.paymentMode}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="Cash">Cash</option>
            <option value="Cheque">Cheque</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="UPI">UPI</option>
            <option value="Credit Card">Credit Card</option>
            <option value="Debit Card">Debit Card</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Payment Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Payment Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            name="paymentDate"
            value={formData.paymentDate}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {errors.paymentDate && <p className="text-red-500 text-sm mt-1">{errors.paymentDate}</p>}
        </div>

        {/* Transaction ID */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Transaction ID / Reference
          </label>
          <input
            type="text"
            name="transactionId"
            value={formData.transactionId}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter transaction ID or reference number"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows="2"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Additional notes"
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : payment ? 'Update Payment' : 'Record Payment'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default PaymentModal;
