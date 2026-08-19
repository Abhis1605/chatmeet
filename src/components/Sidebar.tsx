"use client";

import { useState } from "react";
import { SIDEBAR_TOP, SIDEBAR_BOTTOM } from "@/lib/sidebarConfig";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useChatUIStore } from "@/store/chat-ui-store";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { logoutUser } from "@/services/auth.service";
import { showError } from "@/lib/toast";

export default function Sidebar() {
  const { activeTab, setActiveTab, sidebarCollapsed: collapsed, setSidebarCollapsed: setCollapsed } = useChatUIStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();

  const confirmLogout = async (toastId: string | number) => {
    if (isLoggingOut) return;

    toast.dismiss(toastId);
    const loadingToastId = toast.loading("Logging out...");
    setIsLoggingOut(true);

    try {
      const data = await logoutUser();

      if (data.error) {
        throw new Error(data.error);
      }

      await signOut({ redirect: false, callbackUrl: "/login" });
      toast.dismiss(loadingToastId);
      toast.success("Logged out successfully");
      router.push("/login");
      router.refresh();
    } catch (error) {
      toast.dismiss(loadingToastId);
      showError(error instanceof Error ? error.message : "Failed to logout");
      setIsLoggingOut(false);
    }
  };

  const handleLogoutClick = () => {
    if (isLoggingOut) return;

    const toastId = toast("Are you sure you want to logout?", {
      description: "You will need to verify your email before signing in again.",
      duration: Infinity,
      action: {
        label: "Yes",
        onClick: () => void confirmLogout(toastId),
      },
      cancel: {
        label: "Cancel",
        onClick: () => toast.dismiss(toastId),
      },
    });
  };

  return (
    <div
      className={`h-screen flex flex-col bg-surface border-r border-border transition-all duration-300
      ${collapsed ? "w-18" : "w-45"}`}
    >
      {/* TOP */}
      <div>
        {/* Logo */}
        <div className="p-4 border-b border-border flex items-center justify-center">
          {!collapsed ? (
            <Image
              src="/chatmeet-logo.png"
              width={300}
              height={100}
              alt="chatmeet-logo"
            />

          ) : (
            <Image
              src="/chatmeet-collapsed-logo.png"
              width={60}
              height={50}
              alt="collapsed-logo"
            />
          )}
        </div>

        {/* TOP ITEMS */}
        <div className="mt-4 px-2 space-y-1">
          {SIDEBAR_TOP.map((item) => {
            const Icon = item.icon;

            return (
              <div key={item.id} className="relative group">
                <button
                  onClick={() => {
                    if (
                      item.id === "personal" ||
                      item.id === "group" ||
                      item.id === "room" ||
                      item.id === "video"
                    ) {
                      setActiveTab(item.id);
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition
                  ${collapsed ? "justify-center" : ""}
                  ${
                    activeTab === item.id
                      ? "bg-surface-soft text-foreground"
                      : "text-muted hover:bg-surface-soft hover:text-foreground"
                  }`}
                >
                  <Icon size={18} />
                  {!collapsed && <span>{item.label}</span>}
                </button>

                {/* TOOLTIP */}
                {collapsed && (
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2
                    hidden group-hover:flex items-center
                    bg-surface border border-border text-foreground text-xs
                    px-2 py-1 rounded shadow-md whitespace-nowrap
                    opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0
                    transition-all duration-200 z-50">
                    {item.label}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* BOTTOM */}
      <div className="mt-auto">
        <div className="px-2 pb-2 space-y-1 border-t border-border pt-4">
          {SIDEBAR_BOTTOM.map((item) => {
            const Icon = item.icon;

            return (
              <div key={item.id} className="relative group">
                <button
                  onClick={() => {
                    if (item.id === "logout") {
                      handleLogoutClick();
                    }
                  }}
                  disabled={item.id === "logout" && isLoggingOut}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition
                  text-muted hover:bg-surface-soft hover:text-foreground
                  disabled:opacity-50 disabled:cursor-not-allowed
                  ${collapsed ? "justify-center" : ""}`}
                >
                  <Icon size={18} />
                  {!collapsed && <span>{item.label}</span>}
                </button>

                {/* TOOLTIP */}
                {collapsed && (
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2
                    hidden group-hover:flex items-center
                    bg-surface border border-border text-foreground text-xs
                    px-2 py-1 rounded shadow-md whitespace-nowrap
                    opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0
                    transition-all duration-200 z-50">
                    {item.label}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* TOGGLE BUTTON */}
        <div className="px-2 pb-4">
          <div className="relative group">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-surface-soft transition
              ${collapsed ? "justify-center" : ""}`}
            >
              {collapsed ? (
                <ChevronRight size={18} />
              ) : (
                <>
                  <ChevronLeft size={18} />
                  {!collapsed && <span>Collapse</span>}
                </>
              )}
            </button>

            {/* TOOLTIP */}
            {collapsed && (
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2
                hidden group-hover:flex items-center
                bg-surface border border-border text-foreground text-xs
                px-2 py-1 rounded shadow-md whitespace-nowrap
                opacity-0 group-hover:opacity-100 transition-all duration-200 z-50">
                Toggle Sidebar
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
