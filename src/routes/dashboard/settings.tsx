import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/dashboard-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { LogOut, User as UserIcon, Sparkles, PlayCircle, Volume2, FileText, ChevronRight, ShieldCheck, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { getSoundEnabled, setSoundEnabled, playCheckSound } from "@/lib/dose-fx";

export const Route = createFileRoute("/dashboard/settings")({ component: SettingsPage });


function SettingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const meta = (user?.user_metadata ?? {}) as { full_name?: string; name?: string };
  const [name, setName] = useState(meta.full_name ?? meta.name ?? "");
  const [saving, setSaving] = useState(false);
  const [sound, setSound] = useState(false);
  useEffect(() => { setSound(getSoundEnabled()); }, []);
  const toggleSound = (on: boolean) => {
    setSound(on);
    setSoundEnabled(on);
    if (on) playCheckSound();
  };


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
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-medium">Current plan</div>
              <p className="text-xs text-muted-foreground">Free tier — upgrade for unlimited everything.</p>
            </div>
            <Badge variant="outline">Free</Badge>
          </div>
          <div>
            <Button asChild size="sm" className="gap-1.5"
              style={{ background: "linear-gradient(135deg, #89CFF0 0%, #C9A8F5 120%)", color: "#1F1240" }}
            >
              <Link to="/pricing">Upgrade to Pro <ChevronRight className="size-4" /></Link>
            </Button>
          </div>
        </section>

        <section className="sayne-card p-6">
          <div className="flex items-center gap-2 mb-3">
            <Volume2 className="size-4 text-primary" />
            <h2 className="font-display text-lg font-semibold">Sounds</h2>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-medium">Completion sound</div>
              <p className="text-xs text-muted-foreground">Play a soft chime when you log a dose.</p>
            </div>
            <Switch checked={sound} onCheckedChange={toggleSound} />
          </div>
        </section>



        <section className="sayne-card p-6">
          <div className="flex items-center gap-2 mb-3">
            <PlayCircle className="size-4" style={{ color: "#C9A8F5" }} />
            <h2 className="font-display text-lg font-semibold">Help & Tutorial</h2>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className="h-10 w-10 rounded-full flex items-center justify-center shrink-0"
                style={{ background: "rgba(201,168,245,0.18)" }}
              >
                <PlayCircle className="size-5" style={{ color: "#6b4ca8" }} />
              </div>
              <div>
                <div className="font-display font-semibold text-sm">App Tutorial</div>
                <p className="text-xs text-muted-foreground">Replay the Sayne walkthrough anytime</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => window.dispatchEvent(new Event("sayne:open-tutorial"))}
              style={{ borderColor: "#C9A8F5", color: "#6b4ca8" }}
              className="hover:bg-[rgba(201,168,245,0.12)]"
            >
              Watch Tutorial
            </Button>
          </div>
        </section>

        <section className="sayne-card p-6">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="size-4 text-primary" />
            <h2 className="font-display text-lg font-semibold">Legal</h2>
          </div>
          <div className="divide-y divide-[color:var(--border)]/60">
            {[
              { to: "/privacy", label: "Privacy Policy", icon: ShieldCheck },
              { to: "/terms", label: "Terms of Service", icon: FileText },
              { to: "/disclaimer", label: "Disclaimer", icon: AlertTriangle },
            ].map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                target="_blank"
                className="flex items-center justify-between py-3 group transition-colors hover:text-foreground"
              >
                <span className="flex items-center gap-3 text-sm">
                  <Icon className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  {label}
                </span>
                <ChevronRight className="size-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
              </Link>
            ))}
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
