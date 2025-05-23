'use server';
/**
 * @fileOverview This file contains the Genkit flow for transcribing recorded answers using Google Cloud Speech-to-Text.
 *
 * - transcribeAnswer - A function that transcribes audio data to text.
 * - TranscribeAnswerInput - The input type for the transcribeAnswer function, which includes the audio data URI.
 * - TranscribeAnswerOutput - The return type for the transcribeAnswer function, which includes the transcribed text.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TranscribeAnswerInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      'The recorded answer as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' 
    ),
});
export type TranscribeAnswerInput = z.infer<typeof TranscribeAnswerInputSchema>;

const TranscribeAnswerOutputSchema = z.object({
  transcription: z.string().describe('The transcribed text of the recorded answer.'),
});
export type TranscribeAnswerOutput = z.infer<typeof TranscribeAnswerOutputSchema>;

export async function transcribeAnswer(input: TranscribeAnswerInput): Promise<TranscribeAnswerOutput> {
  return transcribeAnswerFlow(input);
}

const transcribeAnswerPrompt = ai.definePrompt({
  name: 'transcribeAnswerPrompt',
  input: {schema: TranscribeAnswerInputSchema},
  output: {schema: TranscribeAnswerOutputSchema},
  prompt: `Transcribe the following audio recording to text:\n\n{{media url=audioDataUri}}`,
});

const transcribeAnswerFlow = ai.defineFlow(
  {
    name: 'transcribeAnswerFlow',
    inputSchema: TranscribeAnswerInputSchema,
    outputSchema: TranscribeAnswerOutputSchema,
  },
  async input => {
    const {output} = await transcribeAnswerPrompt(input);
    return output!;
  }
);
