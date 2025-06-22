import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../src/prisma/prisma.service';

@Injectable()
export class ProfileService {
    constructor(private readonly prisma: PrismaService) { }
    // async create(data: CreateUserPreferencesDto) {
    //     return this.prisma.userPreferences.create({ data });
    // }

    // async findByUserId(userId: string) {
    //     const prefs = await this.prisma.userPreferences.findUnique({
    //         where: { userId },
    //         include: { companyTypes: true },
    //     });
    //     if (!prefs) throw new NotFoundException('Preferences not found');
    //     return prefs;
    // }

    // async update(userId: string, data: UpdateUserPreferencesDto) {
    //     await this.findByUserId(userId);
    //     return this.prisma.userPreferences.update({
    //         where: { userId },
    //         data,
    //     });
    // }
}
