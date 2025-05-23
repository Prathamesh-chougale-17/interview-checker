import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Lightbulb, MessageSquareText, CheckCircle2 } from "lucide-react";

interface AnswerEvaluationProps {
  transcribedText: string | null;
  evaluation: string | null;
  followUpQuestion: string | null;
}

export function AnswerEvaluation({ transcribedText, evaluation, followUpQuestion }: AnswerEvaluationProps) {
  if (!transcribedText && !evaluation && !followUpQuestion) {
    return null; 
  }

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="h-6 w-6 text-green-500" />
          Interview Feedback
        </CardTitle>
        <CardDescription>Here's the analysis of your answer.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {transcribedText && (
          <div>
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <MessageSquareText className="h-5 w-5 text-primary" />
              Your Answer (Transcribed)
            </h3>
            <blockquote className="pl-4 border-l-4 border-muted-foreground/50 italic text-muted-foreground bg-muted/30 p-3 rounded-md">
              {transcribedText}
            </blockquote>
          </div>
        )}

        {evaluation && (
          <div>
            <Separator className="my-4" />
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              AI Evaluation
            </h3>
            <p className="text-foreground leading-relaxed whitespace-pre-wrap bg-green-50 border border-green-200 p-3 rounded-md">
              {evaluation}
            </p>
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
