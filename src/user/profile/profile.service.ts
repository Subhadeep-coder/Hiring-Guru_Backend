import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserPreferencesDto } from './dto/create-user-preferences.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateUserPreferencesDto } from './dto/update-user-preferences.dto';

@Injectable()
export class ProfileService {
    constructor(private readonly prisma: PrismaService) { }
    async create(data: CreateUserPreferencesDto) {
        return this.prisma.userPreferences.create({ data });
    }

    async findByUserId(userId: string) {
        const prefs = await this.prisma.userPreferences.findUnique({
            where: { userId },
            include: { companyTypes: true },
        });
        if (!prefs) throw new NotFoundException('Preferences not found');
        return prefs;
    }

    async update(userId: string, data: UpdateUserPreferencesDto) {
        await this.findByUserId(userId);
        return this.prisma.userPreferences.update({
            where: { userId },
            data,
        });
    }
}
