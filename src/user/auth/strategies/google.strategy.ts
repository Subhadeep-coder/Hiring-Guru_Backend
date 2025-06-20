import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
    constructor(
        private configService: ConfigService,
        private authService: AuthService,
    ) {
        super({
            clientID: configService.get<string>('GOOGLE_CLIENT_ID') || "",
            clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET') || "",
            callbackURL: `${configService.get<string>('BACKEND_URL')}/user/auth/google/callback`,
            scope: ['email', 'profile'],
        });
    }

    async validate(
        accessToken: string,
        refreshToken: string,
        profile: any,
        done: VerifyCallback,
    ): Promise<any> {
        const { id, name, emails, photos } = profile;

        const user = {
            authProviderId: id,
            email: emails[0].value,
            name: name.givenName + ' ' + name.familyName,
            profilePictureUrl: photos[0].value,
            authProvider: 'google',
        };

        const validatedUser = await this.authService.validateOAuthUser(user);
        done(null, validatedUser);
    }
}