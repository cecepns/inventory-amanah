import { useState, useEffect } from "react";
import { HiDownload, HiPrinter, HiSearch } from "react-icons/hi";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import axios from "axios";
import { printReport, exportToExcel, formatPurchaseDataForExcel } from "../../utils/reportUtils";

const PurchaseReport = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState("this_month");
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [purchaseData, setPurchaseData] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem("token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    Promise.all([
      axios
        .get("https://api-inventory.isavralabel.com/api/inventory-amanah/purchase_orders", { headers })
        .then((res) => res.data),
      axios
        .get("https://api-inventory.isavralabel.com/api/inventory-amanah/suppliers", { headers })
        .then((res) => res.data),
      axios
        .get("https://api-inventory.isavralabel.com/api/inventory-amanah/purchase_orders/monthly-stats", {
          headers,
        })
        .then((res) => res.data),
    ])
      .then(([orders, suppliers, monthly]) => {
        setPurchaseData(orders);
        setSuppliers(suppliers.map((s) => s.name));
        setMonthlyData(
          monthly.map((m) => ({
            month: m.month,
            amount: m.amount,
            orders: m.orders,
          }))
        );
        setLoading(false);
      })
      .catch(() => {
        setError("Gagal memuat data laporan pembelian.");
        setLoading(false);
      });
  }, []);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "completed":
        return "Selesai";
      case "pending":
        return "Menunggu";
      case "cancelled":
        return "Dibatalkan";
      default:
        return status;
    }
  };

  // Adapt to new API data structure
  const filteredData = purchaseData.filter((purchase) => {
    const matchesSearch =
      (purchase.order_number || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (purchase.supplier_name || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesSupplier =
      selectedSupplier === "" || purchase.supplier_name === selectedSupplier;
    return matchesSearch && matchesSupplier;
  });

  const totalAmount = filteredData.reduce(
    (sum, purchase) => sum + (purchase.total_amount || 0),
    0
  );
  const completedOrders = filteredData.filter(
    (purchase) => purchase.status === "completed"
  ).length;
  const pendingOrders = filteredData.filter(
    (purchase) => purchase.status === "pending"
  ).length;

  const handlePrint = () => {
    printReport('Laporan Pembelian');
  };

  const handleExport = () => {
    const excelData = formatPurchaseDataForExcel(filteredData);
    exportToExcel(excelData, 'laporan_pembelian', 'Data Pembelian');
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500">
        Memuat data laporan pembelian...
      </div>
    );
  }
  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Laporan Pembelian
          </h1>
          <p className="text-gray-600 mt-1">
            Laporan pembelian barang dari supplier
          </p>
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
          <h3 className="text-sm font-medium text-primary-800 mb-1">
            Total Pembelian
          </h3>
          <p className="text-2xl font-bold text-primary-600">
            {formatCurrency(totalAmount)}
          </p>
        </div>

        <div className="bg-secondary-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-secondary-800 mb-1">
            Jumlah Order
          </h3>
          <p className="text-2xl font-bold text-secondary-600">
            {filteredData.length}
          </p>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-green-800 mb-1">
            Order Selesai
          </h3>
          <p className="text-2xl font-bold text-green-600">{completedOrders}</p>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-yellow-800 mb-1">
            Order Pending
          </h3>
          <p className="text-2xl font-bold text-yellow-600">{pendingOrders}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Purchase Amount Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Pembelian Bulanan
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Bar dataKey="amount" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Order Count Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Jumlah Order Bulanan
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="orders"
                stroke="#10B981"
                strokeWidth={2}
              />
            </LineChart>
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
              placeholder="Cari nomor order atau supplier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10 w-full"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
              className="input-field"
            >
              <option value="">Semua Supplier</option>
              {suppliers.map((supplier) => (
                <option key={supplier} value={supplier}>
                  {supplier}
                </option>
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
            </select>
          </div>
        </div>
      </div>

      {/* Purchase Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  No. Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Supplier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tanggal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    Tidak ada data ditemukan
                  </td>
                </tr>
              ) : (
                filteredData.map((purchase) => (
                  <tr key={purchase.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {purchase.order_number}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {purchase.supplier_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(purchase.order_date)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(purchase.total_amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          purchase.status
                        )}`}
                      >
                        {getStatusText(purchase.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {/* Items are not included in list endpoint, so show dash or fetch on detail if needed */}
                        -
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Supplier Performance */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Performa Supplier
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {suppliers.map((supplier) => {
            const supplierOrders = purchaseData.filter(
              (p) => p.supplier_name === supplier
            );
            const totalSupplierAmount = supplierOrders.reduce(
              (sum, order) => sum + (order.total_amount || 0),
              0
            );
            const completedCount = supplierOrders.filter(
              (p) => p.status === "completed"
            ).length;

            return (
              <div key={supplier} className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">{supplier}</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Pembelian:</span>
                    <span className="font-semibold">
                      {formatCurrency(totalSupplierAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Jumlah Order:</span>
                    <span className="font-semibold">
                      {supplierOrders.length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order Selesai:</span>
                    <span className="font-semibold text-green-600">
                      {completedCount}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PurchaseReport;
