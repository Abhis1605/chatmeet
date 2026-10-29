"use client";

import { SIDEBAR_TOP, SIDEBAR_BOTTOM } from "@/lib/sidebarConfig";
import { ChevronLeft, ChevronRight, Menu, X } from "lucide-react";
import Image from "next/image";
import { useChatUIStore } from "@/store/chat-ui-store";
import { useLogout } from "@/hooks/use-logout";
import { useState } from "react";

export default function Sidebar() {
  const { activeTab, setActiveTab, setMobilePanel, sidebarCollapsed: collapsed, setSidebarCollapsed: setCollapsed } = useChatUIStore();
  const { isLoggingOut, handleLogoutClick } = useLogout();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const selectTab = (tab: "personal" | "group" | "room" | "video" | "profile" | "settings") => {
    setActiveTab(tab);
    setMobilePanel(tab === "profile" || tab === "settings" ? "detail" : "list");
    setMobileMenuOpen(false);
  };

  const handleBottomItem = (id: string) => {
    if (id === "logout") {
      handleLogoutClick();
      setMobileMenuOpen(false);
    } else if (id === "profile" || id === "settings") {
      selectTab(id);
    }
  };

  return (
    <>
      <div className="fixed left-0 right-0 top-0 z-50 hidden h-14 items-center justify-between border-b border-border bg-surface px-4 max-lg:flex">
        <Image
          src="/chatmeet-logo.png"
          width={135}
          height={45}
          alt="ChatMeet"
          className="h-8 w-auto object-contain"
        />
        <button
          type="button"
          onClick={() => setMobileMenuOpen((open) => !open)}
          aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={mobileMenuOpen}
          className="rounded-md p-2 text-foreground hover:bg-surface-soft"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="fixed inset-x-0 top-14 z-40 max-h-[calc(100dvh-7.5rem)] overflow-y-auto border-b border-border bg-surface p-3 shadow-lg lg:hidden">
          <nav aria-label="Mobile navigation" className="space-y-1">
            {[...SIDEBAR_TOP, ...SIDEBAR_BOTTOM].map((item) => {
              const Icon = item.icon;
              const isLogout = item.id === "logout";
              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={isLogout && isLoggingOut}
                  onClick={() => isLogout ? handleBottomItem(item.id) : selectTab(item.id as "personal" | "group" | "room" | "video" | "profile" | "settings")}
                  className={`flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-sm transition hover:bg-surface-soft disabled:cursor-not-allowed disabled:opacity-50 ${
                    activeTab === item.id ? "bg-surface-soft text-foreground" : "text-muted"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      )}

      <div
        className={`safe-area-bottom z-20 flex shrink-0 flex-col bg-surface border-r border-border transition-all duration-300
      ${collapsed ? "w-18" : "w-45"} max-lg:fixed max-lg:bottom-0 max-lg:left-0 max-lg:right-0 max-lg:h-16 max-lg:w-full max-lg:flex-row max-lg:border-r-0 max-lg:border-t`}
      >
      {/* TOP */}
      <div className="max-lg:flex max-lg:flex-1 max-lg:items-center">
        {/* Logo */}
        <div className="p-4 border-b border-border flex items-center justify-center max-lg:hidden">
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
        <div className="mt-4 px-2 space-y-1 max-lg:mt-0 max-lg:flex max-lg:w-full max-lg:justify-around">
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
                      selectTab(item.id);
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition cursor-pointer
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
        <div className="px-2 pb-2 space-y-1 border-t border-border pt-4 max-lg:hidden">
          {SIDEBAR_BOTTOM.map((item) => {
            const Icon = item.icon;

            return (
              <div key={item.id} className="relative group">
                <button
                  onClick={() => {
                    handleBottomItem(item.id);
                  }}
                  disabled={item.id === "logout" && isLoggingOut}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition cursor-pointer
                  disabled:opacity-50 disabled:cursor-not-allowed
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

        {/* TOGGLE BUTTON */}
        <div className="px-2 pb-4 max-lg:hidden">
          <div className="relative group">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-surface-soft transition cursor-pointer
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
    </>
  );
}
