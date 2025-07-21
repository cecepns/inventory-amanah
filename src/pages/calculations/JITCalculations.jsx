import { useState, useEffect } from 'react';
import { HiClock, HiInformationCircle, HiSave, HiEye, HiRefresh, HiTrash } from 'react-icons/hi';
import { useAuth } from '../../contexts/AuthContext';

const BASE_URL = 'http://localhost:5000';

const JITCalculations = () => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [historicalData, setHistoricalData] = useState(null);
  const [calculationHistory, setCalculationHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  
  const [formData, setFormData] = useState({
    dailyDemand: '',
    leadTime: '',
    safetyStock: '',
    workingDays: '365'
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
      if (data.avg_daily_demand > 0) {
        setFormData(prev => ({
          ...prev,
          dailyDemand: data.avg_daily_demand.toString()
        }));
      }
    } catch (error) {
      console.error('Error fetching historical data:', error);
    }
  };

  const fetchCalculationHistory = async (itemId) => {
    try {
      const response = await fetch(`${BASE_URL}/api/jit_calculations?item_id=${itemId}`);
      const data = await response.json();
      setCalculationHistory(data);
    } catch (error) {
      console.error('Error fetching calculation history:', error);
    }
  };

  const calculateJIT = () => {
    const { dailyDemand, leadTime, safetyStock, workingDays } = formData;
    
    if (!dailyDemand || !leadTime) {
      alert('Mohon lengkapi field yang diperlukan');
      return;
    }

    const dd = parseFloat(dailyDemand);
    const lt = parseFloat(leadTime);
    const ss = parseFloat(safetyStock) || 0;
    const wd = parseFloat(workingDays);

    // JIT Calculations
    const reorderPoint = (dd * lt) + ss;
    const annualDemand = dd * wd;
    const totalLeadTimeDemand = dd * lt;
    const averageInventory = ss + (dd * lt / 2);
    const stockoutRisk = ss > 0 ? 'Low' : 'High';
    
    // Time to stockout (if no safety stock)
    const timeToStockout = ss / dd;
    
    // Minimum order frequency for JIT
    const minOrderFrequency = wd / lt;

    setResult({
      reorderPoint: Math.round(reorderPoint),
      annualDemand: Math.round(annualDemand),
      totalLeadTimeDemand: Math.round(totalLeadTimeDemand),
      averageInventory: Math.round(averageInventory),
      stockoutRisk,
      timeToStockout: Math.round(timeToStockout * 10) / 10,
      minOrderFrequency: Math.round(minOrderFrequency)
    });
  };

  const saveCalculation = async () => {
    if (!selectedItem || !result) {
      alert('Pilih item dan lakukan perhitungan terlebih dahulu');
      return;
    }

    setSaveLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/api/jit_calculations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          item_id: selectedItem.id,
          lead_time: parseInt(formData.leadTime),
          daily_demand: parseFloat(formData.dailyDemand),
          safety_stock: parseInt(formData.safetyStock) || 0,
          reorder_point: result.reorderPoint,
          calculation_date: new Date().toISOString().split('T')[0],
          created_by: user?.id
        }),
      });

      if (response.ok) {
        alert('Perhitungan JIT berhasil disimpan!');
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
      const response = await fetch(`${BASE_URL}/api/jit_calculations/${calculationId}`, {
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
      dailyDemand: calculation.daily_demand.toString(),
      leadTime: calculation.lead_time.toString(),
      safetyStock: calculation.safety_stock.toString(),
      workingDays: '365'
    });

    setResult({
      reorderPoint: calculation.reorder_point,
      annualDemand: 0,
      totalLeadTimeDemand: 0,
      averageInventory: 0,
      stockoutRisk: calculation.safety_stock > 0 ? 'Low' : 'High',
      timeToStockout: 0,
      minOrderFrequency: 0
    });
  };

  const resetForm = () => {
    setFormData({
      dailyDemand: '',
      leadTime: '',
      safetyStock: '',
      workingDays: '365'
    });
    setResult(null);
    setSelectedItem(null);
    setHistoricalData(null);
    setCalculationHistory([]);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Perhitungan JIT</h1>
        <p className="text-gray-600 mt-1">
          Just In Time - Menghitung titik pemesanan ulang untuk meminimalkan inventory
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
              <HiClock className="h-6 w-6 text-primary-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Parameter JIT</h2>
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
                Permintaan Harian (D) *
              </label>
              <input
                type="number"
                value={formData.dailyDemand}
                onChange={(e) => setFormData({ ...formData, dailyDemand: e.target.value })}
                className="input-field w-full"
                placeholder="Contoh: 50"
                min="0"
                step="0.1"
                disabled={!selectedItem}
              />
              <p className="text-xs text-gray-500 mt-1">Rata-rata unit yang dibutuhkan per hari</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lead Time (L) *
              </label>
              <input
                type="number"
                value={formData.leadTime}
                onChange={(e) => setFormData({ ...formData, leadTime: e.target.value })}
                className="input-field w-full"
                placeholder="Contoh: 7"
                min="0"
                disabled={!selectedItem}
              />
              <p className="text-xs text-gray-500 mt-1">Waktu tunggu pengiriman (dalam hari)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Safety Stock (SS)
              </label>
              <input
                type="number"
                value={formData.safetyStock}
                onChange={(e) => setFormData({ ...formData, safetyStock: e.target.value })}
                className="input-field w-full"
                placeholder="Contoh: 50"
                min="0"
                disabled={!selectedItem}
              />
              <p className="text-xs text-gray-500 mt-1">Stok pengaman untuk mengantisipasi ketidakpastian</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hari Kerja per Tahun
              </label>
              <input
                type="number"
                value={formData.workingDays}
                onChange={(e) => setFormData({ ...formData, workingDays: e.target.value })}
                className="input-field w-full"
                placeholder="365"
                min="1"
                disabled={!selectedItem}
              />
              <p className="text-xs text-gray-500 mt-1">Jumlah hari operasional per tahun</p>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                onClick={calculateJIT}
                disabled={!selectedItem}
                className="btn-primary flex items-center flex-1"
              >
                <HiClock className="h-5 w-5 mr-2" />
                Hitung JIT
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

        {/* JIT Info */}
        <div className="card">
          <div className="flex items-center mb-4">
            <HiInformationCircle className="h-6 w-6 text-secondary-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Tentang JIT</h2>
          </div>
          
          <div className="space-y-4 text-sm text-gray-600">
            <div>
              <h3 className="font-medium text-gray-800 mb-2">Rumus JIT:</h3>
              <div className="bg-gray-50 p-3 rounded-lg font-mono text-center">
                ROP = (D × L) + SS
              </div>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-800 mb-2">Keterangan:</h3>
              <ul className="space-y-1">
                <li><strong>ROP</strong> = Reorder Point (Titik Pemesanan Ulang)</li>
                <li><strong>D</strong> = Permintaan harian (unit)</li>
                <li><strong>L</strong> = Lead time (hari)</li>
                <li><strong>SS</strong> = Safety stock (unit)</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-800 mb-2">Prinsip JIT:</h3>
              <ul className="space-y-1 list-disc list-inside">
                <li>Produksi berdasarkan permintaan aktual</li>
                <li>Meminimalkan waste dan inventory</li>
                <li>Meningkatkan efisiensi operasional</li>
                <li>Pengiriman tepat waktu</li>
                <li>Kualitas zero defect</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Calculation History */}
      {showHistory && calculationHistory.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Riwayat Perhitungan JIT</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Permintaan Harian</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lead Time</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Safety Stock</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reorder Point</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {calculationHistory.map((calc) => (
                  <tr key={calc.id}>
                    <td className="px-4 py-3 text-sm text-gray-900">{formatDate(calc.calculation_date)}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{calc.daily_demand}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{calc.lead_time} hari</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{calc.safety_stock}</td>
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
            Hasil Perhitungan JIT
            {selectedItem && (
              <span className="text-sm font-normal text-gray-600 ml-2">
                untuk {selectedItem.code} - {selectedItem.name}
              </span>
            )}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-primary-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-primary-800 mb-1">Reorder Point</h3>
              <p className="text-2xl font-bold text-primary-600">{result.reorderPoint}</p>
              <p className="text-xs text-primary-700">unit</p>
            </div>
            
            <div className="bg-secondary-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-secondary-800 mb-1">Permintaan Tahunan</h3>
              <p className="text-2xl font-bold text-secondary-600">{result.annualDemand}</p>
              <p className="text-xs text-secondary-700">unit per tahun</p>
            </div>
            
            <div className="bg-accent-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-accent-800 mb-1">Lead Time Demand</h3>
              <p className="text-2xl font-bold text-accent-600">{result.totalLeadTimeDemand}</p>
              <p className="text-xs text-accent-700">unit</p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-green-800 mb-1">Rata-rata Inventory</h3>
              <p className="text-2xl font-bold text-green-600">{result.averageInventory}</p>
              <p className="text-xs text-green-700">unit</p>
            </div>
          </div>
          
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-800 mb-1">Risiko Stockout</h3>
              <p className={`text-lg font-bold ${result.stockoutRisk === 'Low' ? 'text-green-600' : 'text-red-600'}`}>
                {result.stockoutRisk}
              </p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-800 mb-1">Waktu ke Stockout</h3>
              <p className="text-lg font-bold text-gray-600">{result.timeToStockout}</p>
              <p className="text-xs text-gray-500">hari</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-800 mb-1">Frekuensi Order Min</h3>
              <p className="text-lg font-bold text-gray-600">{result.minOrderFrequency}</p>
              <p className="text-xs text-gray-500">kali per tahun</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JITCalculations;