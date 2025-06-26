'use server';
/**
 * @fileOverview Analyzes user's video performance for visual cues.
 *
 * - analyzeVideoPerformance - A function that handles the video performance analysis.
 * - AnalyzeVideoPerformanceInput - The input type for the analyzeVideoPerformance function.
 * - AnalyzeVideoPerformanceOutput - The return type for the analyzeVideoPerformance function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeVideoPerformanceInputSchema = z.object({
  videoDataUri: z
    .string()
    .describe(
      "A video recording of the user answering an interview question, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AnalyzeVideoPerformanceInput = z.infer<typeof AnalyzeVideoPerformanceInputSchema>;

const AnalyzeVideoPerformanceOutputSchema = z.object({
  nervousnessAnalysis: z.string().describe("A textual analysis of the user's nervousness, based on their facial expressions and body language (e.g., fidgeting, eye contact)."),
  confidenceScore: z.number().min(0).max(10).describe("A numerical score from 0 to 10 for the user's confidence. 0 is not confident, 10 is very confident."),
  gazeAnalysis: z.string().describe("An analysis of the user's eye gaze. Note if they are consistently looking away from the screen, which might suggest distraction or reading notes."),
  cheatingSuspicion: z.boolean().describe("A flag indicating whether there is a strong suspicion of cheating based on prolonged and repeated gaze away from the screen or other cues."),
});
export type AnalyzeVideoPerformanceOutput = z.infer<typeof AnalyzeVideoPerformanceOutputSchema>;

export async function analyzeVideoPerformance(input: AnalyzeVideoPerformanceInput): Promise<AnalyzeVideoPerformanceOutput> {
  return analyzeVideoPerformanceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeVideoPerformancePrompt',
  input: {schema: AnalyzeVideoPerformanceInputSchema},
  output: {schema: AnalyzeVideoPerformanceOutputSchema},
  prompt: `You are an expert interview coach who specializes in analyzing non-verbal communication. Analyze the provided video of a candidate answering an interview question.

  Video: {{media url=videoDataUri}}

  Based on the video, provide the following analysis:
  1.  **Nervousness Analysis**: Evaluate the candidate's facial expressions, posture, and body language for common signs of nervousness like fidgeting, lack of eye contact, or tense posture. Provide a brief textual summary.
  2.  **Confidence Score**: On a scale of 0 to 10, how confident does the candidate appear? Consider their posture, eye contact, and clarity of expression.
  3.  **Gaze Analysis**: Pay close attention to the candidate's eye movements. Are they maintaining good eye contact with the camera (simulating an interviewer)? Note if their gaze frequently darts away, especially to one side, as if reading from another screen.
  4.  **Cheating Suspicion**: Based on the gaze analysis, set the 'cheatingSuspicion' flag to true if the candidate appears to be consistently reading their answer from an off-screen source. Otherwise, set it to false.

  Return your complete analysis in the specified JSON format.`,
});

const analyzeVideoPerformanceFlow = ai.defineFlow(
  {
    name: 'analyzeVideoPerformanceFlow',
    inputSchema: AnalyzeVideoPerformanceInputSchema,
    outputSchema: AnalyzeVideoPerformanceOutputSchema,
  },
  async input => {
    // Using a more powerful model capable of video analysis
    const {output} = await ai.generate({
        model: 'googleai/gemini-2.0-flash',
        prompt: prompt.render(input),
        output: {schema: AnalyzeVideoPerformanceOutputSchema},
    });
    return output!;
  }
);
