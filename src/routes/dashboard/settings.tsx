import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/dashboard-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { LogOut, User as UserIcon, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/settings")({ component: SettingsPage });

function SettingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const meta = (user?.user_metadata ?? {}) as { full_name?: string; name?: string };
  const [name, setName] = useState(meta.full_name ?? meta.name ?? "");
  const [saving, setSaving] = useState(false);

  const saveName = async () => {
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ data: { full_name: name } });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Profile updated");
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) return toast.error(error.message);
    navigate({ to: "/login", replace: true });
  };

  return (
    <>
      <PageHeader title="Settings" subtitle="Manage your profile and account." />

      <div className="grid gap-6 max-w-2xl">
        <section className="sayne-card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <UserIcon className="size-4 text-primary" />
            <h2 className="font-display text-lg font-semibold">Profile</h2>
          </div>
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user?.email ?? ""} disabled className="font-mono text-sm" />
          </div>
          <div>
            <Button onClick={saveName} disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
          </div>
        </section>

        <section className="sayne-card p-6 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            <h2 className="font-display text-lg font-semibold">Subscription</h2>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Current plan</div>
              <p className="text-xs text-muted-foreground">Free tier — upgrade for advanced tracking.</p>
            </div>
            <Badge variant="outline">Free</Badge>
          </div>
        </section>

        <section className="sayne-card p-6">
          <Button variant="destructive" onClick={signOut} className="gap-2">
            <LogOut className="size-4" /> Sign out
          </Button>
        </section>
      </div>
    </>
  );
}
