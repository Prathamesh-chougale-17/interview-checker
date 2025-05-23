"use client";

import { useState, useEffect, useCallback } from 'react';
import type { ParseResumeOutput } from '@/ai/flows/parse-resume';
import { parseResume } from '@/ai/flows/parse-resume';
import type { GenerateInterviewQuestionsOutput } from '@/ai/flows/generate-interview-questions';
import { generateInterviewQuestions } from '@/ai/flows/generate-interview-questions';
import type { TranscribeAnswerOutput } from '@/ai/flows/transcribe-answer';
import { transcribeAnswer } from '@/ai/flows/transcribe-answer';
import type { EvaluateAnswerOutput } from '@/ai/flows/evaluate-answer';
import { evaluateAnswer } from '@/ai/flows/evaluate-answer';

import { AppHeader } from '@/components/app-header';
import { ResumeUploader } from '@/components/resume-uploader';
import { VoiceRecorder } from '@/components/voice-recorder';
import { AnswerEvaluation } from '@/components/answer-evaluation';
import { LoadingIndicator } from '@/components/loading-indicator';
import { InterviewSummary } from '@/components/interview-summary';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { FileText, Brain, Mic, Volume2, ChevronRight, RotateCcw, CheckCircle, ListChecks, Info, AlertTriangle } from 'lucide-react';

type InterviewStage =
  | 'INITIAL'
  | 'RESUME_PARSING'
  | 'RESUME_PARSED'
  | 'GENERATING_QUESTIONS'
  | 'QUESTIONS_READY'
  | 'INTERVIEWING'
  | 'PROCESSING_ANSWER'
  | 'QUESTION_EVALUATED'
  | 'INTERVIEW_COMPLETE'
  | 'ERROR_STATE';

interface InterviewLog {
  question: string;
  audioUri: string | null;
  transcribedAnswer: string | null;
  evaluation: EvaluateAnswerOutput | null;
}

