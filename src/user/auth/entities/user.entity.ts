export class User {
  id: string;
  name: string | null;
  email: string;
  profilePictureUrl?: string | null;
  authProvider: string;
  authProviderId: string;
  githubUsername: string | null;
  isActive: boolean;
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}