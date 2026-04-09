import { useState } from "react";
import { useParams, Link } from "wouter";
import { AppLayout } from "@/components/layout/app-layout";
import { ProtectedRoute } from "@/components/protected-route";
import { 
  useGetAccount, 
  getGetAccountQueryKey,
  useGetAccountTransactions,
  getGetAccountTransactionsQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Copy, Check, ArrowDownLeft, ArrowUpRight, ArrowLeftRight } from "lucide-react";
import { format } from "date-fns";

export default function AccountDetail() {
  const { accountId } = useParams();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const { data: account, isLoading: isLoadingAccount } = useGetAccount(accountId as string, {
    query: {
      enabled: !!accountId,
      queryKey: getGetAccountQueryKey(accountId as string)
    }
  });

  const { data: transactionsData, isLoading: isLoadingTx } = useGetAccountTransactions(accountId as string, { limit: 50 }, {
    query: {
      enabled: !!accountId,
      queryKey: getGetAccountTransactionsQueryKey(accountId as string, { limit: 50 })
    }
  });

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (isLoadingAccount) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 bg-secondary rounded"></div>
            <div className="h-32 bg-secondary rounded-xl"></div>
            <div className="h-64 bg-secondary rounded-xl"></div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  if (!account) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className="text-center py-12">Account not found</div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Link href="/accounts">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{account.label || `${account.currency} Pocket`}</h1>
              <p className="text-muted-foreground">{account.accountType} account</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2 bg-gradient-to-br from-card to-secondary/30 border-border">
              <CardContent className="p-8">
                <div className="text-sm font-medium text-muted-foreground mb-2">Available Balance</div>
                <div className="text-5xl font-extrabold mb-8 tracking-tight">
                  {formatCurrency(account.availableBalance, account.currency)}
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-border">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Currency</div>
                    <div className="font-medium">{account.currency}</div>
                  </div>
                  {account.iban && (
                    <div className="col-span-2">
                      <div className="text-xs text-muted-foreground mb-1">IBAN</div>
                      <div className="font-medium flex items-center gap-2">
                        <span className="truncate">{account.iban}</span>
                        <button onClick={() => copyToClipboard(account.iban!, 'iban')} className="text-muted-foreground hover:text-foreground">
                          {copiedField === 'iban' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  )}
                  {account.swift && (
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">BIC/SWIFT</div>
                      <div className="font-medium flex items-center gap-2">
                        <span>{account.swift}</span>
                        <button onClick={() => copyToClipboard(account.swift!, 'swift')} className="text-muted-foreground hover:text-foreground">
                          {copiedField === 'swift' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/payments" className="block w-full">
                  <Button className="w-full justify-start" variant="outline">
                    <ArrowUpRight className="w-4 h-4 mr-2" /> Send Money
                  </Button>
                </Link>
                <Link href="/fx" className="block w-full">
                  <Button className="w-full justify-start" variant="outline">
                    <ArrowLeftRight className="w-4 h-4 mr-2" /> Exchange
                  </Button>
                </Link>
                <Button className="w-full justify-start" variant="outline">
                  <ArrowDownLeft className="w-4 h-4 mr-2" /> Add Money
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingTx ? (
                <div className="space-y-4">
                  {[1,2,3].map(i => (
                    <div key={i} className="h-12 bg-secondary animate-pulse rounded"></div>
                  ))}
                </div>
              ) : !transactionsData?.transactions?.length ? (
                <div className="text-center py-8 text-muted-foreground">No transactions yet</div>
              ) : (
                <div className="divide-y divide-border">
                  {transactionsData.transactions.map((tx) => (
                    <div key={tx.transactionId} className="py-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          tx.amount > 0 ? "bg-green-500/10 text-green-500" : "bg-foreground/10 text-foreground"
                        }`}>
                          {tx.amount > 0 ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{tx.merchantName || tx.description || tx.type}</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(tx.createdAt), "MMM d, yyyy")}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-medium ${tx.amount > 0 ? "text-green-500" : "text-foreground"}`}>
                          {tx.amount > 0 ? "+" : ""}{formatCurrency(tx.amount, tx.currency)}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">{tx.status}</p>
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