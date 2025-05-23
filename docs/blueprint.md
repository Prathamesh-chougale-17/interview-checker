# **App Name**: Resume Interview Ace

## Core Features:

- Resume Upload: Enable users to upload their resume in PDF or DOCX format.
- Resume Parsing: Use Gemini to parse uploaded resumes and extract key information such as work experience, skills, and projects. The prompt will instruct Gemini to return data as JSON. Consider using Gemini as a tool in cases where reasoning is needed to select specific data points to extract.
- Question Generation: Leverage Gemini to generate personalized interview questions based on the extracted resume data. Use the extracted information and instruct Gemini to function as a tool that produces the interview questions.
- Text-to-Speech: Utilize the Web Speech API to convert generated interview questions into spoken audio.
- Voice Recording: Allow users to record their spoken answers using the device's microphone via the MediaRecorder API.
- Speech-to-Text: Transcribe user's recorded voice into text using Google Speech-to-Text.
- Answer Evaluation: Evaluate transcribed answers using Gemini. Give Gemini access to a 'follow up question suggestion' tool that will allow it to suggest a follow up question in addition to a raw evaluation. Then report all results to the user.

## Style Guidelines:

- Primary color: Blue (#3498db) to convey professionalism and intelligence, which are highly relevant in a job-seeking context. The design should be beautiful and clean.
- Background color: White (#ffffff), providing a clean and non-distracting backdrop. The design should be beautiful and clean.
- Accent color: Orange (#e67e22), used for interactive elements and highlights, to give the app a modern feel while maintaining a sense of professionalism. The design should be beautiful and clean.
- Clean, sans-serif font for readability. The design should be beautiful and clean.
- Use clear, professional icons for navigation. The design should be beautiful and clean.
- Intuitive layout with a clear visual hierarchy. The design should be beautiful and clean.
- Subtle transitions and animations for a polished user experience. The design should be beautiful and clean.