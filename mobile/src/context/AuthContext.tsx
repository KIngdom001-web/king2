import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthState, LoginCredentials, RegisterCredentials, User } from '../types/auth';
import { login, register, forgotPassword, resetPassword } from '../services/auth';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    // Check if the user is already logged in
    const bootstrapAsync = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const userJson = await AsyncStorage.getItem('user');
        if (token && userJson) {
          const user = JSON.parse(userJson);
          setState({ user, token, isLoading: false, error: null });
        } else {
          setState({ user: null, token: null, isLoading: false, error: null });
        }
      } catch (e) {
        setState({ user: null, token: null, isLoading: false, error: 'Failed to load user data' });
      }
    };

    bootstrapAsync();
  }, []);

  const authContext: AuthContextType = {
    ...state,
    login: async (credentials) => {
      try {
        const { user, token } = await login(credentials);
        await AsyncStorage.setItem('userToken', token);
        await AsyncStorage.setItem('user', JSON.stringify(user));
        setState({ user, token, isLoading: false, error: null });
      } catch (error) {
        setState({ ...state, error: error.message });
      }
    },
    register: async (credentials) => {
      try {
        const { user, token } = await register(credentials);
        await AsyncStorage.setItem('userToken', token);
        await AsyncStorage.setItem('user', JSON.stringify(user));
        setState({ user, token, isLoading: false, error: null });
      } catch (error) {
        setState({ ...state, error: error.message });
      }
    },
    logout: async () => {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('user');
      setState({ user: null, token: null, isLoading: false, error: null });
    },
    forgotPassword: async (email) => {
      try {
        await forgotPassword(email);
      } catch (error) {
        setState({ ...state, error: error.message });
      }
    },
    resetPassword: async (token, newPassword) => {
      try {
        await resetPassword(token, newPassword);
      } catch (error) {
        setState({ ...state, error: error.message });
      }
    },
  };

  return <AuthContext.Provider value={authContext}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

