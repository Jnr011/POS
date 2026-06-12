import { useState } from 'react';
import { UserRepository } from '../db/repository';
import { useAuthStore } from '../store/authStore';

export async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + 'pharmacy-pos-salt');
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function useAuth() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const storeLogin = useAuthStore(s => s.login);

  const login = async (email: string, pin: string) => {
    setError('');
    setLoading(true);
    try {
      const user = await UserRepository.getByEmail(email);
      if (!user) {
        setError('Invalid email or PIN');
        return null;
      }
      if (!user.isActive) {
        setError('Account is deactivated');
        return null;
      }
      const pinHash = await hashPin(pin);
      if (pinHash !== user.pinHash) {
        setError('Invalid email or PIN');
        return null;
      }
      storeLogin(user);
      return user;
    } catch {
      setError('Login failed');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const loginByPin = async (pin: string) => {
    setError('');
    setLoading(true);
    try {
      const pinHash = await hashPin(pin);
      const user = await UserRepository.getByPinHash(pinHash);
      if (!user) {
        setError('Invalid PIN');
        return null;
      }
      if (!user.isActive) {
        setError('Account is deactivated');
        return null;
      }
      storeLogin(user);
      return user;
    } catch {
      setError('Login failed');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: {
    name: string;
    email: string;
    pin: string;
    role: 'admin' | 'sales';
  }) => {
    setError('');
    setLoading(true);
    try {
      const existing = await UserRepository.getByEmail(data.email);
      if (existing) {
        setError('Email already registered');
        return null;
      }
      const pinHash = await hashPin(data.pin);
      const user = await UserRepository.add({
        name: data.name,
        email: data.email,
        role: data.role,
        pinHash,
        mustChangePin: data.role === 'sales',
        isActive: true,
      });
      return user;
    } catch {
      setError('Registration failed');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { login, loginByPin, register, error, loading };
}
