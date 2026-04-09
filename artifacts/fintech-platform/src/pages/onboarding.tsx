import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useLocation } from "wouter";
import { 
  useStartOnboarding, 
  useGetOnboardingSession,
  getGetOnboardingSessionQueryKey,
  useSubmitOnboardingStep,
  StartOnboardingRequestType
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export default function Onboarding() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [sessionId, setSessionId] = useState<string | null>(localStorage.getItem("nova_onboarding_session"));
  const [answer, setAnswer] = useState("");

  const startMutation = useStartOnboarding();
  const submitMutation = useSubmitOnboardingStep();

  const { data: session, isLoading } = useGetOnboardingSession(sessionId as string, {
    query: {
      enabled: !!sessionId,
      queryKey: getGetOnboardingSessionQueryKey(sessionId as string)
    }
  });

  useEffect(() => {
    // If we don't have a session, start one automatically
    if (!sessionId && user) {
      startMutation.mutate(
        {
          data: {
            type: user.accountType as StartOnboardingRequestType,
            countryCode: user.countryCode
          }
        },
        {
          onSuccess: (data) => {
            setSessionId(data.sessionId);
            localStorage.setItem("nova_onboarding_session", data.sessionId);
          }
        }
      );
    }
  }, [sessionId, user]);

  useEffect(() => {
    if (session?.status === "completed") {
      toast({ title: "Onboarding complete", description: "Welcome to your dashboard!" });
      setLocation("/dashboard");
    }
  }, [session, setLocation, toast]);

  const handleSubmit = () => {
    if (!session?.nextStep) return;
    
    submitMutation.mutate(
      {
        sessionId: sessionId!,
        data: {
          stepId: session.nextStep.stepId,
          answer: { value: answer }
        }
      },
      {
        onSuccess: (data) => {
          setAnswer("");
          queryClient.setQueryData(getGetOnboardingSessionQueryKey(sessionId!), data);
        },
        onError: (error: any) => {
          toast({ title: "Error", description: error?.message || "Failed to submit", variant: "destructive" });
        }
      }
    );
  };

  if (!sessionId || isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-muted-foreground">Preparing your personalized setup...</p>
      </div>
    );
  }

  if (session?.status === "completed") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <CheckCircle2 className="w-16 h-16 text-green-500 mb-6" />
        <h1 className="text-3xl font-bold mb-2">You're all set!</h1>
        <p className="text-muted-foreground mb-8">Redirecting to your dashboard...</p>
      </div>
    );
  }

  const step = session?.nextStep;
  const progress = session ? Math.max(10, (session.completedSteps.length / (session.completedSteps.length + 1)) * 100) : 0;

  return (
    <div className="min-h-screen bg-background flex flex-col pt-12 sm:pt-24 px-4">
      <div className="max-w-xl mx-auto w-full">
        <div className="mb-8">
          <div className="h-1 w-full bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-500 ease-in-out" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {step ? (
          <Card className="border-border shadow-xl">
            <CardHeader className="pb-8">
              <CardDescription className="text-primary font-medium tracking-wide uppercase text-xs mb-2">
                {step.screenName}
              </CardDescription>
              <CardTitle className="text-2xl md:text-3xl leading-tight">
                {step.questionText}
              </CardTitle>
              {step.helpText && (
                <p className="text-muted-foreground mt-2">{step.helpText}</p>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              
              {step.questionType === "select" && step.options ? (
                <div className="grid gap-3">
                  {step.options.map((opt) => (
                    <Button
                      key={opt.value}
                      variant="outline"
                      className={`h-14 justify-start text-left font-normal border-border hover:border-primary hover:bg-primary/5 ${answer === opt.value ? 'border-primary bg-primary/10' : ''}`}
                      onClick={() => setAnswer(opt.value)}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
              ) : step.questionType === "text" ? (
                <Input 
                  className="h-14 text-lg bg-secondary/50 border-border" 
                  placeholder="Type your answer..." 
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && answer && handleSubmit()}
                />
              ) : (
                <div className="p-4 bg-secondary text-center rounded-lg border border-dashed border-border text-muted-foreground">
                  Input type '{step.questionType}' placeholder
                  <Input className="mt-4" value={answer} onChange={(e) => setAnswer(e.target.value)} />
                </div>
              )}

              <div className="pt-6 flex justify-end">
                <Button 
                  size="lg" 
                  className="px-8 text-md bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={handleSubmit}
                  disabled={submitMutation.isPending || (step.isRequired && !answer)}
                >
                  {submitMutation.isPending ? "Saving..." : "Continue"} <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="text-center py-12">Loading next step...</div>
        )}
      </div>
    </div>
  );
}