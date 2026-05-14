"use client";

import { useState } from "react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { Bell, Clock, Loader2 } from "lucide-react";

interface AlertSettingsProps {
  watchlistId: string;
  frequency: string;
  onUpdate: () => void;
}

export function AlertSettings({
  watchlistId,
  frequency,
  onUpdate,
}: AlertSettingsProps) {
  const [freq, setFreq] = useState(frequency);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const res = await api.updateWatchlistSettings(watchlistId, {
      frequency: freq,
    });
    if (res.data) {
      toast.success("Settings updated");
      onUpdate();
    } else {
      toast.error(res.error || "Failed to update settings");
    }
    setSaving(false);
  }

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Bell className="w-5 h-5 text-teal-700" />
        <h3 className="font-semibold">Alert Settings</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="flex items-center gap-2 text-sm font-medium mb-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            Check Frequency
          </label>
          <div className="flex gap-2">
            {["daily", "weekly", "monthly"].map((f) => (
              <button
                key={f}
                onClick={() => setFreq(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                  freq === f
                    ? "bg-teal-500/10 text-teal-700 border border-teal-500/20"
                    : "bg-background border border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>


        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-500 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          Save Settings
        </button>
      </div>
    </div>
  );
}
