import { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { ProtectedRoute } from "@/components/protected-route";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  useListCards, 
  getListCardsQueryKey,
  useIssueCard,
  useUpdateCard,
  useListAccounts,
  IssueCardRequestCardType,
  IssueCardRequestCardNetwork,
  UpdateCardRequestStatus
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { CreditCard, Plus, Snowflake, Shield, Settings2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";

const issueCardSchema = z.object({
  accountId: z.string().min(1, "Please select an account"),
  cardType: z.nativeEnum(IssueCardRequestCardType),
  cardNetwork: z.nativeEnum(IssueCardRequestCardNetwork),
  label: z.string().optional(),
});

export default function Cards() {
  const { data: cards, isLoading } = useListCards();
  const { data: accounts } = useListAccounts();
  const issueCardMutation = useIssueCard();
  const updateCardMutation = useUpdateCard();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<z.infer<typeof issueCardSchema>>({
    resolver: zodResolver(issueCardSchema),
    defaultValues: {
      accountId: "",
      cardType: IssueCardRequestCardType.virtual,
      cardNetwork: IssueCardRequestCardNetwork.visa,
      label: "",
    },
  });

  const onSubmit = (values: z.infer<typeof issueCardSchema>) => {
    issueCardMutation.mutate({ data: values }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCardsQueryKey() });
        toast({ title: "Card issued", description: `Successfully issued new ${values.cardType} card.` });
        setIsDialogOpen(false);
        form.reset();
      },
      onError: (error: any) => {
        toast({ title: "Error", description: error?.message || "Failed to issue card", variant: "destructive" });
      }
    });
  };

  const toggleFreeze = (cardId: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? UpdateCardRequestStatus.frozen : UpdateCardRequestStatus.active;
    updateCardMutation.mutate(
      { cardId, data: { status: newStatus } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListCardsQueryKey() });
          toast({ title: "Card updated", description: `Card is now ${newStatus}.` });
        },
        onError: (error: any) => {
          toast({ title: "Error", description: error?.message || "Failed to update card", variant: "destructive" });
        }
      }
    );
  };

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Cards</h1>
              <p className="text-muted-foreground">Manage your physical and virtual cards</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <Plus className="w-4 h-4 mr-2" /> Issue Card
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Issue New Card</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="accountId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Linked Account</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select account" />
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
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="cardType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value={IssueCardRequestCardType.virtual}>Virtual</SelectItem>
                                <SelectItem value={IssueCardRequestCardType.physical}>Physical</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="cardNetwork"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Network</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Network" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value={IssueCardRequestCardNetwork.visa}>Visa</SelectItem>
                                <SelectItem value={IssueCardRequestCardNetwork.mastercard}>Mastercard</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="label"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Label (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Online Shopping" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button type="submit" disabled={issueCardMutation.isPending}>
                        {issueCardMutation.isPending ? "Issuing..." : "Issue Card"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              [1, 2, 3].map(i => (
                <div key={i} className="h-56 bg-secondary animate-pulse rounded-2xl"></div>
              ))
            ) : cards?.length === 0 ? (
              <div className="col-span-full text-center py-12 text-muted-foreground border border-dashed rounded-lg">
                <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No cards issued yet. Create a virtual card instantly.</p>
              </div>
            ) : (
              cards?.map((card) => (
                <div key={card.cardId} className="group flex flex-col gap-4">
                  <div className={`relative h-56 rounded-2xl p-6 flex flex-col justify-between overflow-hidden shadow-lg transition-transform group-hover:-translate-y-1 ${
                    card.status === "frozen" ? "bg-secondary/50 grayscale opacity-80" : "bg-gradient-to-br from-primary/90 to-primary/60"
                  }`}>
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:20px_20px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_10%,transparent_100%)] opacity-30 pointer-events-none"></div>
                    <div className="flex justify-between items-start z-10">
                      <div className="font-bold text-white tracking-widest text-lg capitalize">{card.cardNetwork}</div>
                      <div className="flex gap-2">
                        {card.status === "frozen" && (
                          <span className="bg-background/80 text-foreground text-xs px-2 py-1 rounded-md backdrop-blur flex items-center">
                            <Snowflake className="w-3 h-3 mr-1" /> Frozen
                          </span>
                        )}
                        <span className="bg-white/20 text-white text-xs px-2 py-1 rounded-md backdrop-blur capitalize">
                          {card.cardType}
                        </span>
                      </div>
                    </div>
                    <div className="z-10">
                      <div className="text-white/80 font-mono text-sm mb-1">{card.cardholderName}</div>
                      <div className="text-white font-mono text-xl tracking-widest flex items-center gap-3">
                        <span>••••</span>
                        <span>••••</span>
                        <span>••••</span>
                        <span>{card.lastFour}</span>
                      </div>
                      <div className="text-white/80 font-mono text-sm mt-2">
                        {card.expiryMonth.toString().padStart(2, '0')}/{card.expiryYear.toString().slice(-2)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1 bg-card hover:bg-secondary"
                      onClick={() => toggleFreeze(card.cardId, card.status)}
                      disabled={updateCardMutation.isPending}
                    >
                      <Snowflake className="w-4 h-4 mr-2" />
                      {card.status === "frozen" ? "Unfreeze" : "Freeze"}
                    </Button>
                    <Button variant="outline" className="flex-1 bg-card hover:bg-secondary">
                      <Settings2 className="w-4 h-4 mr-2" /> Settings
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}