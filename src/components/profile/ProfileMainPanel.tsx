"use client";

import { useRef, useState } from "react";
import { Check, LogOut, Pencil, X } from "lucide-react";
import { useProfile } from "@/hooks/queries/use-profile";
import { useUpdateUserProfile } from "@/hooks/mutations/use-update-user-profile";
import { useChangePassword } from "@/hooks/mutations/use-change-password";
import { useUploadThing } from "@/lib/uploadthing";
import { PRESET_AVATARS } from "@/lib/avatars";
import { showError } from "@/lib/toast";
import Spinner from "@/components/Spinner";

interface ProfileMainPanelProps {
  onLogout: () => void;
}

const STATUS_OPTIONS = [
  { value: "ONLINE", label: "Online", dot: "bg-green-500" },
  { value: "AWAY", label: "Away", dot: "bg-yellow-500" },
  { value: "DND", label: "Do Not Disturb", dot: "bg-error" },
  { value: "INVISIBLE", label: "Invisible", dot: "bg-muted" },
] as const;

export default function ProfileMainPanel({ onLogout }: ProfileMainPanelProps) {
  const { data: profile, isLoading } = useProfile();
  const { mutate: updateProfile, isPending: saving } = useUpdateUserProfile();
  const { mutate: changePassword, isPending: changingPassword } = useChangePassword();
  const { startUpload, isUploading } = useUploadThing("avatarUploader", {
    onClientUploadComplete: (res) => {
      const url = res?.[0]?.ufsUrl;
      if (url) {
        updateProfile({ profilePhotoType: "PHOTO", imageUrl: url });
      }
    },
    onUploadError: () => showError("Failed to upload photo"),
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);

  const [editingField, setEditingField] = useState<"name" | "username" | "bio" | null>(null);
  const [draftValue, setDraftValue] = useState("");

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const startEdit = (field: "name" | "username" | "bio", value: string) => {
    setEditingField(field);
    setDraftValue(value);
  };

  const saveEdit = () => {
    if (!editingField) return;
    const trimmed = draftValue.trim();
    if (editingField !== "bio" && !trimmed) {
      showError("This field cannot be empty");
      return;
    }
    updateProfile(
      { [editingField]: trimmed },
      { onSuccess: () => setEditingField(null) },
    );
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    await startUpload([file]);
  };

  const selectAvatar = (filename: string) => {
    updateProfile(
      { profilePhotoType: "AVATAR", avatarFilename: filename },
      { onSuccess: () => setAvatarPickerOpen(false) },
    );
  };

  const submitPasswordChange = () => {
    if (!currentPassword || !newPassword) {
      showError("Both password fields are required");
      return;
    }
    changePassword(
      { currentPassword, newPassword },
      {
        onSuccess: (data) => {
          if (!data.error) {
            setCurrentPassword("");
            setNewPassword("");
            setShowPasswordForm(false);
          }
        },
      },
    );
  };

  const avatarSrc =
    profile?.profilePhotoType === "AVATAR" && profile.avatarFilename
      ? `/${profile.avatarFilename}`
      : profile?.image || "/default-avatar.png";

  if (isLoading || !profile) {
    return (
      <div className="h-full flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const currentStatus = STATUS_OPTIONS.find((s) => s.value === profile.statusPreference);

  return (
    <div className="h-full flex flex-col">
      {/* Header banner */}
      <div className="border-b border-border bg-surface px-8 py-6 flex items-center gap-5">
        <div className="relative shrink-0">
          <img
            src={avatarSrc}
            alt="avatar"
            className="w-20 h-20 rounded-full object-cover border border-border"
          />
          {currentStatus && (
            <span
              className={`absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full border-2 border-surface ${currentStatus.dot}`}
            />
          )}
          {isUploading && (
            <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
              <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-foreground text-lg font-semibold truncate">{profile.name || "Unnamed"}</p>
          <p className="text-muted text-sm truncate">
            {profile.username ? `@${profile.username}` : "No username set"}
          </p>
          {currentStatus && (
            <p className="text-muted text-xs mt-1 flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${currentStatus.dot}`} />
              {currentStatus.label}
            </p>
          )}
        </div>

        <div className="flex gap-2 shrink-0">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || saving}
            className="text-xs px-3 py-1.5 rounded-md border border-border text-foreground hover:bg-surface-soft transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Upload photo
          </button>
          <button
            type="button"
            onClick={() => setAvatarPickerOpen((v) => !v)}
            disabled={saving}
            className="text-xs px-3 py-1.5 rounded-md border border-border text-foreground hover:bg-surface-soft transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Choose avatar
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelected}
          />
        </div>
      </div>

      {avatarPickerOpen && (
        <div className="px-8 py-4 border-b border-border bg-surface">
          <div className="flex gap-3 flex-wrap max-w-2xl">
            {PRESET_AVATARS.map((filename) => {
              const isSelected =
                profile.profilePhotoType === "AVATAR" && profile.avatarFilename === filename;
              return (
                <button
                  key={filename}
                  type="button"
                  onClick={() => selectAvatar(filename)}
                  disabled={saving}
                  className={`relative rounded-full overflow-hidden border-2 transition cursor-pointer disabled:cursor-not-allowed ${
                    isSelected ? "border-primary" : "border-transparent hover:border-border"
                  }`}
                >
                  <img src={`/${filename}`} alt={filename} className="w-14 h-14 object-cover" />
                  {isSelected && (
                    <span className="absolute bottom-0 right-0 bg-primary rounded-full p-0.5">
                      <Check className="w-3 h-3 text-on-primary" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl">
          {/* Basic info card */}
          <section className="rounded-xl border border-border bg-surface p-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Basic info</h3>

            <EditableField
              label="Display name"
              value={profile.name || ""}
              editing={editingField === "name"}
              draftValue={draftValue}
              onDraftChange={setDraftValue}
              onEdit={() => startEdit("name", profile.name || "")}
              onSave={saveEdit}
              onCancel={() => setEditingField(null)}
              saving={saving}
            />

            <EditableField
              label="Username"
              value={profile.username ? `@${profile.username}` : "Not set"}
              editing={editingField === "username"}
              draftValue={draftValue}
              onDraftChange={setDraftValue}
              onEdit={() => startEdit("username", profile.username || "")}
              onSave={saveEdit}
              onCancel={() => setEditingField(null)}
              saving={saving}
            />

            <div>
              <label className="block text-xs text-muted mb-1">Email</label>
              <p className="text-foreground text-sm px-3 py-2 rounded-md bg-surface-soft border border-border">
                {profile.email}
              </p>
            </div>

            <EditableField
              label="Bio / status line"
              value={profile.bio || "No bio yet"}
              editing={editingField === "bio"}
              draftValue={draftValue}
              onDraftChange={setDraftValue}
              onEdit={() => startEdit("bio", profile.bio || "")}
              onSave={saveEdit}
              onCancel={() => setEditingField(null)}
              saving={saving}
              multiline
            />

            <div>
              <label className="block text-xs text-muted mb-1">Member since</label>
              <p className="text-foreground text-sm px-3 py-2 rounded-md bg-surface-soft border border-border">
                {new Date(profile.createdAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </section>

          {/* Status + privacy card */}
          <section className="rounded-xl border border-border bg-surface p-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Status &amp; privacy</h3>

            <div>
              <label className="block text-xs text-muted mb-1">Online status</label>
              <div className="grid grid-cols-2 gap-2">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={saving}
                    onClick={() => updateProfile({ statusPreference: opt.value })}
                    className={`text-sm px-3 py-2 rounded-md border transition flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed ${
                      profile.statusPreference === opt.value
                        ? "border-primary bg-primary-soft text-primary"
                        : "border-border text-foreground hover:bg-surface-soft"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${opt.dot}`} />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <ToggleRow
                label="Show my last seen"
                checked={profile.showLastSeen}
                disabled={saving}
                onChange={(checked) => updateProfile({ showLastSeen: checked })}
              />
              <ToggleRow
                label="Show my online status"
                checked={profile.showOnlineStatus}
                disabled={saving}
                onChange={(checked) => updateProfile({ showOnlineStatus: checked })}
              />
            </div>
          </section>

          {/* Security card */}
          <section className="rounded-xl border border-border bg-surface p-5 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Security</h3>

            {profile.provider === "credentials" ? (
              <>
                <button
                  type="button"
                  onClick={() => setShowPasswordForm((v) => !v)}
                  className="text-sm text-primary hover:underline cursor-pointer"
                >
                  {showPasswordForm ? "Cancel password change" : "Change password"}
                </button>

                {showPasswordForm && (
                  <div className="space-y-2 pt-1">
                    <input
                      type="password"
                      placeholder="Current password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full rounded-lg bg-surface-soft px-3 py-2 text-sm text-foreground outline-none border border-border focus:border-primary"
                    />
                    <input
                      type="password"
                      placeholder="New password (8+ chars)"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full rounded-lg bg-surface-soft px-3 py-2 text-sm text-foreground outline-none border border-border focus:border-primary"
                    />
                    <button
                      type="button"
                      onClick={submitPasswordChange}
                      disabled={changingPassword}
                      className="btn-primary w-full cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {changingPassword ? "Updating..." : "Update password"}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-muted">
                Signed in with {profile.provider.charAt(0).toUpperCase() + profile.provider.slice(1)}
              </p>
            )}
          </section>

          {/* Account actions card */}
          <section className="rounded-xl border border-border bg-surface p-5 flex flex-col justify-center">
            <h3 className="text-sm font-semibold text-foreground mb-3">Account</h3>
            <button
              type="button"
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 text-sm px-3 py-2 rounded-md border border-error text-error hover:bg-error/10 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}

interface EditableFieldProps {
  label: string;
  value: string;
  editing: boolean;
  draftValue: string;
  onDraftChange: (value: string) => void;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  multiline?: boolean;
}

function EditableField({
  label,
  value,
  editing,
  draftValue,
  onDraftChange,
  onEdit,
  onSave,
  onCancel,
  saving,
  multiline,
}: EditableFieldProps) {
  return (
    <div>
      <label className="block text-xs text-muted mb-1">{label}</label>
      {editing ? (
        <div className="flex items-start gap-2">
          {multiline ? (
            <textarea
              value={draftValue}
              onChange={(e) => onDraftChange(e.target.value)}
              rows={2}
              maxLength={200}
              className="flex-1 rounded-md bg-surface-soft px-3 py-2 text-sm text-foreground outline-none border border-border focus:border-primary resize-none"
            />
          ) : (
            <input
              value={draftValue}
              onChange={(e) => onDraftChange(e.target.value)}
              className="flex-1 rounded-md bg-surface-soft px-3 py-2 text-sm text-foreground outline-none border border-border focus:border-primary"
            />
          )}
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="p-2 rounded-md bg-primary text-on-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="p-2 rounded-md border border-border text-muted hover:text-foreground cursor-pointer disabled:cursor-not-allowed"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between px-3 py-2 rounded-md bg-surface-soft border border-border">
          <p className="text-foreground text-sm truncate">{value}</p>
          <button
            type="button"
            onClick={onEdit}
            className="text-muted hover:text-foreground shrink-0 ml-2 cursor-pointer"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
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
