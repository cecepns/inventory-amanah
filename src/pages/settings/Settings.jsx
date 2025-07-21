import React, { useState } from 'react';
import { HiCog, HiDatabase, HiBell, HiCalculator, HiSave } from 'react-icons/hi';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('general');
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

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = () => {
    // Here you would typically send the settings to your API
    console.log('Saving settings:', settings);
    alert('Pengaturan berhasil disimpan!');
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
          onClick={handleSave}
          className="btn-primary flex items-center"
        >
          <HiSave className="h-5 w-5 mr-2" />
          Simpan Pengaturan
        </button>
      </div>

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
                        className="input-field w-full"
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
                        className="input-field w-full"
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
                      className="input-field w-full"
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
                      className="input-field w-full"
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
                        className="input-field w-full"
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
                        className="input-field w-full"
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
                      className="input-field w-full max-w-xs"
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
                        className="input-field w-full max-w-xs"
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
                        className="input-field w-full"
                      />
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex">
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-yellow-800">
                            Backup Manual
                          </h3>
                          <div className="mt-2 text-sm text-yellow-700">
                            <p>Backup terakhir: 24 Januari 2024, 08:00 WIB</p>
                          </div>
                          <div className="mt-4">
                            <button className="btn-accent text-sm">
                              Backup Sekarang
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