import { useEffect, useState } from "react";
import { getSettings, updateSettings } from "../lib/tauri";
import type { ShopSettings } from "../types";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { BackupSettings } from "../components/settings/BackupSettings";

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
  const [activeTab, setActiveTab] = useState<"shop" | "backup">("shop");

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
        <p className="text-sm text-slate-500">Manage your shop settings and data backups</p>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-4xl">
          {/* Tab Navigation */}
          <div className="mb-6 flex gap-2 border-b border-slate-200">
            <button
              onClick={() => setActiveTab("shop")}
              className={`px-4 py-2 text-sm font-medium transition ${
                activeTab === "shop"
                  ? "border-b-2 border-emerald-600 text-emerald-600"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Shop Settings
            </button>
            <button
              onClick={() => setActiveTab("backup")}
              className={`px-4 py-2 text-sm font-medium transition ${
                activeTab === "backup"
                  ? "border-b-2 border-emerald-600 text-emerald-600"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Backup & Recovery
            </button>
          </div>

          {activeTab === "shop" ? (
            <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
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
          ) : (
            <BackupSettings />
          )}
        </div>
      </div>
    </div>
  );
}
