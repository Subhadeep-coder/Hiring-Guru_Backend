import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class AuthService {
    constructor(private prisma: PrismaService) { }
    async create(createUserDto: CreateUserDto): Promise<User> {
        return this.prisma.user.create({
            data: createUserDto,
        });
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.prisma.user.findUnique({
            where: { email },
        });
    }

    async findByAuthProvider(
        authProvider: string,
        authProviderId: string,
    ): Promise<User | null> {
        return this.prisma.user.findFirst({
            where: {
                authProvider,
                authProviderId,
            },
        });
    }

    async findById(id: string): Promise<User | null> {
        return this.prisma.user.findUnique({
            where: { id },
        });
    }

    async updateLastLogin(id: string): Promise<User> {
        return this.prisma.user.update({
            where: { id },
            data: { updatedAt: new Date() },
        });
    }

    async validateOAuthUser(oauthUser: {
        authProviderId: string;
        email: string;
        name: string;
        profilePictureUrl: string;
        authProvider: string;
    }): Promise<User> {
        // Check if user exists by auth provider
        let user = await this.findByAuthProvider(
            oauthUser.authProvider,
            oauthUser.authProviderId,
        );

        if (user) {
            // Update last login
            return this.updateLastLogin(user.id);
        }

        // Check if user exists by email (for account linking)
        user = await this.findByEmail(oauthUser.email);

        if (user) {
            // User exists with same email but different provider
            // You might want to handle account linking here
            throw new Error('Account with this email already exists with different provider');
        }

        // Create new user
        const createUserDto: CreateUserDto = {
            name: oauthUser.name,
            email: oauthUser.email,
            avatar: oauthUser.profilePictureUrl,
            authProvider: oauthUser.authProvider,
            authProviderId: oauthUser.authProviderId,
            isActive: true,
        };

        return this.create(createUserDto);
    }

    async findUserById(id: string): Promise<User | null> {
        return this.findById(id);
    }
}