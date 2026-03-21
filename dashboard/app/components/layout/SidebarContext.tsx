'use client'
import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { usePathname } from 'next/navigation'

type SidebarContextType = {
  mobileOpen: boolean
  setMobileOpen: (open: boolean) => void
  toggleMobile: () => void
}

const SidebarContext = createContext<SidebarContextType>({
  mobileOpen: false,
  setMobileOpen: () => {},
  toggleMobile: () => {},
})

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const toggleMobile = useCallback(() => setMobileOpen((p) => !p), [])

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  return (
    <SidebarContext.Provider value={{ mobileOpen, setMobileOpen, toggleMobile }}>
      {children}
    </SidebarContext.Provider>
  )
}

export const useSidebar = () => useContext(SidebarContext)
