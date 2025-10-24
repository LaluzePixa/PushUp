import { SiteProvider } from "@/contexts/SiteContext"

export default function SelectSiteLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <SiteProvider>
            {children}
        </SiteProvider>
    )
}