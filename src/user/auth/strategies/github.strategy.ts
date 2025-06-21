import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class GitHubStrategy extends PassportStrategy(Strategy, 'github') {
    constructor(
        private configService: ConfigService,
        private authService: AuthService,
    ) {
        super({
            clientID: configService.get<string>('GITHUB_CLIENT_ID') || "",
            clientSecret: configService.get<string>('GITHUB_CLIENT_SECRET') || "",
            callbackURL: `${configService.get<string>('BACKEND_URL')}/user/auth/github/callback`,
            scope: ['user:email'],
        });
    }

    async validate(
        accessToken: string,
        refreshToken: string,
        profile: any,
        done: Function,
    ): Promise<any> {
        const { id, username, emails, photos } = profile;

        const user = {
            authProviderId: id,
            email: emails[0].value,
            name: profile.displayName || username,
            profilePictureUrl: photos[0].value,
            authProvider: 'github',
            githubUsername: username,
        };

        const validatedUser = await this.authService.validateOAuthUser(user);
        done(null, validatedUser);
    }
}