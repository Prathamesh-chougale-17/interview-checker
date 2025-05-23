// src/ai/flows/generate-interview-questions.ts
'use server';

/**
 * @fileOverview Generates personalized interview questions based on the provided resume data and desired quantity.
 *
 * - generateInterviewQuestions - A function that generates interview questions.
 * - GenerateInterviewQuestionsInput - The input type for the generateInterviewQuestions function.
 * - GenerateInterviewQuestionsOutput - The return type for the generateInterviewQuestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateInterviewQuestionsInputSchema = z.object({
  resumeData: z
    .string()
    .describe('The extracted data from the resume, including work experience, skills, and projects.'),
  numberOfQuestions: z.number().optional().default(5).describe('The desired number of interview questions. Defaults to 5.'),
});
export type GenerateInterviewQuestionsInput = z.infer<typeof GenerateInterviewQuestionsInputSchema>;

const QuestionObjectSchema = z.object({
  question: z.string().describe('The interview question text.'),
  guidanceLink: z.string().url().describe('A URL (e.g., Google search) to help understand the question.'),
});

const GenerateInterviewQuestionsOutputSchema = z.object({
  questions: z.array(QuestionObjectSchema).describe('An array of personalized interview questions, each with text and a guidance link.'),
});
export type GenerateInterviewQuestionsOutput = z.infer<typeof GenerateInterviewQuestionsOutputSchema>;

export async function generateInterviewQuestions(input: GenerateInterviewQuestionsInput): Promise<GenerateInterviewQuestionsOutput> {
  return generateInterviewQuestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateInterviewQuestionsPrompt',
  input: {schema: GenerateInterviewQuestionsInputSchema},
  output: {schema: GenerateInterviewQuestionsOutputSchema},
  prompt: `You are an expert career coach specializing in helping candidates prepare for job interviews.

  Based on the following information extracted from the candidate's resume, generate {{{numberOfQuestions}}} interview questions that are relevant to their experience and skills.
  The questions should be challenging but fair, and designed to assess the candidate's suitability for a role.
  For each question, also provide a guidanceLink. This link should be a Google search query URL formatted as 'https://www.google.com/search?q=how+to+answer+[URL_ENCODED_QUESTION_TEXT]'. Ensure the question text in the URL is properly URL encoded.

  Return the interview questions as a JSON array of objects, where each object has a "question" field (string) and a "guidanceLink" field (string URL).

  Resume Data: {{{resumeData}}}
  Number of Questions: {{{numberOfQuestions}}}`,
});

const generateInterviewQuestionsFlow = ai.defineFlow(
  {
    name: 'generateInterviewQuestionsFlow',
    inputSchema: GenerateInterviewQuestionsInputSchema,
    outputSchema: GenerateInterviewQuestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

export type { QuestionObjectSchema };
