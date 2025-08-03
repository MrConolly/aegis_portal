import { useState, useEffect } from "react";

interface User {
  id: string;
  username: string;
  role: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('healthcare_token');
        if (!token) {
          setIsLoading(false);
          return;
        }

        const response = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` },
        }).catch(() => null);

        if (response?.ok) {
          const userData = await response.json().catch(() => null);
          if (userData) setUser(userData);
        } else {
          localStorage.removeItem('healthcare_token');
        }
      } catch {
        localStorage.removeItem('healthcare_token');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      }).catch(() => null);

      if (!response) {
        return { success: false, error: 'Network error' };
      }

      if (response.ok) {
        const data = await response.json().catch(() => null);
        if (data?.token) {
          localStorage.setItem('healthcare_token', data.token);
          setTimeout(() => window.location.reload(), 100);
          return { success: true };
        }
      }

      return { success: false, error: 'Login failed' };
    } catch {
      return { success: false, error: 'Network error' };
    }
  };

  const logout = () => {
    localStorage.removeItem('healthcare_token');
    window.location.reload();
  };

  return {
    user: user as User | null,
    isLoading,
    login,
    logout,
    isAuthenticated: !!user,
  };
}
