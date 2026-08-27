import { useEffect, useState } from "react";
import { X, Loader2, Save } from "lucide-react";
import { getAdminSettings, updateAdminSettings } from "@/lib/mf.functions";
import { toast } from "sonner";

export function AdminSettingsPanel({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncYears, setSyncYears] = useState("3");

  useEffect(() => {
    let active = true;
    getAdminSettings()
      .then((data) => {
        if (!active) return;
        setSyncYears(data.timescaledb_sync_years || "3");
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        toast.error("Failed to load administrator settings");
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      await updateAdminSettings({ data: { timescaledb_sync_years: syncYears } });
      toast.success("Settings updated successfully");
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="panel w-full max-w-md bg-card border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-4 bg-muted/30">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
            <h3 className="font-display font-semibold text-ink text-sm uppercase tracking-wider">
              System Admin Configuration
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-ink-3 hover:text-ink transition-colors p-1 rounded-md hover:bg-border/30"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8 text-sm text-ink-3">
              <Loader2 className="size-5 animate-spin text-accent mb-2" />
              <span>Retrieving configuration variables…</span>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <label className="eyebrow text-xs text-ink-3 block">
                  TimescaleDB History Depth
                </label>
                <p className="text-xs text-ink-2 leading-relaxed">
                  Configure the depth of active Net Asset Value (NAV) history synchronized to the 
                  Postgres/TimescaleDB time-series database. Deep historical records remain in S3.
                </p>

                <div className="grid grid-cols-2 gap-3 mt-3">
                  <button
                    type="button"
                    onClick={() => setSyncYears("2")}
                    aria-pressed={syncYears === "2"}
                    className="flex flex-col items-start gap-1 p-3.5 rounded-lg border text-left cursor-pointer transition-all hover:bg-border/20
                      aria-pressed:border-accent aria-pressed:bg-accent/5 aria-pressed:ring-1 aria-pressed:ring-accent border-border"
                  >
                    <span className="font-display text-xs font-bold text-ink">1-2 Years</span>
                    <span className="text-[10px] text-ink-3">Saves database storage. Optimized for short-term comparisons.</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSyncYears("3")}
                    aria-pressed={syncYears === "3"}
                    className="flex flex-col items-start gap-1 p-3.5 rounded-lg border text-left cursor-pointer transition-all hover:bg-border/20
                      aria-pressed:border-accent aria-pressed:bg-accent/5 aria-pressed:ring-1 aria-pressed:ring-accent border-border"
                  >
                    <span className="font-display text-xs font-bold text-ink">1-3 Years</span>
                    <span className="text-[10px] text-ink-3">Highly recommended. Enables full range correlation metrics.</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-border p-4 bg-muted/30">
          <button
            type="button"
            onClick={onClose}
            className="chip hover:bg-border/30 text-ink-2 font-semibold"
            disabled={saving}
          >
            Cancel
          </button>
          
          <button
            type="button"
            onClick={handleSave}
            disabled={loading || saving}
            className="btn-primary py-2 px-4 rounded-lg flex items-center gap-1.5"
          >
            {saving ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Save className="size-3.5" />
            )}
            <span>Save Settings</span>
          </button>
        </div>

      </div>
    </div>
  );
}
