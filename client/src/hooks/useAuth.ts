import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { User } from '../types';

interface LoginResponse {
  token: string;
  user: User;
}

interface RegisterResponse {
  message: string;
}

export function useAuth() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const login = async (email: string, password: string) => {
    setError('');
    setLoading(true);
    try {
      const response = await API.post<LoginResponse>('/auth/login', { email, password });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      return response.data;
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: Record<string, unknown>) => {
    setError('');
    setLoading(true);
    try {
      const response = await API.post<RegisterResponse>('/auth/register', data);
      return response.data;
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return { login, register, logout, error, loading };
}
