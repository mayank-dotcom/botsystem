'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { signOut } from 'next-auth/react';
import { 
  ChatBubbleLeftIcon, 
  Cog6ToothIcon, 
  BellIcon, 
  BookOpenIcon,
  ArrowLeftOnRectangleIcon,
  LinkIcon // Added LinkIcon for Connections
} from '@heroicons/react/24/outline';
import './admin.css';
import './utilities.css';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOrgAdmin, setIsOrgAdmin] = useState(false);

  // Check if user is logged in as organization admin
  useEffect(() => {
    const checkOrgToken = async () => {
      try {
        // You can create an API endpoint to check if org_token exists and is valid
        const response = await axios.get('/api/org/check-auth');
        setIsOrgAdmin(response.data.isAuthenticated);
      } catch (error) {
        // If error, assume not org admin
        setIsOrgAdmin(false);
      }
    };
    
    checkOrgToken();
  }, []);

  const handleLogout = async () => {
    try {
      // Call the logout API endpoint to clear the token cookie
      await axios.get('/api/logout');
      
      // Clear NextAuth session on the client side
      await signOut({ redirect: false });
      
      toast.success('Logged out successfully');
      router.push(isOrgAdmin ? '/org/login' : '/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Error during logout');
    }
  };

  const navigation = [
    { name: 'Chat History', href: '/admin/chat-history', icon: ChatBubbleLeftIcon },
    { name: 'Fine-Tuning', href: '/admin/fine-tuning', icon: Cog6ToothIcon },
    { name: 'Feedback', href: '/admin/feedback', icon: BellIcon },
    { name: 'Training', href: '/admin/training', icon: BookOpenIcon },
    { name: 'Connections', href: '/admin/connections', icon: LinkIcon }, // Added Connections to navigation
  ];

  return (
    <div className="admin-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>NeuroBot Admin</h2>
          {isOrgAdmin && <p className="text-sm text-gray-400">Organization Admin</p>}
        </div>
        <nav className="sidebar-menu">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={isActive ? 'active' : ''}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
          <button
            className="sidebar-menu-item"
            onClick={handleLogout}
          >
            <ArrowLeftOnRectangleIcon className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </nav>
      </aside>

      {/* Main content */}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}