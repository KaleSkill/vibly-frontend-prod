import { create } from "zustand";
import { persist } from "zustand/middleware";
import { toast } from "sonner";
import { authApi } from "../api/api";

export const useAuthStore = create(
  persist(
    (set, get) => ({
      authUser: null,
      isLoading: false,

      // Action to set user data after successful authentication
      setAuthUser: (user) => {
        set({ authUser: user });
      },

      // Action to update user data
      updateUser: (updatedUser) => {
        set({ authUser: updatedUser });
      },
      
      // Action to handle the OAuth callback
      handleAuthCallback: async (token) => {
        try {
          // Store the token
          if (token) {
            localStorage.setItem('token', token);
          }
          
          // Wait a moment for cookies to be set
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Get user profile
          const response = await authApi.getCurrentUser();
          if (response.data) {
            const user = response.data;
            
            set({ 
              authUser: user,
              isLoading: false
            });
            
            // Redirect based on user role using current domain
            const currentDomain = window.location.origin;
            if (user.role === 'Admin') {
              window.location.href = `${currentDomain}/admin`;
            } else {
              window.location.href = `${currentDomain}/`;
            }
            
            return user;
          } else {
            throw new Error('Failed to get user profile');
          }
        } catch (error) {
          console.error('Auth callback error:', error);
          localStorage.removeItem('token');
          set({ authUser: null, isLoading: false });
          throw error;
        }
      },

      // Action to log the user out
      logout: async () => {
        try {
          // Try to call backend logout API
          await authApi.logout();
        } catch (error) {
          console.log("Backend logout error (continuing with local logout):", error);
          // Continue with local logout even if backend call fails
        }
        
        // Always clear local storage and state
        localStorage.clear();
        set({ authUser: null, isLoading: false });
        
        // Show success message
        toast.success("Logout successful");
        
        // Redirect to login page to ensure clean state
        window.location.href = '/login';
      },
      
      // Action to check authentication status on initial load
      checkAuth: async () => {
        set({ isLoading: true });
        try {
          // Check if we have a token
          const currentToken = localStorage.getItem('token');
          
          // If no token, user is not authenticated
          if (!currentToken) {
            set({ authUser: null, isLoading: false });
            return;
          }

          // Try to refresh token if needed (but don't fail completely if refresh fails)
          try {
            await get().refreshAccessToken();
          } catch (e) {
            // If refresh fails, log but continue with existing token
            console.log('Token refresh failed, continuing with existing token:', e.message);
            // Don't clear everything - token might still be valid
          }

          // Check authentication with backend using current token
          const response = await authApi.checkAuth();
          if (response.data) {
            const user = response.data;
            
            set({ 
              authUser: user,
              isLoading: false
            });
          } else {
            // No user data, clear only auth items (preserve shiprocket_token)
            const shiprocketToken = localStorage.getItem('shiprocket_token');
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('auth-storage');
            if (shiprocketToken) {
              localStorage.setItem('shiprocket_token', shiprocketToken);
            }
            set({ authUser: null, isLoading: false });
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          
          // If token is expired or invalid, try to refresh
          if (error.response?.status === 401 || error.response?.status === 403) {
            try {
              const newToken = await get().refreshAccessToken();
              if (newToken) {
                // Retry auth check with new token
                const retryResponse = await authApi.checkAuth();
                if (retryResponse.data) {
                  set({ 
                    authUser: retryResponse.data,
                    isLoading: false
                  });
                  return;
                }
              }
            } catch (refreshError) {
              console.error('Token refresh failed during auth check:', refreshError);
            }
          }
          
          // Clear only auth items on auth failure (preserve shiprocket_token)
          const shiprocketToken = localStorage.getItem('shiprocket_token');
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('auth-storage');
          if (shiprocketToken) {
            localStorage.setItem('shiprocket_token', shiprocketToken);
          }
          set({ authUser: null, isLoading: false });
        }
      },

      loginWithGoogle: () => {
        authApi.loginWithGoogle();
      },

      // Method to refresh user data
      refreshUserData: async () => {
        try {
          const response = await authApi.getCurrentUser();
          if (response.data) {
            const user = response.data;
            console.log("users data", user)
            
            set({ 
              authUser: user
            });
            
            return user;
          }
        } catch (error) {
          console.error('Failed to refresh user data:', error);
        }
        return null;
      },

      // Method to refresh access token
      refreshAccessToken: async () => {
        try {
          const response = await authApi.refreshToken();
          if (response.data?.data?.accessToken) {
            const newToken = response.data.data.accessToken;
            localStorage.setItem('token', newToken);
            if (response.data.data.refreshToken) {
              localStorage.setItem('refreshToken', response.data.data.refreshToken);
            }
            return newToken;
          }
        } catch (error) {
          console.error('[authstore] Failed to refresh access token:', error?.response?.status, error?.response?.data || error?.message);
          // Only clear auth items if it's a definitive auth error (not network error, etc.)
          // Preserve shiprocket_token
          if (error.response?.status === 401 || error.response?.status === 403) {
            const shiprocketToken = localStorage.getItem('shiprocket_token');
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('auth-storage');
            if (shiprocketToken) {
              localStorage.setItem('shiprocket_token', shiprocketToken);
            }
            set({ authUser: null, isLoading: false });
          }
          // Don't show toast here as it might be called during normal logout
          throw error; // Re-throw so caller knows it failed
        }
        return null;
      },

      // Method to handle token expiration
      handleTokenExpiration: async () => {
        try {
          const newToken = await get().refreshAccessToken();
          if (newToken) {
            // Retry the failed request
            return true;
          }
        } catch (error) {
          console.error('Token refresh failed:', error);
        }
        return false;
      },
    }),
    {
      name: "auth-storage",
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          const { state } = JSON.parse(str);
          return {
            state: {
              ...state,
              isLoading: true,
            },
          };
        },
        setItem: (name, newValue) => {
          const { state, version } = newValue;
          const str = JSON.stringify({
            state: {
              ...state,
            },
            version,
          });
          localStorage.setItem(name, str);
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
      partialize: (state) => ({ 
        authUser: state.authUser
      }),
    }
  )
);
