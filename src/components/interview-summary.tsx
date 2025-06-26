
import type { EvaluateAnswerOutput, SuggestedResourceSchema } from "@/ai/flows/evaluate-answer";
import type { AnalyzeVideoPerformanceOutput } from "@/ai/flows/analyze-video-performance";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, MessageCircle, HelpCircle, Mic, Star, Percent, TrendingUp, ExternalLink, Target, BookOpen, Lightbulb, Smile, Eye, AlertCircle } from "lucide-react";
import ReactMarkdown from 'react-markdown';

interface InterviewData {
  question: string;
  guidanceLink?: string;
  transcribedAnswer: string | null;
  evaluation: EvaluateAnswerOutput | null;
  videoUri?: string | null;
  videoAnalysis: AnalyzeVideoPerformanceOutput | null;
}

interface InterviewSummaryProps {
  interviewData: InterviewData[];
}

export function InterviewSummary({ interviewData }: InterviewSummaryProps) {
  const totalQuestions = interviewData.length;
  const answeredQuestions = interviewData.filter(item => item.evaluation?.score !== undefined && item.evaluation.score !== null);
  const totalScore = answeredQuestions.reduce((sum, item) => sum + (item.evaluation?.score || 0), 0);
  const averageScore = totalQuestions > 0 && answeredQuestions.length > 0 ? (totalScore / answeredQuestions.length) : null;
  
  const totalConfidenceScore = interviewData.reduce((sum, item) => sum + (item.videoAnalysis?.confidenceScore || 0), 0);
  const answeredConfidenceQuestions = interviewData.filter(item => item.videoAnalysis?.confidenceScore !== undefined && item.videoAnalysis.confidenceScore !== null);
  const averageConfidenceScore = totalQuestions > 0 && answeredConfidenceQuestions.length > 0 ? (totalConfidenceScore / answeredConfidenceQuestions.length) : null;


  const getScoreColor = (score: number | null | undefined) => {
    if (score === null || score === undefined) return "bg-gray-400";
    if (score >= 8) return "bg-green-500";
    if (score >= 5) return "bg-yellow-500";
    return "bg-red-500";
  };
  
  return (
    <Card className="w-full shadow-xl">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-7 w-7 text-primary" />
              Interview Performance Summary
            </CardTitle>
            <CardDescription>Review your overall performance and details for each question.</CardDescription>
          </div>
          <div className="flex gap-4">
          {averageScore !== null && (
            <div className="text-center p-3 rounded-lg bg-primary/10">
              <p className="text-sm font-medium text-primary">Avg. Content Score</p>
              <p className={`text-3xl font-bold ${getScoreColor(averageScore).replace('bg-','text-')}`}>
                {averageScore.toFixed(1)}<span className="text-lg">/10</span>
              </p>
            </div>
          )}
          {averageConfidenceScore !== null && (
            <div className="text-center p-3 rounded-lg bg-indigo-500/10">
              <p className="text-sm font-medium text-indigo-500">Avg. Confidence</p>
              <p className={`text-3xl font-bold ${getScoreColor(averageConfidenceScore).replace('bg-','text-')}`}>
                {averageConfidenceScore.toFixed(1)}<span className="text-lg">/10</span>
              </p>
            </div>
          )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {interviewData.length === 0 ? (
          <p className="text-muted-foreground">No interview data to display.</p>
        ) : (
          <Accordion type="single" collapsible className="w-full" defaultValue={`item-0`}>
            {interviewData.map((item, index) => (
              <AccordionItem value={`item-${index}`} key={index}>
                <AccordionTrigger className="text-lg hover:no-underline">
                  <div className="flex items-center justify-between w-full gap-3">
                    <div className="flex items-center gap-3 text-left">
                        <HelpCircle className="h-5 w-5 text-primary shrink-0" />
                        <span>Question {index + 1}</span>
                    </div>
                    <div className="flex gap-2 flex-wrap justify-end">
                      {item.videoAnalysis?.confidenceScore !== null && item.videoAnalysis?.confidenceScore !== undefined && (
                        <Badge variant="outline" className={`text-sm font-semibold border-2 ${getScoreColor(item.videoAnalysis.confidenceScore).replace('bg-','border-')}`}>
                          Confidence: {item.videoAnalysis.confidenceScore}/10
                        </Badge>
                      )}
                      {item.evaluation?.score !== null && item.evaluation?.score !== undefined && (
                        <Badge variant="outline" className={`text-sm font-semibold border-2 ${getScoreColor(item.evaluation.score).replace('bg-','border-')}`}>
                          Content: {item.evaluation.score}/10
                        </Badge>
                      )}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2 pb-4 px-2">
                  <p className="font-semibold text-base">{item.question}</p>
                  
                  {item.videoUri && (
                     <div className="mt-2">
                        <h4 className="font-semibold mb-1 text-xs text-muted-foreground">Recorded Video:</h4>
                        <video controls src={item.videoUri} className="w-full max-w-sm rounded-md" />
                    </div>
                  )}

                  {item.videoAnalysis && (
                    <div>
                      <h4 className="font-semibold mb-1 flex items-center gap-2 text-muted-foreground text-sm">
                        <Smile className="h-4 w-4 text-indigo-500" /> Visual Analysis:
                      </h4>
                      <div className="text-sm space-y-2 bg-indigo-50 border border-indigo-100 p-2 rounded-sm">
                        <p><strong>Nervousness:</strong> {item.videoAnalysis.nervousnessAnalysis}</p>
                        <p><strong>Gaze & Focus:</strong> {item.videoAnalysis.gazeAnalysis}</p>
                        {item.videoAnalysis.cheatingSuspicion && (
                            <p className="font-semibold text-destructive-foreground bg-destructive p-2 rounded-md flex items-center gap-2"><AlertCircle className="h-4 w-4"/> Cheating Flagged</p>
                        )}
                      </div>
                    </div>
                  )}

                  {item.transcribedAnswer && (
                    <div>
                      <h4 className="font-semibold mb-1 flex items-center gap-2 text-muted-foreground text-sm">
                        <Mic className="h-4 w-4" /> Your Answer:
                      </h4>
                      <blockquote className="pl-3 border-l-2 border-primary/30 italic text-foreground bg-primary/5 p-2 rounded-sm text-sm">
                        {item.transcribedAnswer}
                      </blockquote>
                    </div>
                  )}
                  
                  {item.evaluation && (
                    <>
                      <div>
                        <h4 className="font-semibold mb-1 flex items-center gap-2 text-muted-foreground text-sm">
                          <Star className="h-4 w-4 text-yellow-500" /> Content Evaluation:
                        </h4>
                        <p className="text-sm whitespace-pre-wrap bg-green-50 border border-green-100 p-2 rounded-sm">{item.evaluation.evaluation}</p>
                      </div>
                      
                      {item.evaluation.expectedAnswerElements && (
                        <div className="mt-2">
                          <h4 className="font-semibold mb-1 flex items-center gap-2 text-muted-foreground text-sm">
                            <Target className="h-4 w-4 text-blue-500" /> Expected Key Points:
                          </h4>
                          <div className="text-sm bg-blue-50 border border-blue-100 p-2 rounded-sm prose prose-sm max-w-none">
                            <ReactMarkdown>{item.evaluation.expectedAnswerElements}</ReactMarkdown>
                          </div>
                        </div>
                      )}
                      {item.evaluation.suggestedResources && item.evaluation.suggestedResources.length > 0 && (
                        <div className="mt-2">
                          <h4 className="font-semibold mb-1 flex items-center gap-2 text-muted-foreground text-sm">
                            <BookOpen className="h-4 w-4 text-purple-500" /> Suggested Resources:
                          </h4>
                          <ul className="space-y-1 pl-2">
                            {item.evaluation.suggestedResources.map((resource, rIndex) => (
                              <li key={rIndex} className="text-sm">
                                <a 
                                  href={resource.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="text-purple-600 hover:text-purple-800 hover:underline flex items-center gap-1"
                                >
                                  {resource.title}
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {item.evaluation.followUpQuestion && (
                        <div className="mt-2">
                          <h4 className="font-semibold mb-1 flex items-center gap-2 text-muted-foreground text-sm">
                            <Lightbulb className="h-4 w-4 text-accent" /> Suggested Follow-up:
                          </h4>
                          <p className="text-sm whitespace-pre-wrap bg-orange-50 border border-orange-100 p-2 rounded-sm">{item.evaluation.followUpQuestion}</p>
                        </div>
                      )}
                    </>
                  )}
                  {!item.transcribedAnswer && !item.evaluation && (
                    <p className="text-sm text-muted-foreground">No answer recorded or evaluated for this question.</p>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}
