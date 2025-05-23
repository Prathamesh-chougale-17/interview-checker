import type { EvaluateAnswerOutput } from "@/ai/flows/evaluate-answer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckCircle, MessageCircle, HelpCircle, Mic } from "lucide-react";

interface InterviewData {
  question: string;
  transcribedAnswer: string | null;
  evaluation: EvaluateAnswerOutput | null;
  audioUri?: string | null; // Optional: if you want to allow playback
}

interface InterviewSummaryProps {
  interviewData: InterviewData[];
}

export function InterviewSummary({ interviewData }: InterviewSummaryProps) {
  return (
    <Card className="w-full shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-7 w-7 text-primary" />
          Interview Summary
        </CardTitle>
        <CardDescription>Review your performance for each question.</CardDescription>
      </CardHeader>
      <CardContent>
        {interviewData.length === 0 ? (
          <p className="text-muted-foreground">No interview data to display.</p>
        ) : (
          <Accordion type="single" collapsible className="w-full">
            {interviewData.map((item, index) => (
              <AccordionItem value={`item-${index}`} key={index}>
                <AccordionTrigger className="text-lg hover:no-underline">
                  <div className="flex items-center gap-3">
                    <HelpCircle className="h-5 w-5 text-primary shrink-0" />
                    <span className="text-left">Question {index + 1}: {item.question}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2 pb-4 px-2">
                  {item.transcribedAnswer && (
                    <div>
                      <h4 className="font-semibold mb-1 flex items-center gap-2">
                        <Mic className="h-4 w-4 text-muted-foreground" /> Your Answer:
                      </h4>
                      <blockquote className="pl-3 border-l-2 border-muted-foreground/30 italic text-muted-foreground bg-muted/20 p-2 rounded-sm">
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
                        <h4 className="font-semibold mb-1 flex items-center gap-2">
                          <MessageCircle className="h-4 w-4 text-muted-foreground" /> Evaluation:
                        </h4>
                        <p className="text-sm whitespace-pre-wrap bg-green-50 border border-green-100 p-2 rounded-sm">{item.evaluation.evaluation}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1 flex items-center gap-2">
                           <MessageCircle className="h-4 w-4 text-muted-foreground" /> Suggested Follow-up:
                        </h4>
                        <p className="text-sm whitespace-pre-wrap bg-orange-50 border border-orange-100 p-2 rounded-sm">{item.evaluation.followUpQuestion}</p>
                      </div>
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
