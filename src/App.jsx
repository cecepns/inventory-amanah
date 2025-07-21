import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/auth/Login';
import Dashboard from './pages/Dashboard';
import Categories from './pages/master/Categories';
import Suppliers from './pages/master/Suppliers';
import Units from './pages/master/Units';
import Items from './pages/master/Items';
import EOQCalculations from './pages/calculations/EOQCalculations';
import JITCalculations from './pages/calculations/JITCalculations';
import PurchaseOrders from './pages/transactions/PurchaseOrders';
import Receipts from './pages/transactions/Receipts';
import StockMovements from './pages/transactions/StockMovements';
import StockReport from './pages/reports/StockReport';
import PurchaseReport from './pages/reports/PurchaseReport';
import UsageReport from './pages/reports/UsageReport';
import Users from './pages/users/Users';
import Settings from './pages/settings/Settings';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          
          {/* Protected Routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          } />
          
          {/* Data Master */}
          <Route path="/master/categories" element={
            <ProtectedRoute>
              <Layout>
                <Categories />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/master/suppliers" element={
            <ProtectedRoute>
              <Layout>
                <Suppliers />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/master/units" element={
            <ProtectedRoute>
              <Layout>
                <Units />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/master/items" element={
            <ProtectedRoute>
              <Layout>
                <Items />
              </Layout>
            </ProtectedRoute>
          } />
          
          {/* EOQ & JIT */}
          <Route path="/calculations/eoq" element={
            <ProtectedRoute>
              <Layout>
                <EOQCalculations />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/calculations/jit" element={
            <ProtectedRoute>
              <Layout>
                <JITCalculations />
              </Layout>
            </ProtectedRoute>
          } />
          
          {/* Transactions */}
          <Route path="/transactions/purchase-orders" element={
            <ProtectedRoute>
              <Layout>
                <PurchaseOrders />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/transactions/receipts" element={
            <ProtectedRoute>
              <Layout>
                <Receipts />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/transactions/stock-movements" element={
            <ProtectedRoute>
              <Layout>
                <StockMovements />
              </Layout>
            </ProtectedRoute>
          } />
          
          {/* Reports */}
          <Route path="/reports/stock" element={
            <ProtectedRoute>
              <Layout>
                <StockReport />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/reports/purchase" element={
            <ProtectedRoute>
              <Layout>
                <PurchaseReport />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/reports/usage" element={
            <ProtectedRoute>
              <Layout>
                <UsageReport />
              </Layout>
            </ProtectedRoute>
          } />
          
          {/* Users */}
          <Route path="/users" element={
            <ProtectedRoute>
              <Layout>
                <Users />
              </Layout>
            </ProtectedRoute>
          } />
          
          {/* Settings */}
          <Route path="/settings" element={
            <ProtectedRoute>
              <Layout>
                <Settings />
              </Layout>
            </ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;