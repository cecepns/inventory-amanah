import { useState, useEffect } from 'react';
import { HiPlus, HiArrowUp, HiArrowDown, HiAdjustments, HiSearch } from 'react-icons/hi';
import { useAuth } from '../../contexts/AuthContext';

const StockMovements = () => {
  const { user, token } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [stockMovements, setStockMovements] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    item_id: '',
    movement_type: 'in',
    quantity: '',
    reference_type: 'adjustment',
    reference_id: null,
    notes: ''
  });

  // API URL base
  const API_BASE = 'https://api-inventory.isavralabel.com/api/inventory-amanah';

  // Fetch stock movements from API
  const fetchStockMovements = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/stock_movements`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch stock movements');
      }
      
      const data = await response.json();
      setStockMovements(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching stock movements:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch items for form dropdown
  const fetchItems = async () => {
    try {
      const response = await fetch(`${API_BASE}/items`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch items');
      }
      
      const data = await response.json();
      setItems(data.filter(item => item.status === 'active'));
    } catch (err) {
      console.error('Error fetching items:', err);
    }
  };

  // Create stock movement
  const createStockMovement = async (movementData) => {
    try {
      const response = await fetch(`${API_BASE}/stock_movements`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...movementData,
          created_by: user?.id
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create stock movement');
      }
      
      await fetchStockMovements();
      setShowForm(false);
      resetForm();
      alert('Pergerakan stok berhasil dicatat!');
    } catch (err) {
      setError(err.message);
      alert('Gagal mencatat pergerakan stok: ' + err.message);
    }
  };

  // Form handlers
  const resetForm = () => {
    setFormData({
      item_id: '',
      movement_type: 'in',
      quantity: '',
      reference_type: 'adjustment',
      reference_id: null,
      notes: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Convert quantity based on movement type
    let finalQuantity = parseInt(formData.quantity);
    if (formData.movement_type === 'out') {
      finalQuantity = -Math.abs(finalQuantity); // Ensure negative for out movements
    } else if (formData.movement_type === 'adjustment') {
      // For adjustments, quantity can be positive or negative
      finalQuantity = parseInt(formData.quantity);
    } else {
      finalQuantity = Math.abs(finalQuantity); // Ensure positive for in movements
    }
    
    await createStockMovement({
      ...formData,
      quantity: finalQuantity
    });
  };

  // Effect hooks
  useEffect(() => {
    if (token) {
      fetchStockMovements();
      fetchItems();
    }
  }, [token]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getMovementIcon = (type) => {
    switch (type) {
      case 'in':
        return <HiArrowUp className="h-5 w-5 text-green-500" />;
      case 'out':
        return <HiArrowDown className="h-5 w-5 text-red-500" />;
      case 'adjustment':
        return <HiAdjustments className="h-5 w-5 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getMovementText = (type) => {
    switch (type) {
      case 'in':
        return 'Masuk';
      case 'out':
        return 'Keluar';
      case 'adjustment':
        return 'Penyesuaian';
      default:
        return type;
    }
  };

  const getMovementColor = (type) => {
    switch (type) {
      case 'in':
        return 'bg-green-100 text-green-800';
      case 'out':
        return 'bg-red-100 text-red-800';
      case 'adjustment':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getReferenceText = (type) => {
    switch (type) {
      case 'purchase':
        return 'Pembelian';
      case 'sale':
        return 'Penjualan';
      case 'adjustment':
        return 'Penyesuaian';
      case 'transfer':
        return 'Transfer';
      default:
        return type;
    }
  };

  const filteredMovements = stockMovements.filter(movement => {
    const matchesSearch = movement.item_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         movement.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === '' || movement.movement_type === selectedType;
    return matchesSearch && matchesType;
  });

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
          <h1 className="text-2xl font-bold text-gray-900">Pergerakan Stok</h1>
          <p className="text-gray-600 mt-1">Kelola dan pantau pergerakan stok barang</p>
        </div>
        <button 
          className="btn-primary flex items-center"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          <HiPlus className="h-5 w-5 mr-2" />
          Catat Pergerakan
        </button>
      </div>

      {/* Search and Filter */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari barang atau catatan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10 w-full"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="input-field"
            >
              <option value="">Semua Tipe</option>
              <option value="in">Masuk</option>
              <option value="out">Keluar</option>
              <option value="adjustment">Penyesuaian</option>
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
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              Catat Pergerakan Stok Baru
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Barang
                </label>
                <select
                  className="input-field w-full"
                  value={formData.item_id}
                  onChange={(e) => setFormData({...formData, item_id: e.target.value})}
                  required
                >
                  <option value="">Pilih Barang</option>
                  {items.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.code} - {item.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipe Pergerakan
                </label>
                <select
                  className="input-field w-full"
                  value={formData.movement_type}
                  onChange={(e) => setFormData({...formData, movement_type: e.target.value})}
                  required
                >
                  <option value="in">Masuk</option>
                  <option value="out">Keluar</option>
                  <option value="adjustment">Penyesuaian</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jumlah {formData.movement_type === 'adjustment' && '(gunakan tanda minus (-) untuk pengurangan)'}
                </label>
                <input
                  type="number"
                  className="input-field w-full"
                  value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                  required
                  min={formData.movement_type === 'adjustment' ? undefined : "1"}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipe Referensi
                </label>
                <select
                  className="input-field w-full"
                  value={formData.reference_type}
                  onChange={(e) => setFormData({...formData, reference_type: e.target.value})}
                >
                  <option value="adjustment">Penyesuaian</option>
                  <option value="purchase">Pembelian</option>
                  <option value="sale">Penjualan</option>
                  <option value="transfer">Transfer</option>
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
                  placeholder="Masukkan catatan pergerakan..."
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn-primary flex-1">
                  Simpan
                </button>
                <button 
                  type="button" 
                  className="btn-secondary flex-1"
                  onClick={() => {
                    setShowForm(false);
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

      {/* Stock Movements Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Barang
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipe
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Jumlah
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Referensi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tanggal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Catatan
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    Tidak ada pergerakan stok ditemukan
                  </td>
                </tr>
              ) : (
                filteredMovements.map((movement) => (
                  <tr key={movement.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{movement.item_name}</div>
                      <div className="text-xs text-gray-500">{movement.item_code}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getMovementIcon(movement.movement_type)}
                        <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getMovementColor(movement.movement_type)}`}>
                          {getMovementText(movement.movement_type)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${movement.quantity > 0 ? 'text-green-600' : movement.quantity < 0 ? 'text-red-600' : 'text-yellow-600'}`}>
                        {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{getReferenceText(movement.reference_type)}</div>
                      {movement.reference_id && (
                        <div className="text-xs text-gray-500">ID: {movement.reference_id}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(movement.created_at)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{movement.user_name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{movement.notes}</div>
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
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center">
            <HiArrowUp className="h-8 w-8 text-green-500 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-green-800">Total Masuk</h3>
              <p className="text-2xl font-bold text-green-600">
                {stockMovements.filter(m => m.movement_type === 'in').reduce((sum, m) => sum + Math.abs(m.quantity), 0)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="flex items-center">
            <HiArrowDown className="h-8 w-8 text-red-500 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Total Keluar</h3>
              <p className="text-2xl font-bold text-red-600">
                {stockMovements.filter(m => m.movement_type === 'out').reduce((sum, m) => sum + Math.abs(m.quantity), 0)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="flex items-center">
            <HiAdjustments className="h-8 w-8 text-yellow-500 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">Penyesuaian</h3>
              <p className="text-2xl font-bold text-yellow-600">
                {stockMovements.filter(m => m.movement_type === 'adjustment').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-primary-50 p-4 rounded-lg">
          <div className="flex items-center">
            <HiAdjustments className="h-8 w-8 text-primary-500 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-primary-800">Total Transaksi</h3>
              <p className="text-2xl font-bold text-primary-600">
                {stockMovements.length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockMovements;