"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api-client";
import { Loader2, User, Bell, Lock, Settings, Trash2, AlertTriangle, Check } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
 const router = useRouter();
 const { user, logout } = useAuth();
 const [name, setName] = useState(user?.name || "");
 const [saving, setSaving] = useState(false);
 const [deleting, setDeleting] = useState(false);
 const [showDelete, setShowDelete] = useState(false);
 const [deleteConfirm, setDeleteConfirm] = useState("");
 const [deletePassword, setDeletePassword] = useState("");

 // Password change state
 const [currentPassword, setCurrentPassword] = useState("");
 const [newPassword, setNewPassword] = useState("");
 const [confirmPassword, setConfirmPassword] = useState("");
 const [changingPassword, setChangingPassword] = useState(false);

 // Notification prefs
 const [notifications, setNotifications] = useState({
 scan_complete: true,
 watchlist_changes: true,
 security_alerts: true,
 weekly_digest: false,
 marketing: false,
 });
 const [savingNotifications, setSavingNotifications] = useState(false);

 // Load notification preferences on mount
 useEffect(() => {
 async function loadPrefs() {
 const res = await api.getNotificationPrefs();
 if (res.data) {
 setNotifications((prev) => ({ ...prev, ...res.data }));
 }
 }
 loadPrefs();
 }, []);

 async function handleSaveProfile(e: React.FormEvent) {
 e.preventDefault();
 setSaving(true);
 const res = await api.updateProfile({ name });
 if (!res.error) {
 toast.success("Profile updated");
 } else {
 toast.error(res.error || "Failed to update profile");
 }
 setSaving(false);
 }

 async function handleChangePassword(e: React.FormEvent) {
 e.preventDefault();
 if (newPassword.length < 8) {
 toast.error("New password must be at least 8 characters");
 return;
 }
 if (newPassword !== confirmPassword) {
 toast.error("Passwords do not match");
 return;
 }
 if (currentPassword === newPassword) {
 toast.error("New password must be different from current password");
 return;
 }
 setChangingPassword(true);
 const res = await api.changePassword({
 current_password: currentPassword,
 new_password: newPassword,
 });
 if (!res.error) {
 toast.success("Password changed successfully");
 setCurrentPassword("");
 setNewPassword("");
 setConfirmPassword("");
 } else {
 toast.error(res.error || "Failed to change password");
 }
 setChangingPassword(false);
 }

 async function handleSaveNotifications() {
 setSavingNotifications(true);
 const res = await api.updateNotificationPrefs(notifications);
 if (!res.error) {
 toast.success("Notification preferences saved");
 } else {
 toast.error(res.error || "Failed to save preferences");
 }
 setSavingNotifications(false);
 }

 async function handleDeleteAccount() {
 if (deleteConfirm !== "DELETE") return;
 if (!deletePassword) {
 toast.error("Please enter your password to confirm deletion");
 return;
 }
 setDeleting(true);
 const res = await api.deleteAccount(deletePassword);
 if (!res.error) {
 logout();
 router.push("/");
 toast.success("Account deleted");
 } else {
 toast.error(res.error || "Failed to delete account");
 }
 setDeleting(false);
 }

 return (
 <div className="dashboard-page mx-auto max-w-2xl">
 {/* Profile */}
 <div className="bg-card border border-border rounded-xl p-6">
 <div className="flex items-center gap-2 mb-4">
 <User className="w-5 h-5 text-teal-700" />
 <h3 className="font-semibold">Profile</h3>
 </div>
 <form onSubmit={handleSaveProfile} className="space-y-4">
 <div>
 <label className="block text-sm font-medium mb-1.5">Name</label>
 <input
 type="text"
 value={name}
 onChange={(e) => setName(e.target.value)}
 className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500/40"
 />
 </div>
 <div>
 <label className="block text-sm font-medium mb-1.5">Email</label>
 <input
 type="email"
 value={user?.email || ""}
 disabled
 className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-muted-foreground cursor-not-allowed"
 />
 <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
 </div>
 <button
 type="submit"
 disabled={saving}
 className="px-4 py-2 bg-teal-600 hover:bg-teal-500 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
 >
 {saving && <Loader2 className="w-4 h-4 animate-spin" />}
 Save Profile
 </button>
 </form>
 </div>

 {/* Change Password */}
 <div className="bg-card border border-border rounded-xl p-6">
 <div className="flex items-center gap-2 mb-4">
 <Lock className="w-5 h-5 text-teal-700" />
 <h3 className="font-semibold">Change Password</h3>
 </div>
 <form onSubmit={handleChangePassword} className="space-y-4">
 <div>
 <label className="block text-sm font-medium mb-1.5">Current Password</label>
 <input
 type="password"
 value={currentPassword}
 onChange={(e) => setCurrentPassword(e.target.value)}
 required
 autoComplete="current-password"
 className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500/40"
 />
 </div>
 <div>
 <label className="block text-sm font-medium mb-1.5">New Password</label>
 <input
 type="password"
 value={newPassword}
 onChange={(e) => setNewPassword(e.target.value)}
 required
 minLength={8}
 autoComplete="new-password"
 className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500/40"
 />
 <p className="text-xs text-muted-foreground mt-1">Minimum 8 characters</p>
 </div>
 <div>
 <label className="block text-sm font-medium mb-1.5">Confirm New Password</label>
 <input
 type="password"
 value={confirmPassword}
 onChange={(e) => setConfirmPassword(e.target.value)}
 required
 minLength={8}
 autoComplete="new-password"
 className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500/40"
 />
 </div>
 <button
 type="submit"
 disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
 className="px-4 py-2 bg-teal-600 hover:bg-teal-500 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
 >
 {changingPassword && <Loader2 className="w-4 h-4 animate-spin" />}
 Change Password
 </button>
 </form>
 </div>

 {/* Notifications */}
 <div className="bg-card border border-border rounded-xl p-6">
 <div className="flex items-center gap-2 mb-4">
 <Bell className="w-5 h-5 text-teal-700" />
 <h3 className="font-semibold">Notification Preferences</h3>
 </div>
 <div className="space-y-4">
 {Object.entries(notifications).map(([key, enabled]) => (
 <label key={key} className="flex items-center justify-between cursor-pointer">
 <span className="text-sm capitalize">{key.replace(/_/g, " ")}</span>
 <div
 onClick={() =>
 setNotifications((prev) => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))
 }
 className={`w-10 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${
 enabled ? "bg-teal-500" : "bg-secondary"
 }`}
 >
 <div
 className={`w-5 h-5 rounded-full bg-card transition-transform ${
 enabled ? "translate-x-4" : "translate-x-0"
 }`}
 />
 </div>
 </label>
 ))}
 <button
 onClick={handleSaveNotifications}
 disabled={savingNotifications}
 className="px-4 py-2 bg-teal-600 hover:bg-teal-500 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
 >
 {savingNotifications && <Loader2 className="w-4 h-4 animate-spin" />}
 Save Preferences
 </button>
 </div>
 </div>

 {/* Default scan settings */}
 <div className="bg-card border border-border rounded-xl p-6">
 <div className="flex items-center gap-2 mb-4">
 <Settings className="w-5 h-5 text-teal-700" />
 <h3 className="font-semibold">Default Scan Settings</h3>
 </div>
 <p className="text-sm text-muted-foreground">
 Default settings are applied to new scans automatically. These can be overridden per scan.
 </p>
 <div className="mt-4 space-y-3">
 <label className="flex items-center justify-between">
 <span className="text-sm">Include AI insights</span>
 <div className="w-10 h-6 rounded-full p-0.5 bg-teal-500 cursor-pointer">
 <div className="w-5 h-5 rounded-full bg-card translate-x-4" />
 </div>
 </label>
 <label className="flex items-center justify-between">
 <span className="text-sm">Deep security scan</span>
 <div className="w-10 h-6 rounded-full p-0.5 bg-teal-500 cursor-pointer">
 <div className="w-5 h-5 rounded-full bg-card translate-x-4" />
 </div>
 </label>
 <label className="flex items-center justify-between">
 <span className="text-sm">Auto-detect competitors</span>
 <div className="w-10 h-6 rounded-full p-0.5 bg-secondary cursor-pointer">
 <div className="w-5 h-5 rounded-full bg-card translate-x-0" />
 </div>
 </label>
 </div>
 </div>

 {/* Delete account */}
 <div className="bg-card border border-red-500/20 rounded-xl p-6">
 <div className="flex items-center gap-2 mb-2">
 <Trash2 className="w-5 h-5 text-red-400" />
 <h3 className="font-semibold text-red-400">Danger Zone</h3>
 </div>
 <p className="text-sm text-muted-foreground mb-4">
 Permanently delete your account and all associated data. This action cannot be undone.
 </p>
 {!showDelete ? (
 <button
 onClick={() => setShowDelete(true)}
 className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm font-medium transition-colors border border-red-500/20"
 >
 Delete Account
 </button>
 ) : (
 <div className="space-y-3 p-4 bg-red-500/5 rounded-lg border border-red-500/20">
 <div className="flex items-start gap-2">
 <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
 <p className="text-sm text-red-400">
 Type <strong>DELETE</strong> and enter your password to confirm permanent account
 deletion.
 </p>
 </div>
 <input
 type="text"
 value={deleteConfirm}
 onChange={(e) => setDeleteConfirm(e.target.value)}
 placeholder="Type DELETE"
 className="w-full px-3 py-2.5 bg-background border border-red-500/20 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-500/40"
 />
 <input
 type="password"
 value={deletePassword}
 onChange={(e) => setDeletePassword(e.target.value)}
 placeholder="Enter your password"
 autoComplete="current-password"
 className="w-full px-3 py-2.5 bg-background border border-red-500/20 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-500/40"
 />
 <div className="flex gap-3">
 <button
 onClick={() => {
 setShowDelete(false);
 setDeleteConfirm("");
 setDeletePassword("");
 }}
 className="px-4 py-2 bg-secondary rounded-lg text-sm font-medium"
 >
 Cancel
 </button>
 <button
 onClick={handleDeleteAccount}
 disabled={deleteConfirm !== "DELETE" || !deletePassword || deleting}
 className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2 transition-colors"
 >
 {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
 Delete My Account
 </button>
 </div>
 </div>
 )}
 </div>
 </div>
 );
}
