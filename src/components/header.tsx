// components/header.tsx
'use client'

import React from 'react'
import { Menu, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSidebar } from '@/components/providers/sidebar-provider'

interface HeaderProps {
  title: string
}

export function Header({ title }: HeaderProps) {
  const { toggleSidebar, isMobile } = useSidebar()

  return (
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
            {isMobile ? 'Claude' : title}
          </h2>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}