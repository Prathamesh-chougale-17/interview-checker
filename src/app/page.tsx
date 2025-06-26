
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { ParseResumeOutput } from '@/ai/flows/parse-resume';
import { parseResume } from '@/ai/flows/parse-resume';
import type { GenerateInterviewQuestionsOutput, QuestionObjectSchema } from '@/ai/flows/generate-interview-questions';
import { generateInterviewQuestions } from '@/ai/flows/generate-interview-questions';
import type { TranscribeAnswerOutput } from '@/ai/flows/transcribe-answer';
import { transcribeAnswer } from '@/ai/flows/transcribe-answer';
import type { EvaluateAnswerOutput } from '@/ai/flows/evaluate-answer';
import { evaluateAnswer } from '@/ai/flows/evaluate-answer';
// Import for facial data analysis
import type { AnalyzeVideoPerformanceOutput } from '@/ai/flows/analyze-video-performance';
import { analyzeVideoPerformance } from '@/ai/flows/analyze-video-performance';


import { AppHeader } from '@/components/app-header';
import { ResumeUploader } from '@/components/resume-uploader';
import { VideoRecorder } from '@/components/video-recorder';
import { AnswerEvaluation } from '@/components/answer-evaluation';
import { LoadingIndicator } from '@/components/loading-indicator';
import { InterviewSummary } from '@/components/interview-summary';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { FileText, Brain, Mic, Volume2, ChevronRight, RotateCcw, CheckCircle, ListChecks, Info, AlertTriangle, ExternalLink, HelpCircle, Wand2, Video } from 'lucide-react';

type InterviewStage =
  | 'INITIAL'
  | 'RESUME_PARSING'
  | 'RESUME_PARSED'
  | 'AWAITING_NUM_QUESTIONS'
  | 'GENERATING_QUESTIONS'
  | 'QUESTIONS_READY'
  | 'INTERVIEWING'
  | 'PROCESSING_ANSWER'
  | 'QUESTION_EVALUATED'
  | 'INTERVIEW_COMPLETE'
  | 'ERROR_STATE';

interface InterviewLog {
  question: string;
  guidanceLink?: string;
  videoUri: string | null;
  transcribedAnswer: string | null;
  evaluation: EvaluateAnswerOutput | null;
  videoAnalysis: AnalyzeVideoPerformanceOutput | null;
}

