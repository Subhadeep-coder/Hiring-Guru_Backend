export interface QuestionResponse {
    id: string;
    content: string;
    type: 'MCQ' | 'SUBJECTIVE';
    difficulty: string;
    category?: string;
    options?: string[];
    correctAnswer?: string;
}

export interface GenerateQuestionsResponse {
    success: boolean;
    roundId: string;
    questions: QuestionResponse[];
    totalQuestions: number;
    estimatedDuration: number;
    message?: string;
}

export interface SubmitAnswersResponse {
    success: boolean;
    roundId: string;
    submissionId: string;
    message?: string;
}

export interface AIVerificationPayload {
    submissionId: string;
    roundId: string;
    questionsAndAnswers: {
        questionId: string;
        question: string;
        userAnswer: string;
        questionType: string;
        correctAnswer?: string | null;
    }[];
}