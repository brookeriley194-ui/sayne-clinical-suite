import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { SayneLogo } from "@/components/sayne-logo";
import { Stethoscope, FlaskConical } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

const TERMS_VERSION = "2026-06-01";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
});

const schema = z.object({
  email: z.string().email("Enter a valid email").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
  role: z.enum(["doctor", "researcher"]),
});

function SignupPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"doctor" | "researcher">("doctor");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      if (s) navigate({ to: "/dashboard", replace: true });
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!consent) {
      toast.error("Please agree to the Terms of Service and Privacy Policy to continue.");
      return;
    }
    const parsed = schema.safeParse({ email, password, role });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    const redirectUrl = `${window.location.origin}/dashboard`;
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          role: parsed.data.role,
          terms_accepted: true,
          terms_version: TERMS_VERSION,
        },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome to Sayne!");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-background">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8"><SayneLogo /></div>
        <div className="sayne-card p-8">
          <h1 className="text-2xl font-semibold mb-1">Create your account</h1>
          <p className="text-sm text-muted-foreground mb-6">Join Sayne and pick your workspace.</p>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label>I am a</Label>
              <div className="grid grid-cols-2 gap-3">
                {([
                  { value: "doctor", label: "Doctor", icon: Stethoscope },
                  { value: "researcher", label: "Researcher", icon: FlaskConical },
                ] as const).map((opt) => {
                  const Icon = opt.icon;
                  const active = role === opt.value;
                  return (
                    <button
                      type="button"
                      key={opt.value}
                      onClick={() => setRole(opt.value)}
                      className="rounded-[12px] border p-4 text-left transition-all"
                      style={{
                        borderColor: active ? "var(--primary)" : "color-mix(in oklab, var(--border) 40%, transparent)",
                        backgroundColor: active ? "var(--panel)" : "var(--card)",
                        boxShadow: active ? "0 0 0 3px color-mix(in oklab, var(--primary) 25%, transparent)" : undefined,
                      }}
                    >
                      <Icon className="h-5 w-5 mb-2" style={{ color: "var(--foreground)" }} />
                      <div className="font-medium">{opt.label}</div>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" />
            </div>
            <div className="flex items-start gap-3 rounded-[10px] border border-[color:var(--border)] bg-[color:var(--card)]/50 p-3">
              <Checkbox
                id="consent"
                checked={consent}
                onCheckedChange={(v) => setConsent(v === true)}
                className="mt-0.5"
              />
              <Label htmlFor="consent" className="text-xs leading-relaxed font-normal text-muted-foreground cursor-pointer">
                I am 18 or older and agree to the{" "}
                <a href="/terms" target="_blank" rel="noopener noreferrer" className="font-medium text-foreground underline-offset-4 hover:underline">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="/privacy" target="_blank" rel="noopener noreferrer" className="font-medium text-foreground underline-offset-4 hover:underline">
                  Privacy Policy
                </a>
                . I understand that Sayne is a research and tracking tool that does not provide medical advice.
              </Label>
            </div>
            <Button type="submit" disabled={loading || !consent} className="w-full bg-indigo-200 font-mono">
              {loading ? "Creating account…" : "Create account"}
            </Button>
          </form>
          <p className="text-sm text-muted-foreground mt-6 text-center">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
