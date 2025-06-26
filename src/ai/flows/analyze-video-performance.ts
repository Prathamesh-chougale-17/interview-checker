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
      "A JSON string representing an array of facial detection data collected over time. Each element is an object with 'blendshapes' (an array from MediaPipe's FaceLandmarker), or null if no face was detected."
    ),
});
export type AnalyzeVideoPerformanceInput = z.infer<typeof AnalyzeVideoPerformanceInputSchema>;

const AnalyzeVideoPerformanceOutputSchema = z.object({
  nervousnessAnalysis: z.string().describe("A textual analysis of the user's nervousness, based on their facial blendshapes over time (e.g., fluctuations, prevalence of surprise or fear-related blendshapes)."),
  confidenceScore: z.number().min(0).max(10).describe("A numerical score from 0 to 10 for the user's confidence. Base this on sustained neutral or smile-related blendshapes."),
  gazeAnalysis: z.string().describe("An analysis of the user's focus. Since we don't have head pose, infer this from the consistency of face detection. Mention that gaze wasn't tracked directly."),
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
  prompt: `You are an expert interview coach who specializes in analyzing non-verbal communication. Analyze the provided time-series data of a candidate's facial blendshapes recorded during an interview answer.

  The input is a JSON string representing an array of snapshots. Each snapshot is either null (no face detected) or an object containing a 'blendshapes' array from MediaPipe FaceLandmarker. Each item in the blendshapes array has a 'categoryName' and a 'score' (0-1).

  Facial Blendshape Data Log:
  {{{facialDataJson}}}

  Based on this data, provide the following analysis:
  1.  **Nervousness Analysis**: Evaluate the stability of blendshapes. Frequent, high-magnitude fluctuations might indicate nervousness. High scores for blendshapes like 'jawOpen', 'mouthPout', 'browDownLeft', 'browDownRight', or 'eyeWidener' could suggest nervousness or surprise. A consistent, stable set of neutral or positive blendshapes suggests calmness. Provide a brief textual summary.
  2.  **Confidence Score**: On a scale of 0 to 10, how confident does the candidate appear? High confidence can be inferred from sustained high scores for smile-related blendshapes ('mouthSmileLeft', 'mouthSmileRight', 'cheekSquintLeft'). Low confidence might be indicated by high scores in frowning or worried blendshapes ('mouthFrownLeft', 'mouthFrownRight', 'browInnerUp').
  3.  **Gaze Analysis**: The data does not include head pose or eye tracking. State that direct gaze analysis is not possible. You can make a general comment on focus based on whether a face was detected consistently. For example, if many entries are null, it might suggest the user was not consistently in front of the camera.
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
    const {output} = await prompt(input);
    return output!;
  }
);
