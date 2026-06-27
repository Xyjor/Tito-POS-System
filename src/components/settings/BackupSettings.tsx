import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Button } from "../ui/Button";

interface BackupInfo {
  filename: string;
  created_at: string;
  size_bytes: number;
  path: string;
}

interface BackupStatus {
  last_backup: string | null;
  last_backup_size: number | null;
  backup_count: number;
  is_backup_running: boolean;
  auto_backup_enabled: boolean;
  auto_backup_interval_minutes: number;
}

export function BackupSettings() {
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [status, setStatus] = useState<BackupStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [restoringBackup, setRestoringBackup] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBackupData();
    const interval = setInterval(loadBackupData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  async function loadBackupData() {
    try {
      const [backupsData, statusData] = await Promise.all([
        invoke<BackupInfo[]>("list_backups"),
        invoke<BackupStatus>("get_backup_status"),
      ]);
      setBackups(backupsData);
      setStatus(statusData);
    } catch (err) {
      console.error("Failed to load backup data:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateBackup() {
    setCreatingBackup(true);
    setMessage(null);
    setError(null);
    try {
      await invoke("create_backup");
      setMessage("Backup created successfully!");
      await loadBackupData();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setCreatingBackup(false);
    }
  }

  async function handleRestoreBackup(filename: string) {
    if (!confirm("Are you sure you want to restore this backup? This will replace the current database.")) {
      return;
    }
    
    setRestoringBackup(filename);
    setMessage(null);
    setError(null);
    try {
      await invoke("restore_backup", { filename });
      setMessage("Database restored successfully! The app will now restart.");
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRestoringBackup(null);
    }
  }

  async function handleDeleteBackup(filename: string) {
    if (!confirm("Are you sure you want to delete this backup?")) {
      return;
    }
    
    try {
      await invoke("delete_backup", { filename });
      setMessage("Backup deleted successfully!");
      await loadBackupData();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Backup Status</h3>
        
        {loading ? (
          <p className="text-sm text-slate-500">Loading backup status...</p>
        ) : status ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Auto Backup:</span>
              <span className={`text-sm font-medium ${status.auto_backup_enabled ? "text-emerald-600" : "text-slate-400"}`}>
                {status.auto_backup_enabled ? `Enabled (every ${status.auto_backup_interval_minutes} min)` : "Disabled"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Last Backup:</span>
              <span className="text-sm font-medium text-slate-900">
                {status.last_backup ? formatDate(status.last_backup) : "Never"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Last Backup Size:</span>
              <span className="text-sm font-medium text-slate-900">
                {status.last_backup_size ? formatFileSize(status.last_backup_size) : "N/A"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Total Backups:</span>
              <span className="text-sm font-medium text-slate-900">{status.backup_count}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Backup Running:</span>
              <span className={`text-sm font-medium ${status.is_backup_running ? "text-emerald-600" : "text-slate-400"}`}>
                {status.is_backup_running ? "Yes" : "No"}
              </span>
            </div>
            
            <div className="pt-4 border-t border-slate-200">
              <Button
                onClick={handleCreateBackup}
                disabled={creatingBackup}
                className="w-full"
              >
                {creatingBackup ? "Creating Backup..." : "Create Manual Backup"}
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Backup History</h3>
        
        {loading ? (
          <p className="text-sm text-slate-500">Loading backups...</p>
        ) : backups.length === 0 ? (
          <p className="text-sm text-slate-500">No backups available.</p>
        ) : (
          <div className="space-y-2">
            {backups.map((backup) => (
              <div
                key={backup.filename}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">{backup.filename}</p>
                  <p className="text-xs text-slate-500">
                    {formatDate(backup.created_at)} • {formatFileSize(backup.size_bytes)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => handleRestoreBackup(backup.filename)}
                    disabled={restoringBackup === backup.filename}
                    className="text-xs px-3 py-1"
                  >
                    {restoringBackup === backup.filename ? "Restoring..." : "Restore"}
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => handleDeleteBackup(backup.filename)}
                    className="text-xs px-3 py-1"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {message ? (
        <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </div>
      ) : null}
      
      {error ? (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
    </div>
  );
}
