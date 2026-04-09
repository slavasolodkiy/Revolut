import { AppLayout } from "@/components/layout/app-layout";
import { ProtectedRoute } from "@/components/protected-route";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  useListNotifications,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  getListNotificationsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, ArrowDownLeft, ArrowUpRight, ShieldAlert, CreditCard, Tag, Settings } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function Notifications() {
  const { data: notifications, isLoading } = useListNotifications();
  const markAllReadMutation = useMarkAllNotificationsRead();
  const markReadMutation = useMarkNotificationRead();
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleMarkAllRead = () => {
    markAllReadMutation.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
        toast({ title: "Notifications cleared" });
      }
    });
  };

  const handleMarkRead = (id: string, isRead: boolean) => {
    if (isRead) return;
    markReadMutation.mutate(
      { notificationId: id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
        }
      }
    );
  };

  const getIcon = (type: string) => {
    switch(type) {
      case "payment_received": return <ArrowDownLeft className="w-5 h-5 text-green-500" />;
      case "payment_sent": return <ArrowUpRight className="w-5 h-5 text-foreground" />;
      case "card_transaction": return <CreditCard className="w-5 h-5 text-primary" />;
      case "security_alert": return <ShieldAlert className="w-5 h-5 text-destructive" />;
      case "promotion": return <Tag className="w-5 h-5 text-purple-500" />;
      default: return <Settings className="w-5 h-5 text-muted-foreground" />;
    }
  };

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
              <p className="text-muted-foreground">Stay updated on your account activity</p>
            </div>
            {notifications && notifications.some(n => !n.isRead) && (
              <Button variant="outline" onClick={handleMarkAllRead} disabled={markAllReadMutation.isPending}>
                Mark all as read
              </Button>
            )}
          </div>

          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="divide-y divide-border">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="p-4 flex items-start gap-4 animate-pulse">
                      <div className="w-10 h-10 rounded-full bg-secondary shrink-0"></div>
                      <div className="space-y-2 w-full">
                        <div className="h-4 w-1/3 bg-secondary rounded"></div>
                        <div className="h-3 w-2/3 bg-secondary rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : !notifications || notifications.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>You're all caught up!</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {notifications.map((notification) => (
                    <div 
                      key={notification.notificationId} 
                      className={`p-4 flex items-start gap-4 transition-colors cursor-pointer hover:bg-secondary/30 ${!notification.isRead ? 'bg-primary/5' : ''}`}
                      onClick={() => handleMarkRead(notification.notificationId, notification.isRead)}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                        !notification.isRead ? 'bg-background shadow-sm border border-border' : 'bg-secondary'
                      }`}>
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm font-medium ${!notification.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {notification.title}
                          </p>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {format(new Date(notification.createdAt), "MMM d, h:mm a")}
                          </span>
                        </div>
                        <p className={`text-sm mt-1 ${!notification.isRead ? 'text-muted-foreground font-medium' : 'text-muted-foreground'}`}>
                          {notification.body}
                        </p>
                      </div>
                      {!notification.isRead && (
                        <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2"></div>
                      )}
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