export default function InterviewPage() {
  const [stage, setStage] = useState<InterviewStage>('INITIAL');
  const [parsedResumeData, setParsedResumeData] = useState<ParseResumeOutput | null>(null);
  const [parsedResumeString, setParsedResumeString] = useState<string>('');
  const [numberOfQuestions, setNumberOfQuestions] = useState<number>(3);
  const [generatedQuestions, setGeneratedQuestions] = useState<QuestionObjectSchema[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  
  const [currentRecordedVideoUri, setCurrentRecordedVideoUri] = useState<string | null>(null);
  const [currentTranscribedAnswer, setCurrentTranscribedAnswer] = useState<string | null>(null);
  const [currentEvaluation, setCurrentEvaluation] = useState<EvaluateAnswerOutput | null>(null);
  const [currentVideoAnalysis, setCurrentVideoAnalysis] = useState<AnalyzeVideoPerformanceOutput | null>(null);
  
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
        const summaryString = `Work Experience: ${parsedData.workExperience.join(', ') || 'N/A'}. Skills: ${parsedData.skills.join(', ') || 'N/A'}. Projects: ${parsedData.projects.join(', ') || 'N/A'}.`;
        setParsedResumeString(summaryString);
        setStage('AWAITING_NUM_QUESTIONS');
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
    if (numberOfQuestions <= 0 || numberOfQuestions > 20) {
        handleError('Please enter a valid number of questions (1-20).');
        return;
    }
    setIsLoading(true);
    setLoadingMessage('Generating interview questions...');
    setStage('GENERATING_QUESTIONS');
    setErrorMessage(null);

    try {
      const result: GenerateInterviewQuestionsOutput = await generateInterviewQuestions({ 
        resumeData: parsedResumeString,
        numberOfQuestions: numberOfQuestions 
      });
      setGeneratedQuestions(result.questions);
      setStage('QUESTIONS_READY');
      setIsLoading(false);
      toast({ title: "Questions Generated", description: "Your personalized interview questions are ready!" });
    } catch (error) {
      handleError('Failed to generate interview questions.', error);
    }
  }, [parsedResumeString, handleError, toast, numberOfQuestions]);

  const handleStartInterview = () => {
    setCurrentQuestionIndex(0);
    setInterviewLog([]);
    setCurrentRecordedVideoUri(null);
    setCurrentTranscribedAnswer(null);
    setCurrentEvaluation(null);
    setCurrentVideoAnalysis(null);
    setStage('INTERVIEWING');
  };
  
  const handleVideoSubmission = useCallback(async (videoDataUri: string, facialData: any[]) => {
    setCurrentRecordedVideoUri(videoDataUri);
    setIsLoading(true);
    setLoadingMessage('Processing your answer (transcribing, evaluating & analyzing performance)...');
    setStage('PROCESSING_ANSWER');
    setErrorMessage(null);
    const currentQuestionObject = generatedQuestions[currentQuestionIndex];

    try {
      if (!parsedResumeString || !currentQuestionObject?.question) {
        throw new Error("Missing data for evaluation.");
      }
      
      setLoadingMessage('Analyzing your performance...');
      
      // Start transcription and facial data analysis in parallel
      const transcribePromise = transcribeAnswer({ audioDataUri: videoDataUri });
      
      const facialDataJson = JSON.stringify(facialData);
      const videoAnalysisPromise = analyzeVideoPerformance({ facialDataJson });

      // Wait for transcription to finish, as evaluation depends on it
      const transcriptionResult = await transcribePromise;
      const transcription = transcriptionResult.transcription;
      setCurrentTranscribedAnswer(transcription);

      // Now start the evaluation, which needs the transcription
      const evaluatePromise = evaluateAnswer({
        question: currentQuestionObject.question,
        answer: transcription,
        resumeData: parsedResumeString,
      });

      // Wait for the remaining promises to resolve
      const [videoAnalysisResult, finalEvaluationResult] = await Promise.all([
        videoAnalysisPromise,
        evaluatePromise
      ]);

      setCurrentVideoAnalysis(videoAnalysisResult);
      setCurrentEvaluation(finalEvaluationResult);

      setInterviewLog(prevLog => [
        ...prevLog,
        {
          question: currentQuestionObject.question,
          guidanceLink: currentQuestionObject.guidanceLink,
          videoUri: videoDataUri,
          transcribedAnswer: transcription,
          evaluation: finalEvaluationResult,
          videoAnalysis: videoAnalysisResult,
        }
      ]);

      setStage('QUESTION_EVALUATED');
      setIsLoading(false);
      toast({ title: "Answer Processed", description: "Your answer has been fully analyzed." });

    } catch (error) {
      handleError('Failed to process your answer.', error);
      setInterviewLog(prevLog => [
        ...prevLog,
        {
          question: currentQuestionObject?.question || "Unknown Question",
          guidanceLink: currentQuestionObject?.guidanceLink,
          videoUri: videoDataUri,
          transcribedAnswer: currentTranscribedAnswer, 
          evaluation: null,
          videoAnalysis: currentVideoAnalysis,
        }
      ]);
    }
  }, [generatedQuestions, currentQuestionIndex, parsedResumeString, handleError, toast, currentTranscribedAnswer, currentVideoAnalysis]);


  const handleNextQuestion = () => {
    if (currentQuestionIndex < generatedQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setCurrentRecordedVideoUri(null);
      setCurrentTranscribedAnswer(null);
      setCurrentEvaluation(null);
      setCurrentVideoAnalysis(null);
      setStage('INTERVIEWING');
    } else {
      setStage('INTERVIEW_COMPLETE');
    }
  };

  const handleSpeakQuestion = () => {
    const currentQuestionText = generatedQuestions[currentQuestionIndex]?.question;
    if (!speechSynthesisSupported || !currentQuestionText) return;
    try {
      const utterance = new SpeechSynthesisUtterance(currentQuestionText);
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
    setNumberOfQuestions(3);
    setCurrentRecordedVideoUri(null);
    setCurrentTranscribedAnswer(null);
    setCurrentEvaluation(null);
    setCurrentVideoAnalysis(null);
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
      
      case 'AWAITING_NUM_QUESTIONS':
         return (
          <Card className="w-full max-w-lg mx-auto text-center shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center justify-center gap-2"><FileText className="h-6 w-6 text-primary" />Resume Parsed!</CardTitle>
              <CardDescription>We've extracted key information. Now, how many questions would you like?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {parsedResumeData && (
                <div className="text-left text-sm space-y-2 bg-muted/50 p-4 rounded-md border">
                  <p><strong>Skills:</strong> {parsedResumeData.skills.join(', ') || 'Not found'}</p>
                  <p><strong>Experience Snippet:</strong> {parsedResumeData.workExperience[0]?.substring(0,100) || 'Not found'}...</p>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="num-questions" className="text-left block">Number of Questions (1-20):</Label>
                <Input
                  id="num-questions"
                  type="number"
                  value={numberOfQuestions}
                  onChange={(e) => setNumberOfQuestions(parseInt(e.target.value, 10))}
                  min="1"
                  max="20"
                  className="w-full"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleGenerateQuestions} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                <Wand2 className="mr-2 h-5 w-5" /> Generate Interview Questions
              </Button>
            </CardFooter>
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
                <Video className="mr-2 h-5 w-5" /> Start Video Interview
              </Button>
            </CardContent>
          </Card>
        );

      case 'INTERVIEWING':
        const currentQuestionObject = generatedQuestions[currentQuestionIndex];
        if (!currentQuestionObject) return <LoadingIndicator message="Loading question..." />;
        return (
          <Card className="w-full max-w-2xl mx-auto shadow-xl">
            <CardHeader>
              <CardTitle>Question {currentQuestionIndex + 1} of {generatedQuestions.length}</CardTitle>
              <CardDescription className="text-xl py-4 text-foreground leading-relaxed">
                {currentQuestionObject.question}
              </CardDescription>
              <div className="flex flex-col sm:flex-row gap-2 items-start">
                {speechSynthesisSupported && (
                  <Button onClick={handleSpeakQuestion} variant="outline" size="sm" className="self-start">
                    <Volume2 className="mr-2 h-4 w-4" /> Read Aloud
                  </Button>
                )}
                {currentQuestionObject.guidanceLink && (
                  <Button asChild variant="outline" size="sm" className="self-start">
                    <a href={currentQuestionObject.guidanceLink} target="_blank" rel="noopener noreferrer">
                      <HelpCircle className="mr-2 h-4 w-4" /> Get Guidance <ExternalLink className="ml-1 h-3 w-3"/>
                    </a>
                  </Button>
                )}
              </div>
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
              <VideoRecorder onRecordingComplete={handleVideoSubmission} isProcessing={isLoading} />
            </CardContent>
          </Card>
        );

      case 'QUESTION_EVALUATED':
        return (
          <div className="w-full max-w-2xl mx-auto space-y-6">
            <AnswerEvaluation 
              questionText={generatedQuestions[currentQuestionIndex]?.question}
              transcribedText={currentTranscribedAnswer}
              evaluation={currentEvaluation?.evaluation ?? null}
              score={currentEvaluation?.score ?? null}
              followUpQuestion={currentEvaluation?.followUpQuestion ?? null}
              expectedAnswerElements={currentEvaluation?.expectedAnswerElements ?? null}
              suggestedResources={currentEvaluation?.suggestedResources ?? null}
              videoAnalysis={currentVideoAnalysis}
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
