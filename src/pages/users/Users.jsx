import { useState, useEffect } from 'react';
import { HiPlus, HiPencilAlt, HiTrash, HiSearch, HiLockClosed, HiUser } from 'react-icons/hi';

const Users = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    fullName: '',
    role: 'staff',
    password: '',
    confirmPassword: '',
    status: 'active'
  });

  // State untuk users dari API
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch users dari API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('https://api-inventory.isavralabel.com/api/inventory-amanah/users', {
          headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        });
        
        if (res.ok) {
          const data = await res.json();
          // Transform data untuk kompatibilitas dengan frontend
          const transformedUsers = data.map(user => ({
            id: user.id,
            username: user.username,
            email: user.email,
            fullName: user.full_name,
            role: user.role,
            status: user.status,
            lastLogin: new Date().toISOString(), // Placeholder
            createdAt: user.created_at ? user.created_at.split('T')[0] : new Date().toISOString().split('T')[0]
          }));
          setUsers(transformedUsers);
        } else {
          console.error('Failed to fetch users');
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate password only for new users or when password is provided during edit
    if (!editingUser && formData.password !== formData.confirmPassword) {
      alert('Password dan konfirmasi password tidak cocok!');
      return;
    }
    
    if (editingUser && formData.password && formData.password !== formData.confirmPassword) {
      alert('Password dan konfirmasi password tidak cocok!');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };

      if (editingUser) {
        // Edit existing user
        const res = await fetch(`https://api-inventory.isavralabel.com/api/inventory-amanah/users/${editingUser.id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            username: formData.username,
            email: formData.email,
            full_name: formData.fullName,
            role: formData.role,
            status: formData.status,
            password: formData.password || undefined
          })
        });
        
        const data = await res.json();
        if (res.ok) {
          // Update local state
          const updatedUsers = users.map(user => 
            user.id === editingUser.id 
              ? { 
                  ...user, 
                  username: formData.username,
                  email: formData.email,
                  fullName: formData.fullName,
                  role: formData.role,
                  status: formData.status
                }
              : user
          );
          setUsers(updatedUsers);
          alert('User berhasil diperbarui!');
        } else {
          alert(data.message || 'Gagal memperbarui user.');
          return;
        }
      } else {
        // Add new user
        const res = await fetch('https://api-inventory.isavralabel.com/api/inventory-amanah/auth/register', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            username: formData.username,
            password: formData.password,
            email: formData.email,
            full_name: formData.fullName,
            role: formData.role
          })
        });
        
        const data = await res.json();
        if (res.ok) {
          // Add to local state
          const newUser = {
            id: data.user.id,
            username: formData.username,
            email: formData.email,
            fullName: formData.fullName,
            role: formData.role,
            status: 'active',
            lastLogin: new Date().toISOString(),
            createdAt: new Date().toISOString().split('T')[0]
          };
          setUsers([...users, newUser]);
          alert('User berhasil ditambahkan!');
        } else {
          alert(data.message || 'Gagal menambahkan user.');
          return;
        }
      }
      
      // Reset form and close modal
      setShowModal(false);
      setEditingUser(null);
      setFormData({
        username: '',
        email: '',
        fullName: '',
        role: 'staff',
        password: '',
        confirmPassword: '',
        status: 'active'
      });
    } catch {
      alert('Terjadi kesalahan saat menyimpan user.');
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      password: '',
      confirmPassword: '',
      status: user.status
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus user ini?')) {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`https://api-inventory.isavralabel.com/api/inventory-amanah/users/${id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        });
        const data = await res.json();
        if (res.ok) {
          setUsers(users.filter(user => user.id !== id));
          alert('User berhasil dihapus!');
        } else {
          alert(data.message || 'Gagal menghapus user.');
        }
      } catch {
        alert('Terjadi kesalahan saat menghapus user.');
      }
    }
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

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'owner':
        return 'bg-purple-100 text-purple-800';
      case 'staff':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleText = (role) => {
    switch (role) {
      case 'admin':
        return 'Administrator';
      case 'owner':
        return 'Owner';
      case 'staff':
        return 'Staff';
      default:
        return role;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.fullName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === '' || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Pengguna</h1>
          <p className="text-gray-600 mt-1">Kelola pengguna dan hak akses sistem</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center"
        >
          <HiPlus className="h-5 w-5 mr-2" />
          Tambah User
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-primary-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-primary-800 mb-1">Total User</h3>
          <p className="text-2xl font-bold text-primary-600">{users.length}</p>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-green-800 mb-1">User Aktif</h3>
          <p className="text-2xl font-bold text-green-600">
            {users.filter(u => u.status === 'active').length}
          </p>
        </div>
        
        <div className="bg-red-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-red-800 mb-1">Administrator</h3>
          <p className="text-2xl font-bold text-red-600">
            {users.filter(u => u.role === 'admin').length}
          </p>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-blue-800 mb-1">Staff</h3>
          <p className="text-2xl font-bold text-blue-600">
            {users.filter(u => u.role === 'staff').length}
          </p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari username, email, atau nama..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10 w-full"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="input-field"
            >
              <option value="">Semua Role</option>
              <option value="admin">Administrator</option>
              <option value="owner">Owner</option>
              <option value="staff">Staff</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pengguna
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Login Terakhir
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    Memuat data pengguna...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    Tidak ada user ditemukan
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                          <HiUser className="h-6 w-6 text-gray-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.fullName}</div>
                          <div className="text-sm text-gray-500">@{user.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                        {getRoleText(user.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.status)}`}>
                        {user.status === 'active' ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(user.lastLogin)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          <HiPencilAlt className="h-5 w-5" />
                        </button>
                        <button className="text-yellow-600 hover:text-yellow-900">
                          <HiLockClosed className="h-5 w-5" />
                        </button>
                        {user.role !== 'admin' && (
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <HiTrash className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 !m-0">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingUser ? 'Edit User' : 'Tambah User'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="input-field w-full"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input-field w-full"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Lengkap *
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="input-field w-full"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="input-field w-full"
                    required
                  >
                    <option value="staff">Staff</option>
                    <option value="admin">Administrator</option>
                    <option value="owner">Owner</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password {editingUser ? '(kosongkan jika tidak ingin mengubah)' : '*'}
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="input-field w-full"
                    required={!editingUser}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Konfirmasi Password {editingUser ? '(kosongkan jika tidak ingin mengubah)' : '*'}
                  </label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="input-field w-full"
                    required={!editingUser}
                  />
                </div>
                
                {editingUser && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="input-field w-full"
                    >
                      <option value="active">Aktif</option>
                      <option value="inactive">Nonaktif</option>
                    </select>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingUser(null);
                      setFormData({
                        username: '',
                        email: '',
                        fullName: '',
                        role: 'staff',
                        password: '',
                        confirmPassword: '',
                        status: 'active'
                      });
                    }}
                    className="btn-outline"
                  >
                    Batal
                  </button>
                  <button type="submit" className="btn-primary">
                    {editingUser ? 'Update' : 'Simpan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;