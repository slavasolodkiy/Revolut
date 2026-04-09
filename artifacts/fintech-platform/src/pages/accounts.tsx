import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useLocation } from "wouter";
import { AppLayout } from "@/components/layout/app-layout";
import { ProtectedRoute } from "@/components/protected-route";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  useListAccounts, 
  getListAccountsQueryKey,
  useCreateAccount,
  CreateAccountRequestAccountType,
  Account
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Wallet, Plus, ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

const createAccountSchema = z.object({
  currency: z.string().min(3).max(3),
  accountType: z.nativeEnum(CreateAccountRequestAccountType),
  label: z.string().optional(),
});

export default function Accounts() {
  const { data: accounts, isLoading } = useListAccounts();
  const createAccountMutation = useCreateAccount();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<z.infer<typeof createAccountSchema>>({
    resolver: zodResolver(createAccountSchema),
    defaultValues: {
      currency: "USD",
      accountType: CreateAccountRequestAccountType.current,
      label: "",
    },
  });

  const onSubmit = (values: z.infer<typeof createAccountSchema>) => {
    createAccountMutation.mutate({ data: values }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAccountsQueryKey() });
        toast({ title: "Account created", description: `Successfully created ${values.currency} pocket.` });
        setIsDialogOpen(false);
        form.reset();
      },
      onError: (error: any) => {
        toast({ title: "Error", description: error?.message || "Failed to create account", variant: "destructive" });
      }
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
  };

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Accounts</h1>
              <p className="text-muted-foreground">Manage your currency pockets</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <Plus className="w-4 h-4 mr-2" /> New Pocket
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Pocket</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Currency</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select currency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="USD">USD - US Dollar</SelectItem>
                              <SelectItem value="EUR">EUR - Euro</SelectItem>
                              <SelectItem value="GBP">GBP - British Pound</SelectItem>
                              <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                              <SelectItem value="CHF">CHF - Japanese Yen</SelectItem>
                              <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                              <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="accountType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value={CreateAccountRequestAccountType.current}>Current</SelectItem>
                              <SelectItem value={CreateAccountRequestAccountType.savings}>Savings</SelectItem>
                              <SelectItem value={CreateAccountRequestAccountType.vault}>Vault</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="label"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Label (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Travel Fund" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button type="submit" disabled={createAccountMutation.isPending}>
                        {createAccountMutation.isPending ? "Creating..." : "Create Pocket"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading ? (
              [1, 2, 3].map(i => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="pb-2">
                    <div className="h-4 w-24 bg-secondary rounded"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-8 w-32 bg-secondary rounded mb-2"></div>
                    <div className="h-4 w-40 bg-secondary rounded"></div>
                  </CardContent>
                </Card>
              ))
            ) : accounts?.length === 0 ? (
              <div className="col-span-full text-center py-12 text-muted-foreground border border-dashed rounded-lg">
                <Wallet className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No accounts found. Create your first pocket to get started.</p>
              </div>
            ) : (
              accounts?.map((account) => (
                <Link key={account.accountId} href={`/accounts/${account.accountId}`}>
                  <Card className="hover:border-primary/50 transition-colors cursor-pointer group h-full flex flex-col">
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-bold text-xs">
                          {account.currency}
                        </div>
                        {account.label || `${account.currency} Pocket`}
                      </CardTitle>
                      {account.isDefault && (
                        <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full font-medium">Default</span>
                      )}
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col justify-end">
                      <div className="text-3xl font-bold mb-1">
                        {formatCurrency(account.balance, account.currency)}
                      </div>
                      <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                        <span>{account.accountType.charAt(0).toUpperCase() + account.accountType.slice(1)}</span>
                        <ArrowRight className="w-4 h-4 group-hover:text-primary transition-colors group-hover:translate-x-1" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            )}
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}