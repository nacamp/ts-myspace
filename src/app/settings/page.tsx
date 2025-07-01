
'use client'

import Link from 'next/link'
import { User, CreditCard, Bell, Shield, Palette, Globe } from 'lucide-react'

const settingsItems = [
  {
    icon: User,
    title: '프로필',
    description: '개인 정보 및 프로필 설정',
    href: '/settings/profile',
    color: 'text-blue-600 bg-blue-100'
  },
  {
    icon: CreditCard,
    title: '결제 및 구독',
    description: '구독 플랜 및 결제 정보 관리',
    href: '/settings/billing',
    color: 'text-green-600 bg-green-100'
  },
  {
    icon: Bell,
    title: '알림',
    description: '알림 설정 및 권한 관리',
    href: '/settings/notifications',
    color: 'text-yellow-600 bg-yellow-100'
  },
  {
    icon: Shield,
    title: '보안',
    description: '비밀번호 및 보안 설정',
    href: '/settings/security',
    color: 'text-red-600 bg-red-100'
  },
  {
    icon: Palette,
    title: '테마',
    description: '화면 테마 및 디스플레이 설정',
    href: '/settings/theme',
    color: 'text-purple-600 bg-purple-100'
  },
  {
    icon: Globe,
    title: '언어',
    description: '언어 및 지역 설정',
    href: '/settings/language',
    color: 'text-indigo-600 bg-indigo-100'
  }
]

export default function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">설정</h1>
        <p className="text-gray-600">앱 설정을 관리하고 개인화하세요</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {settingsItems.map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className="block p-6 bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all"
          >
            <div className="flex items-start space-x-4">
              <div className={`p-3 rounded-lg ${item.color}`}>
                <item.icon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {item.title}
                </h3>
                <p className="text-gray-600 text-sm">
                  {item.description}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* 추가 정보 */}
      <div className="mt-12 p-6 bg-gray-50 rounded-lg">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">앱 정보</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-600">버전</p>
            <p className="font-medium">v1.0.0</p>
          </div>
          <div>
            <p className="text-gray-600">마지막 업데이트</p>
            <p className="font-medium">2024년 12월 20일</p>
          </div>
          <div>
            <p className="text-gray-600">지원</p>
            <Link href="/support" className="font-medium text-blue-600 hover:text-blue-700">
              도움말 센터
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}