
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User } from '../types';
import '../styles/Sidebar.css';

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
    <aside className="sidebar">
      <div className="sidebar-header">
        <h3>{isAdmin ? '👨‍💼 Admin' : '👤 Sales Rep'}</h3>
        <p>{user?.name}</p>
      </div>

      <ul className="sidebar-menu">
        <li>
          <Link to="/dashboard">
            {isAdmin ? '📊 Overview' : '📊 My Dashboard'}
          </Link>
        </li>
        
        <li>
          <Link to="/sales">
            💳 {isAdmin ? 'All Sales' : 'Record Sale'}
          </Link>
        </li>

        <li>
          <Link to="/inventory">
            📦 Inventory
          </Link>
        </li>

        {isAdmin && (
          <>
            <li className="sidebar-divider">
              <span>Admin Only</span>
            </li>
            <li>
              <Link to="/reports">
                📈 Reports
              </Link>
            </li>
            <li className="admin-only">
              <a href="#register-rep" style={{ pointerEvents: 'none' }}>
                👥 Register Sales Rep
              </a>
              <p style={{ fontSize: '11px', marginTop: '5px' }}>
                Use Registration Code: <strong>ADMIN2024</strong>
              </p>
            </li>
          </>
        )}
      </ul>

      <div className="sidebar-footer">
        <p style={{ fontSize: '12px', color: '#999' }}>
          {isAdmin 
            ? '🔐 Admin Access Enabled' 
            : '⭐ Sales Rep Account'}
        </p>
      </div>
    </aside>
  );
}

export default Sidebar;
