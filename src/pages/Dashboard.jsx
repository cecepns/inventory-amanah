import { useState, useEffect } from 'react';
import { HiCube, HiExclamationCircle, HiClipboardList, HiCurrencyDollar } from 'react-icons/hi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import axios from 'axios';
import PropTypes from 'prop-types';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalItems: 0,
    lowStockItems: 0,
    pendingOrders: 0,
    totalInventoryValue: 0
  });
  const [recentMovements, setRecentMovements] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, movementsRes, monthlyRes] = await Promise.all([
        axios.get('https://api-inventory.isavralabel.com/api/inventory-amanah/dashboard/stats'),
        axios.get('https://api-inventory.isavralabel.com/api/inventory-amanah/dashboard/recent-movements'),
        axios.get('https://api-inventory.isavralabel.com/api/inventory-amanah/dashboard/monthly-stats')
      ]);

      setStats(statsRes.data);
      setRecentMovements(movementsRes.data);
      setMonthlyStats(monthlyRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(value);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const pieData = [
    { name: 'Stok Normal', value: stats.totalItems - stats.lowStockItems, color: '#10B981' },
    { name: 'Stok Rendah', value: stats.lowStockItems, color: '#EF4444' }
  ];

  const StatCard = ({ title, value, icon: Icon, color, description }) => (
    <div className="card hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center">
        <div className={`p-3 rounded-full ${color} mr-4`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {description && (
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          )}
        </div>
      </div>
    </div>
  );

  // Add PropTypes validation for StatCard component
  StatCard.propTypes = {
    title: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    icon: PropTypes.elementType.isRequired,
    color: PropTypes.string.isRequired,
    description: PropTypes.string
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Selamat datang di Sistem Manajemen Inventory Toko Amanah Sparepart</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard
          title="Total Barang"
          value={stats.totalItems}
          icon={HiCube}
          color="bg-primary-500"
          description="Barang aktif"
        />
        <StatCard
          title="Stok Rendah"
          value={stats.lowStockItems}
          icon={HiExclamationCircle}
          color="bg-red-500"
          description="Perlu segera diorder"
        />
        <StatCard
          title="Pesanan Pending"
          value={stats.pendingOrders}
          icon={HiClipboardList}
          color="bg-accent-500"
          description="Menunggu persetujuan"
        />
        <StatCard
          title="Nilai Inventory"
          value={formatCurrency(stats.totalInventoryValue)}
          icon={HiCurrencyDollar}
          color="bg-secondary-500"
          description="Total nilai stok"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Stock Movement Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Pergerakan Stok Bulanan</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total_in" fill="#10B981" name="Barang Masuk" />
              <Bar dataKey="total_out" fill="#EF4444" name="Barang Keluar" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Stock Status Pie Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Stok</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Stock Movements */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Pergerakan Stok Terbaru</h3>
          <button className="btn-outline text-sm">Lihat Semua</button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Barang</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipe</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jumlah</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Referensi</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentMovements.map((movement) => (
                <tr key={movement.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{movement.item_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      movement.movement_type === 'in' 
                        ? 'bg-green-100 text-green-800' 
                        : movement.movement_type === 'out'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {movement.movement_type === 'in' ? 'Masuk' : movement.movement_type === 'out' ? 'Keluar' : 'Adjustment'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {movement.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {movement.reference_type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(movement.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {movement.user_name}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;