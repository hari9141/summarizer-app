import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-blue-800 shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
      
          <Link to="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition">
            <span className="text-3xl">✨</span>
            <span className="text-xl font-bold text-white">PrecisAI</span>
          </Link>

          <div className="flex items-center gap-6">
            {isAuthenticated ? (
              <>
                
                <div className="flex items-center gap-3 pl-6 border-l border-blue-400">
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center font-bold text-blue-600">
                    {user?.username?.charAt(0).toUpperCase()}
                  </div>
                  <Link
                    to="/profile"
                    className="text-white hover:bg-red-600 px-3 py-1 rounded transition text-sm font-medium"
                  >
                    {user?.username}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-white hover:bg-red-600 px-3 py-1 rounded transition text-sm font-medium"
                  >
                    🚪 Logout
                  </button>
                </div>
              </>
            ) : (
              <>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
