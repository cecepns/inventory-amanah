import { useState, useEffect } from 'react';
import { HiPlus, HiEye, HiPencilAlt, HiTrash, HiSearch, HiX, HiExclamationCircle } from 'react-icons/hi';
import axios from 'axios';

const PurchaseOrders = () => {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Current data
  const [editingOrder, setEditingOrder] = useState(null);
  const [viewingOrder, setViewingOrder] = useState(null);
  const [deletingOrder, setDeletingOrder] = useState(null);
  
  // Form data
  const [formData, setFormData] = useState({
    order_number: '',
    supplier_id: '',
    order_date: '',
    expected_date: '',
    total_amount: 0,
    status: 'pending',
    notes: '',
    items: []
  });

  const [formItems, setFormItems] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      const [ordersRes, suppliersRes, itemsRes] = await Promise.all([
        axios.get('https://api-inventory.isavralabel.com/api/inventory-amanah/purchase_orders', { headers }),
        axios.get('https://api-inventory.isavralabel.com/api/inventory-amanah/suppliers', { headers }),
        axios.get('https://api-inventory.isavralabel.com/api/inventory-amanah/items', { headers })
      ]);

      setPurchaseOrders(ordersRes.data);
      setSuppliers(suppliersRes.data.filter(s => s.status === 'active'));
      setItems(itemsRes.data.filter(i => i.status === 'active'));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const generateOrderNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const existingOrders = purchaseOrders.filter(order => 
      order.order_number?.includes(`PO-${year}${month}`)
    );
    const nextNumber = String(existingOrders.length + 1).padStart(3, '0');
    return `PO-${year}${month}-${nextNumber}`;
  };

  const resetForm = () => {
    setFormData({
      order_number: '',
      supplier_id: '',
      order_date: '',
      expected_date: '',
      total_amount: 0,
      status: 'pending',
      notes: '',
      items: []
    });
    setFormItems([]);
  };

  const handleCreate = () => {
    resetForm();
    setFormData(prev => ({ ...prev, order_number: generateOrderNumber() }));
    setShowCreateModal(true);
  };

  const handleEdit = async (order) => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      // Fetch detailed order data
      const response = await axios.get(`https://api-inventory.isavralabel.com/api/inventory-amanah/purchase_orders/${order.id}`, { headers });
      const orderData = response.data;
      
      setEditingOrder(orderData);
      setFormData({
        order_number: orderData.order_number,
        supplier_id: orderData.supplier_id,
        order_date: orderData.order_date?.split('T')[0] || '',
        expected_date: orderData.expected_date?.split('T')[0] || '',
        total_amount: orderData.total_amount,
        status: orderData.status,
        notes: orderData.notes || '',
        items: orderData.items || []
      });
      
      setFormItems(orderData.items?.map(item => ({
        item_id: item.item_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price
      })) || []);
      
      setShowEditModal(true);
    } catch (error) {
      console.error('Error fetching order details:', error);
      alert('Gagal memuat detail pesanan');
    }
  };

  const handleView = async (order) => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      const response = await axios.get(`https://api-inventory.isavralabel.com/api/inventory-amanah/purchase_orders/${order.id}`, { headers });
      setViewingOrder(response.data);
      setShowViewModal(true);
    } catch (error) {
      console.error('Error fetching order details:', error);
      alert('Gagal memuat detail pesanan');
    }
  };

  const handleDelete = (order) => {
    setDeletingOrder(order);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      await axios.delete(`https://api-inventory.isavralabel.com/api/inventory-amanah/purchase_orders/${deletingOrder.id}`, { headers });
      await fetchData();
      setShowDeleteModal(false);
      setDeletingOrder(null);
      alert('Pesanan berhasil dihapus');
    } catch (error) {
      console.error('Error deleting order:', error);
      alert(error.response?.data?.message || 'Gagal menghapus pesanan');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.supplier_id || !formData.order_date || formItems.length === 0) {
      alert('Mohon lengkapi semua field yang diperlukan');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      const totalAmount = formItems.reduce((sum, item) => sum + (item.total_price || 0), 0);
      
      const orderData = {
        ...formData,
        total_amount: totalAmount,
        items: formItems
      };

      if (editingOrder) {
        await axios.put(`https://api-inventory.isavralabel.com/api/inventory-amanah/purchase_orders/${editingOrder.id}`, orderData, { headers });
        setShowEditModal(false);
        setEditingOrder(null);
      } else {
        await axios.post('https://api-inventory.isavralabel.com/api/inventory-amanah/purchase_orders', orderData, { headers });
        setShowCreateModal(false);
      }

      await fetchData();
      resetForm();
      alert(editingOrder ? 'Pesanan berhasil diperbarui' : 'Pesanan berhasil dibuat');
    } catch (error) {
      console.error('Error saving order:', error);
      alert('Gagal menyimpan pesanan');
    }
  };

  const addFormItem = () => {
    setFormItems([...formItems, { item_id: '', quantity: 1, unit_price: 0, total_price: 0 }]);
  };

  const updateFormItem = (index, field, value) => {
    const updatedItems = [...formItems];
    updatedItems[index][field] = value;
    
    // Calculate total price
    if (field === 'quantity' || field === 'unit_price') {
      updatedItems[index].total_price = updatedItems[index].quantity * updatedItems[index].unit_price;
    }
    
    // Auto-fill unit price when item is selected
    if (field === 'item_id') {
      const selectedItem = items.find(item => item.id === parseInt(value));
      if (selectedItem) {
        updatedItems[index].unit_price = selectedItem.price || 0;
        updatedItems[index].total_price = updatedItems[index].quantity * updatedItems[index].unit_price;
      }
    }
    
    setFormItems(updatedItems);
  };

  const removeFormItem = (index) => {
    setFormItems(formItems.filter((_, i) => i !== index));
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-blue-100 text-blue-800';
      case 'received':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Menunggu';
      case 'approved':
        return 'Disetujui';
      case 'received':
        return 'Diterima';
      case 'cancelled':
        return 'Dibatalkan';
      default:
        return status;
    }
  };

  const filteredOrders = purchaseOrders.filter(order => {
    const matchesSearch = order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !selectedStatus || order.status === selectedStatus;
    const matchesSupplier = !selectedSupplier || order.supplier_id === parseInt(selectedSupplier);
    
    return matchesSearch && matchesStatus && matchesSupplier;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pemesanan Barang</h1>
          <p className="text-gray-600 mt-1">Kelola pesanan pembelian barang dari supplier</p>
        </div>
        <button onClick={handleCreate} className="btn-primary flex items-center">
          <HiPlus className="h-5 w-5 mr-2" />
          Buat Pesanan Baru
        </button>
      </div>

      {/* Search and Filter */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nomor pesanan atau supplier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10 w-full"
            />
          </div>
          <div className="flex gap-2">
            <select 
              className="input-field"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="">Semua Status</option>
              <option value="pending">Menunggu</option>
              <option value="approved">Disetujui</option>
              <option value="received">Diterima</option>
              <option value="cancelled">Dibatalkan</option>
            </select>
            <select 
              className="input-field"
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
            >
              <option value="">Semua Supplier</option>
              {suppliers.map(supplier => (
                <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Purchase Orders Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  No. Pesanan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Supplier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tanggal Pesanan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tanggal Kirim
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    Tidak ada pesanan ditemukan
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{order.order_number}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{order.supplier_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(order.order_date)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(order.expected_date)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(order.total_amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleView(order)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Lihat Detail"
                        >
                          <HiEye className="h-5 w-5" />
                        </button>
                        {order.status === 'pending' && (
                          <button 
                            onClick={() => handleEdit(order)}
                            className="text-primary-600 hover:text-primary-900"
                            title="Edit"
                          >
                            <HiPencilAlt className="h-5 w-5" />
                          </button>
                        )}
                        {order.status === 'pending' && (
                          <button 
                            onClick={() => handleDelete(order)}
                            className="text-red-600 hover:text-red-900"
                            title="Hapus"
                          >
                            <HiTrash className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-yellow-800 mb-1">Pesanan Menunggu</h3>
          <p className="text-2xl font-bold text-yellow-600">
            {purchaseOrders.filter(o => o.status === 'pending').length}
          </p>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-blue-800 mb-1">Pesanan Disetujui</h3>
          <p className="text-2xl font-bold text-blue-600">
            {purchaseOrders.filter(o => o.status === 'approved').length}
          </p>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-green-800 mb-1">Pesanan Diterima</h3>
          <p className="text-2xl font-bold text-green-600">
            {purchaseOrders.filter(o => o.status === 'received').length}
          </p>
        </div>
        
        <div className="bg-primary-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-primary-800 mb-1">Total Nilai</h3>
          <p className="text-2xl font-bold text-primary-600">
            {formatCurrency(purchaseOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0))}
          </p>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-start justify-center p-4">
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-5xl my-8 max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {editingOrder ? 'Edit Pesanan' : 'Buat Pesanan Baru'}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {editingOrder ? 'Perbarui informasi pesanan pembelian' : 'Tambahkan pesanan pembelian baru'}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                  setEditingOrder(null);
                  resetForm();
                }}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <HiX className="h-6 w-6 text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
              <form onSubmit={handleSubmit} className="p-6 space-y-8">
                {/* Basic Information */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Informasi Dasar</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nomor Pesanan <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.order_number}
                        onChange={(e) => setFormData({...formData, order_number: e.target.value})}
                        className="input-field w-full"
                        required
                        readOnly={!!editingOrder}
                        placeholder="PO-202401-001"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Supplier <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.supplier_id}
                        onChange={(e) => setFormData({...formData, supplier_id: e.target.value})}
                        className="input-field w-full"
                        required
                      >
                        <option value="">Pilih Supplier</option>
                        {suppliers.map(supplier => (
                          <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                        className="input-field w-full"
                      >
                        <option value="pending">Menunggu</option>
                        <option value="approved">Disetujui</option>
                        <option value="received">Diterima</option>
                        <option value="cancelled">Dibatalkan</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Date Information */}
                <div className="bg-blue-50 rounded-lg p-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Informasi Tanggal</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tanggal Pesanan <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={formData.order_date}
                        onChange={(e) => setFormData({...formData, order_date: e.target.value})}
                        className="input-field w-full"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tanggal Pengiriman Diharapkan
                      </label>
                      <input
                        type="date"
                        value={formData.expected_date}
                        onChange={(e) => setFormData({...formData, expected_date: e.target.value})}
                        className="input-field w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="bg-green-50 rounded-lg p-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Catatan</h4>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="input-field w-full"
                    rows="3"
                    placeholder="Tambahkan catatan untuk pesanan ini..."
                  />
                </div>

                {/* Items Section */}
                <div className="bg-yellow-50 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h4 className="text-lg font-medium text-gray-900">Items Pesanan</h4>
                      <p className="text-sm text-gray-600 mt-1">Tambahkan item yang akan dipesan</p>
                    </div>
                    <button
                      type="button"
                      onClick={addFormItem}
                      className="btn-primary flex items-center"
                    >
                      <HiPlus className="h-4 w-4 mr-2" />
                      Tambah Item
                    </button>
                  </div>

                  {formItems.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
                      <div className="text-gray-400 mb-2">
                        <HiPlus className="h-12 w-12 mx-auto" />
                      </div>
                      <p className="text-gray-500 text-lg mb-2">Belum ada item</p>
                                             <p className="text-gray-400 text-sm">Klik &quot;Tambah Item&quot; untuk menambahkan item pertama</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {formItems.map((item, index) => (
                        <div key={index} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                          <div className="flex items-start justify-between mb-4">
                            <h5 className="text-md font-medium text-gray-900">Item #{index + 1}</h5>
                            <button
                              type="button"
                              onClick={() => removeFormItem(index)}
                              className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                              title="Hapus Item"
                            >
                              <HiTrash className="h-5 w-5" />
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="lg:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Nama Item <span className="text-red-500">*</span>
                              </label>
                              <select
                                value={item.item_id}
                                onChange={(e) => updateFormItem(index, 'item_id', e.target.value)}
                                className="input-field w-full"
                                required
                              >
                                <option value="">Pilih Item</option>
                                {items.map(itm => (
                                  <option key={itm.id} value={itm.id}>{itm.name}</option>
                                ))}
                              </select>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Kuantitas <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => updateFormItem(index, 'quantity', parseInt(e.target.value) || 0)}
                                className="input-field w-full"
                                min="1"
                                required
                                placeholder="0"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Harga Satuan <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="number"
                                value={item.unit_price}
                                onChange={(e) => updateFormItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                                className="input-field w-full"
                                min="0"
                                step="0.01"
                                required
                                placeholder="0.00"
                              />
                            </div>
                          </div>
                          
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Subtotal Item:</span>
                              <span className="text-lg font-semibold text-gray-900">
                                {formatCurrency(item.total_price || 0)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {/* Total Summary */}
                      <div className="bg-primary-50 border border-primary-200 rounded-lg p-6">
                        <div className="flex justify-between items-center">
                          <div>
                            <h5 className="text-lg font-semibold text-primary-900">Total Pesanan</h5>
                            <p className="text-sm text-primary-700">{formItems.length} item(s)</p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-primary-900">
                              {formatCurrency(formItems.reduce((sum, item) => sum + (item.total_price || 0), 0))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </form>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end px-6 py-4 border-t border-gray-200 bg-gray-50 space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                  setEditingOrder(null);
                  resetForm();
                }}
                className="btn-outline"
              >
                Batal
              </button>
              <button 
                onClick={handleSubmit}
                className="btn-primary"
              >
                {editingOrder ? 'Perbarui' : 'Simpan'} Pesanan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && viewingOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-8 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Detail Pesanan</h3>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setViewingOrder(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <HiX className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Informasi Pesanan</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Nomor:</span> {viewingOrder.order_number}</div>
                    <div><span className="font-medium">Supplier:</span> {viewingOrder.supplier_name}</div>
                    <div><span className="font-medium">Tanggal Pesanan:</span> {formatDate(viewingOrder.order_date)}</div>
                    <div><span className="font-medium">Tanggal Pengiriman:</span> {formatDate(viewingOrder.expected_date)}</div>
                    <div><span className="font-medium">Status:</span> 
                      <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(viewingOrder.status)}`}>
                        {getStatusText(viewingOrder.status)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Ringkasan</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Total Items:</span> {viewingOrder.items?.length || 0}</div>
                    <div><span className="font-medium">Total Nilai:</span> {formatCurrency(viewingOrder.total_amount)}</div>
                    {viewingOrder.notes && (
                      <div><span className="font-medium">Catatan:</span> {viewingOrder.notes}</div>
                    )}
                  </div>
                </div>
              </div>

              {viewingOrder.items && viewingOrder.items.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Items Pesanan</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Harga Satuan</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {viewingOrder.items.map((item, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.item_name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.quantity}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(item.unit_price)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{formatCurrency(item.total_price)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setViewingOrder(null);
                }}
                className="btn-secondary"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <HiExclamationCircle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">Hapus Pesanan</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Apakah Anda yakin ingin menghapus pesanan <strong>{deletingOrder.order_number}</strong>? 
                  Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
              <div className="items-center px-4 py-3 flex justify-center space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeletingOrder(null);
                  }}
                  className="btn-secondary"
                >
                  Batal
                </button>
                <button
                  onClick={confirmDelete}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseOrders;