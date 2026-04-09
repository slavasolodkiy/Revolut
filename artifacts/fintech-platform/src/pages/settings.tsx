import { AppLayout } from "@/components/layout/app-layout";
import { ProtectedRoute } from "@/components/protected-route";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { format } from "date-fns";

export default function Settings() {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground">Manage your profile and preferences</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-1">
              <nav className="flex flex-col space-y-1">
                <Button variant="secondary" className="justify-start">Profile</Button>
                <Button variant="ghost" className="justify-start">Security</Button>
                <Button variant="ghost" className="justify-start">Preferences</Button>
                <Button variant="ghost" className="justify-start">API Keys</Button>
              </nav>
            </div>
            
            <div className="md:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Your personal details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>First Name</Label>
                      <Input value={user?.firstName || ""} readOnly className="bg-secondary/50" />
                    </div>
                    <div className="space-y-2">
                      <Label>Last Name</Label>
                      <Input value={user?.lastName || ""} readOnly className="bg-secondary/50" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input value={user?.email || ""} readOnly className="bg-secondary/50" />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input value={user?.phone || "Not provided"} readOnly className="bg-secondary/50" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Account Type</Label>
                      <Input value={user?.accountType || ""} readOnly className="bg-secondary/50 capitalize" />
                    </div>
                    <div className="space-y-2">
                      <Label>Country Code</Label>
                      <Input value={user?.countryCode || ""} readOnly className="bg-secondary/50 uppercase" />
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-border mt-4">
                    <p className="text-sm text-muted-foreground">
                      Member since {user?.createdAt ? format(new Date(user.createdAt), "MMMM yyyy") : "..."}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Danger Zone</CardTitle>
                  <CardDescription>Irreversible actions</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="destructive" className="w-full sm:w-auto">
                    Close Account
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}