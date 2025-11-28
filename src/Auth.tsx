import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from './useAuth';
import { ProfileCompletion } from './ProfileCompletion';
import { usePageLeaveReset } from './usePageLeaveReset';

export const Auth = ({ children, AdminPage }: React.PropsWithChildren<{AdminPage?: React.FC<{}>}>) => {
  const {
    isLoading,
    isAuthenticated,
    userProfile,
    loginWithGitHub,
    handleGitHubCallback,
    completeProfile,
    logout
  } = useAuth();

  // const reset = useCallback(
  //   () => {
  //     if (isAuthenticated && userProfile?.role !== 'admin') {
  //       if (window.location.pathname === '/') {
  //         window.location.reload();
  //       } else {
  //         window.location.href = '/';
  //       }
  //     }
  //   },
  //   [isAuthenticated, userProfile?.role]
  // );

  // Сброс состояния для студентов при уходе со страницы
  // usePageLeaveReset(reset);

  const [isProcessingCallback, setIsProcessingCallback] = useState(() => {
    // Проверяем наличие code в URL при инициализации
    const params = new URLSearchParams(window.location.search);
    return !!params.get('code');
  });

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const processedCodeRef = useRef<string | null>(null);

  // Обработка OAuth callback
  useEffect(() => {
    const processCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const error = params.get('error');

      if (error) {
        console.error('GitHub OAuth error:', error);
        window.history.replaceState({}, document.title, '/');
        setIsProcessingCallback(false);
        return;
      }

      if (code) {
        // Проверяем, не обрабатывали ли мы уже этот code
        if (processedCodeRef.current === code) {
          return;
        }

        processedCodeRef.current = code;

        try {
          await handleGitHubCallback(code);
          // Очищаем URL от параметров после успешной обработки
          window.history.replaceState({}, document.title, '/');
          // НЕ сбрасываем isProcessingCallback здесь - дождемся обновления isAuthenticated
        } catch (error) {
          console.error('Failed to process GitHub callback:', error);
          window.history.replaceState({}, document.title, '/');
          setIsProcessingCallback(false);
          processedCodeRef.current = null; // Сбрасываем при ошибке для retry
        }
      }
    };

    processCallback();
  }, [handleGitHubCallback]);

  // Сбрасываем isProcessingCallback когда пользователь авторизован И загрузка завершена
  useEffect(() => {
    if (isAuthenticated && !isLoading && isProcessingCallback) {
      setIsProcessingCallback(false);
    }
  }, [isAuthenticated, isLoading, isProcessingCallback]);

  // Закрытие меню при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };

    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showProfileMenu]);

  // Показываем лоадер во время обработки callback или загрузки данных
  if (isProcessingCallback || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {isProcessingCallback ? 'Авторизация через GitHub...' : 'Загрузка...'}
          </p>
        </div>
      </div>
    );
  }

  // Не авторизован - показываем кнопку входа через GitHub
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Вход в систему
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Используйте GitHub для авторизации
            </p>
          </div>
          <div className="flex justify-center">
            <button
              onClick={loginWithGitHub}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg shadow-md transition-colors"
          >
             Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {userProfile && (
        <div className="fixed top-5 right-5 z-50 flex" ref={menuRef}>
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <img
                src={userProfile.avatarUrl}
                alt={userProfile.githubUsername}
                className="w-8 h-8 rounded-full flex-shrink-0"
              />
              <span className="text-sm text-white font-medium drop-shadow-md whitespace-nowrap">
                {userProfile.firstName && userProfile.lastName
                  ? `${userProfile.firstName} ${userProfile.lastName}`
                  : userProfile.githubUsername}
              </span>
            </button>

            {showProfileMenu && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200">
                <button
                  onClick={() => {
                    setShowProfileEdit(true);
                    setShowProfileMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-t-lg"
                >
                  Редактировать профиль
                </button>
                <button
                  onClick={logout}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600 rounded-b-lg"
                >
                  Выйти
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {showProfileEdit && userProfile && (
        <ProfileCompletion
          userProfile={userProfile}
          onComplete={async (firstName, lastName) => {
            await completeProfile(firstName, lastName);
            setShowProfileEdit(false);
          }}
          onCancel={() => setShowProfileEdit(false)}
        />
      )}

      {userProfile?.role === 'admin' && AdminPage && <AdminPage />}
      {userProfile?.role !== 'admin' && children}
    </>
  );
};
