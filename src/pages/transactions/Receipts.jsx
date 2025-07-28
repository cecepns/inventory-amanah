import { useState, useEffect } from 'react';
import { HiPlus, HiEye, HiCheck, HiSearch, HiPencil, HiTrash } from 'react-icons/hi';
import { useAuth } from '../../contexts/AuthContext';

const Receipts = () => {
  const { user, token } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [receipts, setReceipts] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingReceipt, setEditingReceipt] = useState(null);
  const [formData, setFormData] = useState({
    // receipt_number: '', // HAPUS dari form input user
    purchase_order_id: '',
    receipt_date: '',
    status: 'pending',
    notes: '',
    items: [],
    total_amount: 0
  });
  const [viewingReceipt, setViewingReceipt] = useState(null); // State untuk modal view
  const [viewingDetail, setViewingDetail] = useState(null); // Data detail dari API
  const [viewLoading, setViewLoading] = useState(false);

  // API URL base
  const API_BASE = 'https://api-inventory.isavralabel.com/api/inventory-amanah';

  // Fetch receipts from API
  const fetchReceipts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/receipts`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch receipts');
      }
      
      const data = await response.json();
      setReceipts(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching receipts:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch purchase orders for form dropdown
  const fetchPurchaseOrders = async () => {
    try {
      const response = await fetch(`${API_BASE}/purchase_orders`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch purchase orders');
      }
      
      const data = await response.json();
      setPurchaseOrders(data.filter(po => po.status === 'approved' || po.status === 'pending'));
    } catch (err) {
      console.error('Error fetching purchase orders:', err);
    }
  };

  // Create receipt
  const createReceipt = async (receiptData) => {
    try {
      const response = await fetch(`${API_BASE}/receipts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...receiptData,
          created_by: user?.id
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create receipt');
      }
      
      await fetchReceipts();
      setShowForm(false);
      resetForm();
      alert('Penerimaan barang berhasil dibuat!');
    } catch (err) {
      setError(err.message);
      alert('Gagal membuat penerimaan barang: ' + err.message);
    }
  };

  // Update receipt
  const updateReceipt = async (id, receiptData) => {
    try {
      const response = await fetch(`${API_BASE}/receipts/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(receiptData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update receipt');
      }
      
      await fetchReceipts();
      setShowForm(false);
      setEditingReceipt(null);
      resetForm();
      alert('Penerimaan barang berhasil diperbarui!');
    } catch (err) {
      setError(err.message);
      alert('Gagal memperbarui penerimaan barang: ' + err.message);
    }
  };

  // Delete receipt
  const deleteReceipt = async (id) => {
    if (!confirm('Apakah Anda yakin ingin menghapus penerimaan ini?')) {
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE}/receipts/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete receipt');
      }
      
      await fetchReceipts();
      alert('Penerimaan barang berhasil dihapus!');
    } catch (err) {
      setError(err.message);
      alert('Gagal menghapus penerimaan barang: ' + err.message);
    }
  };

  // Complete receipt (mark as completed)
  const completeReceipt = async (id) => {
    const receipt = receipts.find(r => r.id === id);
    if (!receipt) return;
    
    try {
      const response = await fetch(`${API_BASE}/receipts/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...receipt,
          status: 'completed'
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to complete receipt');
      }
      
      await fetchReceipts();
      alert('Penerimaan barang telah selesai!');
    } catch (err) {
      setError(err.message);
      alert('Gagal menyelesaikan penerimaan barang: ' + err.message);
    }
  };

  // Form handlers
  const resetForm = () => {
    setFormData({
      // receipt_number: '',
      purchase_order_id: '',
      receipt_date: '',
      status: 'pending',
      notes: '',
      items: [],
      total_amount: 0
    });
  };

  const handlePurchaseOrderChange = async (e) => {
    const poId = e.target.value;
    setFormData((prev) => ({ ...prev, purchase_order_id: poId, items: [] }));
    if (!poId) return;
    try {
      const response = await fetch(`${API_BASE}/purchase_orders/${poId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Gagal mengambil detail PO');
      const data = await response.json();
      // Map item PO ke format item penerimaan
      const items = (data.items || []).map(item => ({
        item_id: item.item_id,
        item_code: item.item_code || '',
        item_name: item.item_name || '',
        quantity_ordered: item.quantity,
        quantity_received: item.quantity, // default: diterima sama dengan dipesan
        unit_price: item.unit_price,
        total_price: item.quantity * item.unit_price
      }));
      setFormData((prev) => ({ ...prev, items }));
    } catch (err) {
      alert('Gagal mengambil detail PO: ' + err.message);
    }
  };

  const handleItemChange = (idx, field, value) => {
    const items = [...formData.items];
    if (field === 'quantity_received' || field === 'unit_price') {
      value = Number(value);
    }
    items[idx][field] = value;
    // Update subtotal
    items[idx].total_price = items[idx].quantity_received * items[idx].unit_price;
    setFormData((prev) => ({ ...prev, items }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Hitung total_amount sebelum submit (jaga-jaga)
    const total = (formData.items || []).reduce((sum, item) => sum + (item.quantity_received * item.unit_price), 0);
    const submitData = { ...formData, total_amount: total };
    // Hapus receipt_number jika ada
    delete submitData.receipt_number;
    if (editingReceipt) {
      await updateReceipt(editingReceipt.id, submitData);
    } else {
      await createReceipt(submitData);
    }
  };

  const startEdit = (receipt) => {
    setEditingReceipt(receipt);
    // Pastikan format tanggal untuk input type="date" adalah YYYY-MM-DD
    let date = receipt.receipt_date;
    if (date) {
      // Jika mengandung 'T', ambil bagian tanggal saja
      date = date.split('T')[0];
    }
    setFormData({
      // receipt_number: receipt.receipt_number,
      purchase_order_id: receipt.purchase_order_id,
      receipt_date: date || '',
      status: receipt.status,
      notes: receipt.notes || '',
      items: receipt.items || [],
      total_amount: receipt.total_amount || 0
    });
    setShowForm(true);
  };

  // Handler untuk view detail
  const handleView = async (receipt) => {
    setViewingReceipt(receipt);
    setViewingDetail(null);
    setViewLoading(true);
    try {
      const response = await fetch(`${API_BASE}/receipts/${receipt.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Gagal memuat detail penerimaan');
      const data = await response.json();
      setViewingDetail(data);
    } catch (err) {
      setViewingDetail({ error: err.message });
    } finally {
      setViewLoading(false);
    }
  };

  // Effect hooks
  useEffect(() => {
    if (token) {
      fetchReceipts();
      fetchPurchaseOrders();
    }
  }, [token]);

  // Hitung total_amount otomatis setiap items berubah
  useEffect(() => {
    const total = (formData.items || []).reduce((sum, item) => sum + (item.quantity_received * item.unit_price), 0);
    setFormData((prev) => ({ ...prev, total_amount: total }));
    // eslint-disable-next-line
  }, [formData.items]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  const formatDate = (dateString) => {
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
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Menunggu';
      case 'completed':
        return 'Selesai';
      default:
        return status;
    }
  };

  const filteredReceipts = receipts.filter(receipt =>
    receipt.receipt_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (receipt.purchase_order_number && receipt.purchase_order_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (receipt.supplier_name && receipt.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-600">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Penerimaan Barang</h1>
          <p className="text-gray-600 mt-1">Kelola penerimaan barang dari purchase order</p>
        </div>
        <button 
          className="btn-primary flex items-center"
          onClick={() => {
            setEditingReceipt(null);
            resetForm();
            setShowForm(true);
          }}
        >
          <HiPlus className="h-5 w-5 mr-2" />
          Buat Penerimaan
        </button>
      </div>

      {/* Search and Filter */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nomor penerimaan, PO, atau supplier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10 w-full"
            />
          </div>
          <div className="flex gap-2">
            <select className="input-field">
              <option value="">Semua Status</option>
              <option value="pending">Menunggu</option>
              <option value="completed">Selesai</option>
            </select>
            <input
              type="date"
              className="input-field"
              placeholder="Tanggal"
            />
          </div>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-screen overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {editingReceipt ? 'Edit Penerimaan' : 'Buat Penerimaan Baru'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Purchase Order
                </label>
                <select
                  className="input-field w-full"
                  value={formData.purchase_order_id}
                  onChange={handlePurchaseOrderChange}
                  required
                >
                  <option value="">Pilih PO</option>
                  {purchaseOrders.map(po => (
                    <option key={po.id} value={po.id}>
                      {po.order_number} - {po.supplier_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tanggal Penerimaan
                </label>
                <input
                  type="date"
                  className="input-field w-full"
                  value={formData.receipt_date}
                  onChange={(e) => setFormData({...formData, receipt_date: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  className="input-field w-full"
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                >
                  <option value="pending">Menunggu</option>
                  <option value="completed">Selesai</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catatan
                </label>
                <textarea
                  className="input-field w-full"
                  rows="3"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                />
              </div>
              {formData.items && formData.items.length > 0 && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Detail Item</label>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-xs border">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="px-2 py-1 border">Kode</th>
                          <th className="px-2 py-1 border">Nama</th>
                          <th className="px-2 py-1 border">Qty Dipesan</th>
                          <th className="px-2 py-1 border">Qty Diterima</th>
                          <th className="px-2 py-1 border">Harga</th>
                          <th className="px-2 py-1 border">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.items.map((item, idx) => (
                          <tr key={idx}>
                            <td className="px-2 py-1 border">{item.item_code}</td>
                            <td className="px-2 py-1 border">{item.item_name}</td>
                            <td className="px-2 py-1 border text-right">{item.quantity_ordered}</td>
                            <td className="px-2 py-1 border text-right">
                              <input
                                type="number"
                                min="0"
                                max={item.quantity_ordered}
                                value={item.quantity_received}
                                onChange={e => handleItemChange(idx, 'quantity_received', e.target.value)}
                                className="input-field w-16 text-right"
                              />
                            </td>
                            <td className="px-2 py-1 border text-right">
                              <input
                                type="number"
                                min="0"
                                value={item.unit_price}
                                onChange={e => handleItemChange(idx, 'unit_price', e.target.value)}
                                className="input-field w-24 text-right"
                              />
                            </td>
                            <td className="px-2 py-1 border text-right">{formatCurrency(item.total_price)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex justify-end mt-2">
                    <span className="font-semibold">Total: {formatCurrency(formData.total_amount)}</span>
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <button type="submit" className="btn-primary flex-1">
                  {editingReceipt ? 'Update' : 'Simpan'}
                </button>
                <button 
                  type="button" 
                  className="btn-secondary flex-1"
                  onClick={() => {
                    setShowForm(false);
                    setEditingReceipt(null);
                    resetForm();
                  }}
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipts Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  No. Penerimaan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Purchase Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Supplier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tanggal Terima
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
              {filteredReceipts.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    Tidak ada penerimaan ditemukan
                  </td>
                </tr>
              ) : (
                filteredReceipts.map((receipt) => (
                  <tr key={receipt.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{receipt.receipt_number}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{receipt.purchase_order_number}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{receipt.supplier_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(receipt.receipt_date)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(receipt.total_amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(receipt.status)}`}>
                        {getStatusText(receipt.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button 
                          className="text-blue-600 hover:text-blue-900"
                          title="Lihat Detail"
                          onClick={() => handleView(receipt)}
                        >
                          <HiEye className="h-5 w-5" />
                        </button>
                        <button 
                          className="text-green-600 hover:text-green-900"
                          onClick={() => startEdit(receipt)}
                          title="Edit"
                        >
                          <HiPencil className="h-5 w-5" />
                        </button>
                        {receipt.status === 'pending' && (
                          <button 
                            className="text-green-600 hover:text-green-900"
                            onClick={() => completeReceipt(receipt.id)}
                            title="Selesaikan"
                          >
                            <HiCheck className="h-5 w-5" />
                          </button>
                        )}
                        {receipt.status === 'pending' && (
                          <button 
                            className="text-red-600 hover:text-red-900"
                            onClick={() => deleteReceipt(receipt.id)}
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

      {/* Modal View Detail Receipt */}
      {viewingReceipt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-screen overflow-y-auto">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              onClick={() => { setViewingReceipt(null); setViewingDetail(null); }}
            >
              <span className="text-2xl">&times;</span>
            </button>
            <h3 className="text-lg font-semibold mb-4">Detail Penerimaan</h3>
            {viewLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : viewingDetail && viewingDetail.error ? (
              <div className="text-center text-red-600">{viewingDetail.error}</div>
            ) : viewingDetail ? (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Nomor Penerimaan:</span>
                  <span className="font-semibold">{viewingDetail.receipt_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Purchase Order:</span>
                  <span>{viewingDetail.purchase_order_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Supplier:</span>
                  <span>{viewingDetail.supplier_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tanggal Penerimaan:</span>
                  <span>{formatDate(viewingDetail.receipt_date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span>{getStatusText(viewingDetail.status)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Nilai:</span>
                  <span>{formatCurrency(viewingDetail.total_amount)}</span>
                </div>
                <div className="flex flex-col mt-4">
                  <span className="font-semibold mb-2">Detail Item:</span>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-xs border">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="px-2 py-1 border">Kode</th>
                          <th className="px-2 py-1 border">Nama</th>
                          <th className="px-2 py-1 border">Qty Dipesan</th>
                          <th className="px-2 py-1 border">Qty Diterima</th>
                          <th className="px-2 py-1 border">Harga</th>
                          <th className="px-2 py-1 border">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewingDetail.items && viewingDetail.items.length > 0 ? (
                          viewingDetail.items.map((item, idx) => (
                            <tr key={idx}>
                              <td className="px-2 py-1 border">{item.item_code}</td>
                              <td className="px-2 py-1 border">{item.item_name}</td>
                              <td className="px-2 py-1 border text-right">{item.quantity_ordered}</td>
                              <td className="px-2 py-1 border text-right">{item.quantity_received}</td>
                              <td className="px-2 py-1 border text-right">{formatCurrency(item.unit_price)}</td>
                              <td className="px-2 py-1 border text-right">{formatCurrency(item.total_price)}</td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan="6" className="text-center py-2">Tidak ada item</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                {viewingDetail.notes && (
                  <div className="mt-2"><span className="font-semibold">Catatan:</span> {viewingDetail.notes}</div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Receipt Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Receipt Summary */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ringkasan Penerimaan</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Penerimaan:</span>
              <span className="font-semibold">{receipts.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Selesai:</span>
              <span className="font-semibold text-green-600">
                {receipts.filter(r => r.status === 'completed').length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Menunggu:</span>
              <span className="font-semibold text-yellow-600">
                {receipts.filter(r => r.status === 'pending').length}
              </span>
            </div>
            <div className="flex justify-between border-t pt-3">
              <span className="text-gray-600">Total Nilai:</span>
              <span className="font-semibold">
                {formatCurrency(receipts.reduce((sum, receipt) => {
                  const amount = parseFloat(receipt.total_amount) || 0;
                  return sum + amount;
                }, 0))}
              </span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Aktivitas Terbaru</h3>
          <div className="space-y-3">
            {receipts.slice(0, 3).map((receipt) => (
              <div key={receipt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="text-sm font-medium text-gray-900">{receipt.receipt_number}</div>
                  <div className="text-xs text-gray-500">{receipt.supplier_name}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {formatCurrency(receipt.total_amount)}
                  </div>
                  <div className="text-xs text-gray-500">{formatDate(receipt.receipt_date)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Receipts;