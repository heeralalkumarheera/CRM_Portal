import { useState, useEffect } from 'react';
import Modal from '../../components/common/Modal';
import { clientAPI } from '../../services/apiService';

const InvoiceModal = ({ isOpen, onClose, onSave, invoice }) => {
  const [formData, setFormData] = useState({
    client: '',
    items: [{ itemType: 'Service', itemName: '', description: '', quantity: 1, unit: 'Nos', unitPrice: 0, discountType: 'Fixed', discount: 0, cgst: 9, sgst: 9, igst: 0 }],
    paymentTerms: '',
    dueDate: '',
    notes: ''
  });
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      loadClients();
      if (invoice) {
        setFormData({
          client: invoice.client?._id || '',
          items: (invoice.items || [{ itemType: 'Service', itemName: '', description: '', quantity: 1, unit: 'Nos', unitPrice: 0, discountType: 'Fixed', discount: 0, cgst: 9, sgst: 9, igst: 0 }]).map(i => ({
            itemType: i.itemType || 'Service',
            itemName: i.itemName || '',
            description: i.description || '',
            quantity: i.quantity ?? 1,
            unit: i.unit || 'Nos',
            unitPrice: i.unitPrice ?? 0,
            discountType: i.discountType || 'Fixed',
            discount: i.discount ?? 0,
            cgst: i.cgst ?? 9,
            sgst: i.sgst ?? 9,
            igst: i.igst ?? 0
          })),
          paymentTerms: invoice.paymentTerms || '',
          dueDate: invoice.dueDate?.split('T')[0] || '',
          notes: invoice.notes || ''
        });
      } else {
        setFormData({
          client: '',
          items: [{ itemType: 'Service', itemName: '', description: '', quantity: 1, unit: 'Nos', unitPrice: 0, discountType: 'Fixed', discount: 0, cgst: 9, sgst: 9, igst: 0 }],
          paymentTerms: '',
          dueDate: '',
          notes: ''
        });
      }
      setErrors({});
    }
  }, [isOpen, invoice]);

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

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { itemType: 'Service', itemName: '', description: '', quantity: 1, unit: 'Nos', unitPrice: 0, discountType: 'Fixed', discount: 0, cgst: 9, sgst: 9, igst: 0 }]
    }));
  };

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }));
    }
  };

  const calculateItemTotal = (item) => {
    const lineAmount = (item.quantity || 0) * (item.unitPrice || 0);
    const discountAmount = item.discountType === 'Percentage' ? (lineAmount * (item.discount || 0)) / 100 : (item.discount || 0);
    const taxableAmount = lineAmount - discountAmount;
    const cgstAmount = (taxableAmount * (item.cgst || 9)) / 100;
    const sgstAmount = (taxableAmount * (item.sgst || 9)) / 100;
    const igstAmount = (taxableAmount * (item.igst || 0)) / 100;
    const taxAmount = cgstAmount + sgstAmount + igstAmount;
    return taxableAmount + taxAmount;
  };

  const calculateGrandTotal = () => {
    return formData.items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.client) newErrors.client = 'Client is required';
    if (!formData.dueDate) newErrors.dueDate = 'Due date is required';
    
    formData.items.forEach((item, index) => {
      if (!item.itemType) newErrors[`item_${index}_itemType`] = 'Item type is required';
      if (!item.itemName) newErrors[`item_${index}_itemName`] = 'Item name is required';
      if (!item.description) newErrors[`item_${index}_description`] = 'Description is required';
      if (item.quantity <= 0) newErrors[`item_${index}_quantity`] = 'Quantity must be greater than 0';
      if (item.unitPrice <= 0) newErrors[`item_${index}_unitPrice`] = 'Unit price must be greater than 0';
    });

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
      console.error('Error saving invoice:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={invoice ? 'Edit Invoice' : 'New Invoice'} size="xl">
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

        {/* Items */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Items <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={addItem}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              + Add Item
            </button>
          </div>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {formData.items.map((item, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                <div className="grid grid-cols-12 gap-3">
                  {/* Item Type */}
                  <div className="col-span-12 sm:col-span-3">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Item Type</label>
                    <select
                      value={item.itemType}
                      onChange={(e) => handleItemChange(index, 'itemType', e.target.value)}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Service">Service</option>
                      <option value="Product">Product</option>
                    </select>
                    {errors[`item_${index}_itemType`] && (
                      <p className="text-red-500 text-xs mt-1">{errors[`item_${index}_itemType`]}</p>
                    )}
                  </div>

                  {/* Item Name */}
                  <div className="col-span-12 sm:col-span-4">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Item Name</label>
                    <input
                      type="text"
                      value={item.itemName}
                      onChange={(e) => handleItemChange(index, 'itemName', e.target.value)}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Annual Maintenance Service"
                    />
                    {errors[`item_${index}_itemName`] && (
                      <p className="text-red-500 text-xs mt-1">{errors[`item_${index}_itemName`]}</p>
                    )}
                  </div>
                  <div className="col-span-12 sm:col-span-5">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Item description"
                    />
                    {errors[`item_${index}_description`] && (
                      <p className="text-red-500 text-xs mt-1">{errors[`item_${index}_description`]}</p>
                    )}
                  </div>
                  
                  <div className="col-span-4 sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Qty</label>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="1"
                    />
                    {errors[`item_${index}_quantity`] && (
                      <p className="text-red-500 text-xs mt-1">{errors[`item_${index}_quantity`]}</p>
                    )}
                  </div>
                  
                  <div className="col-span-4 sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Price</label>
                    <input
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                      step="0.01"
                    />
                    {errors[`item_${index}_unitPrice`] && (
                      <p className="text-red-500 text-xs mt-1">{errors[`item_${index}_unitPrice`]}</p>
                    )}
                  </div>
                  
                  {/* Discount */}
                  <div className="col-span-6 sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Discount</label>
                    <div className="flex gap-2">
                      <select
                        value={item.discountType}
                        onChange={(e) => handleItemChange(index, 'discountType', e.target.value)}
                        className="px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="Fixed">Fixed</option>
                        <option value="Percentage">Percentage</option>
                      </select>
                      <input
                        type="number"
                        value={item.discount}
                        onChange={(e) => handleItemChange(index, 'discount', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>

                  {/* Taxes */}
                  <div className="col-span-6 sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">CGST %</label>
                    <input
                      type="number"
                      value={item.cgst}
                      onChange={(e) => handleItemChange(index, 'cgst', parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                      max="100"
                    />
                  </div>
                  <div className="col-span-6 sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">SGST %</label>
                    <input
                      type="number"
                      value={item.sgst}
                      onChange={(e) => handleItemChange(index, 'sgst', parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                      max="100"
                    />
                  </div>
                  <div className="col-span-6 sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">IGST %</label>
                    <input
                      type="number"
                      value={item.igst}
                      onChange={(e) => handleItemChange(index, 'igst', parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                      max="100"
                    />
                  </div>
                  
                  <div className="col-span-1 flex items-end">
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      disabled={formData.items.length === 1}
                      className="px-2 py-1.5 text-red-600 hover:bg-red-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ×
                    </button>
                  </div>
                </div>
                
                <div className="mt-2 text-right text-sm font-medium text-gray-700">
                  Total: ₹{calculateItemTotal(item).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-3 text-right">
            <div className="text-lg font-bold text-gray-900">
              Grand Total: ₹{calculateGrandTotal().toFixed(2)}
            </div>
          </div>
        </div>

        {/* Due Date */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Due Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.dueDate && <p className="text-red-500 text-sm mt-1">{errors.dueDate}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
            <input
              type="text"
              name="paymentTerms"
              value={formData.paymentTerms}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Net 30"
            />
          </div>
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
            {loading ? 'Saving...' : invoice ? 'Update Invoice' : 'Create Invoice'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default InvoiceModal;
