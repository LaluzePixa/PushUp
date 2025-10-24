import type { Metadata } from "next"
import { SiteProvider } from "@/contexts/SiteContext"
import { SiteGuard } from "@/components/SiteGuard"
import { SiteLayoutWrapper } from "@/components/SiteLayoutWrapper"

export const metadata: Metadata = {
  title: "Patata.com Dashboard",
  description: "Dashboard application",
}

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SiteProvider>
      <SiteGuard>
        <SiteLayoutWrapper>
          {children}
        </SiteLayoutWrapper>
      </SiteGuard>
    </SiteProvider>
  )
}