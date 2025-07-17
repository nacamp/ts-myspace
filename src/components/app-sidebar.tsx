// components/app-sidebar.tsx
"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  X,
  Plus,
  Search,
  User,
  ChevronDown,
  MessageSquare,
  Settings,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/providers/sidebar-provider";

// 메뉴 아이템
const menuItems = [
  { name: "홈", href: "/", icon: MessageSquare },
  { name: "설정", href: "/settings", icon: Settings },
  { name: "freqtrade", href: "/freqtrade", icon: FileText },
  { name: "deposit", href: "/deposit", icon: FileText },
  { name: "decision", href: "/decision", icon: FileText },
];

export function AppSidebar() {
  const { sidebarOpen, isMobile, toggleSidebar } = useSidebar();
  const pathname = usePathname();

  return (
    <>
      {/* 모바일 오버레이 */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={toggleSidebar}
        />
      )}

      {/* 사이드바 */}
      <div
        className={`
        ${isMobile ? "fixed" : "relative"} 
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        ${isMobile ? "z-50" : "z-10"}
        ${isMobile ? "w-80" : sidebarOpen ? "w-80" : "w-0"}
        h-full border-r border-gray-200 transition-all duration-300 ease-in-out
        flex flex-col overflow-hidden
      `}
      >
        {/* 사이드바 헤더 */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold">My Space</h1>
            {isMobile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSidebar}
                className="p-1 h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* 메뉴 네비게이션 */}
        <div className="p-4 border-b border-gray-200">
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link key={item.name} href={item.href}>
                  <div
                    className={`
                    flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200
                    ${isActive ? "bg-gray-950 border " : ""}
                  `}
                  >
                    <Icon className="h-4 w-4 mr-3" />
                    {item.name}
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </>
  );
}
