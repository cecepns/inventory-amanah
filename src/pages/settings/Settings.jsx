import React, { useState, useEffect } from 'react';
import { HiCog, HiDatabase, HiBell, HiCalculator, HiSave } from 'react-icons/hi';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [settings, setSettings] = useState({
    // General Settings
    companyName: 'Toko Amanah Sparepart',
    companyAddress: 'Jl. Raya Sparepart No. 123, Jakarta',
    companyPhone: '021-1234567',
    companyEmail: 'info@tokoamanah.com',
    
    // EOQ Settings
    defaultOrderingCost: 50000,
    defaultHoldingCost: 10000,
    defaultLeadTime: 7,
    
    // JIT Settings
    defaultSafetyStock: 5,
    workingDaysPerYear: 365,
    
    // Notification Settings
    lowStockNotification: true,
    reorderNotification: true,
    emailNotifications: true,
    
    // Backup Settings
    backupSchedule: 'daily',
    backupPath: '/backup/inventory',
    autoBackup: true
  });

  // Load settings from API on component mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('https://api-inventory.isavralabel.com/api/inventory-amanah/settings');
      
      if (!response.ok) {
        throw new Error('Failed to load settings');
      }
      
      const serverSettings = await response.json();
      
      // Merge server settings with default settings
      setSettings(prevSettings => ({
        ...prevSettings,
        ...serverSettings
      }));
    } catch (err) {
      console.error('Error loading settings:', err);
      setError('Gagal memuat pengaturan: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    
    // Clear any previous messages
    setError('');
    setSuccessMessage('');
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccessMessage('');
    
    try {
      // Get auth token from localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Token autentikasi tidak ditemukan. Silakan login kembali.');
      }
      
      const response = await fetch('http://localhost:5000/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save settings');
      }
      
      const result = await response.json();
      setSuccessMessage('Pengaturan berhasil disimpan!');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Gagal menyimpan pengaturan: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleManualBackup = async () => {
    setSaving(true);
    setError('');
    setSuccessMessage('');
    
    try {
      // Simulate backup process
      await new Promise(resolve => setTimeout(resolve, 2000));
      setSuccessMessage('Backup berhasil dibuat! Data telah disimpan.');
      
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      
    } catch (err) {
      setError('Gagal membuat backup: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const validateSettings = () => {
    const errors = [];
    
    // Validate company info
    if (!settings.companyName?.trim()) {
      errors.push('Nama perusahaan harus diisi');
    }
    if (!settings.companyEmail?.trim()) {
      errors.push('Email perusahaan harus diisi');
    }
    if (settings.companyEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.companyEmail)) {
      errors.push('Format email tidak valid');
    }
    
    // Validate EOQ settings
    if (!settings.defaultOrderingCost || settings.defaultOrderingCost < 0) {
      errors.push('Biaya pemesanan harus lebih besar dari 0');
    }
    if (!settings.defaultHoldingCost || settings.defaultHoldingCost < 0) {
      errors.push('Biaya penyimpanan harus lebih besar dari 0');
    }
    
    // Validate JIT settings
    if (!settings.defaultLeadTime || settings.defaultLeadTime < 1) {
      errors.push('Lead time minimal 1 hari');
    }
    if (!settings.workingDaysPerYear || settings.workingDaysPerYear < 1 || settings.workingDaysPerYear > 366) {
      errors.push('Hari kerja per tahun harus antara 1-366');
    }
    
    return errors;
  };

  const handleSaveWithValidation = async () => {
    const validationErrors = validateSettings();
    
    if (validationErrors.length > 0) {
      setError('Validasi gagal:\n' + validationErrors.join('\n'));
      return;
    }
    
    await handleSave();
  };

  const tabs = [
    { id: 'general', name: 'Umum', icon: HiCog },
    { id: 'calculations', name: 'Perhitungan', icon: HiCalculator },
    { id: 'notifications', name: 'Notifikasi', icon: HiBell },
    { id: 'backup', name: 'Backup', icon: HiDatabase }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pengaturan Sistem</h1>
          <p className="text-gray-600 mt-1">Konfigurasi parameter sistem dan preferensi</p>
        </div>
        <button
          onClick={handleSaveWithValidation}
          disabled={saving || loading}
          className="btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <HiSave className="h-5 w-5 mr-2" />
          {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
            <p className="text-blue-800">Memuat pengaturan...</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="text-sm text-red-700 mt-1">
                {error.split('\n').map((line, index) => (
                  <p key={index}>{line}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Berhasil</h3>
              <p className="text-sm text-green-700 mt-1">{successMessage}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="card">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    activeTab === tab.id
                      ? 'bg-primary-100 text-primary-700 border-r-2 border-primary-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <tab.icon className="mr-3 h-5 w-5" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="card">
            {/* General Settings */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Informasi Perusahaan</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nama Perusahaan
                      </label>
                      <input
                        type="text"
                        value={settings.companyName}
                        onChange={(e) => handleSettingChange('companyName', e.target.value)}
                        disabled={loading || saving}
                        className="input-field w-full disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Telepon
                      </label>
                      <input
                        type="tel"
                        value={settings.companyPhone}
                        onChange={(e) => handleSettingChange('companyPhone', e.target.value)}
                        disabled={loading || saving}
                        className="input-field w-full disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Alamat
                    </label>
                    <textarea
                      value={settings.companyAddress}
                      onChange={(e) => handleSettingChange('companyAddress', e.target.value)}
                      disabled={loading || saving}
                      className="input-field w-full disabled:bg-gray-100 disabled:cursor-not-allowed"
                      rows="3"
                    />
                  </div>
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={settings.companyEmail}
                      onChange={(e) => handleSettingChange('companyEmail', e.target.value)}
                      disabled={loading || saving}
                      className="input-field w-full disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Calculation Settings */}
            {activeTab === 'calculations' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Parameter EOQ</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Biaya Pemesanan Default (Rp)
                      </label>
                      <input
                        type="number"
                        value={settings.defaultOrderingCost}
                        onChange={(e) => handleSettingChange('defaultOrderingCost', parseInt(e.target.value))}
                        disabled={loading || saving}
                        className="input-field w-full disabled:bg-gray-100 disabled:cursor-not-allowed"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Biaya Penyimpanan Default (Rp)
                      </label>
                      <input
                        type="number"
                        value={settings.defaultHoldingCost}
                        onChange={(e) => handleSettingChange('defaultHoldingCost', parseInt(e.target.value))}
                        disabled={loading || saving}
                        className="input-field w-full disabled:bg-gray-100 disabled:cursor-not-allowed"
                        min="0"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Parameter JIT</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Lead Time Default (hari)
                      </label>
                      <input
                        type="number"
                        value={settings.defaultLeadTime}
                        onChange={(e) => handleSettingChange('defaultLeadTime', parseInt(e.target.value))}
                        className="input-field w-full"
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Safety Stock Default (unit)
                      </label>
                      <input
                        type="number"
                        value={settings.defaultSafetyStock}
                        onChange={(e) => handleSettingChange('defaultSafetyStock', parseInt(e.target.value))}
                        className="input-field w-full"
                        min="0"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hari Kerja per Tahun
                    </label>
                    <input
                      type="number"
                      value={settings.workingDaysPerYear}
                      onChange={(e) => handleSettingChange('workingDaysPerYear', parseInt(e.target.value))}
                      disabled={loading || saving}
                      className="input-field w-full max-w-xs disabled:bg-gray-100 disabled:cursor-not-allowed"
                      min="1"
                      max="366"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Notification Settings */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Pengaturan Notifikasi</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-900">Notifikasi Stok Rendah</label>
                        <p className="text-sm text-gray-500">Tampilkan notifikasi ketika stok mencapai batas minimum</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.lowStockNotification}
                          onChange={(e) => handleSettingChange('lowStockNotification', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-900">Notifikasi Reorder Point</label>
                        <p className="text-sm text-gray-500">Tampilkan notifikasi ketika mencapai titik pemesanan ulang</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.reorderNotification}
                          onChange={(e) => handleSettingChange('reorderNotification', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-900">Notifikasi Email</label>
                        <p className="text-sm text-gray-500">Kirim notifikasi melalui email</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.emailNotifications}
                          onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Backup Settings */}
            {activeTab === 'backup' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Pengaturan Backup</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-900">Auto Backup</label>
                        <p className="text-sm text-gray-500">Backup otomatis sesuai jadwal yang ditentukan</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.autoBackup}
                          onChange={(e) => handleSettingChange('autoBackup', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Jadwal Backup
                      </label>
                      <select
                        value={settings.backupSchedule}
                        onChange={(e) => handleSettingChange('backupSchedule', e.target.value)}
                        disabled={loading || saving}
                        className="input-field w-full max-w-xs disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        <option value="daily">Harian</option>
                        <option value="weekly">Mingguan</option>
                        <option value="monthly">Bulanan</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Lokasi Backup
                      </label>
                      <input
                        type="text"
                        value={settings.backupPath}
                        onChange={(e) => handleSettingChange('backupPath', e.target.value)}
                        disabled={loading || saving}
                        className="input-field w-full disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex">
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-yellow-800">
                            Backup Manual
                          </h3>
                          <div className="mt-2 text-sm text-yellow-700">
                            <p>Backup terakhir: {new Date().toLocaleDateString('id-ID', { 
                              day: 'numeric', 
                              month: 'long', 
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })} WIB</p>
                          </div>
                          <div className="mt-4">
                            <button 
                              onClick={handleManualBackup}
                              disabled={saving}
                              className="btn-accent text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {saving ? 'Processing...' : 'Backup Sekarang'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;