export interface UserProfile {
  id: string;
  githubId: number;
  githubUsername: string;
  avatarUrl: string;
  firstName?: string;
  lastName?: string;
  role: 'admin' | 'student';
}

export interface AuthState {
  accessToken: string | null;
  userProfile: UserProfile | null;
}