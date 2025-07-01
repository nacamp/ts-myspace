import { Header } from '@/components/header'
import { notFound } from 'next/navigation'

interface ChatPageProps {
  params: {
    id: string
  }
}

// 샘플 채팅 데이터
const chatData = {
  '1': {
    title: 'React 컴포넌트 최적화',
    messages: [
      {
        id: 1,
        role: 'user',
        content: 'React 컴포넌트를 최적화하는 방법에 대해 알려주세요. 특히 렌더링 성능 개선에 대해 궁금합니다.',
        timestamp: new Date('2024-01-15T10:00:00')
      },
      {
        id: 2,
        role: 'assistant',
        content: 'React 컴포넌트 최적화에 대해 설명드리겠습니다. 렌더링 성능을 개선하는 주요 방법들은 다음과 같습니다:\n\n**1. React.memo 사용**\n컴포넌트의 props가 변경되지 않았을 때 리렌더링을 방지합니다.\n\n**2. useMemo와 useCallback 활용**\nexpensive 계산이나 함수 생성을 메모이제이션하여 최적화합니다.\n\n**3. 컴포넌트 분할**\n큰 컴포넌트를 작은 단위로 나누어 필요한 부분만 리렌더링되도록 합니다.',
        timestamp: new Date('2024-01-15T10:01:00')
      }
    ]
  },
  '2': {
    title: 'Next.js 라우팅 질문',
    messages: [
      {
        id: 1,
        role: 'user',
        content: 'Next.js 13의 App Router에 대해 설명해주세요.',
        timestamp: new Date('2024-01-14T15:30:00')
      },
      {
        id: 2,
        role: 'assistant',
        content: 'Next.js 13의 App Router는 React Server Components를 기반으로 한 새로운 라우팅 시스템입니다. 주요 특징은 다음과 같습니다:\n\n**1. 파일 기반 라우팅**\n- app 디렉토리 내의 폴더 구조가 URL 경로가 됩니다\n- page.tsx 파일이 해당 경로의 페이지가 됩니다\n\n**2. 레이아웃 시스템**\n- layout.tsx로 중첩 레이아웃 구현\n- 자동으로 상위 레이아웃을 상속받습니다',
        timestamp: new Date('2024-01-14T15:31:00')
      }
    ]
  },
  'new': {
    title: '새 대화',
    messages: []
  }
}

export default function ChatPage({ params }: ChatPageProps) {
  const chat = chatData[params.id as keyof typeof chatData]
  
  if (!chat) {
    notFound()
  }

  return (
    <>
      <Header title={chat.title} />
      <div>test....</div>
    </>
  )
}