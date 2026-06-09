import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../services/api';
import '../styles/Register.css';

function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [registrationCode, setRegistrationCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!name || !email || !password || !confirmPassword || !registrationCode) {
      setError('All fields are required');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email');
      return;
    }

    try {
      setLoading(true);
      const response = await API.post('/auth/register', {
        name,
        email,
        password,
        registrationCode
      });

      setSuccess('✅ Registration successful! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-wrapper">
        <div className="register-card">
          <div className="register-header">
            <h1>Register Sales Representative</h1>
            <p>Create a new account with admin code</p>
          </div>

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label htmlFor="name">Full Name *</label>
              <input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address *</label>
              <input
                id="email"
                type="email"
                placeholder="john@pharmacy.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password *</label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
              <small>Minimum 6 characters</small>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password *</label>
              <input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="registrationCode">Admin Registration Code *</label>
              <input
                id="registrationCode"
                type="password"
                placeholder="Enter admin code"
                value={registrationCode}
                onChange={(e) => setRegistrationCode(e.target.value)}
                disabled={loading}
                required
              />
              <small>Ask your admin for the registration code</small>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Registering...' : 'Create Account'}
            </button>
          </form>

          <div className="register-footer">
            <p>Already have an account? <Link to="/login">Login here</Link></p>
          </div>

          <div className="register-help">
            <h3>❓ Need Help?</h3>
            <ul>
              <li>Password must be at least 6 characters</li>
              <li>Use a valid email address</li>
              <li>The registration code is provided by your admin</li>
              <li>Code: <code>ADMIN2024</code> (for testing)</li>
            </ul>
          </div>
        </div>

        <div className="register-info">
          <h2>📋 Registration Information</h2>
          <div className="info-box">
            <h3>🔐 What is the Registration Code?</h3>
            <p>Only authorized admins can register new sales representatives. The code ensures that only approved users can create accounts.</p>
          </div>
          
          <div className="info-box">
            <h3>👤 Sales Rep Account</h3>
            <p>Once registered, you'll have access to your personal sales dashboard, where you can:</p>
            <ul>
              <li>Track your daily sales</li>
              <li>View commission earnings</li>
              <li>Record product sales</li>
              <li>Check inventory</li>
            </ul>
          </div>

          <div className="info-box">
            <h3>🔑 Password Policy</h3>
            <ul>
              <li>Minimum 6 characters</li>
              <li>Use a mix of letters and numbers for security</li>
              <li>Don't share your password</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
