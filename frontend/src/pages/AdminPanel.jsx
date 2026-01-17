import { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Users, Loader2, Shield } from "lucide-react";

const API_URL = "http://localhost:8000";

const ROLES = ["CONSUMER", "CONTRIBUTOR", "MODERATOR", "ADMIN"];

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/admin/users`);
      setUsers(response.data);
      setMessage("");
    } catch (error) {
      console.error("Failed to fetch users:", error);
      setMessage("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await axios.patch(`${API_URL}/admin/users/${userId}/role`, {
        role: newRole,
      });
      setMessage(`User role updated to ${newRole} successfully!`);
      fetchUsers();
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to update user role");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="h-8 w-8" />
          Admin Panel
        </h1>
        <Button onClick={fetchUsers} variant="outline">
          Refresh
        </Button>
      </div>

      {message && (
        <div className={`p-3 rounded ${message.includes("success") ? "bg-green-500/10 text-green-500" : "bg-yellow-500/10 text-yellow-500"}`}>
          {message}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="mb-4">No users loaded</p>
              <p className="text-sm">
                Note: The backend needs a GET /admin/users endpoint to list all users.
              </p>
              <p className="text-sm mt-2">
                For now, you can change user roles if you know their user ID using the form below.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  onRoleChange={handleRoleChange}
                />
              ))}
            </div>
          )}

          {/* Manual role change form */}
          <ManualRoleChangeForm onRoleChange={handleRoleChange} />
        </CardContent>
      </Card>
    </div>
  );
}

function UserRow({ user, onRoleChange }) {
  const [selectedRole, setSelectedRole] = useState(user.role);

  const handleChange = async () => {
    if (selectedRole !== user.role) {
      await onRoleChange(user.id, selectedRole);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex-1">
        <p className="font-semibold">{user.display_name}</p>
        <p className="text-sm text-muted-foreground">{user.email}</p>
      </div>
      <div className="flex items-center gap-4">
        <select
          className="px-3 py-2 border border-input bg-background rounded-md"
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
        >
          {ROLES.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
        <Button
          onClick={handleChange}
          disabled={selectedRole === user.role}
          size="sm"
        >
          Update
        </Button>
      </div>
    </div>
  );
}

function ManualRoleChangeForm({ onRoleChange }) {
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState("CONTRIBUTOR");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (userId) {
      await onRoleChange(parseInt(userId), role);
      setUserId("");
    }
  };

  return (
    <div className="mt-8 pt-8 border-t">
      <h3 className="text-lg font-semibold mb-4">Manual Role Change</h3>
      <form onSubmit={handleSubmit} className="flex gap-4 items-end">
        <div className="flex-1">
          <label className="text-sm font-semibold mb-2 block">User ID</label>
          <input
            type="number"
            className="w-full px-3 py-2 border border-input bg-background rounded-md"
            placeholder="Enter user ID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            required
          />
        </div>
        <div className="flex-1">
          <label className="text-sm font-semibold mb-2 block">New Role</label>
          <select
            className="w-full px-3 py-2 border border-input bg-background rounded-md"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit">Change Role</Button>
      </form>
    </div>
  );
}
