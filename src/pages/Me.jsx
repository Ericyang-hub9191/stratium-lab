import { User, Settings, LogOut } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";

export default function Me() {
  return (
    <div className="px-4 py-6 space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-xp flex items-center justify-center">
          <User className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold">Your Profile</h1>
          <p className="text-xs text-muted-foreground">Level 1 · 0 XP</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="rounded-xl border bg-card p-4 flex items-center gap-3">
          <Settings className="w-5 h-5 text-muted-foreground" />
          <span className="text-sm font-medium">Preferences</span>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-destructive hover:text-destructive"
          onClick={() => base44.auth.logout()}
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">Sign Out</span>
        </Button>
      </div>
    </div>
  );
}