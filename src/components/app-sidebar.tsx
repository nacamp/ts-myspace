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
import { Input } from "@/components/ui/input";
import { useSidebar } from "@/components/providers/sidebar-provider";

// 샘플 대화 데이터
const conversations = [
  { id: "1", title: "React 컴포넌트 최적화", date: "오늘", href: "/chat/1" },
  { id: "2", title: "Next.js 라우팅 질문", date: "어제", href: "/chat/2" },
  { id: "3", title: "TypeScript 타입 정의", date: "2일 전", href: "/chat/3" },
  { id: "4", title: "CSS Grid vs Flexbox", date: "3일 전", href: "/chat/4" },
  { id: "5", title: "API 연동 방법", date: "1주 전", href: "/chat/5" },
  { id: "6", title: "상태 관리 라이브러리", date: "1주 전", href: "/chat/6" },
  { id: "7", title: "성능 최적화 팁", date: "2주 전", href: "/chat/7" },
  { id: "8", title: "테스팅 전략", date: "2주 전", href: "/chat/8" },
];

// 메뉴 아이템
const menuItems = [
  { name: "홈", href: "/", icon: MessageSquare },
  { name: "설정", href: "/settings", icon: Settings },
  { name: "도움말", href: "/help", icon: FileText },
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
        h-full bg-white border-r border-red-200 transition-all duration-300 ease-in-out
        flex flex-col overflow-hidden
      `}
      >
        {/* 사이드바 헤더 */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-gray-900">Claude</h1>
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

          {/* 새 대화 버튼 */}
          <Link href="/chat/new">
            <Button className="w-full mb-3 bg-orange-500 hover:bg-orange-600 text-white">
              <Plus className="h-4 w-4 mr-2" />새 대화
            </Button>
          </Link>

          {/* 검색 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="대화 검색..."
              className="pl-10 bg-gray-50 border-gray-200"
            />
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
                    ${
                      isActive
                        ? "bg-orange-50 text-orange-900 border border-orange-200"
                        : "text-gray-700 hover:bg-gray-50"
                    }
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

        {/* 대화 목록 */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-1">
            <div className="text-xs font-medium text-gray-500 mb-2 px-2">
              최근 대화
            </div>
            {conversations.map((conv) => {
              const isActive = pathname === conv.href;
              return (
                <Link key={conv.id} href={conv.href}>
                  <div
                    className={`
                    p-3 rounded-lg cursor-pointer transition-colors duration-200
                    ${
                      isActive
                        ? "bg-orange-50 border border-orange-200 text-orange-900"
                        : "hover:bg-gray-50 text-gray-700"
                    }
                  `}
                  >
                    <div className="font-medium text-sm mb-1 truncate">
                      {conv.title}
                    </div>
                    <div className="text-xs text-gray-500">{conv.date}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* 사이드바 푸터 */}
        <div className="p-4 border-t border-gray-200">
          <Link href="/profile">
            <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">사용자</div>
                <div className="text-xs text-gray-500">무료 플랜</div>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </div>
          </Link>
        </div>
      </div>
    </>
  );
}
