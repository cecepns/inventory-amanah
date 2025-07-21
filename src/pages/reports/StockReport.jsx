import { useState, useEffect } from 'react';
import axios from 'axios';
import { HiDownload, HiPrinter, HiSearch, HiExclamationCircle } from 'react-icons/hi';
import { printReport, exportToExcel, formatStockDataForExcel } from '../../utils/reportUtils';

const StockReport = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [stockData, setStockData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStockData = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const response = await axios.get('https://api-inventory.isavralabel.com/api/inventory-amanah/items', { headers });
        // Transform data agar sesuai kebutuhan frontend
        const transformed = (response.data || []).map(item => ({
          id: item.id,
          code: item.code,
          name: item.name,
          category: item.category_name || '-',
          currentStock: item.current_stock,
          minStock: item.min_stock,
          maxStock: item.max_stock,
          unitPrice: item.price,
          totalValue: (item.current_stock || 0) * (item.price || 0),
          location: item.location || '-',
          lastMovement: item.updated_at || item.created_at || '',
          status: item.current_stock <= item.min_stock ? 'low' : (item.current_stock > item.max_stock ? 'overstock' : 'normal')
        }));
        setStockData(transformed);
      } catch {
        setError('Gagal mengambil data stok.');
      } finally {
        setLoading(false);
      }
    };
    fetchStockData();
  }, []);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'low':
        return 'bg-red-100 text-red-800';
      case 'normal':
        return 'bg-green-100 text-green-800';
      case 'overstock':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'low':
        return 'Stok Rendah';
      case 'normal':
        return 'Normal';
      case 'overstock':
        return 'Overstock';
      default:
        return status;
    }
  };

  const filteredData = stockData.filter(item => {
    const matchesSearch = item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === '' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(stockData.map(item => item.category))];
  const totalValue = filteredData.reduce((sum, item) => sum + item.totalValue, 0);
  const lowStockItems = filteredData.filter(item => item.status === 'low').length;

  const handlePrint = () => {
    printReport('Laporan Stok');
  };

  const handleExport = () => {
    const excelData = formatStockDataForExcel(filteredData);
    exportToExcel(excelData, 'laporan_stok', 'Data Stok');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Laporan Stok</h1>
          <p className="text-gray-600 mt-1">Laporan status stok barang secara real-time</p>
        </div>
        <div className="flex space-x-2">
          <button onClick={handlePrint} className="btn-outline flex items-center">
            <HiPrinter className="h-5 w-5 mr-2" />
            Print
          </button>
          <button onClick={handleExport} className="btn-primary flex items-center">
            <HiDownload className="h-5 w-5 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-primary-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-primary-800 mb-1">Total Item</h3>
          <p className="text-2xl font-bold text-primary-600">{filteredData.length}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-red-800 mb-1">Stok Rendah</h3>
          <p className="text-2xl font-bold text-red-600">{lowStockItems}</p>
        </div>
        <div className="bg-secondary-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-secondary-800 mb-1">Total Nilai Stok</h3>
          <p className="text-2xl font-bold text-secondary-600">{formatCurrency(totalValue)}</p>
        </div>
        <div className="bg-accent-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-accent-800 mb-1">Kategori</h3>
          <p className="text-2xl font-bold text-accent-600">{categories.length}</p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari kode atau nama barang..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10 w-full"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input-field"
            >
              <option value="">Semua Kategori</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <select className="input-field" disabled>
              <option value="">Semua Status</option>
              <option value="low">Stok Rendah</option>
              <option value="normal">Normal</option>
              <option value="overstock">Overstock</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading & Error State */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Memuat data stok...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">{error}</div>
      ) : (
        <>
          {/* Stock Table */}
          <div className="card">
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kode & Nama
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kategori
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stok Saat Ini
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Min/Max
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Harga Satuan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nilai Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lokasi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                        Tidak ada data ditemukan
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{item.code}</div>
                            <div className="text-sm text-gray-500">{item.name}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{item.category}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {item.status === 'low' && (
                              <HiExclamationCircle className="h-4 w-4 text-red-500 mr-2" />
                            )}
                            <div className="text-sm font-medium text-gray-900">{item.currentStock}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {item.minStock} / {item.maxStock}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatCurrency(item.unitPrice)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{formatCurrency(item.totalValue)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{item.location}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                            {getStatusText(item.status)}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Low Stock Alert */}
          {lowStockItems > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <HiExclamationCircle className="h-5 w-5 text-red-400 mr-2" />
                <div>
                  <h3 className="text-sm font-medium text-red-800">Peringatan Stok Rendah</h3>
                  <p className="text-sm text-red-600 mt-1">
                    Ada {lowStockItems} item dengan stok di bawah minimum. Segera lakukan pemesanan ulang.
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default StockReport;