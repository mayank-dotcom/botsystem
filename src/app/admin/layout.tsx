'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import './admin.css';
import {
  HomeIcon,
  ChatBubbleLeftIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  LinkIcon,
  UserGroupIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await axios.get('/api/logout');
      await signOut({ redirect: false });
      toast.success('Logged out successfully');
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Error during logout');
    }
  };

  return (
    <div className="admin-container">
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>Admin Dashboard</h2>
        </div>
        <div className="sidebar-menu">
          <Link
            href="/admin"
            className={pathname === '/admin' ? 'active' : ''}
          >
            <HomeIcon className="w-4 h-4" />
            Dashboard
          </Link>
          <Link
            href="/admin/chat-history"
            className={pathname === '/admin/chat-history' ? 'active' : ''}
          >
            <ChatBubbleLeftIcon className="w-4 h-4" />
            Chat History
          </Link>
   
          <Link
            href="/admin/training"
            className={pathname === '/admin/training' ? 'active' : ''}
          >
            <DocumentTextIcon className="w-4 h-4" />
            Training
          </Link>
          <Link
            href="/admin/connections"
            className={pathname === '/admin/connections' ? 'active' : ''}
          >
            <LinkIcon className="w-4 h-4" />
            Connections
          </Link>
          {/* Add the new Admin Management link here */}
          <Link
            href="/admin/admins"
            className={pathname === '/admin/admins' ? 'active' : ''}
          >
            <UserGroupIcon className="w-4 h-4" />
            Team
          </Link>
          {/* Other sidebar links */}
          {/* Add the logout button at the end */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100"
          >
            <ArrowRightOnRectangleIcon className="w-4 h-4 mr-2" />
            Logout
          </button>
        </div>
      </div>
      <div className="main-content">
        {children}
      </div>
    </div>
  );
}