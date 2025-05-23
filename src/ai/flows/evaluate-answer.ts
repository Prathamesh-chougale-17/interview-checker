// src/ai/flows/evaluate-answer.ts
'use server';
/**
 * @fileOverview Evaluates user answers to interview questions, providing feedback and follow-up questions.
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

const EvaluateAnswerOutputSchema = z.object({
  evaluation: z.string().describe('The evaluation of the answer.'),
  followUpQuestion: z.string().describe('A suggested follow-up question.'),
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
      followUpQuestion: `Based on the question, answer and resume, what follow up question would you ask? The question was: ${input.question}. The answer was: ${input.answer}. Here is the resume data: ${input.resumeData}`,
    };
  },
});

const evaluateAnswerPrompt = ai.definePrompt({
  name: 'evaluateAnswerPrompt',
  tools: [followUpQuestionSuggestionTool],
  input: {schema: EvaluateAnswerInputSchema},
  output: {schema: EvaluateAnswerOutputSchema},
  prompt: `You are an expert interview evaluator.  Please evaluate the candidate's answer to the question, taking into account their resume data.

    Question: {{{question}}}
    Answer: {{{answer}}}
    Resume Data: {{{resumeData}}}

    Consider the following:
    - Did the candidate answer the question directly?
    - Did the candidate provide sufficient detail?
    - Did the candidate use specific examples to support their answer?
    - How does the answer relate to the information provided in their resume?

    In addition to your evaluation, use the followUpQuestionSuggestion tool to suggest ONE follow-up question that would help you better assess the candidate's skills and experience. The tool's description is: Suggests a relevant follow-up question based on the answer and the resume.

    Return the evaluation and the follow up question.
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

export type {FollowUpQuestionSuggestionSchema};
