import { createContext, useState, useEffect, useCallback, useRef } from 'react';
import { login as apiLogin, getMe, refresh as apiRefresh, logout as apiLogout } from '../api/auth';
import { getAccessToken, getRefreshToken, setTokens, setAccessToken, clearTokens } from '../utils/storage';

export const AuthContext = createContext(null);

const TOKEN_REFRESH_MARGIN = 60 * 1000; // Refresh 1 minute before expiration

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshTimeoutRef = useRef(null);

  const clearRefreshTimeout = useCallback(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }
  }, []);

  const scheduleTokenRefresh = useCallback((expiresIn) => {
    clearRefreshTimeout();

    const refreshTime = (expiresIn * 1000) - TOKEN_REFRESH_MARGIN;
    if (refreshTime > 0) {
      refreshTimeoutRef.current = setTimeout(async () => {
        const refreshToken = getRefreshToken();
        if (refreshToken) {
          try {
            const result = await apiRefresh(refreshToken);
            setAccessToken(result.accessToken);
            scheduleTokenRefresh(result.expiresIn);
          } catch {
            clearTokens();
            setUser(null);
          }
        }
      }, refreshTime);
    }
  }, [clearRefreshTimeout]);

  const checkAuth = useCallback(async () => {
    const accessToken = getAccessToken();
    if (!accessToken) {
      setIsLoading(false);
      return;
    }

    try {
      const userData = await getMe();
      setUser(userData);
      // Schedule refresh assuming token has ~14 minutes left (half of 15 min default)
      scheduleTokenRefresh(14 * 60);
    } catch (error) {
      // Try to refresh the token
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        try {
          const result = await apiRefresh(refreshToken);
          setAccessToken(result.accessToken);
          const userData = await getMe();
          setUser(userData);
          scheduleTokenRefresh(result.expiresIn);
        } catch {
          clearTokens();
        }
      } else {
        clearTokens();
      }
    } finally {
      setIsLoading(false);
    }
  }, [scheduleTokenRefresh]);

  useEffect(() => {
    checkAuth();
    return () => clearRefreshTimeout();
  }, [checkAuth, clearRefreshTimeout]);

  const login = async (email, password) => {
    const result = await apiLogin(email, password);
    setTokens(result.accessToken, result.refreshToken);
    setUser(result.user);
    scheduleTokenRefresh(result.expiresIn);
    return result;
  };

  const logout = async () => {
    clearRefreshTimeout();
    const refreshToken = getRefreshToken();
    try {
      if (refreshToken) {
        await apiLogout(refreshToken);
      }
    } finally {
      clearTokens();
      setUser(null);
    }
  };

  const refreshUser = async () => {
    try {
      const userData = await getMe();
      setUser(userData);
    } catch (error) {
      console.error('Erro ao atualizar dados do usuário:', error);
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
