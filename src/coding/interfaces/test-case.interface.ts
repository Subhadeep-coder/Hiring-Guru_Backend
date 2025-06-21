export interface TestCase {
    input: string;
    expectedOutput: string;
    description?: string;
}

export interface TestResult {
    input: string;
    expectedOutput: string;
    actualOutput: string;
    passed: boolean;
    executionTime?: number;
    memory?: number;
}