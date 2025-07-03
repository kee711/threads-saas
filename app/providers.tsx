'use client'

import { Attribute, ThemeProvider as NextThemesProvider } from 'next-themes'
import { SessionProvider } from 'next-auth/react'
import { ReactNode } from 'react'
import { Session } from 'next-auth'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

interface ProvidersProps {
  children: ReactNode
  session?: Session | null
  attribute?: Attribute
  defaultTheme?: string
  enableSystem?: boolean
  disableTransitionOnChange?: boolean
}

// 다크모드 및 세션 구현
export function Providers({
  children,
  session,
  attribute = "class",
  defaultTheme = "system",
  enableSystem = true,
  disableTransitionOnChange
}: ProvidersProps) {
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider session={session}>
        <NextThemesProvider
          attribute={attribute}
          defaultTheme={defaultTheme}
          enableSystem={enableSystem}
          disableTransitionOnChange={disableTransitionOnChange}
        >

          {children}

        </NextThemesProvider>
      </SessionProvider>
    </QueryClientProvider>
  )
}