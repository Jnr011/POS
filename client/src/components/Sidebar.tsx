
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User } from '../types';

interface SidebarProps {
  userRole: string | undefined;
}

function Sidebar({ userRole }: SidebarProps) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, [userRole]);

  const isAdmin = user?.role === 'admin';

  return (
    <aside className="w-64 bg-white border-r min-h-screen flex flex-col">
      <div className="p-4 border-b">
        <h3 className="font-semibold text-sm">{isAdmin ? '👨‍💼 Admin' : '👤 Sales Rep'}</h3>
        <p className="text-xs text-gray-600 mt-1">{user?.name}</p>
      </div>

      <ul className="flex flex-col p-2 space-y-1">
        <li>
          <Link to="/dashboard" className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 transition-colors">
            {isAdmin ? '📊 Overview' : '📊 My Dashboard'}
          </Link>
        </li>
        
        <li>
          <Link to="/sales" className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 transition-colors">
            💳 {isAdmin ? 'All Sales' : 'Record Sale'}
          </Link>
        </li>

        <li>
          <Link to="/inventory" className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 transition-colors">
            📦 Inventory
          </Link>
        </li>

        {isAdmin && (
          <>
            <li className="px-3 py-2">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Admin Only</span>
            </li>
            <li>
              <Link to="/reports" className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                📈 Reports
              </Link>
            </li>
            <li className="px-3 py-2 rounded-md bg-gray-50">
              <a href="#register-rep" className="flex items-center gap-2 text-sm text-gray-500" style={{ pointerEvents: 'none' }}>
                👥 Register Sales Rep
              </a>
              <p style={{ fontSize: '11px', marginTop: '5px' }} className="text-gray-400">
                Use Registration Code: <strong className="text-gray-600">ADMIN2024</strong>
              </p>
            </li>
          </>
        )}
      </ul>

      <div className="mt-auto p-4 border-t">
        <p className="text-xs text-gray-400">
          {isAdmin 
            ? '🔐 Admin Access Enabled' 
            : '⭐ Sales Rep Account'}
        </p>
      </div>
    </aside>
  );
}

export default Sidebar;
