import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { RunCodeDto } from './dto/run-code.dto';
import { SubmitCodeDto } from './dto/submit-code.dto';
import { TestCase, TestResult } from './interfaces/test-case.interface';

@Injectable()
export class CodingService {
    private readonly judge0BaseUrl: string;
    private readonly judge0ApiKey: string;

    // Language ID mapping for Judge0
    private readonly languageMap = {
        'javascript': 63,
        'python': 71,
        'java': 62,
        'cpp': 54,
        'c': 50,
        'csharp': 51,
        'go': 60,
        'rust': 73,
        'typescript': 74,
    };

    constructor(
        private prismaService: PrismaService,
        private httpService: HttpService,
        private configService: ConfigService,
    ) {
        this.judge0BaseUrl = this.configService.get('JUDGE0_BASE_URL') || 'https://judge0-ce.p.rapidapi.com';
        this.judge0ApiKey = this.configService.get('JUDGE0_API_KEY') || "";
    }

    async runCode(runCodeDto: RunCodeDto) {
        const { code, language, roundId, questionId, testCases, stdin } = runCodeDto;

        // Validate round and question exist
        // await this.validateRoundAndQuestion(roundId, questionId);

        const languageId = this.getLanguageId(language);

        try {
            if (testCases && testCases.length > 0) {
                // Run against multiple test cases
                console.log(testCases);
                const results = await this.runMultipleTestCases(code, languageId, testCases);
                console.log("Here results: ", results);
                return {
                    success: true,
                    results,
                    summary: this.generateTestSummary(results),
                };
            } else {
                // Single execution with stdin
                const result = await this.executeSingleRun(code, languageId, stdin);
                return {
                    success: true,
                    result,
                };
            }
        } catch (error) {
            throw new InternalServerErrorException('Failed to execute code: ' + error.message);
        }
    }

    async submitCode(submitCodeDto: SubmitCodeDto) {
        const { code, language, roundId, questionId, testCases } = submitCodeDto;

        // Validate round and question exist
        const round = await this.validateRoundAndQuestion(roundId, questionId);

        // Check if round is in progress
        if (round.status !== 'IN_PROGRESS') {
            throw new BadRequestException('Round is not in progress');
        }

        const languageId = this.getLanguageId(language);

        try {
            // Execute code against test cases
            const testResults = await this.runMultipleTestCases(code, languageId, testCases!);
            const summary = this.generateTestSummary(testResults);

            // Calculate score based on test case results
            const score = this.calculateScore(testResults);

            // Store submission in database
            const submission = await this.prismaService.codingSubmission.create({
                data: {
                    roundId,
                    questionId,
                    code,
                    language,
                    status: summary.status,
                    executionTime: summary.avgExecutionTime,
                    memoryUsed: summary.avgMemory,
                    testResults: JSON.parse(JSON.stringify(testResults)),
                    score,
                    evaluatedAt: new Date(),
                },
            });

            return {
                success: true,
                submissionId: submission.id,
                score,
                summary,
                testResults,
            };
        } catch (error) {
            throw new InternalServerErrorException('Failed to submit code: ' + error.message);
        }
    }

    async getSubmissionHistory(roundId: string) {
        const submissions = await this.prismaService.codingSubmission.findMany({
            where: { roundId },
            orderBy: { submittedAt: 'desc' },
            select: {
                id: true,
                language: true,
                status: true,
                score: true,
                executionTime: true,
                memoryUsed: true,
                submittedAt: true,
            },
        });

        return submissions;
    }

    async getSubmissionDetails(submissionId: string) {
        const submission = await this.prismaService.codingSubmission.findUnique({
            where: { id: submissionId },
        });

        if (!submission) {
            throw new BadRequestException('Submission not found');
        }

        return submission;
    }

    private async validateRoundAndQuestion(roundId: string, questionId: string) {
        const round = await this.prismaService.round.findUnique({
            where: { id: roundId },
            include: {
                questions: {
                    where: { id: questionId },
                },
            },
        });

        if (!round) {
            throw new BadRequestException('Round not found');
        }

        if (round.questions.length === 0) {
            throw new BadRequestException('Question not found in this round');
        }

        return round;
    }

