
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';

interface NavbarProps {
  onLogout: () => void;
}

function Navbar({ onLogout }: NavbarProps) {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <nav className="bg-gray-900 text-white px-6 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Pharmacy POS System</h1>
        <Button variant="ghost" className="text-white hover:bg-gray-800" onClick={handleLogout}>
          Logout
        </Button>
      </div>
    </nav>
  );
}

export default Navbar;
