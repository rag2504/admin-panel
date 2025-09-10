import { createContext, useContext, useEffect, useState } from "react";

interface AdminUser {
  id?: string;
  email: string;
  name?: string;
  role: string;
}

interface AdminContextType {
  user: AdminUser | null;
  token: string | null;
  login: (token: string, user: AdminUser) => void;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
  apiCall: (endpoint: string, options?: RequestInit) => Promise<any>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem("adminToken");
    const savedUser = localStorage.getItem("adminUser");

    if (savedToken && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setToken(savedToken);
        setUser(parsedUser);
      } catch (error) {
        console.error("Error parsing saved user:", error);
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
      }
    }
    setLoading(false);
  }, []);

  const login = (newToken: string, newUser: AdminUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem("adminToken", newToken);
    localStorage.setItem("adminUser", JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
  };

  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    // Use the main server URL for API calls (port 3001)
    const baseURL = 'http://localhost:3001';
    const url = endpoint.startsWith('http') ? endpoint : `${baseURL}${endpoint}`;
    
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    };

    console.log("🌐 API Call:", url, { headers, ...options });

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      let data: any = null;
      try {
        data = await response.json();
      } catch (_e) {
        data = { success: false, message: 'Empty response' };
      }
      console.log("📝 API Response:", response.status, data);

      // Do NOT auto-logout on 401 here; let callers decide how to handle
      // Return a structured error response instead
      if (!response.ok) {
        return { success: false, status: response.status, ...data };
      }

      return data;
    } catch (error) {
      console.error("❌ API Error:", error);
      throw error;
    }
  };

  const value = {
    user,
    token,
    login,
    logout,
    isAuthenticated: !!token && !!user,
    loading,
    apiCall,
  };

  return (
    <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
}
