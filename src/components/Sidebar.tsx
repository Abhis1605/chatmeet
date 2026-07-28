"use client";

import { useState } from "react";
import { SIDEBAR_TOP, SIDEBAR_BOTTOM } from "@/lib/sidebarConfig";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useChatUIStore } from "@/store/chat-ui-store";

export default function Sidebar() {
  const { activeTab, setActiveTab, sidebarCollapsed: collapsed, setSidebarCollapsed: setCollapsed } = useChatUIStore();

  return (
    <div
      className={`h-screen flex flex-col bg-[#0b1220] border-r border-white/10 transition-all duration-300
      ${collapsed ? "w-18" : "w-45"}`}
    >
      {/* TOP */}
      <div>
        {/* Logo */}
        <div className="p-4 border-b border-white/10 flex items-center justify-center">
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
                  onClick={() => setActiveTab(item.id as "group" | "personal")}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition
                  ${collapsed ? "justify-center" : ""}
                  ${
                    activeTab === item.id
                      ? "bg-white/10 text-white"
                      : "text-gray-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon size={18} />
                  {!collapsed && <span>{item.label}</span>}
                </button>

                {/* TOOLTIP */}
                {collapsed && (
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2
                    hidden group-hover:flex items-center
                    bg-[#111827] border border-white/10 text-white text-xs
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
        <div className="px-2 pb-2 space-y-1 border-t border-white/10 pt-4">
          {SIDEBAR_BOTTOM.map((item) => {
            const Icon = item.icon;

            return (
              <div key={item.id} className="relative group">
                <button
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition
                  text-gray-400 hover:bg-white/5 hover:text-white
                  ${collapsed ? "justify-center" : ""}`}
                >
                  <Icon size={18} />
                  {!collapsed && <span>{item.label}</span>}
                </button>

                {/* TOOLTIP */}
                {collapsed && (
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2
                    hidden group-hover:flex items-center
                    bg-[#111827] border border-white/10 text-white text-xs
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
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-white/10 transition
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
                bg-[#111827] border border-white/10 text-white text-xs
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