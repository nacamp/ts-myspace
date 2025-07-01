// app/page.tsx
import { Header } from '@/components/header'
import Link from 'next/link'
import { MessageSquare, Zap, Shield, Globe } from 'lucide-react'

export default function HomePage() {
  const features = [
    {
      icon: MessageSquare,
      title: '자연스러운 대화',
      description: 'Claude와 자연스럽고 유용한 대화를 나누세요.'
    },
    {
      icon: Zap,
      title: '빠른 응답',
      description: '실시간으로 빠르고 정확한 답변을 받아보세요.'
    },
    {
      icon: Shield,
      title: '안전한 AI',
      description: '안전하고 도움이 되는 AI 어시스턴트입니다.'
    },
    {
      icon: Globe,
      title: '다양한 주제',
      description: '프로그래밍부터 일상 대화까지 다양한 주제를 다룹니다.'
    }
  ]

  return (
    <>
      <Header title="홈" />
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-6">
          {/* 환영 섹션 */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Claude에 오신 것을 환영합니다
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              AI 어시스턴트와 함께 새로운 대화를 시작해보세요
            </p>
            <Link 
              href="/chat/new"
              className="inline-flex items-center px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors duration-200"
            >
              <MessageSquare className="h-5 w-5 mr-2" />
              새 대화 시작하기
            </Link>
          </div>

          {/* 기능 카드 */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div key={index} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-orange-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </div>
              )
            })}
          </div>

          {/* 최근 대화 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">최근 대화</h2>
            <div className="space-y-3">
              {[
                { id: 1, title: 'React 컴포넌트 최적화', time: '2시간 전', href: '/chat/1' },
                { id: 2, title: 'Next.js 라우팅 질문', time: '어제', href: '/chat/2' },
                { id: 3, title: 'TypeScript 타입 정의', time: '2일 전', href: '/chat/3' }
              ].map((chat) => (
                <Link key={chat.id} href={chat.href}>
                  <div className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                    <MessageSquare className="h-5 w-5 text-gray-400 mr-3" />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{chat.title}</div>
                      <div className="text-sm text-gray-500">{chat.time}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}