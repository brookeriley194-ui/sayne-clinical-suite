import { Link } from "@tanstack/react-router";
import { Sparkles, ArrowRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const LAVENDER = "#C9A8F5";
const BABY_BLUE = "#89CFF0";
const MUTED = "#9B8EC4";

/**
 * Friendly upgrade-wall modal shown when a free-tier limit is hit.
 *
 * Usage:
 *   <UpgradePrompt
 *     open={open}
 *     onOpenChange={setOpen}
 *     resource="vials" // "vials" | "stacks" | "imports" | "scans" | string
 *   />
 */
export function UpgradePrompt({
  open,
  onOpenChange,
  resource = "items",
  title,
  description,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  resource?: string;
  title?: string;
  description?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div
            className="mx-auto mb-2 inline-flex items-center justify-center h-12 w-12 rounded-full"
            style={{
              background: `linear-gradient(135deg, ${BABY_BLUE}33, ${LAVENDER}55)`,
              border: `1px solid ${LAVENDER}66`,
            }}
          >
            <Sparkles className="h-5 w-5" style={{ color: "#6b4ca8" }} />
          </div>
          <DialogTitle className="font-display text-center">
            {title ?? "You've reached your free plan limit."}
          </DialogTitle>
          <DialogDescription className="text-center" style={{ color: MUTED }}>
            {description ??
              `Upgrade to Researcher Pro for unlimited ${resource}.`}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="sm:justify-center gap-2 mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Not now
          </Button>
          <Button
            asChild
            className="liquid-button shadow-md"
            style={{
              background: `linear-gradient(135deg, ${BABY_BLUE} 0%, ${LAVENDER} 120%)`,
              color: "#1F1240",
            }}
          >
            <Link to="/pricing" onClick={() => onOpenChange(false)}>
              See Pro <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
