
import type { EvaluateAnswerOutput, SuggestedResourceSchema } from "@/ai/flows/evaluate-answer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, MessageCircle, HelpCircle, Mic, Star, Percent, TrendingUp, ExternalLink, Target, BookOpen, Lightbulb } from "lucide-react";

interface InterviewData {
  question: string;
  guidanceLink?: string;
  transcribedAnswer: string | null;
  evaluation: EvaluateAnswerOutput | null; // Contains score, expectedAnswerElements, suggestedResources
  audioUri?: string | null; 
}

interface InterviewSummaryProps {
  interviewData: InterviewData[];
}

export function InterviewSummary({ interviewData }: InterviewSummaryProps) {
  const totalQuestions = interviewData.length;
  const answeredQuestions = interviewData.filter(item => item.evaluation?.score !== undefined && item.evaluation.score !== null);
  const totalScore = answeredQuestions.reduce((sum, item) => sum + (item.evaluation?.score || 0), 0);
  const averageScore = totalQuestions > 0 && answeredQuestions.length > 0 ? (totalScore / answeredQuestions.length) : null;

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
          {averageScore !== null && (
            <div className="text-center p-3 rounded-lg bg-primary/10">
              <p className="text-sm font-medium text-primary">Overall Average Score</p>
              <p className={`text-3xl font-bold ${getScoreColor(averageScore).replace('bg-','text-')}`}>
                {averageScore.toFixed(1)}<span className="text-lg">/10</span>
              </p>
            </div>
          )}
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
                    {item.evaluation?.score !== null && item.evaluation?.score !== undefined && (
                       <Badge variant="outline" className={`text-sm font-semibold border-2 ${getScoreColor(item.evaluation.score).replace('bg-','border-')}`}>
                         {item.evaluation.score}/10
                       </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2 pb-4 px-2">
                  <p className="font-semibold text-base">{item.question}</p>
                  {item.guidanceLink && (
                    <a href={item.guidanceLink} target="_blank" rel="noopener noreferrer" className="text-sm text-accent hover:underline inline-flex items-center gap-1">
                      <ExternalLink className="h-3 w-3"/> View Guidance
                    </a>
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
                  {item.audioUri && (
                     <div className="mt-2">
                        <h4 className="font-semibold mb-1 text-xs text-muted-foreground">Recorded Audio:</h4>
                        <audio controls src={item.audioUri} className="w-full h-8" />
                    </div>
                  )}
                  {item.evaluation && (
                    <>
                      <div>
                        <h4 className="font-semibold mb-1 flex items-center gap-2 text-muted-foreground text-sm">
                          <Star className="h-4 w-4 text-yellow-500" /> AI Evaluation:
                        </h4>
                        <p className="text-sm whitespace-pre-wrap bg-green-50 border border-green-100 p-2 rounded-sm">{item.evaluation.evaluation}</p>
                      </div>
                       {item.evaluation.score !== null && item.evaluation.score !== undefined && (
                         <div className="mt-2">
                            <h4 className="font-semibold mb-1 flex items-center gap-2 text-muted-foreground text-sm">
                                <Percent className="h-4 w-4 text-blue-500"/> Score:
                            </h4>
                            <p className={`text-sm font-bold p-2 rounded-sm inline-block text-white ${getScoreColor(item.evaluation.score)}`}>
                                {item.evaluation.score}/10
                            </p>
                         </div>
                       )}
                      {item.evaluation.expectedAnswerElements && (
                        <div className="mt-2">
                          <h4 className="font-semibold mb-1 flex items-center gap-2 text-muted-foreground text-sm">
                            <Target className="h-4 w-4 text-blue-500" /> Expected Key Points:
                          </h4>
                          <p className="text-sm whitespace-pre-wrap bg-blue-50 border border-blue-100 p-2 rounded-sm">{item.evaluation.expectedAnswerElements}</p>
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
