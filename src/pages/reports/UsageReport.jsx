import { useState } from 'react';
import { HiDownload, HiPrinter, HiSearch, HiTrendingDown, HiTrendingUp } from 'react-icons/hi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useUsageReports, useDailyUsage, useCategoryUsage, useCategories } from '../../hooks/useUsageReports';
import { printReport, exportToExcel, formatUsageDataForExcel } from '../../utils/reportUtils';

const UsageReport = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState('this_month');
  const [selectedCategory, setSelectedCategory] = useState('');
  
  // Fetch data using custom hooks
  const { usageData, loading: usageLoading, error: usageError } = useUsageReports(dateRange, selectedCategory, searchTerm);
  const { dailyData, loading: dailyLoading } = useDailyUsage(dateRange);
  const { categoryData, loading: categoryLoading } = useCategoryUsage(dateRange);
  const { categories, loading: categoriesLoading } = useCategories();
  
  // Transform data for charts
  const dailyUsageData = dailyData.map(item => ({
    date: item.date,
    usage: item.usage || 0
  }));

  const categoryUsageData = categoryData;

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up':
        return <HiTrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <HiTrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <div className="h-4 w-4 bg-gray-400 rounded-full" />;
    }
  };

  const getTrendColor = (trend) => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getTrendText = (trend) => {
    switch (trend) {
      case 'up':
        return 'Naik';
      case 'down':
        return 'Turun';
      default:
        return 'Stabil';
    }
  };

  const filteredData = usageData.filter(item => {
    const matchesSearch = item.itemCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.itemName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === '' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalUsage = filteredData.reduce((sum, item) => sum + (parseInt(item.totalUsage) || 0), 0);
  const averageDaily = totalUsage / 30; // Assuming 30 days in a month

  const handlePrint = () => {
    printReport('Laporan Pemakaian');
  };

  const handleExport = () => {
    const excelData = formatUsageDataForExcel(filteredData);
    exportToExcel(excelData, 'laporan_pemakaian', 'Data Pemakaian');
  };

  // Show loading state
  if (usageLoading || dailyLoading || categoryLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Laporan Pemakaian</h1>
            <p className="text-gray-600 mt-1">Laporan pemakaian barang dan analisis tren</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Memuat data laporan...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (usageError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Laporan Pemakaian</h1>
            <p className="text-gray-600 mt-1">Laporan pemakaian barang dan analisis tren</p>
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="text-center">
            <p className="text-red-600 font-medium">Error memuat data: {usageError}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 btn-primary"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Laporan Pemakaian</h1>
          <p className="text-gray-600 mt-1">Laporan pemakaian barang dan analisis tren</p>
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
          <h3 className="text-sm font-medium text-primary-800 mb-1">Total Pemakaian</h3>
          <p className="text-2xl font-bold text-primary-600">{totalUsage}</p>
          <p className="text-xs text-primary-700">unit bulan ini</p>
        </div>
        
        <div className="bg-secondary-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-secondary-800 mb-1">Rata-rata Harian</h3>
          <p className="text-2xl font-bold text-secondary-600">{averageDaily.toFixed(1)}</p>
          <p className="text-xs text-secondary-700">unit per hari</p>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-green-800 mb-1">Tren Naik</h3>
          <p className="text-2xl font-bold text-green-600">
            {filteredData.filter(item => item.trend === 'up').length}
          </p>
          <p className="text-xs text-green-700">item</p>
        </div>
        
        <div className="bg-red-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-red-800 mb-1">Tren Turun</h3>
          <p className="text-2xl font-bold text-red-600">
            {filteredData.filter(item => item.trend === 'down').length}
          </p>
          <p className="text-xs text-red-700">item</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Usage Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Pemakaian Harian</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dailyUsageData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="usage" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category Usage Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Pemakaian per Kategori</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryUsageData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryUsageData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
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
              disabled={categoriesLoading}
            >
              <option value="">Semua Kategori</option>
              {categories.map(category => (
                <option key={category.id} value={category.name}>{category.name}</option>
              ))}
            </select>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="input-field"
            >
              <option value="this_month">Bulan Ini</option>
              <option value="last_month">Bulan Lalu</option>
              <option value="last_3_months">3 Bulan Terakhir</option>
              <option value="this_year">Tahun Ini</option>
              <option value="last_year">Tahun Lalu</option>
            </select>
          </div>
        </div>
      </div>

      {/* Usage Table */}
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
                  Total Pemakaian
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rata-rata Harian
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tren
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Terakhir Digunakan
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    {usageData.length === 0 ? 'Tidak ada data pemakaian dalam periode ini' : 'Tidak ada data ditemukan'}
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{item.itemCode}</div>
                        <div className="text-sm text-gray-500">{item.itemName}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{item.category}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{parseInt(item.totalUsage) || 0}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{parseFloat(item.averageDaily) || 0}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getTrendIcon(item.trend)}
                        <span className={`ml-2 text-sm font-medium ${getTrendColor(item.trend)}`}>
                          {getTrendText(item.trend)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(item.lastUsage)}</div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Used Items */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Barang Paling Banyak Digunakan</h3>
        <div className="space-y-3">
          {[...filteredData].sort((a, b) => (parseInt(b.totalUsage) || 0) - (parseInt(a.totalUsage) || 0)).slice(0, 5).map((item, index) => (
            <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-sm font-bold text-primary-600">{index + 1}</span>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">{item.itemName}</div>
                  <div className="text-xs text-gray-500">{item.category}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-gray-900">{parseInt(item.totalUsage) || 0}</div>
                <div className="text-xs text-gray-500">unit</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UsageReport;