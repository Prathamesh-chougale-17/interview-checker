import { config } from 'dotenv';
config();

import '@/ai/flows/generate-interview-questions.ts';
import '@/ai/flows/transcribe-answer.ts';
import '@/ai/flows/parse-resume.ts';
import '@/ai/flows/evaluate-answer.ts';