// src/ai/flows/evaluate-answer.ts
'use server';
/**
 * @fileOverview Evaluates user answers to interview questions, providing feedback, a score, follow-up questions, expected answer elements, and suggested resources.
 *
 * - evaluateAnswer - A function that evaluates the answer.
 * - EvaluateAnswerInput - The input type for the evaluateAnswer function.
 * - EvaluateAnswerOutput - The return type for the evaluateAnswer function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EvaluateAnswerInputSchema = z.object({
  question: z.string().describe('The interview question asked.'),
  answer: z.string().describe('The answer provided by the user.'),
  resumeData: z.string().describe('The extracted resume data in JSON format.'),
});
export type EvaluateAnswerInput = z.infer<typeof EvaluateAnswerInputSchema>;

const FollowUpQuestionSuggestionSchema = z.object({
  followUpQuestion: z.string().describe('A suggested follow-up question.'),
});

const SuggestedResourceSchema = z.object({
  title: z.string().describe('The title of the suggested resource.'),
  url: z.string().describe('The URL of the suggested resource (e.g., an article or documentation).'),
});

const EvaluateAnswerOutputSchema = z.object({
  evaluation: z.string().describe('The textual evaluation of the answer.'),
  score: z.number().min(0).max(10).describe('A numerical score from 0 to 10 for the answer. 0 is poor, 10 is excellent.'),
  followUpQuestion: z.string().describe('A suggested follow-up question.'),
  expectedAnswerElements: z.string().describe('A summary of key points or elements the AI was expecting in an ideal answer.'),
  suggestedResources: z.array(SuggestedResourceSchema).describe('An array of 1-2 suggested resources (e.g., articles, documentation) to enhance understanding, each with a title and URL.'),
});
export type EvaluateAnswerOutput = z.infer<typeof EvaluateAnswerOutputSchema>;

const followUpQuestionSuggestionTool = ai.defineTool({
  name: 'followUpQuestionSuggestion',
  description: 'Suggests a relevant follow-up question based on the answer and the resume.',
  inputSchema: z.object({
    question: z.string().describe('The original interview question.'),
    answer: z.string().describe('The user provided answer.'),
    resumeData: z.string().describe('The resume data to base the follow up question on.'),
  }),
  outputSchema: FollowUpQuestionSuggestionSchema,
  async run(input) {
    // Just return the follow up question. The LLM will handle the
    // tool calling and formatting of the response.
    return {
      followUpQuestion: `Based on the question ("${input.question}"), the answer ("${input.answer}"), and the resume ("${input.resumeData}"), what is a good follow-up question to ask?`,
    };
  },
});

const evaluateAnswerPrompt = ai.definePrompt({
  name: 'evaluateAnswerPrompt',
  tools: [followUpQuestionSuggestionTool],
  input: {schema: EvaluateAnswerInputSchema},
  output: {schema: EvaluateAnswerOutputSchema},
  prompt: `You are an expert interview evaluator. Please evaluate the candidate's answer to the question, taking into account their resume data.

    Question: {{{question}}}
    Answer: {{{answer}}}
    Resume Data: {{{resumeData}}}

    Consider the following:
    - Did the candidate answer the question directly?
    - Did the candidate provide sufficient detail?
    - Did the candidate use specific examples to support their answer?
    - How does the answer relate to the information provided in their resume?

    Provide a textual evaluation of the answer.
    Also, provide a numerical score from 0 to 10 for the answer, where 0 is poor and 10 is excellent.
    Describe the key elements or points you were expecting in an ideal answer for this specific question.
    Suggest 1-2 relevant online resources (e.g., articles, documentation links) that would help the candidate deepen their understanding of the question's topic. For each resource, provide a title and a URL.

    In addition to your evaluation, score, expected answer elements, and suggested resources, use the followUpQuestionSuggestion tool to suggest ONE follow-up question that would help you better assess the candidate's skills and experience. The tool's description is: Suggests a relevant follow-up question based on the answer and the resume.

    Return the evaluation, the score, the expected answer elements, the suggested resources, and the follow up question.
    `,
});

const evaluateAnswerFlow = ai.defineFlow(
  {
    name: 'evaluateAnswerFlow',
    inputSchema: EvaluateAnswerInputSchema,
    outputSchema: EvaluateAnswerOutputSchema,
  },
  async input => {
    const {output} = await evaluateAnswerPrompt(input);
    return output!;
  }
);

export async function evaluateAnswer(input: EvaluateAnswerInput): Promise<EvaluateAnswerOutput> {
  return evaluateAnswerFlow(input);
}

export type {FollowUpQuestionSuggestionSchema, SuggestedResourceSchema};
