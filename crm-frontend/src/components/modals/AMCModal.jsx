import { useState, useEffect } from 'react';
import Modal from '../../components/common/Modal';
import { clientAPI } from '../../services/apiService';

const AMCModal = ({ isOpen, onClose, onSave, amc }) => {
  const [formData, setFormData] = useState({
    client: '',
    contractValue: '',
    startDate: '',
    endDate: '',
    serviceFrequency: 'Monthly',
    coverageDetails: '',
    terms: '',
    notes: ''
  });
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      loadClients();
      if (amc) {
        setFormData({
          client: amc.client?._id || '',
          contractValue: amc.contractValue || '',
          startDate: amc.startDate?.split('T')[0] || '',
          endDate: amc.endDate?.split('T')[0] || '',
          serviceFrequency: amc.serviceFrequency || 'Monthly',
          coverageDetails: amc.coverageDetails || '',
          terms: amc.terms || '',
          notes: amc.notes || ''
        });
      } else {
        setFormData({
          client: '',
          contractValue: '',
          startDate: '',
          endDate: '',
          serviceFrequency: 'Monthly',
          coverageDetails: '',
          terms: '',
          notes: ''
        });
      }
      setErrors({});
    }
  }, [isOpen, amc]);

  const loadClients = async () => {
    try {
      const response = await clientAPI.getAll({ limit: 1000 });
      const list = Array.isArray(response?.data?.data) ? response.data.data : Array.isArray(response?.data) ? response.data : [];
      setClients(list);
    } catch (error) {
      console.error('Error loading clients:', error);
      setClients([]);
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
    if (!formData.client) newErrors.client = 'Client is required';
    if (!formData.contractValue) newErrors.contractValue = 'Contract value is required';
    if (formData.contractValue <= 0) newErrors.contractValue = 'Contract value must be greater than 0';
    if (!formData.startDate) newErrors.startDate = 'Start date is required';
    if (!formData.endDate) newErrors.endDate = 'End date is required';
    
    if (formData.startDate && formData.endDate && new Date(formData.startDate) >= new Date(formData.endDate)) {
      newErrors.endDate = 'End date must be after start date';
    }

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
      console.error('Error saving AMC:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={amc ? 'Edit AMC Contract' : 'New AMC Contract'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Client Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Client <span className="text-red-500">*</span>
          </label>
          <select
            name="client"
            value={formData.client}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select Client</option>
            {(Array.isArray(clients) ? clients : []).map(client => (
              <option key={client._id} value={client._id}>
                {(client.clientName || client.companyName || 'Unnamed')} {client.companyName ? `- ${client.companyName}` : ''}
              </option>
            ))}
          </select>
          {errors.client && <p className="text-red-500 text-sm mt-1">{errors.client}</p>}
        </div>

        {/* Contract Value */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contract Value (₹) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="contractValue"
            value={formData.contractValue}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0.00"
            min="0"
            step="0.01"
          />
          {errors.contractValue && <p className="text-red-500 text-sm mt-1">{errors.contractValue}</p>}
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.startDate && <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.endDate && <p className="text-red-500 text-sm mt-1">{errors.endDate}</p>}
          </div>
        </div>

        {/* Service Frequency */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Service Frequency
          </label>
          <select
            name="serviceFrequency"
            value={formData.serviceFrequency}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="Weekly">Weekly</option>
            <option value="Bi-Weekly">Bi-Weekly</option>
            <option value="Monthly">Monthly</option>
            <option value="Quarterly">Quarterly</option>
            <option value="Half-Yearly">Half-Yearly</option>
            <option value="Yearly">Yearly</option>
            <option value="On-Call">On-Call</option>
          </select>
        </div>

        {/* Coverage Details */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Coverage Details</label>
          <textarea
            name="coverageDetails"
            value={formData.coverageDetails}
            onChange={handleChange}
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Describe what is covered under this AMC"
          />
        </div>

        {/* Terms */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Terms & Conditions</label>
          <textarea
            name="terms"
            value={formData.terms}
            onChange={handleChange}
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter terms and conditions"
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
            {loading ? 'Saving...' : amc ? 'Update AMC' : 'Create AMC'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AMCModal;
