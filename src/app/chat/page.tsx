'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MessageSquare, Plus, Search } from 'lucide-react'

// 더미 데이터
const mockChats = [
  { id: '1', title: '일반 대화', lastMessage: '안녕하세요!', timestamp: '2분 전', unread: 2 },
  { id: '2', title: '프로젝트 논의', lastMessage: '내일 미팅은 몇 시인가요?', timestamp: '1시간 전', unread: 0 },
  { id: '3', title: '친구들과의 채팅', lastMessage: '오늘 저녁에 만날까요?', timestamp: '3시간 전', unread: 1 },
  { id: '4', title: '업무 채팅', lastMessage: '보고서 검토 완료했습니다.', timestamp: '어제', unread: 0 },
]

export default function ChatListPage() {
  const [searchQuery, setSearchQuery] = useState('')
  
  const filteredChats = mockChats.filter(chat =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="h-full flex flex-col bg-white">
      {/* 헤더 */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">채팅</h1>
          <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="mr-2 h-4 w-4" />
            새 채팅
          </button>
        </div>
        
        {/* 검색 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="채팅 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* 채팅 목록 */}
      <div className="flex-1 overflow-y-auto">
        {filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <MessageSquare className="h-12 w-12 mb-4" />
            <p>검색 결과가 없습니다</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredChats.map((chat) => (
              <Link
                key={chat.id}
                href={`/chat/${chat.id}`}
                className="block p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <MessageSquare className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {chat.title}
                      </p>
                      <div className="flex items-center space-x-2">
                        <p className="text-xs text-gray-500">{chat.timestamp}</p>
                        {chat.unread > 0 && (
                          <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                            {chat.unread}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 truncate">{chat.lastMessage}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}