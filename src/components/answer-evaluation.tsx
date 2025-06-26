
import type { SuggestedResourceSchema } from "@/ai/flows/evaluate-answer";
import type { AnalyzeVideoPerformanceOutput } from "@/ai/flows/analyze-video-performance";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, MessageSquareText, CheckCircle2, Star, HelpCircle, BookOpen, ExternalLink, Target, Smile, AlertCircle, Eye } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

interface AnswerEvaluationProps {
  questionText?: string | null;
  transcribedText: string | null;
  evaluation: string | null;
  score: number | null;
  followUpQuestion: string | null;
  expectedAnswerElements?: string | null;
  suggestedResources?: SuggestedResourceSchema[] | null;
  videoAnalysis?: AnalyzeVideoPerformanceOutput | null;
}

export function AnswerEvaluation({ 
  questionText, 
  transcribedText, 
  evaluation, 
  score, 
  followUpQuestion,
  expectedAnswerElements,
  suggestedResources,
  videoAnalysis
}: AnswerEvaluationProps) {

  if (!transcribedText && !evaluation && !followUpQuestion && score === null && !expectedAnswerElements && !suggestedResources && !videoAnalysis) {
    return null; 
  }

  const getScoreColor = (currentScore: number | null) => {
    if (currentScore === null) return "bg-gray-500";
    if (currentScore >= 8) return "bg-green-500";
    if (currentScore >= 5) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-primary" />
              Answer Feedback
            </CardTitle>
            <CardDescription>Here's the analysis of your response.</CardDescription>
          </div>
          {score !== null && (
             <Badge variant="secondary" className={`px-3 py-1 text-lg font-semibold text-white ${getScoreColor(score)}`}>
                Content Score: {score}/10
             </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {videoAnalysis && (
            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <Smile className="h-5 w-5 text-indigo-500" />
                Visual Performance Analysis
              </h3>
              <div className="space-y-4 rounded-md border bg-muted/30 p-4">
                  <div className="flex justify-between items-center">
                      <p className="font-medium">Confidence Score</p>
                      <Badge variant="secondary" className={`text-base ${getScoreColor(videoAnalysis.confidenceScore)}`}>
                          {videoAnalysis.confidenceScore}/10
                      </Badge>
                  </div>
                   <Separator />
                   <div>
                       <p className="font-medium mb-1">Nervousness</p>
                       <p className="text-sm text-muted-foreground">{videoAnalysis.nervousnessAnalysis}</p>
                   </div>
                   <div>
                       <p className="font-medium mb-1 flex items-center gap-2"><Eye className="h-4 w-4"/>Gaze & Focus</p>
                       <p className="text-sm text-muted-foreground">{videoAnalysis.gazeAnalysis}</p>
                   </div>
                   {videoAnalysis.cheatingSuspicion && (
                       <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Potential Cheating Flagged</AlertTitle>
                            <AlertDescription>
                                The system detected consistent gaze away from the screen, which could indicate reading from notes. Be sure to maintain eye contact with the camera.
                            </AlertDescription>
                       </Alert>
                   )}
              </div>
            </div>
        )}

        {questionText && (
           <div>
            {videoAnalysis && <Separator className="my-4" /> }
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-muted-foreground" />
              Question Asked
            </h3>
            <p className="text-muted-foreground leading-relaxed bg-muted/30 p-3 rounded-md">
              {questionText}
            </p>
          </div>
        )}
        {transcribedText && (
          <div>
            {(questionText || videoAnalysis) && <Separator className="my-4" /> }
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <MessageSquareText className="h-5 w-5 text-primary" />
              Your Answer (Transcribed)
            </h3>
            <blockquote className="pl-4 border-l-4 border-primary/50 italic text-foreground bg-primary/10 p-3 rounded-md">
              {transcribedText}
            </blockquote>
          </div>
        )}

        {evaluation && (
          <div>
            <Separator className="my-4" />
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              AI Evaluation (Content)
            </h3>
            <p className="text-foreground leading-relaxed whitespace-pre-wrap bg-green-50 border border-green-200 p-3 rounded-md">
              {evaluation}
            </p>
          </div>
        )}

        {expectedAnswerElements && (
          <div>
            <Separator className="my-4" />
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-500" />
              Expected Key Points
            </h3>
            <div className="text-foreground leading-relaxed bg-blue-50 border border-blue-200 p-3 rounded-md prose prose-sm max-w-none">
              <ReactMarkdown>{expectedAnswerElements}</ReactMarkdown>
            </div>
          </div>
        )}
        
        {suggestedResources && suggestedResources.length > 0 && (
          <div>
            <Separator className="my-4" />
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-purple-500" />
              Suggested Learning Resources
            </h3>
            <ul className="space-y-2">
              {suggestedResources.map((resource, index) => (
                <li key={index} className="text-sm bg-purple-50 border border-purple-200 p-3 rounded-md">
                  <a 
                    href={resource.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="font-medium text-purple-700 hover:text-purple-900 hover:underline flex items-center gap-1"
                  >
                    {resource.title}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {followUpQuestion && (
          <div>
            <Separator className="my-4" />
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-accent" />
              Suggested Follow-up Question
            </h3>
            <p className="text-foreground leading-relaxed whitespace-pre-wrap bg-orange-50 border border-orange-200 p-3 rounded-md">
              {followUpQuestion}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
