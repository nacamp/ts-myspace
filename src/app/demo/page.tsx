'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function Next() {
  const router = useRouter()

  const handleGoBack = () => {
    router.back() // 이전 페이지로
  }

  const handleGoHome = () => {
    router.push('/') // 홈으로
  }

  const handleReplace = () => {
    router.replace('/') // 히스토리 교체하며 홈으로
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
      <h1>About 페이지</h1>
      <p>이것은 About 페이지입니다.</p>
      
      <div style={{ marginTop: '2rem' }}>
        <h2>네비게이션 옵션들:</h2>
        
        {/* Link 컴포넌트로 홈 이동 */}
        <div style={{ margin: '1rem 0' }}>
          <Link 
            href="/"
            style={{ 
              padding: '0.5rem 1rem', 
              backgroundColor: '#0070f3', 
              color: 'white', 
              textDecoration: 'none',
              borderRadius: '4px',
              display: 'inline-block'
            }}
          >
            홈으로 이동 (Link)
          </Link>
        </div>

        {/* Router로 다양한 이동 방법들 */}
        <div style={{ margin: '1rem 0' }}>
          <button 
            onClick={handleGoHome}
            style={{ 
              padding: '0.5rem 1rem', 
              backgroundColor: '#28a745', 
              color: 'white', 
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginRight: '1rem'
            }}
          >
            홈으로 이동 (Push)
          </button>

          <button 
            onClick={handleReplace}
            style={{ 
              padding: '0.5rem 1rem', 
              backgroundColor: '#ffc107', 
              color: 'black', 
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginRight: '1rem'
            }}
          >
            홈으로 이동 (Replace)
          </button>

          <button 
            onClick={handleGoBack}
            style={{ 
              padding: '0.5rem 1rem', 
              backgroundColor: '#6c757d', 
              color: 'white', 
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            뒤로가기
          </button>
        </div>
      </div>
    </div>
  )
} 