import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  FaUsers,
  FaHome,
  FaFlag,
  FaChartBar,
  FaCog,
  FaSignOutAlt,
  FaUserShield,
  FaBan,
  FaCheck,
  FaTimes,
  FaEye,
  FaTrash,
  FaStar,
  FaExclamationTriangle,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaMedal,
  FaShieldAlt
} from 'react-icons/fa';
import TrustManagement from '../components/TrustManagement';
import TrustBadge from '../components/TrustBadge';

const AdminDashboard = () => {
  const { curUser } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [listings, setListings] = useState([]);
  const [reports, setReports] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [trustStats, setTrustStats] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    
    console.log('🔍 AdminDashboard useEffect - curUser:', curUser);
    console.log('🔍 AdminDashboard useEffect - curUser role:', curUser?.role);
    
    // Check if user is admin
    if (!curUser || curUser.role !== 'admin') {
      console.log('❌ User is not admin, redirecting to home');
      navigate('/');
      return;
    }
    
    console.log('✅ User is admin, fetching analytics');
    fetchAnalytics();
  }, [curUser, navigate]);

  const fetchAnalytics = async () => {
    try {
      console.log('🔍 Fetching analytics...');
      console.log('🔍 Current user:', curUser);
      console.log('🔍 Document cookies:', document.cookie);
      
      const res = await fetch('/api/admin/analytics', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      console.log('📊 Analytics response status:', res.status);
      console.log('📊 Analytics response headers:', res.headers);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('❌ Analytics API error response:', errorText);
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      console.log('✅ Analytics data:', data);
      setAnalytics(data);
      setLoading(false);
    } catch (error) {
      console.error('❌ Error fetching analytics:', error);
      setAnalytics(null);
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      console.log('Fetching users...');
      const res = await fetch('/api/admin/users', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      console.log('Users response status:', res.status);
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Users API error response:', errorText);
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      console.log('Users data:', data);
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    }
  };

  const fetchListings = async () => {
    try {
      console.log('Fetching listings...');
      const res = await fetch('/api/admin/listings', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      console.log('Listings response status:', res.status);
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Listings API error response:', errorText);
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      console.log('Listings data:', data);
      setListings(data.listings || []);
    } catch (error) {
      console.error('Error fetching listings:', error);
      setListings([]);
    }
  };

  const fetchReports = async () => {
    try {
      const res = await fetch('/api/admin/reports', {
        credentials: 'include'
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setReports(data.reports || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
      setReports([]);
    }
  };

  const fetchActivityLogs = async () => {
    try {
      console.log('Fetching activity logs...');
      const res = await fetch('/api/admin/activity-logs', {
        credentials: 'include'
      });
      console.log('Activity logs response status:', res.status);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      console.log('Activity logs data:', data);
      setActivityLogs(data.activities || []);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      setActivityLogs([]);
    }
  };

  const fetchTrustStats = async () => {
    try {
      console.log('Fetching trust statistics...');
      const res = await fetch('/api/trust/statistics', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      console.log('Trust stats response status:', res.status);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      console.log('Trust stats data:', data);
      setTrustStats(data.data);
    } catch (error) {
      console.error('Error fetching trust statistics:', error);
      setTrustStats(null);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    switch (tab) {
      case 'users':
        fetchUsers();
        break;
      case 'listings':
        fetchListings();
        break;
      case 'reports':
        fetchReports();
        break;
      case 'activity':
        fetchActivityLogs();
        break;
      case 'trust':
        fetchTrustStats();
        break;
      default:
        break;
    }
  };

  const handleUserBan = async (userId, isBanned) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/ban`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          banReason: isBanned ? 'Violation of terms' : ''
        }),
      });
      
      if (res.ok) {
        fetchUsers();
        fetchAnalytics();
      } else {
        console.error('Failed to update user ban status');
      }
    } catch (error) {
      console.error('Error updating user ban status:', error);
    }
  };

  const handleListingStatus = async (listingId, status) => {
    try {
      const res = await fetch(`/api/admin/listings/${listingId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          status,
          rejectionReason: status === 'rejected' ? 'Does not meet quality standards' : ''
        }),
      });
      
      if (res.ok) {
        fetchListings();
        fetchAnalytics();
      } else {
        console.error('Failed to update listing status');
      }
    } catch (error) {
      console.error('Error updating listing status:', error);
    }
  };

  const handleReportStatus = async (reportId, status) => {
    try {
      const res = await fetch(`/api/admin/reports/${reportId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          status,
          adminNotes: 'Reviewed by admin'
        }),
      });
      
      if (res.ok) {
        fetchReports();
      } else {
        console.error('Failed to update report status');
      }
    } catch (error) {
      console.error('Error updating report status:', error);
    }
  };

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: FaChartBar },
    { id: 'users', name: 'Users', icon: FaUsers },
    { id: 'listings', name: 'Listings', icon: FaHome },
    { id: 'reports', name: 'Reports', icon: FaFlag },
    { id: 'trust', name: 'Trust System', icon: FaShieldAlt },
    { id: 'activity', name: 'Activity Logs', icon: FaCog },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">Welcome back, {curUser?.username}</p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <FaSignOutAlt />
              <span>Back to Site</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-64 bg-white rounded-lg shadow-sm p-4">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
                
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <div className="flex items-center">
                      <FaUsers className="h-8 w-8 text-blue-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total Users</p>
                        <p className="text-2xl font-bold text-gray-900">{analytics?.overview?.totalUsers || 0}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <div className="flex items-center">
                      <FaHome className="h-8 w-8 text-green-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total Listings</p>
                        <p className="text-2xl font-bold text-gray-900">{analytics?.overview?.totalListings || 0}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <div className="flex items-center">
                      <FaFlag className="h-8 w-8 text-red-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Pending Reports</p>
                        <p className="text-2xl font-bold text-gray-900">{analytics?.overview?.pendingReports || 0}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <div className="flex items-center">
                      <FaUserShield className="h-8 w-8 text-purple-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Trusted Sellers</p>
                        <p className="text-2xl font-bold text-gray-900">{analytics?.overview?.trustedSellers || 0}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h3 className="text-lg font-semibold mb-4">Listing Status</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Pending</span>
                        <span className="font-semibold text-yellow-600">{analytics?.overview?.pendingListings || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Approved</span>
                        <span className="font-semibold text-green-600">{analytics?.overview?.approvedListings || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Rejected</span>
                        <span className="font-semibold text-red-600">{analytics?.overview?.rejectedListings || 0}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h3 className="text-lg font-semibold mb-4">User Status</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Active Users</span>
                        <span className="font-semibold text-green-600">{(analytics?.overview?.totalUsers || 0) - (analytics?.overview?.bannedUsers || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Banned Users</span>
                        <span className="font-semibold text-red-600">{analytics?.overview?.bannedUsers || 0}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h3 className="text-lg font-semibold mb-4">Reports</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Reports</span>
                        <span className="font-semibold text-gray-900">{analytics?.overview?.totalReports || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Pending</span>
                        <span className="font-semibold text-yellow-600">{analytics?.overview?.pendingReports || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trust Points</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trust Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((user) => (
                          <tr key={user._id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{user.username}</div>
                                <div className="text-sm text-gray-500">{user.email}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                                user.role === 'seller' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {user.role}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {user.isBanned ? (
                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                  Banned
                                </span>
                              ) : (
                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                  Active
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <span className="text-sm text-gray-900">{user.trustPoints || 0}</span>
                                {user.verifiedSeller && (
                                  <FaStar className="ml-1 h-4 w-4 text-yellow-500" />
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <TrustBadge seller={user} size="sm" />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => handleUserBan(user._id, !user.isBanned)}
                                className={`mr-2 px-3 py-1 rounded text-xs font-medium ${
                                  user.isBanned
                                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                    : 'bg-red-100 text-red-800 hover:bg-red-200'
                                }`}
                              >
                                {user.isBanned ? 'Unban' : 'Ban'}
                              </button>
                              <button
                                onClick={() => setSelectedUser(user._id)}
                                className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium hover:bg-blue-200"
                              >
                                Manage Trust
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'listings' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">Listing Management</h2>
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Listing</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {listings.map((listing) => (
                          <tr key={listing._id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{listing.name}</div>
                                <div className="text-sm text-gray-500">{listing.address}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {listing.userRef?.username || 'Unknown'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                listing.status === 'approved' ? 'bg-green-100 text-green-800' :
                                listing.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {listing.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              ${listing.regularPrice?.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              {listing.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleListingStatus(listing._id, 'approved')}
                                    className="mr-2 px-3 py-1 bg-green-100 text-green-800 rounded text-xs font-medium hover:bg-green-200"
                                  >
                                    <FaCheck className="inline h-3 w-3 mr-1" />
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleListingStatus(listing._id, 'rejected')}
                                    className="mr-2 px-3 py-1 bg-red-100 text-red-800 rounded text-xs font-medium hover:bg-red-200"
                                  >
                                    <FaTimes className="inline h-3 w-3 mr-1" />
                                    Reject
                                  </button>
                                </>
                              )}
                              <button className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium hover:bg-blue-200">
                                <FaEye className="inline h-3 w-3 mr-1" />
                                View
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'reports' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">Report Management</h2>
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Report</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {reports.map((report) => (
                          <tr key={report._id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {report.listingId?.name || 'Unknown Listing'}
                                </div>
                                <div className="text-sm text-gray-500">
                                  Reported by: {report.reportedByName}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                                {report.reason}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                report.status === 'resolved' ? 'bg-green-100 text-green-800' :
                                report.status === 'dismissed' ? 'bg-gray-100 text-gray-800' :
                                report.status === 'reviewed' ? 'bg-blue-100 text-blue-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {report.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                report.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                                report.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                report.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {report.priority}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              {report.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleReportStatus(report._id, 'resolved')}
                                    className="mr-2 px-3 py-1 bg-green-100 text-green-800 rounded text-xs font-medium hover:bg-green-200"
                                  >
                                    <FaCheckCircle className="inline h-3 w-3 mr-1" />
                                    Resolve
                                  </button>
                                  <button
                                    onClick={() => handleReportStatus(report._id, 'dismissed')}
                                    className="mr-2 px-3 py-1 bg-gray-100 text-gray-800 rounded text-xs font-medium hover:bg-gray-200"
                                  >
                                    <FaTimesCircle className="inline h-3 w-3 mr-1" />
                                    Dismiss
                                  </button>
                                </>
                              )}
                              <button className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium hover:bg-blue-200">
                                <FaEye className="inline h-3 w-3 mr-1" />
                                View
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'trust' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">Trust System Management</h2>
                
                {/* Trust Statistics Overview */}
                {trustStats && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-lg shadow-sm">
                      <div className="flex items-center">
                        <FaUsers className="h-8 w-8 text-blue-600" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Total Sellers</p>
                          <p className="text-2xl font-bold text-gray-900">{trustStats.totalSellers}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white p-6 rounded-lg shadow-sm">
                      <div className="flex items-center">
                        <FaShieldAlt className="h-8 w-8 text-green-600" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Verified Sellers</p>
                          <p className="text-2xl font-bold text-gray-900">{trustStats.verifiedSellers}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white p-6 rounded-lg shadow-sm">
                      <div className="flex items-center">
                        <FaChartBar className="h-8 w-8 text-purple-600" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Verification Rate</p>
                          <p className="text-2xl font-bold text-gray-900">{trustStats.verificationRate}%</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white p-6 rounded-lg shadow-sm">
                      <div className="flex items-center">
                        <FaStar className="h-8 w-8 text-yellow-600" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">Avg Trust Points</p>
                          <p className="text-2xl font-bold text-gray-900">{trustStats.averageTrustPoints}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* User Selection for Trust Management */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold mb-4">Manage User Trust Points</h3>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select User
                    </label>
                    <select
                      value={selectedUser || ''}
                      onChange={(e) => setSelectedUser(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select a user to manage trust points</option>
                      {users.map((user) => (
                        <option key={user._id} value={user._id}>
                          {user.username} ({user.email}) - {user.trustPoints || 0} pts
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {selectedUser && (
                    <TrustManagement 
                      userId={selectedUser} 
                      onUpdate={(updatedUser) => {
                        // Update the users list with the updated user data
                        setUsers(users.map(user => 
                          user._id === selectedUser ? { ...user, ...updatedUser } : user
                        ));
                        // Refresh trust stats
                        fetchTrustStats();
                      }}
                    />
                  )}
                </div>

                {/* Top Sellers Table */}
                {trustStats && trustStats.topSellers && (
                  <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h3 className="text-lg font-semibold">Top Trusted Sellers</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seller</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trust Points</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {trustStats.topSellers.map((seller, index) => (
                            <tr key={seller.username}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-10 w-10">
                                    <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                      <span className="text-sm font-medium text-gray-700">
                                        {seller.username.charAt(0).toUpperCase()}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">{seller.username}</div>
                                    <div className="text-sm text-gray-500">Rank #{index + 1}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{seller.trustPoints}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <TrustBadge seller={seller} size="sm" />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button
                                  onClick={() => setSelectedUser(seller._id)}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  Manage
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">Activity Logs</h2>
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admin</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {activityLogs.map((activity) => (
                          <tr key={activity._id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {activity.adminName || activity.adminId}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                {activity.action.replace(/_/g, ' ')}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {activity.targetName || activity.targetId || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(activity.timestamp || activity.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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

export default AdminDashboard;
