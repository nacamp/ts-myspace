'use client'
import React, { useState, useEffect } from 'react';
import { Menu, X, Home, MessageSquare, Settings, User, FileText, Search, ChevronDown, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { Separator } from '@/components/ui/separator';

const SidebarLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // 모바일 감지
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // 샘플 대화 목록
  const conversations = [
    { id: 1, title: "React 컴포넌트 최적화", date: "오늘", active: true },
    { id: 2, title: "Next.js 라우팅 질문", date: "어제" },
    { id: 3, title: "TypeScript 타입 정의", date: "2일 전" },
    { id: 4, title: "CSS Grid vs Flexbox", date: "3일 전" },
    { id: 5, title: "API 연동 방법", date: "1주 전" },
    { id: 6, title: "상태 관리 라이브러리", date: "1주 전" },
    { id: 7, title: "성능 최적화 팁", date: "2주 전" },
    { id: 8, title: "테스팅 전략", date: "2주 전" },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 모바일 오버레이 */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={toggleSidebar}
        />
      )}

      {/* 사이드바 */}
      <div className={`
        ${isMobile ? 'fixed' : 'relative'} 
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        ${isMobile ? 'z-50' : 'z-10'}
        ${isMobile ? 'w-80' : sidebarOpen ? 'w-80' : 'w-0'}
        h-full bg-white border-r border-gray-200 transition-all duration-300 ease-in-out
        flex flex-col overflow-hidden
      `}>
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
          <Button className="w-full mb-3 bg-orange-500 hover:bg-orange-600 text-white">
            <Plus className="h-4 w-4 mr-2" />
            새 대화
          </Button>

          {/* 검색 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="대화 검색..." 
              className="pl-10 bg-gray-50 border-gray-200"
            />
          </div>
        </div>

        {/* 대화 목록 */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-1">
            <div className="text-xs font-medium text-gray-500 mb-2 px-2">최근 대화</div>
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className={`
                  p-3 rounded-lg cursor-pointer transition-colors duration-200
                  ${conv.active 
                    ? 'bg-orange-50 border border-orange-200 text-orange-900' 
                    : 'hover:bg-gray-50 text-gray-700'
                  }
                `}
              >
                <div className="font-medium text-sm mb-1 truncate">
                  {conv.title}
                </div>
                <div className="text-xs text-gray-500">
                  {conv.date}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 사이드바 푸터 */}
        <div className="p-4 border-t border-gray-200">
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
        </div>
      </div>

      {/* 메인 컨텐츠 영역 */}
      <div className={`
        flex-1 flex flex-col transition-all duration-300 ease-in-out
        ${isMobile ? 'w-full' : sidebarOpen ? 'ml-0' : 'ml-0 w-full'}
      `}>
        {/* 헤더 */}
        <header className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSidebar}
                className="p-2 h-8 w-8"
              >
                <Menu className="h-4 w-4" />
              </Button>
              <h2 className="text-lg font-semibold text-gray-900">
                {isMobile ? 'Claude' : 'React 컴포넌트 최적화'}
              </h2>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* 메인 컨텐츠 */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-4xl mx-auto p-6">
            {/* 대화 내용 */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900 mb-2">사용자</div>
                    <div className="text-gray-700">
                      React 컴포넌트를 최적화하는 방법에 대해 알려주세요. 특히 렌더링 성능 개선에 대해 궁금합니다.
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900 mb-2">Claude</div>
                    <div className="text-gray-700 leading-relaxed">
                      <p className="mb-4">
                        React 컴포넌트 최적화에 대해 설명드리겠습니다. 렌더링 성능을 개선하는 주요 방법들은 다음과 같습니다:
                      </p>
                      <p className="mb-4">
                        <strong>1. React.memo 사용</strong><br />
                        컴포넌트의 props가 변경되지 않았을 때 리렌더링을 방지합니다.
                      </p>
                      <p className="mb-4">
                        <strong>2. useMemo와 useCallback 활용</strong><br />
                        expensive 계산이나 함수 생성을 메모이제이션하여 최적화합니다.
                      </p>
                      <p>
                        <strong>3. 컴포넌트 분할</strong><br />
                        큰 컴포넌트를 작은 단위로 나누어 필요한 부분만 리렌더링되도록 합니다.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 입력 영역 */}
            <div className="mt-8 bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="p-4">
                <div className="flex items-end space-x-4">
                  <div className="flex-1">
                    <textarea
                      placeholder="메시지를 입력하세요..."
                      className="w-full resize-none border-0 focus:ring-0 focus:outline-none text-gray-700 placeholder-gray-400"
                      rows={3}
                    />
                  </div>
                  <Button className="bg-orange-500 hover:bg-orange-600 text-white px-6">
                    전송
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SidebarLayout;