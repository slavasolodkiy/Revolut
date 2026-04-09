import { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { ProtectedRoute } from "@/components/protected-route";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  useGetKycStatus,
  useListKycChecks,
  useSubmitKycDocument,
  KycDocumentSubmissionDocumentType,
  getGetKycStatusQueryKey,
  getListKycChecksQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ShieldAlert, ShieldCheck, Upload, FileText, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export default function KYC() {
  const { data: status, isLoading: isLoadingStatus } = useGetKycStatus();
  const { data: checks, isLoading: isLoadingChecks } = useListKycChecks();
  const submitDocMutation = useSubmitKycDocument();
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [docType, setDocType] = useState<KycDocumentSubmissionDocumentType>(KycDocumentSubmissionDocumentType.passport);
  const [frontImage, setFrontImage] = useState<string>("data:image/png;base64,fake-image-data"); // Simulated file
  const [selfieImage, setSelfieImage] = useState<string>("data:image/png;base64,fake-selfie-data");

  const handleSubmit = () => {
    submitDocMutation.mutate(
      {
        data: {
          documentType: docType,
          documentFront: frontImage,
          selfieImage: selfieImage
        }
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetKycStatusQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListKycChecksQueryKey() });
          toast({ title: "Documents submitted", description: "Your verification is now in review." });
          setIsDialogOpen(false);
        },
        onError: (error: any) => {
          toast({ title: "Submission failed", description: error?.message || "An error occurred", variant: "destructive" });
        }
      }
    );
  };

  const getStatusColor = (s?: string) => {
    switch (s) {
      case "approved": return "text-green-500 bg-green-500/10";
      case "pending":
      case "in_review": return "text-yellow-500 bg-yellow-500/10";
      case "rejected": return "text-destructive bg-destructive/10";
      default: return "text-muted-foreground bg-secondary";
    }
  };

  const getStatusIcon = (s?: string) => {
    switch (s) {
      case "approved": return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case "pending":
      case "in_review": return <Clock className="w-5 h-5 text-yellow-500" />;
      case "rejected": return <AlertCircle className="w-5 h-5 text-destructive" />;
      default: return <FileText className="w-5 h-5 text-muted-foreground" />;
    }
  };

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Identity Verification</h1>
              <p className="text-muted-foreground">Complete KYC to unlock all features</p>
            </div>
            
            {status?.overallStatus !== "approved" && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <Upload className="w-4 h-4 mr-2" /> Upload Documents
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Submit Verification Documents</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Document Type</label>
                      <Select value={docType} onValueChange={(v) => setDocType(v as KycDocumentSubmissionDocumentType)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={KycDocumentSubmissionDocumentType.passport}>Passport</SelectItem>
                          <SelectItem value={KycDocumentSubmissionDocumentType.national_id}>National ID</SelectItem>
                          <SelectItem value={KycDocumentSubmissionDocumentType.drivers_license}>Driver's License</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="border-2 border-dashed border-border rounded-xl p-8 text-center bg-secondary/20 hover:bg-secondary/50 transition-colors cursor-pointer">
                      <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm font-medium">Click to upload document front</p>
                      <p className="text-xs text-muted-foreground mt-1">JPEG, PNG up to 10MB</p>
                    </div>

                    <div className="border-2 border-dashed border-border rounded-xl p-8 text-center bg-secondary/20 hover:bg-secondary/50 transition-colors cursor-pointer">
                      <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm font-medium">Click to upload selfie</p>
                      <p className="text-xs text-muted-foreground mt-1">Take a clear photo of your face</p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleSubmit} disabled={submitDocMutation.isPending} className="w-full">
                      {submitDocMutation.isPending ? "Submitting..." : "Submit for Review"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-1 border-border">
              <CardHeader>
                <CardTitle>Overall Status</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-8">
                {isLoadingStatus ? (
                  <div className="w-24 h-24 rounded-full bg-secondary animate-pulse mb-4"></div>
                ) : (
                  <>
                    <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-4 ${getStatusColor(status?.overallStatus)}`}>
                      {status?.overallStatus === "approved" ? (
                        <ShieldCheck className="w-12 h-12" />
                      ) : (
                        <ShieldAlert className="w-12 h-12" />
                      )}
                    </div>
                    <h3 className="text-xl font-bold capitalize mb-2">
                      {status?.overallStatus?.replace('_', ' ')}
                    </h3>
                    <p className="text-center text-sm text-muted-foreground">
                      {status?.overallStatus === "approved" 
                        ? "Your identity has been fully verified. You have access to all NovaPay features." 
                        : "Please complete the verification steps to lift account limits."}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Verification Checks</CardTitle>
                <CardDescription>Individual components of your KYC profile</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingChecks ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-16 bg-secondary animate-pulse rounded-lg"></div>
                    ))}
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {checks?.map((check) => (
                      <div key={check.checkId} className="py-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getStatusColor(check.status)}`}>
                            {getStatusIcon(check.status)}
                          </div>
                          <div>
                            <p className="font-medium capitalize">{check.checkType.replace('_', ' ')} Check</p>
                            <p className="text-xs text-muted-foreground">ID: {check.checkId.substring(0, 8)}...</p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(check.status)}`}>
                          {check.status.replace('_', ' ')}
                        </span>
                      </div>
                    ))}
                    
                    {(!checks || checks.length === 0) && (
                      <div className="text-center py-8 text-muted-foreground">
                        No verification checks initiated yet.
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}