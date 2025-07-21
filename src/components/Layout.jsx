import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  HiHome, 
  HiCollection, 
  HiCalculator, 
  HiDocumentText, 
  HiClipboardList, 
  HiUsers, 
  HiCog, 
  HiLogout,
  HiMenu,
  HiX,
  HiBell,
  HiUser,
  HiChevronDown,
  HiChevronRight
} from 'react-icons/hi';
import PropTypes from 'prop-types';
import { useAuth } from '../contexts/AuthContext';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState(new Set());
  const location = useLocation();
  const { user, logout } = useAuth();

  const menuItems = [
    {
      title: 'Dashboard',
      icon: HiHome,
      path: '/dashboard'
    },
    {
      title: 'Data Master',
      icon: HiCollection,
      submenu: [
        { title: 'Barang', path: '/master/items' },
        { title: 'Kategori Barang', path: '/master/categories' },
        { title: 'Supplier', path: '/master/suppliers' },
        { title: 'Satuan', path: '/master/units' }
      ]
    },
    {
      title: 'EOQ & JIT',
      icon: HiCalculator,
      submenu: [
        { title: 'Perhitungan EOQ', path: '/calculations/eoq' },
        { title: 'Perhitungan JIT', path: '/calculations/jit' }
      ]
    },
    {
      title: 'Transaksi',
      icon: HiDocumentText,
      submenu: [
        { title: 'Pemesanan Barang', path: '/transactions/purchase-orders' },
        { title: 'Penerimaan Barang', path: '/transactions/receipts' },
        { title: 'Pengeluaran Barang', path: '/transactions/stock-movements' }
      ]
    },
    {
      title: 'Laporan',
      icon: HiClipboardList,
      submenu: [
        { title: 'Laporan Stok', path: '/reports/stock' },
        { title: 'Laporan Pembelian', path: '/reports/purchase' },
        { title: 'Laporan Pemakaian', path: '/reports/usage' }
      ]
    },
    {
      title: 'Pengguna',
      icon: HiUsers,
      path: '/users'
    },
    {
      title: 'Pengaturan',
      icon: HiCog,
      path: '/settings'
    }
  ];

  const isActivePath = (path) => {
    return location.pathname === path;
  };

  const isActiveSubmenu = (submenu) => {
    return submenu.some(item => location.pathname === item.path);
  };

  const toggleSubmenu = (menuTitle) => {
    setExpandedMenus(prev => {
      const newSet = new Set(prev);
      if (newSet.has(menuTitle)) {
        newSet.delete(menuTitle);
      } else {
        newSet.add(menuTitle);
      }
      return newSet;
    });
  };

  const isSubmenuExpanded = (menuTitle) => {
    return expandedMenus.has(menuTitle);
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex items-center justify-between h-16 px-4 bg-primary-600 text-white">
          <div className="flex items-center">
            <h1 className="text-lg font-bold">Toko Amanah</h1>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden"
          >
            <HiX className="h-6 w-6" />
          </button>
        </div>
        
        <nav className="mt-4 px-2 space-y-1 overflow-y-auto scrollbar-thin">
          {menuItems.map((item, index) => (
            <div key={index}>
              {item.submenu ? (
                <div className="space-y-1">
                  <button
                    onClick={() => toggleSubmenu(item.title)}
                    className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
                      isActiveSubmenu(item.submenu) 
                        ? 'bg-primary-50 text-primary-600' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center">
                      <item.icon className="mr-3 h-5 w-5" />
                      {item.title}
                    </div>
                    {isSubmenuExpanded(item.title) ? (
                      <HiChevronDown className="h-4 w-4 transition-transform duration-200" />
                    ) : (
                      <HiChevronRight className="h-4 w-4 transition-transform duration-200" />
                    )}
                  </button>
                  <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    isSubmenuExpanded(item.title) ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}>
                    <div className="ml-8 space-y-1">
                      {item.submenu.map((subItem, subIndex) => (
                        <Link
                          key={subIndex}
                          to={subItem.path}
                          className={`block px-4 py-2 text-sm rounded-lg transition-colors duration-200 ${
                            isActivePath(subItem.path)
                              ? 'bg-primary-100 text-primary-700 border-r-2 border-primary-600'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                          onClick={() => setSidebarOpen(false)}
                        >
                          {subItem.title}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <Link
                  to={item.path}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    isActivePath(item.path)
                      ? 'bg-primary-100 text-primary-700 border-r-2 border-primary-600'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.title}
                </Link>
              )}
            </div>
          ))}
          
          <div className="pt-4">
            <button 
              onClick={logout}
              className="flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors duration-200"
            >
              <HiLogout className="mr-3 h-5 w-5" />
              Logout
            </button>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden mr-4 p-2 rounded-lg hover:bg-gray-100"
              >
                <HiMenu className="h-6 w-6" />
              </button>
              <h2 className="text-lg font-semibold text-gray-900">
                Inventory Management System
              </h2>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="p-2 rounded-lg hover:bg-gray-100 relative">
                <HiBell className="h-6 w-6 text-gray-500" />
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                  3
                </span>
              </button>
              
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                  <HiUser className="h-5 w-5 text-white" />
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-700">{user?.full_name || 'User'}</p>
                  <p className="text-xs text-gray-500">{user?.role === 'admin' ? 'Administrator' : user?.role === 'owner' ? 'Owner' : 'Staff'}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          {children}
        </main>
      </div>

      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

Layout.propTypes = {
  children: PropTypes.node.isRequired
};

export default Layout;