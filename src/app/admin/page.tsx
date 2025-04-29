'use client';

import { 
  ChatBubbleLeftIcon, 
  Cog6ToothIcon, 
  BellIcon, 
  BookOpenIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';
import './dashboard.css'
export default function AdminDashboard() {
  // Mock data - replace with actual data from your backend
  const stats = [
    { name: 'Total Conversations', value: '1,234', icon: ChatBubbleLeftIcon, change: '+12%', trend: 'up' },
    { name: 'Fine-Tuning Tasks', value: '45', icon: Cog6ToothIcon, change: '+5%', trend: 'up' },
    { name: 'Feedback Received', value: '89', icon: BellIcon, change: '-3%', trend: 'down' },
    { name: 'Training Documents', value: '23', icon: BookOpenIcon, change: '+8%', trend: 'up' },
  ];

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
          {[1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="activity-item">
              <div>
                <div className="title">New conversation started</div>
                <div className="meta">
                  <span>User ID: 12345</span>
                </div>
              </div>
              <div className="flex items-center">
                <span className="status">Active</span>
                <span className="text-sm text-gray-500 ml-3">2 minutes ago</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 