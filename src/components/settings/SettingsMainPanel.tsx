"use client";

import { useState } from "react";
import { AlertTriangle, UserX } from "lucide-react";
import { useSettings } from "@/hooks/queries/use-settings";
import { useUpdateSettings } from "@/hooks/mutations/use-update-settings";
import { useBlockedUsers } from "@/hooks/queries/use-blocked-users";
import { useUnblockUser } from "@/hooks/mutations/use-unblock-user";
import { useDeleteAccount } from "@/hooks/mutations/use-delete-account";
import { showError } from "@/lib/toast";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Spinner from "@/components/Spinner";

const THEME_OPTIONS = [
  { value: "LIGHT", label: "Light" },
  { value: "DARK", label: "Dark" },
  { value: "SYSTEM", label: "System" },
] as const;

export default function SettingsMainPanel() {
  const { data: settings, isLoading } = useSettings();
  const { mutate: updateSettings, isPending: saving } = useUpdateSettings();

  if (isLoading || !settings) {
    return (
      <div className="h-full flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-border bg-surface px-8 py-6">
        <h2 className="text-foreground text-lg font-semibold">Settings</h2>
        <p className="text-muted text-sm">Manage how ChatMeet looks and behaves for you</p>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl">
          {/* Theme */}
          <section className="rounded-xl border border-border bg-surface p-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Theme</h3>
            <div className="grid grid-cols-3 gap-2">
              {THEME_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  disabled={saving}
                  onClick={() => updateSettings({ theme: opt.value })}
                  className={`text-sm px-3 py-2 rounded-md border transition cursor-pointer disabled:cursor-not-allowed ${
                    settings.theme === opt.value
                      ? "border-primary bg-primary-soft text-primary"
                      : "border-border text-foreground hover:bg-surface-soft"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </section>

          {/* Chat behavior */}
          <section className="rounded-xl border border-border bg-surface p-5 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Chat behavior</h3>
            <ToggleRow
              label={settings.enterToSend ? "Enter to send (Shift+Enter for new line)" : "Shift+Enter to send"}
              checked={settings.enterToSend}
              disabled={saving}
              onChange={(checked) => updateSettings({ enterToSend: checked })}
            />
            <ToggleRow
              label="Send read receipts"
              checked={settings.readReceiptsEnabled}
              disabled={saving}
              onChange={(checked) => updateSettings({ readReceiptsEnabled: checked })}
            />
            <ToggleRow
              label="Show typing indicator to others"
              checked={settings.showTypingIndicator}
              disabled={saving}
              onChange={(checked) => updateSettings({ showTypingIndicator: checked })}
            />
          </section>

          {/* Notifications */}
          <section className="rounded-xl border border-border bg-surface p-5 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
            <ToggleRow
              label="Mute all notifications"
              checked={settings.notificationsMuted}
              disabled={saving}
              onChange={(checked) => updateSettings({ notificationsMuted: checked })}
            />
            <ToggleRow
              label="Message notification sound"
              checked={settings.notificationSound}
              disabled={saving || settings.notificationsMuted}
              onChange={(checked) => updateSettings({ notificationSound: checked })}
            />
            <ToggleRow
              label="In-app notification toast"
              checked={settings.notificationToast}
              disabled={saving || settings.notificationsMuted}
              onChange={(checked) => updateSettings({ notificationToast: checked })}
            />
          </section>

          {/* Privacy - blocked users */}
          <BlockedUsersSection />

          {/* Account */}
          <DeleteAccountSection />
        </div>
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  checked: boolean;
  disabled: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between px-3 py-2 rounded-md bg-surface-soft border border-border">
      <span className="text-sm text-foreground">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-5 rounded-full transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
          checked ? "bg-primary" : "bg-border"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

function BlockedUsersSection() {
  const { data: blockedUsers, isLoading } = useBlockedUsers();
  const { mutate: unblock, isPending: unblocking } = useUnblockUser();

  return (
    <section className="rounded-xl border border-border bg-surface p-5 space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Blocked users</h3>

      {isLoading ? (
        <p className="text-sm text-muted">Loading...</p>
      ) : !blockedUsers || blockedUsers.length === 0 ? (
        <p className="text-sm text-muted">You haven&apos;t blocked anyone</p>
      ) : (
        <div className="space-y-2">
          {blockedUsers.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between px-3 py-2 rounded-md bg-surface-soft border border-border"
            >
              <div className="flex items-center gap-2 min-w-0">
                <img
                  src={user.image || "/default-avatar.png"}
                  alt={user.name || "user"}
                  className="w-7 h-7 rounded-full object-cover border border-border shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-sm text-foreground truncate">{user.name || "Unnamed"}</p>
                  {user.username && <p className="text-xs text-muted truncate">@{user.username}</p>}
                </div>
              </div>
              <button
                type="button"
                onClick={() => unblock(user.blockedId)}
                disabled={unblocking}
                className="text-xs px-3 py-1.5 rounded-md border border-border text-foreground hover:bg-surface transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              >
                Unblock
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function DeleteAccountSection() {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const { mutate: deleteAccount, isPending: deleting } = useDeleteAccount();
  const router = useRouter();

  const submitDelete = () => {
    if (confirmation !== "DELETE") {
      showError('Type "DELETE" to confirm');
      return;
    }
    deleteAccount(
      { confirmation },
      {
        onSuccess: async (data) => {
          if (data.error) {
            showError(data.error);
            return;
          }
          await signOut({ redirect: false, callbackUrl: "/login" });
          router.push("/login");
          router.refresh();
        },
      },
    );
  };

  return (
    <section className="rounded-xl border border-error/40 bg-surface p-5 space-y-3">
      <h3 className="text-sm font-semibold text-error flex items-center gap-2">
        <AlertTriangle className="w-4 h-4" />
        Danger zone
      </h3>

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full flex items-center justify-center gap-2 text-sm px-3 py-2 rounded-md border border-error text-error hover:bg-error/10 transition cursor-pointer"
        >
          <UserX className="w-4 h-4" />
          Delete account
        </button>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-muted">
            This will permanently anonymize your account and cannot be undone. You will lose access to
            your profile, and this action is irreversible. Type <span className="font-mono text-foreground">DELETE</span> to confirm.
          </p>
          <input
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            placeholder="DELETE"
            className="w-full rounded-lg bg-surface-soft px-3 py-2 text-sm text-foreground outline-none border border-border focus:border-error"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={submitDelete}
              disabled={deleting || confirmation !== "DELETE"}
              className="flex-1 text-sm px-3 py-2 rounded-md bg-error text-on-primary transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deleting ? "Deleting..." : "Permanently delete my account"}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setConfirmation("");
              }}
              disabled={deleting}
              className="text-sm px-3 py-2 rounded-md border border-border text-muted hover:text-foreground cursor-pointer disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
