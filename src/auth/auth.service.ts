import { Injectable } from '@nestjs/common';

export interface AuthenticatedUser {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  accessToken?: string;
}

@Injectable()
export class AuthService {
  async validateGoogleUser(profile: any): Promise<AuthenticatedUser> {
    return {
      id: profile.id,
      email: profile.emails?.[0]?.value,
      firstName: profile.name?.givenName,
      lastName: profile.name?.familyName,
      avatarUrl: profile.photos?.[0]?.value,
    };
  }
}
