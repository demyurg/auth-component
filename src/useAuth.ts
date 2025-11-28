import { useCallback, useEffect, useState } from 'react';
import { useLocalStorageWithSubscription } from './useLocalStorageWithSubscription';
import { UserProfile } from './types';

const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID;
const REDIRECT_URI = import.meta.env.VITE_GITHUB_REDIRECT_URI || 'http://localhost:5173';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const useAuth = () => {
  const { isLoading: isLoadingToken, data: token, setValue: setToken } = useLocalStorageWithSubscription<string>('auth_token', true);
  const { isLoading: isLoadingUser, data: userProfile, setValue: setUserProfile } = useLocalStorageWithSubscription<UserProfile>('auth_user');
  const [isRefreshing, setIsRefreshing] = useState(true);

  const authState = token ? { accessToken: token, userProfile } : null;

  // При загрузке проверяем актуальные данные пользователя с сервера (только если роли нет)
  useEffect(() => {
    const refreshUserData = async () => {
      // Если нет токена - не делаем запрос
      if (!token) {
        setIsRefreshing(false);
        return;
      }

      // Если роль уже есть - не делаем запрос
      if (userProfile?.role) {
        setIsRefreshing(false);
        return;
      }

      // Делаем запрос для получения роли
      try {
        const response = await fetch(`${API_URL}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const user = await response.json();

          // Обновляем профиль с ролью
          setUserProfile({
            id: user.id,
            githubUsername: user.githubUsername,
            githubId: user.githubId,
            avatarUrl: user.avatarUrl,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
          });
        }
      } catch (error) {
        console.error('Failed to refresh user data:', error);
      } finally {
        setIsRefreshing(false);
      }
    };

    const isLoading = isLoadingToken || isLoadingUser;
    if (!isLoading) {
      refreshUserData();
    }
  }, [isLoadingToken, isLoadingUser, token, userProfile?.role, setUserProfile]);

  const loginWithGitHub = useCallback(() => {
    const params = new URLSearchParams({
      client_id: GITHUB_CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      scope: 'user:email read:user',
    });

    window.location.href = `https://github.com/login/oauth/authorize?${params.toString()}`;
  }, []);

  const handleGitHubCallback = useCallback(async (code: string) => {
    try {
      // Запрос на backend для обмена code на access_token
      // Backend: обменивает code на GitHub access_token, получает данные пользователя,
      // создает/находит пользователя в БД, возвращает наш JWT токен
      const response = await fetch(`${API_URL}/api/auth/github/callback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        throw new Error('Failed to authenticate with GitHub');
      }

      const { token: accessToken, user } = await response.json();

      // Сохраняем токен и профиль раздельно
      setToken(accessToken);
      setUserProfile({
        id: user.id,
        githubUsername: user.githubUsername,
        githubId: user.githubId,
        avatarUrl: user.avatarUrl,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      });
    } catch (error) {
      console.error('GitHub auth error:', error);
      throw error;
    }
  }, [setToken, setUserProfile]);

  const completeProfile = useCallback(async (firstName: string, lastName: string) => {
    if (!token) {
      console.error('No access token available');
      throw new Error('Not authenticated');
    }

    try {
      // Отправляем данные на backend для сохранения
      const response = await fetch(`${API_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ firstName, lastName }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Profile update failed:', response.status, errorData);
        throw new Error(errorData.message || 'Failed to update profile');
      }

      const user = await response.json();

      // Обновляем профиль
      setUserProfile({
        id: user.id,
        githubUsername: user.githubUsername,
        githubId: user.githubId,
        avatarUrl: user.avatarUrl,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      });
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  }, [token, setUserProfile]);

  const logout = useCallback(() => {
    setToken(null);
    setUserProfile(null);
  }, [setToken, setUserProfile]);

  const isLoading = isLoadingToken || isLoadingUser;

  return {
    isLoading: isLoading || isRefreshing,
    authState,
    isAuthenticated: !!token,
    userProfile: userProfile ?? null,
    loginWithGitHub,
    handleGitHubCallback,
    completeProfile,
    logout,
  };
};
