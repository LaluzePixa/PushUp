import type { Metadata } from "next"
import { SiteProvider } from "@/contexts/SiteContext"

export const metadata: Metadata = {
  title: "Gestión de Sitios - Patata.com",
  description: "Administra tus sitios web",
}

export default function SitesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SiteProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          {children}
        </div>
      </div>
    </SiteProvider>
  )
}
