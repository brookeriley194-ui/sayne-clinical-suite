import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { SayneLogo } from "@/components/sayne-logo";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        setReady(true);
      }
    });

    async function init() {
      const hash = window.location.hash.startsWith("#")
        ? window.location.hash.slice(1)
        : window.location.hash;
      const hashParams = new URLSearchParams(hash);
      const queryParams = new URLSearchParams(window.location.search);

      // Surface errors returned by Supabase in the URL (e.g. expired/consumed link)
      const errorDescription =
        hashParams.get("error_description") || queryParams.get("error_description");
      const errorCode =
        hashParams.get("error_code") || queryParams.get("error_code") ||
        hashParams.get("error") || queryParams.get("error");
      if (errorDescription || errorCode) {
        toast.error(
          errorDescription?.replace(/\+/g, " ") ||
            "This reset link is invalid or has expired. Please request a new one."
        );
        return;
      }

      // Newer Supabase flow: ?token_hash=...&type=recovery
      const tokenHash = queryParams.get("token_hash");
      const type = queryParams.get("type");
      if (tokenHash && type === "recovery") {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: "recovery",
        });
        if (!cancelled) {
          if (error) {
            toast.error("This reset link is invalid or has expired. Please request a new one.");
          } else {
            setReady(true);
          }
        }
        return;
      }

      // Implicit flow: tokens delivered in URL hash
      if (hashParams.get("access_token") || hashParams.get("type") === "recovery") {
        setReady(true);
        return;
      }

      // Fall back to existing session (Supabase may have already processed it)
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;
      if (session) {
        setReady(true);
      } else {
        // Wait a tick for onAuthStateChange before declaring failure
        setTimeout(async () => {
          if (cancelled) return;
          const { data: { session: s2 } } = await supabase.auth.getSession();
          if (!s2) {
            toast.error("This reset link is invalid or has expired. Please request a new one.");
          } else {
            setReady(true);
          }
        }, 800);
      }
    }

    init();

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setDone(true);
    toast.success("Password updated successfully");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-background">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8"><SayneLogo /></div>
        <div className="sayne-card p-8">
          <h1 className="text-2xl font-semibold mb-1">Set new password</h1>
          <p className="text-sm text-muted-foreground mb-6">
            {done
              ? "Your password has been updated."
              : "Choose a new password for your account."}
          </p>
          {!done && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>
              <Button type="submit" disabled={loading || !ready} className="w-full bg-indigo-200 font-mono">
                {loading ? "Updating…" : "Update password"}
              </Button>
            </form>
          )}
          {done && (
            <div className="mt-4">
              <Link to="/login">
                <Button className="w-full bg-indigo-200 font-mono">Go to sign in</Button>
              </Link>
            </div>
          )}
          {!done && (
            <p className="text-sm text-muted-foreground mt-6 text-center">
              <Link to="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
                Back to sign in
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
