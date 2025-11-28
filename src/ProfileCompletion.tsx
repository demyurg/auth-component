import { useState } from 'react';
import { UserProfile } from './types';

interface ProfileCompletionProps {
  userProfile: UserProfile;
  onComplete: (firstName: string, lastName: string) => Promise<void>;
  onCancel?: () => void;
}

export const ProfileCompletion = ({ userProfile, onComplete, onCancel }: ProfileCompletionProps) => {
  const [firstName, setFirstName] = useState(userProfile.firstName || '');
  const [lastName, setLastName] = useState(userProfile.lastName || '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!firstName.trim()) {
      newErrors.firstName = 'Имя обязательно';
    }

    if (!lastName.trim()) {
      newErrors.lastName = 'Фамилия обязательна';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onComplete(firstName.trim(), lastName.trim());
    } catch (error) {
      setErrors({ submit: 'Не удалось сохранить профиль. Попробуйте еще раз.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Редактировать профиль
            </h2>
            {onCancel && (
              <button
                onClick={onCancel}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-4 mb-6">
            <img
              src={userProfile.avatarUrl}
              alt={userProfile.githubUsername}
              className="h-16 w-16 rounded-full"
            />
            <div>
              <p className="font-medium text-gray-900">@{userProfile.githubUsername}</p>
              <p className="text-sm text-gray-500">GitHub ID: {userProfile.githubId}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {errors.submit && (
              <div className="rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-800">{errors.submit}</p>
              </div>
            )}

            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                Имя
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={`w-full px-3 py-2 border ${
                  errors.firstName ? 'border-red-500' : 'border-gray-300'
                } rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                placeholder="Иван"
              />
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
              )}
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                Фамилия
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={`w-full px-3 py-2 border ${
                  errors.lastName ? 'border-red-500' : 'border-gray-300'
                } rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                placeholder="Иванов"
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Отмена
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
