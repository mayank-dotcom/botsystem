'use client';
import './style.css';

import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface Admin {
  id: string;
  email: string;
  name: string;
  type: 'regular' | 'super';  // Updated to allow both types
}

export default function AdminManagement() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [newAdmin, setNewAdmin] = useState({ 
    email: '', 
    name: '', 
    password: '',
    confirmPassword: '',
    type: 'regular' as 'regular' | 'super' 
  });
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentOrgName, setCurrentOrgName] = useState<string>('');
  const [currentOrgId, setCurrentOrgId] = useState<string>('');

  // Fetch current user ID and admins on component mount
  useEffect(() => {
    const fetchUserIdAndAdmins = async () => {
      try {
        // Get current user ID
        const userResponse = await axios.get('/api/get-user-id');
        if (userResponse.data.success) {
          setCurrentUserId(userResponse.data.userId);
          setCurrentOrgId(userResponse.data.userId); // Set org_Id same as userId
          
          // Get organization name
          const orgResponse = await axios.get('/api/get-org-name');
          if (orgResponse.data.success) {
            setCurrentOrgName(orgResponse.data.org_name);
            fetchAdmins(userResponse.data.userId, orgResponse.data.org_name);
          }
        } else {
          toast.error('Failed to get user information');
        }
      } catch (error) {
        console.error('Error fetching user ID:', error);
        toast.error('Failed to get user information');
      }
    };

    fetchUserIdAndAdmins();
  }, []);

  const fetchAdmins = async (userId: string, orgName: string) => {
    try {
      setLoading(true);
      // Fetch admins from the org_collection
      const response = await axios.get('/api/admins');
      
      // Transform and filter the data to match our Admin interface
      // Now filter by organization name instead of user ID
      const adminData = response.data.admins
        .filter((admin: any) => admin.org_name === orgName) // Filter by org_name instead of _id
        .map((admin: any) => ({
          id: admin._id,
          email: admin.super_email || admin.email,
          name: admin.org_name,
          type: admin.isSuper ? 'super' : 'regular'
        }));
      
      setAdmins(adminData);
    } catch (error) {
      console.error('Error fetching admins:', error);
      toast.error('Failed to load admins');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate input
    if (!newAdmin.email || !newAdmin.name || !newAdmin.password) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    if (newAdmin.password !== newAdmin.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    try {
      setLoading(true);
      // Make API call to add a new admin based on type
      const endpoint = newAdmin.type === 'super' ? '/api/superadmin' : '/api/regularadmin';
      
      const response = await axios.post(endpoint, {
        org_name: currentOrgName, // Use the current org name
        org_Id: currentOrgId, // Use the current org ID
        email: newAdmin.email,
        password: newAdmin.password,
        super_email: newAdmin.email, // Always send super_email regardless of admin type
        super_password: newAdmin.password, // Always send super_password regardless of admin type
        isSuper: newAdmin.type === 'super'
      });
      
      if (response.data.success) {
        // Add the new admin to the list
        const newAdminWithId = {
          id: response.data.admin._id,
          email: newAdmin.email,
          name: newAdmin.name,
          type: newAdmin.type
        };
        
        setAdmins([...admins, newAdminWithId]);
        setNewAdmin({ email: '', name: '', password: '', confirmPassword: '', type: 'regular' });
        toast.success(`${newAdmin.type === 'super' ? 'Super' : 'Regular'} admin added successfully. Verification email sent.`);
      } else {
        toast.error(response.data.message || 'Failed to add admin');
      }
    } catch (error: any) {
      console.error('Error adding admin:', error);
      toast.error(error.response?.data?.message || 'Failed to add admin');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAdmin = async (id: string) => {
    try {
      setLoading(true);
      // Make API call to remove an admin
      const response = await axios.delete(`/api/admins/${id}`);
      
      if (response.data.success) {
        // Update state
        setAdmins(admins.filter(admin => admin.id !== id));
        toast.success('Admin removed successfully');
      } else {
        toast.error(response.data.message || 'Failed to remove admin');
      }
    } catch (error) {
      console.error('Error removing admin:', error);
      toast.error('Failed to remove admin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6" id='adminamangemntcont'>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4" id='adminheading'>
          <h1 className="text-2xl font-bold text-gray-900">Admin Management</h1>
       
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id='admin-manage'>
        {/* Admin List */}
        <div className="lg:col-span-2 bg-white shadow rounded-lg" >
          <div className="p-4 border-b">
            <h2 className="text-lg font-medium">Current Admins</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {admins.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No admins found</div>
            ) : (
              admins.map((admin) => (
                <div key={admin.id} className="p-4 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {admin.name}
                      {currentUserId === admin.id && (
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          You
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-gray-500">{admin.email}</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      admin.type === 'super' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {admin.type === 'super' ? 'Super Admin' : 'Regular Admin'}
                    </span>
                  </div>
                  {/* Only show remove button if:
                      Current user is a super admin AND they're not trying to remove themselves */}
                  {(admins.find(a => a.id === currentUserId)?.type === 'super' && currentUserId !== admin.id) && (
                    <button
                      onClick={() => handleRemoveAdmin(admin.id)}
                      className="text-red-600 hover:text-red-900"
                      disabled={loading}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Add Admin Form - Only show if user is current admin */}
        {currentUserId && (
          <div className="lg:col-span-1 bg-white shadow rounded-lg" id='new-box'>
            <div className="p-4 border-b">
              <h2 className="text-lg font-medium">Add New Admin</h2>
            </div>
            <div className="p-4">
              <form onSubmit={handleAddAdmin} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={newAdmin.name}
                    onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Admin Name"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={newAdmin.email}
                    onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="admin@example.com"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={newAdmin.password}
                    onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Password"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={newAdmin.confirmPassword}
                    onChange={(e) => setNewAdmin({ ...newAdmin, confirmPassword: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Confirm Password"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                    Admin Type
                  </label>
                  <select
                    id="type"
                    value={newAdmin.type}
                    onChange={(e) => setNewAdmin({ ...newAdmin, type: e.target.value as 'regular' | 'super' })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="regular">Regular Admin</option>
                    <option value="super">Super Admin</option>
                  </select>
                </div>
                
                <div>
                  <button id='addadminbt'
                    type="submit"
                    disabled={loading}
                    className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                      loading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {loading ? 'Adding...' : 'Add Admin'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}