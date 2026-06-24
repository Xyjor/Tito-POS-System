import { useEffect, useState } from "react";
import { getSettings, updateSettings } from "../lib/tauri";
import type { ShopSettings } from "../types";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";

export function SettingsPage() {
  const [settings, setSettings] = useState<ShopSettings>({
    shop_name: "",
    shop_address: "",
    shop_contact: "",
    receipt_prefix: "RCP",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSettings()
      .then(setSettings)
      .catch((err) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const updated = await updateSettings(settings);
      setSettings(updated);
      setMessage("Settings saved successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex h-screen flex-col">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <h2 className="text-2xl font-bold text-slate-900">Settings</h2>
        <p className="text-sm text-slate-500">Shop details shown on receipts</p>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-2xl space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
          {loading ? (
            <p className="text-sm text-slate-500">Loading settings...</p>
          ) : (
            <>
              <Input
                label="Shop Name"
                value={settings.shop_name}
                onChange={(event) =>
                  setSettings({ ...settings, shop_name: event.target.value })
                }
              />
              <Input
                label="Address"
                value={settings.shop_address}
                onChange={(event) =>
                  setSettings({ ...settings, shop_address: event.target.value })
                }
              />
              <Input
                label="Contact Number"
                value={settings.shop_contact}
                onChange={(event) =>
                  setSettings({ ...settings, shop_contact: event.target.value })
                }
              />
              <Input
                label="Receipt Prefix"
                value={settings.receipt_prefix}
                onChange={(event) =>
                  setSettings({ ...settings, receipt_prefix: event.target.value })
                }
              />
              {message ? (
                <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {message}
                </p>
              ) : null}
              {error ? (
                <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
              ) : null}
              <Button disabled={saving} onClick={handleSave}>
                {saving ? "Saving..." : "Save Settings"}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
