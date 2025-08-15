import { useAdmin } from '@/contexts/AdminContext';
import { useCallback } from 'react';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export function useApi() {
  const { token, logout } = useAdmin();

  const apiCall = useCallback(async <T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> => {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...options.headers as Record<string, string>
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`/api${endpoint}`, {
        ...options,
        headers
      });

      if (response.status === 401) {
        logout();
        throw new Error('Authentication required');
      }

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || `HTTP ${response.status}`,
          data: null
        };
      }

      return {
        success: true,
        data,
        message: data.message
      };
    } catch (error) {
      console.error('API call error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        data: null
      };
    }
  }, [token, logout]);

  const get = useCallback(<T = any>(endpoint: string) => 
    apiCall<T>(endpoint, { method: 'GET' }), [apiCall]);

  const post = useCallback(<T = any>(endpoint: string, data?: any) => 
    apiCall<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    }), [apiCall]);

  const put = useCallback(<T = any>(endpoint: string, data?: any) => 
    apiCall<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    }), [apiCall]);

  const patch = useCallback(<T = any>(endpoint: string, data?: any) => 
    apiCall<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined
    }), [apiCall]);

  const del = useCallback(<T = any>(endpoint: string) => 
    apiCall<T>(endpoint, { method: 'DELETE' }), [apiCall]);

  return { apiCall, get, post, put, patch, delete: del };
}
