import { useState, useEffect } from 'react';
import { HiCalculator, HiInformationCircle, HiSave, HiEye, HiRefresh, HiTrash } from 'react-icons/hi';
import { useAuth } from '../../contexts/AuthContext';

const BASE_URL = 'http://localhost:5000';

const EOQCalculations = () => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [historicalData, setHistoricalData] = useState(null);
  const [calculationHistory, setCalculationHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  
  const [formData, setFormData] = useState({
    annualDemand: '',
    orderingCost: '',
    holdingCost: '',
    unitCost: ''
  });
  
  const [result, setResult] = useState(null);
  const [saveLoading, setSaveLoading] = useState(false);

  // Load items on component mount
  useEffect(() => {
    fetchItems();
  }, []);

  // Load historical data when item is selected
  useEffect(() => {
    if (selectedItem) {
      fetchHistoricalData(selectedItem.id);
      fetchCalculationHistory(selectedItem.id);
    }
  }, [selectedItem]);

  const fetchItems = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/items`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setItems(data.filter(item => item.status === 'active'));
    } catch (error) {
      console.error('Error fetching items:', error);
      alert('Tidak dapat terhubung ke server. Pastikan server backend sedang berjalan di port 5000.');
    }
  };

  const fetchHistoricalData = async (itemId) => {
    try {
      const response = await fetch(`${BASE_URL}/api/items/${itemId}/historical-data?months=12`);
      const data = await response.json();
      setHistoricalData(data);
      
      // Auto-fill form with suggested values based on historical data
      if (data.estimated_annual_demand > 0) {
        setFormData(prev => ({
          ...prev,
          annualDemand: data.estimated_annual_demand.toString()
        }));
      }
    } catch (error) {
      console.error('Error fetching historical data:', error);
    }
  };

  const fetchCalculationHistory = async (itemId) => {
    try {
      const response = await fetch(`${BASE_URL}/api/eoq_calculations?item_id=${itemId}`);
      const data = await response.json();
      setCalculationHistory(data);
    } catch (error) {
      console.error('Error fetching calculation history:', error);
    }
  };

  const calculateEOQ = () => {
    const { annualDemand, orderingCost, holdingCost, unitCost } = formData;
    
    if (!annualDemand || !orderingCost || !holdingCost) {
      alert('Mohon lengkapi semua field yang diperlukan');
      return;
    }

    const D = parseFloat(annualDemand);
    const S = parseFloat(orderingCost);
    const H = parseFloat(holdingCost);
    const C = parseFloat(unitCost) || 0;

    // EOQ Formula: √(2DS/H)
    const eoq = Math.sqrt((2 * D * S) / H);
    
    // Total Cost = (D/Q)*S + (Q/2)*H + D*C
    const totalOrderingCost = (D / eoq) * S;
    const totalHoldingCost = (eoq / 2) * H;
    const totalItemCost = D * C;
    const totalCost = totalOrderingCost + totalHoldingCost + totalItemCost;
    
    // Number of orders per year
    const numberOfOrders = D / eoq;
    
    // Time between orders (in days, assuming 365 days per year)
    const timeBetweenOrders = 365 / numberOfOrders;
    
    // Reorder point (assuming lead time of 7 days)
    const leadTime = 7;
    const reorderPoint = (D / 365) * leadTime;

    setResult({
      eoq: Math.round(eoq),
      totalCost: Math.round(totalCost),
      totalOrderingCost: Math.round(totalOrderingCost),
      totalHoldingCost: Math.round(totalHoldingCost),
      totalItemCost: Math.round(totalItemCost),
      numberOfOrders: Math.round(numberOfOrders * 10) / 10,
      timeBetweenOrders: Math.round(timeBetweenOrders),
      reorderPoint: Math.round(reorderPoint)
    });
  };

  const saveCalculation = async () => {
    if (!selectedItem || !result) {
      alert('Pilih item dan lakukan perhitungan terlebih dahulu');
      return;
    }

    setSaveLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/api/eoq_calculations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          item_id: selectedItem.id,
          annual_demand: parseInt(formData.annualDemand),
          ordering_cost: parseFloat(formData.orderingCost),
          holding_cost: parseFloat(formData.holdingCost),
          eoq_quantity: result.eoq,
          total_cost: result.totalCost,
          reorder_point: result.reorderPoint,
          calculation_date: new Date().toISOString().split('T')[0],
          created_by: user?.id
        }),
      });

      if (response.ok) {
        alert('Perhitungan EOQ berhasil disimpan!');
        fetchCalculationHistory(selectedItem.id);
      } else {
        throw new Error('Failed to save calculation');
      }
    } catch (error) {
      console.error('Error saving calculation:', error);
      alert('Gagal menyimpan perhitungan');
    } finally {
      setSaveLoading(false);
    }
  };

  const deleteCalculation = async (calculationId) => {
    if (!confirm('Yakin ingin menghapus perhitungan ini?')) return;

    try {
      const response = await fetch(`${BASE_URL}/api/eoq_calculations/${calculationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Perhitungan berhasil dihapus');
        fetchCalculationHistory(selectedItem.id);
      } else {
        throw new Error('Failed to delete calculation');
      }
    } catch (error) {
      console.error('Error deleting calculation:', error);
      alert('Gagal menghapus perhitungan');
    }
  };

  const loadCalculation = (calculation) => {
    setFormData({
      annualDemand: calculation.annual_demand.toString(),
      orderingCost: calculation.ordering_cost.toString(),
      holdingCost: calculation.holding_cost.toString(),
      unitCost: ''
    });

    setResult({
      eoq: calculation.eoq_quantity,
      totalCost: calculation.total_cost,
      totalOrderingCost: 0,
      totalHoldingCost: 0,
      totalItemCost: 0,
      numberOfOrders: 0,
      timeBetweenOrders: 0,
      reorderPoint: calculation.reorder_point
    });
  };

  const resetForm = () => {
    setFormData({
      annualDemand: '',
      orderingCost: '',
      holdingCost: '',
      unitCost: ''
    });
    setResult(null);
    setSelectedItem(null);
    setHistoricalData(null);
    setCalculationHistory([]);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Perhitungan EOQ</h1>
        <p className="text-gray-600 mt-1">
          Economic Order Quantity - Menghitung jumlah pesanan optimal untuk meminimalkan biaya total
        </p>
      </div>

      {/* Item Selection */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Pilih Item</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Item *
            </label>
            <select
              value={selectedItem?.id || ''}
              onChange={(e) => {
                const item = items.find(i => i.id === parseInt(e.target.value));
                setSelectedItem(item);
              }}
              className="input-field w-full"
            >
              <option value="">Pilih Item</option>
              {items.map(item => (
                <option key={item.id} value={item.id}>
                  {item.code} - {item.name}
                </option>
              ))}
            </select>
          </div>
          
          {selectedItem && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <h3 className="font-medium text-gray-800 mb-1">Info Item</h3>
              <p className="text-sm text-gray-600">Stok Saat Ini: {selectedItem.current_stock}</p>
              <p className="text-sm text-gray-600">Min Stock: {selectedItem.min_stock}</p>
              <p className="text-sm text-gray-600">Kategori: {selectedItem.category_name}</p>
            </div>
          )}
        </div>

        {historicalData && (
          <div className="mt-4 bg-blue-50 p-3 rounded-lg">
            <h3 className="font-medium text-blue-800 mb-1">Data Historis (12 bulan terakhir)</h3>
            <p className="text-sm text-blue-700">
              Estimasi Permintaan Tahunan: {historicalData.estimated_annual_demand} unit
            </p>
            <p className="text-sm text-blue-700">
              Rata-rata Permintaan Harian: {historicalData.avg_daily_demand} unit
            </p>
            <p className="text-sm text-blue-700">
              Periode Data: {historicalData.data_period_months} bulan
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <HiCalculator className="h-6 w-6 text-primary-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Parameter EOQ</h2>
            </div>
            {calculationHistory.length > 0 && (
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="btn-outline text-sm flex items-center"
              >
                <HiEye className="h-4 w-4 mr-1" />
                History ({calculationHistory.length})
              </button>
            )}
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Permintaan Tahunan (D) *
              </label>
              <input
                type="number"
                value={formData.annualDemand}
                onChange={(e) => setFormData({ ...formData, annualDemand: e.target.value })}
                className="input-field w-full"
                placeholder="Contoh: 12000"
                min="0"
                disabled={!selectedItem}
              />
              <p className="text-xs text-gray-500 mt-1">Jumlah unit yang dibutuhkan per tahun</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Biaya Pemesanan (S) *
              </label>
              <input
                type="number"
                value={formData.orderingCost}
                onChange={(e) => setFormData({ ...formData, orderingCost: e.target.value })}
                className="input-field w-full"
                placeholder="Contoh: 50000"
                min="0"
                disabled={!selectedItem}
              />
              <p className="text-xs text-gray-500 mt-1">Biaya tetap per pesanan (dalam Rupiah)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Biaya Penyimpanan (H) *
              </label>
              <input
                type="number"
                value={formData.holdingCost}
                onChange={(e) => setFormData({ ...formData, holdingCost: e.target.value })}
                className="input-field w-full"
                placeholder="Contoh: 5000"
                min="0"
                disabled={!selectedItem}
              />
              <p className="text-xs text-gray-500 mt-1">Biaya penyimpanan per unit per tahun (dalam Rupiah)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Biaya per Unit (C)
              </label>
              <input
                type="number"
                value={formData.unitCost}
                onChange={(e) => setFormData({ ...formData, unitCost: e.target.value })}
                className="input-field w-full"
                placeholder="Contoh: 25000"
                min="0"
                disabled={!selectedItem}
              />
              <p className="text-xs text-gray-500 mt-1">Harga pembelian per unit (opsional)</p>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                onClick={calculateEOQ}
                disabled={!selectedItem}
                className="btn-primary flex items-center flex-1"
              >
                <HiCalculator className="h-5 w-5 mr-2" />
                Hitung EOQ
              </button>
              
              {result && (
                <button
                  onClick={saveCalculation}
                  disabled={saveLoading}
                  className="btn-secondary flex items-center"
                >
                  <HiSave className="h-5 w-5 mr-2" />
                  {saveLoading ? 'Simpan...' : 'Simpan'}
                </button>
              )}
              
              <button
                onClick={resetForm}
                className="btn-outline"
              >
                <HiRefresh className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* EOQ Info */}
        <div className="card">
          <div className="flex items-center mb-4">
            <HiInformationCircle className="h-6 w-6 text-secondary-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Tentang EOQ</h2>
          </div>
          
          <div className="space-y-4 text-sm text-gray-600">
            <div>
              <h3 className="font-medium text-gray-800 mb-2">Rumus EOQ:</h3>
              <div className="bg-gray-50 p-3 rounded-lg font-mono text-center">
                EOQ = √(2DS/H)
              </div>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-800 mb-2">Keterangan:</h3>
              <ul className="space-y-1">
                <li><strong>D</strong> = Permintaan tahunan (unit)</li>
                <li><strong>S</strong> = Biaya pemesanan per pesanan</li>
                <li><strong>H</strong> = Biaya penyimpanan per unit per tahun</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-800 mb-2">Manfaat EOQ:</h3>
              <ul className="space-y-1 list-disc list-inside">
                <li>Meminimalkan total biaya inventory</li>
                <li>Menentukan jumlah pesanan optimal</li>
                <li>Mengoptimalkan frekuensi pemesanan</li>
                <li>Mengurangi biaya penyimpanan</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Calculation History */}
      {showHistory && calculationHistory.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Riwayat Perhitungan EOQ</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Permintaan Tahunan</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">EOQ</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Biaya</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reorder Point</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {calculationHistory.map((calc) => (
                  <tr key={calc.id}>
                    <td className="px-4 py-3 text-sm text-gray-900">{formatDate(calc.calculation_date)}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{calc.annual_demand}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{calc.eoq_quantity}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{formatCurrency(calc.total_cost)}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{calc.reorder_point}</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => loadCalculation(calc)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Load perhitungan"
                        >
                          <HiRefresh className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteCalculation(calc.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Hapus perhitungan"
                        >
                          <HiTrash className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Hasil Perhitungan EOQ
            {selectedItem && (
              <span className="text-sm font-normal text-gray-600 ml-2">
                untuk {selectedItem.code} - {selectedItem.name}
              </span>
            )}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-primary-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-primary-800 mb-1">EOQ (Optimal Order)</h3>
              <p className="text-2xl font-bold text-primary-600">{result.eoq}</p>
              <p className="text-xs text-primary-700">unit per pesanan</p>
            </div>
            
            <div className="bg-secondary-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-secondary-800 mb-1">Total Biaya</h3>
              <p className="text-2xl font-bold text-secondary-600">{formatCurrency(result.totalCost)}</p>
              <p className="text-xs text-secondary-700">per tahun</p>
            </div>
            
            <div className="bg-accent-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-accent-800 mb-1">Frekuensi Pesanan</h3>
              <p className="text-2xl font-bold text-accent-600">{result.numberOfOrders}</p>
              <p className="text-xs text-accent-700">kali per tahun</p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-green-800 mb-1">Reorder Point</h3>
              <p className="text-2xl font-bold text-green-600">{result.reorderPoint}</p>
              <p className="text-xs text-green-700">unit</p>
            </div>
          </div>
          
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-800 mb-1">Biaya Pemesanan</h3>
              <p className="text-lg font-bold text-gray-600">{formatCurrency(result.totalOrderingCost)}</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-800 mb-1">Biaya Penyimpanan</h3>
              <p className="text-lg font-bold text-gray-600">{formatCurrency(result.totalHoldingCost)}</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-800 mb-1">Interval Pesanan</h3>
              <p className="text-lg font-bold text-gray-600">{result.timeBetweenOrders}</p>
              <p className="text-xs text-gray-500">hari</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EOQCalculations;