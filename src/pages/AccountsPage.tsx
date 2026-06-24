import { useEffect, useState } from "react";
import type { User } from "../types";
import { listUsers, createUser, updateUser, updatePassword, deleteUser } from "../lib/tauri";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { Badge } from "../components/ui/Badge";
import { useAuth } from "../context/AuthContext";

export function AccountsPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("cashier");
  const [canManageProducts, setCanManageProducts] = useState(false);

  async function loadUsers() {
    try {
      const data = await listUsers();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  function openCreateForm() {
    setSelectedUser(null);
    setUsername("");
    setPassword("");
    setRole("cashier");
    setCanManageProducts(false);
    setError(null);
    setFormOpen(true);
  }

  function openEditForm(u: User) {
    setSelectedUser(u);
    setUsername(u.username);
    setRole(u.role);
    setCanManageProducts(u.can_manage_products);
    setError(null);
    setFormOpen(true);
  }

  function openPasswordForm(u: User) {
    setSelectedUser(u);
    setPassword("");
    setError(null);
    setPasswordOpen(true);
  }

  async function handleSaveAccount() {
    setError(null);
    try {
      if (selectedUser) {
        await updateUser({
          id: selectedUser.id,
          username,
          role,
          can_manage_products: canManageProducts,
        });
      } else {
        await createUser({
          username,
          password_hash: password, // The backend handles hashing
          role,
          can_manage_products: canManageProducts,
        });
      }
      setFormOpen(false);
      loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function handleSavePassword() {
    if (!selectedUser) return;
    setError(null);
    try {
      await updatePassword({
        id: selectedUser.id,
        new_password: password,
      });
      setPasswordOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function handleDelete(u: User) {
    if (u.id === currentUser?.id) {
      alert("You cannot delete your own account.");
      return;
    }
    if (!window.confirm(`Are you sure you want to delete ${u.username}?`)) {
      return;
    }
    await deleteUser(u.id);
    loadUsers();
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Account Management</h1>
          <p className="mt-1 text-sm text-slate-500">Manage admins and clerks</p>
        </div>
        <Button onClick={openCreateForm}>Add Account</Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">Username</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Permissions</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium text-slate-900">{u.username}</td>
                <td className="px-4 py-3">
                  <Badge tone={u.role === "admin" ? "success" : "default"}>
                    {u.role}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  {u.can_manage_products ? (
                    <Badge tone="success">Can manage products</Badge>
                  ) : (
                    <Badge tone="default">POS only</Badge>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => openEditForm(u)}>Edit</Button>
                    <Button variant="secondary" onClick={() => openPasswordForm(u)}>Reset Password</Button>
                    <Button variant="danger" onClick={() => handleDelete(u)}>Delete</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={selectedUser ? "Edit Account" : "Add Account"}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveAccount}>Save</Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <Input label="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
          {!selectedUser && (
            <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          )}
          <label className="flex flex-col gap-1 text-sm text-slate-700">
            <span className="font-medium">Role</span>
            <select
              className="rounded-lg border border-slate-300 bg-white px-3 py-2"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="cashier">Cashier</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={canManageProducts}
              onChange={(e) => setCanManageProducts(e.target.checked)}
            />
            Can manage products (Add/Edit/Remove/Stock)
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      </Modal>

      <Modal
        open={passwordOpen}
        onClose={() => setPasswordOpen(false)}
        title={`Change Password for ${selectedUser?.username}`}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setPasswordOpen(false)}>Cancel</Button>
            <Button onClick={handleSavePassword}>Save Password</Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <Input label="New Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      </Modal>
    </div>
  );
}