    private getLanguageId(language: string): number {
        const languageId = this.languageMap[language.toLowerCase()];
        if (!languageId) {
            throw new BadRequestException(`Unsupported language: ${language}`);
        }
        return languageId;
    }

    private async executeSingleRun(code: string, languageId: number, stdin?: string) {
        const submissionData = {
            source_code: Buffer.from(code).toString('base64'),
            language_id: languageId,
            stdin: stdin ? Buffer.from(stdin).toString('base64') : undefined,
        };
        console.log("Before execution");
        // Submit to Judge0
        const submitResponse = await firstValueFrom(
            this.httpService.post(`${this.judge0BaseUrl}/submissions`, submissionData, {
                headers: {
                    'X-RapidAPI-Key': this.judge0ApiKey,
                    'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
                    'Content-Type': 'application/json',
                },
                params: { base64_encoded: 'true', wait: 'true' },
            })
        );
        console.log("After execution", submitResponse);
        return this.parseJudge0Response(submitResponse.data);
    }

    private async runMultipleTestCases(code: string, languageId: number, testCases: TestCase[]): Promise<TestResult[]> {
        const results: TestResult[] = [];

        for (const testCase of testCases) {
            console.log("Running one execution: ", testCase);
            const result = await this.executeSingleRun(code, languageId, testCase.input);
            console.log("After running one execution: ", result);
            const testResult: TestResult = {
                input: testCase.input,
                expectedOutput: testCase.expectedOutput.trim(),
                actualOutput: result.stdout ? result.stdout.trim() : '',
                passed: result.stdout ? result.stdout.trim() === testCase.expectedOutput.trim() : false,
                executionTime: result.time ? parseFloat(result.time) : undefined,
                memory: result.memory,
            };

            results.push(testResult);
        }

        return results;
    }

    private parseJudge0Response(response: any) {
        return {
            status: response.status?.description || 'Unknown',
            stdout: response.stdout ? Buffer.from(response.stdout, 'base64').toString() : null,
            stderr: response.stderr ? Buffer.from(response.stderr, 'base64').toString() : null,
            compile_output: response.compile_output ? Buffer.from(response.compile_output, 'base64').toString() : null,
            time: response.time,
            memory: response.memory,
            exit_code: response.exit_code,
        };
    }

    private generateTestSummary(testResults: TestResult[]) {
        const totalTests = testResults.length;
        const passedTests = testResults.filter(result => result.passed).length;
        const failedTests = totalTests - passedTests;

        const executionTimes = testResults
            .map(result => result.executionTime)
            .filter(time => time !== undefined);

        const memories = testResults
            .map(result => result.memory)
            .filter(memory => memory !== undefined);

        return {
            totalTests,
            passedTests,
            failedTests,
            successRate: (passedTests / totalTests) * 100,
            status: passedTests === totalTests ? 'Accepted' : 'Failed',
            avgExecutionTime: executionTimes.length > 0
                ? executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length
                : null,
            avgMemory: memories.length > 0
                ? memories.reduce((a, b) => a + b, 0) / memories.length
                : null,
        };
    }

    private calculateScore(testResults: TestResult[]): number {
        const passedTests = testResults.filter(result => result.passed).length;
        const totalTests = testResults.length;

        if (totalTests === 0) return 0;

        // Base score from test case success rate
        const baseScore = (passedTests / totalTests) * 80; // 80% weight for correctness

        // Bonus for efficiency (if all test cases pass)
        let efficiencyBonus = 0;
        if (passedTests === totalTests) {
            const avgTime = testResults
                .map(r => r.executionTime)
                .filter(t => t !== undefined)
                .reduce((a, b) => a + b, 0) / testResults.length;

            // Bonus based on execution time (faster = better)
            if (avgTime < 0.1) efficiencyBonus = 20;
            else if (avgTime < 0.5) efficiencyBonus = 15;
            else if (avgTime < 1.0) efficiencyBonus = 10;
            else efficiencyBonus = 5;
        }

        return Math.min(100, baseScore + efficiencyBonus);
    }
}