export default function InterviewPage() {
  const [stage, setStage] = useState<InterviewStage>('INITIAL');
  const [parsedResumeData, setParsedResumeData] = useState<ParseResumeOutput | null>(null);
  const [parsedResumeString, setParsedResumeString] = useState<string>('');
  const [generatedQuestions, setGeneratedQuestions] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  
  const [currentRecordedAudioUri, setCurrentRecordedAudioUri] = useState<string | null>(null);
  const [currentTranscribedAnswer, setCurrentTranscribedAnswer] = useState<string | null>(null);
  const [currentEvaluation, setCurrentEvaluation] = useState<EvaluateAnswerOutput | null>(null);
  
  const [interviewLog, setInterviewLog] = useState<InterviewLog[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const { toast } = useToast();
  const [speechSynthesisSupported, setSpeechSynthesisSupported] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined' && !window.speechSynthesis) {
      setSpeechSynthesisSupported(false);
    }
  }, []);

  const handleError = useCallback((message: string, error?: any) => {
    console.error(message, error);
    setErrorMessage(message);
    setStage('ERROR_STATE');
    setIsLoading(false);
    toast({ title: "An Error Occurred", description: message, variant: "destructive" });
  }, [toast]);

  const handleResumeUpload = useCallback(async (file: File) => {
    setIsLoading(true);
    setLoadingMessage('Parsing your resume...');
    setStage('RESUME_PARSING');
    setErrorMessage(null);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const resumeDataUri = reader.result as string;
        const parsedData = await parseResume({ resumeDataUri });
        setParsedResumeData(parsedData);
        // Create a string summary for AI context. Adjust as needed for brevity/completeness.
        const summaryString = `Work Experience: ${parsedData.workExperience.join(', ') || 'N/A'}. Skills: ${parsedData.skills.join(', ') || 'N/A'}. Projects: ${parsedData.projects.join(', ') || 'N/A'}.`;
        setParsedResumeString(summaryString);
        setStage('RESUME_PARSED');
        setIsLoading(false);
        toast({ title: "Resume Parsed", description: "Your resume has been successfully parsed." });
      };
      reader.onerror = () => handleError('Failed to read resume file.');
      reader.readAsDataURL(file);
    } catch (error) {
      handleError('Failed to parse resume.', error);
    }
  }, [handleError, toast]);

  const handleGenerateQuestions = useCallback(async () => {
    if (!parsedResumeString) {
      handleError('Cannot generate questions without parsed resume data.');
      return;
    }
    setIsLoading(true);
    setLoadingMessage('Generating interview questions...');
    setStage('GENERATING_QUESTIONS');
    setErrorMessage(null);

    try {
      const result: GenerateInterviewQuestionsOutput = await generateInterviewQuestions({ resumeData: parsedResumeString });
      setGeneratedQuestions(result.questions);
      setStage('QUESTIONS_READY');
      setIsLoading(false);
      toast({ title: "Questions Generated", description: "Your personalized interview questions are ready!" });
    } catch (error) {
      handleError('Failed to generate interview questions.', error);
    }
  }, [parsedResumeString, handleError, toast]);

  const handleStartInterview = () => {
    setCurrentQuestionIndex(0);
    setInterviewLog([]);
    setCurrentRecordedAudioUri(null);
    setCurrentTranscribedAnswer(null);
    setCurrentEvaluation(null);
    setStage('INTERVIEWING');
  };
  
  const handleAudioSubmission = useCallback(async (audioDataUri: string) => {
    setCurrentRecordedAudioUri(audioDataUri);
    setIsLoading(true);
    setLoadingMessage('Processing your answer (transcribing & evaluating)...');
    setStage('PROCESSING_ANSWER');
    setErrorMessage(null);

    try {
      // Transcribe
      setLoadingMessage('Transcribing your answer...');
      const transcriptionResult: TranscribeAnswerOutput = await transcribeAnswer({ audioDataUri });
      setCurrentTranscribedAnswer(transcriptionResult.transcription);
      
      // Evaluate
      setLoadingMessage('Evaluating your answer...');
      if (!parsedResumeString || !generatedQuestions[currentQuestionIndex]) {
        throw new Error("Missing data for evaluation.");
      }
      const evaluationResult: EvaluateAnswerOutput = await evaluateAnswer({
        question: generatedQuestions[currentQuestionIndex],
        answer: transcriptionResult.transcription,
        resumeData: parsedResumeString,
      });
      setCurrentEvaluation(evaluationResult);

      setInterviewLog(prevLog => [
        ...prevLog,
        {
          question: generatedQuestions[currentQuestionIndex],
          audioUri: audioDataUri,
          transcribedAnswer: transcriptionResult.transcription,
          evaluation: evaluationResult,
        }
      ]);

      setStage('QUESTION_EVALUATED');
      setIsLoading(false);
      toast({ title: "Answer Processed", description: "Your answer has been transcribed and evaluated." });

    } catch (error) {
      handleError('Failed to process your answer.', error);
      // Keep audio URI so user doesn't lose it, allow retry or manual entry? For now, error state.
      setInterviewLog(prevLog => [ // Log with partial data on error
        ...prevLog,
        {
          question: generatedQuestions[currentQuestionIndex],
          audioUri: audioDataUri,
          transcribedAnswer: currentTranscribedAnswer, // Might be null if transcription failed
          evaluation: null, // Evaluation definitely failed or didn't run
        }
      ]);
    }
  }, [generatedQuestions, currentQuestionIndex, parsedResumeString, handleError, toast, currentTranscribedAnswer]);

  const handleNextQuestion = () => {
    if (currentQuestionIndex < generatedQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setCurrentRecordedAudioUri(null);
      setCurrentTranscribedAnswer(null);
      setCurrentEvaluation(null);
      setStage('INTERVIEWING');
    } else {
      setStage('INTERVIEW_COMPLETE');
    }
  };

  const handleSpeakQuestion = () => {
    if (!speechSynthesisSupported || !generatedQuestions[currentQuestionIndex]) return;
    try {
      const utterance = new SpeechSynthesisUtterance(generatedQuestions[currentQuestionIndex]);
      speechSynthesis.speak(utterance);
    } catch (error) {
      console.error("Error with speech synthesis:", error);
      toast({ title: "Speech Error", description: "Could not read the question aloud.", variant: "destructive" });
    }
  };

  const handleRestart = () => {
    setStage('INITIAL');
    setParsedResumeData(null);
    setParsedResumeString('');
    setGeneratedQuestions([]);
    setCurrentQuestionIndex(0);
    setCurrentRecordedAudioUri(null);
    setCurrentTranscribedAnswer(null);
    setCurrentEvaluation(null);
    setInterviewLog([]);
    setIsLoading(false);
    setLoadingMessage('');
    setErrorMessage(null);
  };

  const renderContent = () => {
    if (isLoading) {
      return <LoadingIndicator message={loadingMessage} />;
    }
    if (stage === 'ERROR_STATE' && errorMessage) {
      return (
        <Card className="w-full max-w-lg mx-auto text-center">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>An Error Occurred</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
            <Button onClick={handleRestart} variant="outline" className="mt-6">
              <RotateCcw className="mr-2 h-4 w-4" /> Try Again
            </Button>
          </CardContent>
        </Card>
      );
    }

    switch (stage) {
      case 'INITIAL':
        return <ResumeUploader onFileUpload={handleResumeUpload} isLoading={isLoading} />;
      
      case 'RESUME_PARSED':
        return (
          <Card className="w-full max-w-lg mx-auto text-center shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center justify-center gap-2"><FileText className="h-6 w-6 text-primary" />Resume Parsed Successfully!</CardTitle>
              <CardDescription>We've extracted key information from your resume.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {parsedResumeData && (
                <div className="text-left text-sm space-y-2 bg-muted/50 p-4 rounded-md border">
                  <p><strong>Skills:</strong> {parsedResumeData.skills.join(', ') || 'Not found'}</p>
                  <p><strong>Experience Snippet:</strong> {parsedResumeData.workExperience[0] || 'Not found'}...</p>
                </div>
              )}
              <Button onClick={handleGenerateQuestions} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                <Brain className="mr-2 h-5 w-5" /> Generate Interview Questions
              </Button>
            </CardContent>
          </Card>
        );

      case 'QUESTIONS_READY':
        return (
          <Card className="w-full max-w-lg mx-auto text-center shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center justify-center gap-2"><CheckCircle className="h-6 w-6 text-green-500" />Questions Generated!</CardTitle>
              <CardDescription>{generatedQuestions.length} personalized questions are ready for you.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleStartInterview} size="lg" className="w-full">
                <Mic className="mr-2 h-5 w-5" /> Start Interview
              </Button>
            </CardContent>
          </Card>
        );

      case 'INTERVIEWING':
        return (
          <Card className="w-full max-w-2xl mx-auto shadow-xl">
            <CardHeader>
              <CardTitle>Question {currentQuestionIndex + 1} of {generatedQuestions.length}</CardTitle>
              <CardDescription className="text-xl py-4 text-foreground leading-relaxed">
                {generatedQuestions[currentQuestionIndex]}
              </CardDescription>
              {speechSynthesisSupported && (
                <Button onClick={handleSpeakQuestion} variant="outline" size="sm" className="mt-2 self-start">
                  <Volume2 className="mr-2 h-4 w-4" /> Read Question Aloud
                </Button>
              )}
               {!speechSynthesisSupported && (
                <Alert variant="default" className="mt-2 text-sm">
                  <Info className="h-4 w-4"/>
                  <AlertDescription>
                  Text-to-speech is not available in your browser. Please read the question manually.
                  </AlertDescription>
                </Alert>
              )}
            </CardHeader>
            <CardContent>
              <VoiceRecorder onRecordingComplete={handleAudioSubmission} isProcessing={isLoading} />
            </CardContent>
          </Card>
        );

      case 'QUESTION_EVALUATED':
        return (
          <div className="w-full max-w-2xl mx-auto space-y-6">
            <AnswerEvaluation 
              transcribedText={currentTranscribedAnswer}
              evaluation={currentEvaluation?.evaluation ?? null}
              followUpQuestion={currentEvaluation?.followUpQuestion ?? null}
            />
            <Button onClick={handleNextQuestion} size="lg" className="w-full">
              {currentQuestionIndex < generatedQuestions.length - 1 ? 'Next Question' : 'Finish Interview'}
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        );
      
      case 'INTERVIEW_COMPLETE':
        return (
          <div className="w-full max-w-3xl mx-auto space-y-6">
            <InterviewSummary interviewData={interviewLog} />
            <Button onClick={handleRestart} variant="outline" size="lg" className="w-full">
              <RotateCcw className="mr-2 h-5 w-5" /> Start New Interview
            </Button>
          </div>
        );
        
      default: // Includes RESUME_PARSING, GENERATING_QUESTIONS, PROCESSING_ANSWER
        return <LoadingIndicator message={loadingMessage || "Loading..."} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex-grow container mx-auto px-4 py-8 md:py-12 flex items-center justify-center">
        {renderContent()}
      </main>
      <footer className="text-center py-4 border-t text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Resume Interview Ace. Level up your interview skills.</p>
      </footer>
    </div>
  );
}
