import { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { ProtectedRoute } from "@/components/protected-route";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  useListPayments, 
  getListPaymentsQueryKey,
  useInitiatePayment,
  useListAccounts,
  InitiatePaymentRequestType,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeftRight, ArrowUpRight, ArrowDownLeft, Clock, Send } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const paymentSchema = z.object({
  fromAccountId: z.string().min(1, "Please select an account"),
  type: z.nativeEnum(InitiatePaymentRequestType),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  currency: z.string().min(3).max(3),
  toAccountId: z.string().optional(),
  recipientName: z.string().optional(),
  recipientIban: z.string().optional(),
  recipientBic: z.string().optional(),
  reference: z.string().optional(),
});

export default function Payments() {
  const { data: paymentsData, isLoading } = useListPayments();
  const { data: accounts } = useListAccounts();
  const initiatePaymentMutation = useInitiatePayment();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<z.infer<typeof paymentSchema>>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      fromAccountId: "",
      type: InitiatePaymentRequestType.sepa,
      amount: 0,
      currency: "EUR",
      toAccountId: "",
      recipientName: "",
      recipientIban: "",
      recipientBic: "",
      reference: "",
    },
  });

  const paymentType = form.watch("type");

  const onSubmit = (values: z.infer<typeof paymentSchema>) => {
    initiatePaymentMutation.mutate({ data: values }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListPaymentsQueryKey() });
        toast({ title: "Payment initiated", description: `Successfully initiated ${values.type} payment.` });
        setIsDialogOpen(false);
        form.reset();
      },
      onError: (error: any) => {
        toast({ title: "Error", description: error?.message || "Failed to initiate payment", variant: "destructive" });
      }
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const variants: Record<string, string> = {
      completed: "bg-green-500/20 text-green-500",
      pending: "bg-yellow-500/20 text-yellow-500",
      processing: "bg-blue-500/20 text-blue-500",
      failed: "bg-red-500/20 text-red-500",
      cancelled: "bg-secondary text-muted-foreground",
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${variants[status] || variants.cancelled}`}>
        {status}
      </span>
    );
  };

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Payments</h1>
              <p className="text-muted-foreground">Send and track transfers</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <Send className="w-4 h-4 mr-2" /> Send Money
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Initiate Transfer</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="fromAccountId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>From Account</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select source account" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {accounts?.map((acc) => (
                                <SelectItem key={acc.accountId} value={acc.accountId}>
                                  {acc.label || `${acc.currency} Pocket`} - {formatCurrency(acc.balance, acc.currency)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Transfer Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select transfer type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value={InitiatePaymentRequestType.internal_transfer}>Internal Transfer</SelectItem>
                              <SelectItem value={InitiatePaymentRequestType.sepa}>SEPA Transfer</SelectItem>
                              <SelectItem value={InitiatePaymentRequestType.swift}>SWIFT Transfer</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Amount</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="currency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Currency</FormLabel>
                            <FormControl>
                              <Input placeholder="EUR" className="uppercase" maxLength={3} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {paymentType === InitiatePaymentRequestType.internal_transfer ? (
                      <FormField
                        control={form.control}
                        name="toAccountId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>To Account</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select destination account" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {accounts?.map((acc) => (
                                  <SelectItem key={acc.accountId} value={acc.accountId}>
                                    {acc.label || `${acc.currency} Pocket`} - {acc.currency}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ) : (
                      <>
                        <FormField
                          control={form.control}
                          name="recipientName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Recipient Name</FormLabel>
                              <FormControl>
                                <Input placeholder="John Doe" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="recipientIban"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>IBAN / Account Number</FormLabel>
                              <FormControl>
                                <Input placeholder="GBXX..." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="recipientBic"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>BIC / SWIFT (Optional)</FormLabel>
                              <FormControl>
                                <Input placeholder="XXXXGB2L" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    )}

                    <FormField
                      control={form.control}
                      name="reference"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reference (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Invoice 123" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button type="submit" disabled={initiatePaymentMutation.isPending}>
                        {initiatePaymentMutation.isPending ? "Processing..." : "Send Transfer"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Transfer History</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="h-16 bg-secondary animate-pulse rounded-lg"></div>
                  ))}
                </div>
              ) : !paymentsData?.payments?.length ? (
                <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg">
                  <ArrowLeftRight className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No payments found.</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {paymentsData.payments.map((payment) => (
                    <div key={payment.paymentId} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                          <ArrowUpRight className="w-5 h-5 text-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{payment.recipientName || payment.type.replace('_', ' ')}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <span className="uppercase">{payment.type.replace('_', ' ')}</span>
                            <span>•</span>
                            <span>{format(new Date(payment.createdAt), "MMM d, h:mm a")}</span>
                            {payment.reference && (
                              <>
                                <span>•</span>
                                <span className="truncate max-w-[150px]">{payment.reference}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-center gap-2">
                        <p className="font-medium">
                          -{formatCurrency(payment.amount, payment.currency)}
                        </p>
                        <StatusBadge status={payment.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}