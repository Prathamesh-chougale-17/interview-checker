
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, MessageSquareText, CheckCircle2, Star, HelpCircle } from "lucide-react";

interface AnswerEvaluationProps {
  questionText?: string | null;
  transcribedText: string | null;
  evaluation: string | null;
  score: number | null;
  followUpQuestion: string | null;
}

export function AnswerEvaluation({ questionText, transcribedText, evaluation, score, followUpQuestion }: AnswerEvaluationProps) {
  if (!transcribedText && !evaluation && !followUpQuestion && score === null) {
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
                Score: {score}/10
             </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {questionText && (
           <div>
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
            {questionText && <Separator className="my-4" /> }
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
