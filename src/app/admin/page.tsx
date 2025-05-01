'use client';

import { useState, useEffect } from 'react';
import { 
  
  ChatBubbleLeftIcon, 
  Cog6ToothIcon, 
  BellIcon, 
  BookOpenIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';
import './dashboard.css';

// Define the ActivityLog interface
interface ActivityLog {
  _id: string;
  action: string;
  adminId: string;
  adminName: string;
  adminEmail?: string; // Add this field to the interface
  adminDesignation: string;
  collectionType: string;
  details?: any;
  timestamp: string;
}

export default function AdminDashboard() {
  // State for activity logs
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState<string>('');

  // Mock data - replace with actual data from your backend
  const stats = [
    { name: 'Total Conversations', value: '1,234', icon: ChatBubbleLeftIcon, change: '+12%', trend: 'up' },
    { name: 'Fine-Tuning Tasks', value: '45', icon: Cog6ToothIcon, change: '+5%', trend: 'up' },
    { name: 'Feedback Received', value: '89', icon: BellIcon, change: '-3%', trend: 'down' },
    { name: 'Training Documents', value: '23', icon: BookOpenIcon, change: '+8%', trend: 'up' },
  ];

  // Fetch organization ID and activity logs
  useEffect(() => {
    const fetchOrgIdAndLogs = async () => {
      try {
        // First get the organization ID
        const orgResponse = await axios.get('/api/get-org-details');
        if (orgResponse.data.success) {
          const fetchedOrgId = orgResponse.data.orgId;
          setOrgId(fetchedOrgId);
          
          // Then fetch activity logs with the org ID
          const logsResponse = await axios.get(`/api/activity-logs?orgId=${fetchedOrgId}`);
          if (logsResponse.data.success) {
            setActivityLogs(logsResponse.data.data);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrgIdAndLogs();
  }, []);

  // Format timestamp to readable format
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
      Math.round((date.getTime() - Date.now()) / (1000 * 60)),
      'minute'
    );
  };

  return (
    <div id='admindash'>
      <h1 className="dashboard-title">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid">
        {stats.map((stat) => (
          <div key={stat.name} className="stats-card">
            <div className="flex items-center mb-2">
              <stat.icon className="w-5 h-5 text-gray-400" aria-hidden="true" />
              <h3 className="ml-2">{stat.name}</h3>
            </div>
            <div className="value">{stat.value}</div>
            <div className={`trend ${stat.trend}`}>
              {stat.trend === 'up' ? (
                <ArrowTrendingUpIcon className="h-3 w-3 mr-1" />
              ) : (
                <ArrowTrendingDownIcon className="h-3 w-3 mr-1" />
              )}
              {stat.change}
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="recent-activity">
        <h2>Recent Activity</h2>
        <div className="activity-list">
          {loading ? (
            <div className="loading">Loading activity logs...</div>
          ) : activityLogs.length === 0 ? (
            <div className="empty-state">No recent activity found</div>
          ) : (
            activityLogs.map((log) => (
              <div key={log._id} className="activity-item">
                <div>
                  <div className="title">{log.action}</div>
                  <div className="meta">
                    <span>Admin: {log.adminEmail || log.adminName || log.adminId}</span>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="admin-designation">{log.adminDesignation}</span>
                  <span className="text-sm text-gray-500 ml-3">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}