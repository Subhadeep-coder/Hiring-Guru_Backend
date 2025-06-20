export class User {
  id: string;
  name: string | null;
  email: string;
  profilePictureUrl?: string | null;
  authProvider: string;
  authProviderId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}