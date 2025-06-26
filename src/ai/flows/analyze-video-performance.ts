'use server';
/**
 * @fileOverview Analyzes user's facial expression data for performance cues.
 *
 * - analyzeVideoPerformance - A function that handles the video performance analysis.
 * - AnalyzeVideoPerformanceInput - The input type for the analyzeVideoPerformance function.
 * - AnalyzeVideoPerformanceOutput - The return type for the analyzeVideoPerformance function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeVideoPerformanceInputSchema = z.object({
  facialDataJson: z
    .string()
    .describe(
      "A JSON string representing an array of facial detection data collected over time. Each element in the array is an object with an 'expressions' key, or null if no face was detected."
    ),
});
export type AnalyzeVideoPerformanceInput = z.infer<typeof AnalyzeVideoPerformanceInputSchema>;

const AnalyzeVideoPerformanceOutputSchema = z.object({
  nervousnessAnalysis: z.string().describe("A textual analysis of the user's nervousness, based on their facial expressions over time (e.g., fluctuations, prevalence of surprise or fear)."),
  confidenceScore: z.number().min(0).max(10).describe("A numerical score from 0 to 10 for the user's confidence. Base this on sustained neutral or happy expressions."),
  gazeAnalysis: z.string().describe("An analysis of the user's focus. Since we don't have head pose, infer this from expression consistency. Mention that gaze wasn't tracked directly."),
  cheatingSuspicion: z.boolean().describe("A flag indicating potential cheating. Since we cannot track gaze from this data, this should generally be false unless expression data is completely absent for long periods, suggesting the user was not in front of the camera. "),
});
export type AnalyzeVideoPerformanceOutput = z.infer<typeof AnalyzeVideoPerformanceOutputSchema>;

export async function analyzeVideoPerformance(input: AnalyzeVideoPerformanceInput): Promise<AnalyzeVideoPerformanceOutput> {
  return analyzeVideoPerformanceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeVideoPerformancePrompt',
  input: {schema: AnalyzeVideoPerformanceInputSchema},
  output: {schema: AnalyzeVideoPerformanceOutputSchema},
  prompt: `You are an expert interview coach who specializes in analyzing non-verbal communication. Analyze the provided time-series data of a candidate's facial expressions recorded during an interview answer.

  The input is a JSON string representing an array of snapshots. Each snapshot contains expression probabilities (0 to 1) or is null if no face was detected.

  Facial Data Log:
  {{{facialDataJson}}}

  Based on this data, provide the following analysis:
  1.  **Nervousness Analysis**: Evaluate the stability of expressions. Frequent fluctuations between neutral, surprised, or fearful expressions might indicate nervousness. A consistent neutral or happy expression suggests calmness. Provide a brief textual summary.
  2.  **Confidence Score**: On a scale of 0 to 10, how confident does the candidate appear? High confidence can be inferred from a high average 'happy' or 'neutral' score. Low confidence might be indicated by high 'sad', 'fearful', or 'surprised' scores.
  3.  **Gaze Analysis**: The data does not include head pose or eye tracking. State that direct gaze analysis is not possible. You can make a general comment on focus based on whether expressions were detected consistently. For example, if many entries are null, it might suggest the user was not consistently in front of the camera.
  4.  **Cheating Suspicion**: Set the 'cheatingSuspicion' flag to 'false'. Since we cannot track eye movement away from the screen with the given data, we cannot reliably detect cheating. Only set it to true if there are large gaps in the data (many null entries) where no face was detected, which could imply the user left the camera's view.

  Return your complete analysis in the specified JSON format.`,
});

const analyzeVideoPerformanceFlow = ai.defineFlow(
  {
    name: 'analyzeVideoPerformanceFlow',
    inputSchema: AnalyzeVideoPerformanceInputSchema,
    outputSchema: AnalyzeVideoPerformanceOutputSchema,
  },
  async input => {
    // Using a standard model as video processing is no longer needed
    const {output} = await ai.generate({
        model: 'googleai/gemini-2.0-flash',
        prompt: prompt.render(input),
        output: {schema: AnalyzeVideoPerformanceOutputSchema},
    });
    return output!;
  }
);
