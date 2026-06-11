import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../services/api';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';

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

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');

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
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 py-8">
      <Card className="w-full max-w-lg mx-4">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Register Sales Representative</CardTitle>
          <CardDescription>Create a new account with admin code</CardDescription>
        </CardHeader>
        <CardContent>
          {error && <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm mb-4">{error}</div>}
          {success && <div className="bg-green-50 text-green-700 p-3 rounded-md text-sm mb-4">{success}</div>}

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="name" className="text-sm font-medium">Full Name *</label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="email" className="text-sm font-medium">Email Address *</label>
              <Input
                id="email"
                type="email"
                placeholder="john@pharmacy.com"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="password" className="text-sm font-medium">Password *</label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
              <p className="text-xs text-gray-500">Minimum 6 characters</p>
            </div>

            <div className="space-y-1">
              <label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password *</label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="registrationCode" className="text-sm font-medium">Admin Registration Code *</label>
              <Input
                id="registrationCode"
                type="password"
                placeholder="Enter admin code"
                value={registrationCode}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRegistrationCode(e.target.value)}
                disabled={loading}
                required
              />
              <p className="text-xs text-gray-500">Ask your admin for the registration code</p>
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Registering...' : 'Create Account'}
            </Button>
          </form>

          <p className="text-sm text-center mt-4 text-gray-600">
            Already have an account? <Link to="/login" className="text-blue-600 hover:underline">Login here</Link>
          </p>

          <div className="mt-6 p-4 bg-gray-50 rounded-md space-y-3">
            <h3 className="font-semibold text-sm">❓ Need Help?</h3>
            <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
              <li>Password must be at least 6 characters</li>
              <li>Use a valid email address</li>
              <li>The registration code is provided by your admin</li>
              <li>Code: <code className="bg-gray-200 px-1 rounded">ADMIN2024</code> (for testing)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default Register;
