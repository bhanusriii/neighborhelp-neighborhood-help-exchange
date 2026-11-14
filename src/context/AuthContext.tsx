import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, LocationCoords } from '../types';
import { api, getStoredToken } from '../api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  activeRequestsCount: number;
  location: LocationCoords;
  neighborhood: string;
  loading: boolean;
  unreadNotificationsCount: number;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  adminLogin: (email: string, password: string) => Promise<void>;
  register: (payload: {
    name: string;
    email: string;
    password: string;
    neighborhood: string;
    lat: number;
    lng: number;
    bio?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  switchDemoUser: (email: string) => Promise<void>;
  updateLocation: (coords: LocationCoords, neighborhoodName: string) => Promise<void>;
  detectBrowserLocation: () => Promise<{ success: boolean; coords?: LocationCoords; error?: string }>;
  refreshUserData: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const DEFAULT_COORDS: LocationCoords = { lat: 37.7749, lng: -122.4194 };
const DEFAULT_NEIGHBORHOOD = 'Oakridge Park';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [activeRequestsCount, setActiveRequestsCount] = useState<number>(0);
  const [location, setLocation] = useState<LocationCoords>(() => {
    const saved = localStorage.getItem('neighborhood_location');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEFAULT_COORDS;
      }
    }
    return DEFAULT_COORDS;
  });
  const [neighborhood, setNeighborhood] = useState<string>(() => {
    return localStorage.getItem('neighborhood_name') || DEFAULT_NEIGHBORHOOD;
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(0);

  const refreshNotifications = useCallback(async () => {
    if (!token) {
      setUnreadNotificationsCount(0);
      return;
    }
    try {
      const data = await api.getNotifications();
      const unread = data.notifications.filter(n => !n.read).length;
      setUnreadNotificationsCount(unread);
    } catch {
      // ignore in background
    }
  }, [token]);

  const refreshUserData = useCallback(async () => {
    const stored = getStoredToken();
    if (!stored) {
      setUser(null);
      setToken(null);
      setLoading(false);
      return;
    }

    try {
      const data = await api.getCurrentUser();
      setUser(data.user);
      setActiveRequestsCount(data.activeRequestsCount);
      setLocation(data.user.location);
      setNeighborhood(data.user.neighborhood);
      localStorage.setItem('neighborhood_location', JSON.stringify(data.user.location));
      localStorage.setItem('neighborhood_name', data.user.neighborhood);
      await refreshNotifications();
    } catch {
      // Token expired or invalid
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, [refreshNotifications]);

  useEffect(() => {
    refreshUserData();
  }, [refreshUserData]);

  // Periodic notifications polling
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      refreshNotifications();
    }, 20000);
    return () => clearInterval(interval);
  }, [user, refreshNotifications]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await api.login({ email, password });
      setUser(res.user);
      setToken(res.token);
      setActiveRequestsCount(res.activeRequestsCount);
      setLocation(res.user.location);
      setNeighborhood(res.user.neighborhood);
      localStorage.setItem('neighborhood_location', JSON.stringify(res.user.location));
      localStorage.setItem('neighborhood_name', res.user.neighborhood);
      await refreshNotifications();
    } finally {
      setLoading(false);
    }
  };

  const adminLogin = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await api.adminLogin({ email, password });
      setUser(res.user);
      setToken(res.token);
      setActiveRequestsCount(res.activeRequestsCount);
      setLocation(res.user.location);
      setNeighborhood(res.user.neighborhood);
      localStorage.setItem('neighborhood_location', JSON.stringify(res.user.location));
      localStorage.setItem('neighborhood_name', res.user.neighborhood);
      await refreshNotifications();
    } finally {
      setLoading(false);
    }
  };

  const register = async (payload: {
    name: string;
    email: string;
    password: string;
    neighborhood: string;
    lat: number;
    lng: number;
    bio?: string;
  }) => {
    setLoading(true);
    try {
      const res = await api.register(payload);
      setUser(res.user);
      setToken(res.token);
      setActiveRequestsCount(res.activeRequestsCount);
      setLocation(res.user.location);
      setNeighborhood(res.user.neighborhood);
      localStorage.setItem('neighborhood_location', JSON.stringify(res.user.location));
      localStorage.setItem('neighborhood_name', res.user.neighborhood);
      await refreshNotifications();
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // clear anyway
    } finally {
      setUser(null);
      setToken(null);
      setActiveRequestsCount(0);
      setUnreadNotificationsCount(0);
    }
  };

  const switchDemoUser = async (email: string) => {
    setLoading(true);
    try {
      const res = await api.switchDemoUser(email);
      setUser(res.user);
      setToken(res.token);
      setActiveRequestsCount(res.activeRequestsCount);
      setLocation(res.user.location);
      setNeighborhood(res.user.neighborhood);
      localStorage.setItem('neighborhood_location', JSON.stringify(res.user.location));
      localStorage.setItem('neighborhood_name', res.user.neighborhood);
      await refreshNotifications();
    } finally {
      setLoading(false);
    }
  };

  const updateLocation = async (coords: LocationCoords, neighborhoodName: string) => {
    setLocation(coords);
    setNeighborhood(neighborhoodName);
    localStorage.setItem('neighborhood_location', JSON.stringify(coords));
    localStorage.setItem('neighborhood_name', neighborhoodName);

    if (user) {
      try {
        const res = await api.updateLocation({
          lat: coords.lat,
          lng: coords.lng,
          neighborhood: neighborhoodName,
        });
        setUser(res.user);
      } catch (e) {
        console.warn('Failed to sync location to server profile:', e);
      }
    }
  };

  const detectBrowserLocation = async (): Promise<{
    success: boolean;
    coords?: LocationCoords;
    error?: string;
  }> => {
    if (!navigator.geolocation) {
      return { success: false, error: 'Geolocation is not supported by your browser.' };
    }

    return new Promise(resolve => {
      navigator.geolocation.getCurrentPosition(
        pos => {
          const coords = {
            lat: Math.round(pos.coords.latitude * 10000) / 10000,
            lng: Math.round(pos.coords.longitude * 10000) / 10000,
          };
          resolve({ success: true, coords });
        },
        err => {
          let msg = 'Could not retrieve your location.';
          if (err.code === err.PERMISSION_DENIED) {
            msg = 'Location permission was denied. You can select a neighborhood manually.';
          } else if (err.code === err.TIMEOUT) {
            msg = 'Location request timed out.';
          }
          resolve({ success: false, error: msg });
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
      );
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        activeRequestsCount,
        location,
        neighborhood,
        loading,
        unreadNotificationsCount,
        isAdmin: user?.role === 'admin',
        login,
        adminLogin,
        register,
        logout,
        switchDemoUser,
        updateLocation,
        detectBrowserLocation,
        refreshUserData,
        refreshNotifications,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};
