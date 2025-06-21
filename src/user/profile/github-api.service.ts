import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class GithubApiService {
    private readonly githubApiUrl = 'https://api.github.com';

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
    ) { }

    private getHeaders() {
        const token = this.configService.get<string>('GITHUB_TOKEN');
        return {
            Authorization: `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
        };
    }

    async getUserProfile(username: string) {
        try {
            const response = await firstValueFrom(
                this.httpService.get(`${this.githubApiUrl}/users/${username}`, {
                    headers: this.getHeaders(),
                }),
            );
            return response.data;
        } catch (error) {
            throw new HttpException(
                `Failed to fetch GitHub user: ${error.response?.data?.message || error.message}`,
                HttpStatus.BAD_REQUEST,
            );
        }
    }

    async getUserRepositories(username: string) {
        try {
            const response = await firstValueFrom(
                this.httpService.get(`${this.githubApiUrl}/users/${username}/repos`, {
                    headers: this.getHeaders(),
                    params: {
                        per_page: 100,
                        sort: 'updated',
                        type: 'owner',
                    },
                }),
            );
            return response.data;
        } catch (error) {
            throw new HttpException(
                `Failed to fetch repositories: ${error.response?.data?.message || error.message}`,
                HttpStatus.BAD_REQUEST,
            );
        }
    }

    async getUserLanguages(username: string) {
        const repos = await this.getUserRepositories(username);
        const languages: Record<string, number> = {};

        for (const repo of repos) {
            if (repo.language) {
                languages[repo.language] = (languages[repo.language] || 0) + 1;
            }
        }

        // Convert to percentages
        const total = Object.values(languages).reduce((sum, count) => sum + count, 0);
        const languagePercentages: Record<string, number> = {};

        for (const [lang, count] of Object.entries(languages)) {
            languagePercentages[lang] = Math.round((count / total) * 100);
        }

        return languagePercentages;
    }

    async getContributionFrequency(username: string): Promise<string> {
        const repos = await this.getUserRepositories(username);
        const recentRepos = repos.filter(repo => {
            const lastUpdate = new Date(repo.updated_at);
            const threeMonthsAgo = new Date();
            threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
            return lastUpdate > threeMonthsAgo;
        });

        const ratio = recentRepos.length / Math.max(repos.length, 1);

        if (ratio > 0.5) return 'high';
        if (ratio > 0.2) return 'medium';
        return 'low';
    }
}