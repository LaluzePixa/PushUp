'use client'

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { SiteSelector } from "@/components/SiteSelector"
import { UserDropdown } from "@/components/UserDropdown"
import { ContactUsModal } from "@/components/ContactUsModal"
import {
    Gauge,
    Users,
    Bell,
    Settings,
    FileText,
    Puzzle,
    Mail,
    Lock,
    Heart,
    Wrench,
    ChevronDown,
    Sun,
    Moon,
} from "lucide-react"

import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    SidebarProvider,
    useSidebar,
} from "@/components/ui/sidebar"
import { Switch } from "@/components/ui/switch"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

// Definir el tipo Item:
type Item = {
    title: string;
    url?: string;
    icon?: React.ComponentType<{ className?: string }>;
    badge?: string;
    badgeColor?: string;
    isCollapsible?: boolean;
    items?: Item[];
    active?: boolean;
    onClick?: () => void;
};

// Datos del menú
const mainMenuData = [
    {
        title: "Dashboard",
        url: "/dashboard",
        icon: Gauge,
        isCollapsible: true,
        items: [
            {
                title: "Overview",
                url: "/dashboard",
                active: true,
            },
            {
                title: "Geo Report",
                url: "/dashboard/geo-report",
            },
            {
                title: "Geek Me Out",
                url: "/dashboard/analytics",
                badgeColor: "bg-orange-200 text-orange-700"
            },
        ],
    },
    {
        title: "Optin Funnel",
        url: "/optin-funnel",
        icon: Puzzle,
        badgeColor: "bg-yellow-200 text-yellow-700"
    },
    {
        title: "Users",
        url: "/users",
        icon: Users,
        isCollapsible: true,
        items: [
            {
                title: "All Users",
                url: "/subscribers",
                active: true,
            },
            {
                title: "Segments",
                url: "/segments",
                active: true,
            },
        ],
    },
    {
        title: "Push Notifications",
        url: "/push-notifications",
        icon: Bell,
        isCollapsible: true,
        items: [{
            title: "Manual Push",
            url: "/campaigns",
            active: true,
        }, {
            title: "Push via API",
            url: "/campaigns/api",
            active: true,
        }, {
            title: "Push via WP Plugin",
            url: "/campaigns/wordpress",
            active: true,
        }, {
            title: "Journey Builder",
            url: "/journeys",
            active: true,
        }
        ]
    },
    {
        title: "Setup",
        url: "/setup",
        icon: Settings,
        isCollapsible: true,
        items: [{
            title: "Opt-In Prompt",
            url: "/optinp",
            active: true,
        }, {
            title: "Subscription Bell",
            url: "/subs-bell",
            active: true,
        }, {
            title: "Notification Cards",
            url: "/noti-cards",
            active: true,
        }, {
            title: "Welcome Push",
            url: "/welcome-noti",
            active: true,
        }]
    },
    {
        title: "Logs",
        url: "/logs",
        icon: FileText,
        isCollapsible: true,
        items: [
            {
                title: "Subscribers",
                url: "/active-users",
                active: true,
            },
            {
                title: "Custom Attributes",
                url: "/attributes",
                active: true,
            },
        ]
    },
    {
        title: "Integration",
        url: "/integration",
        icon: Puzzle,
        isCollapsible: true,
        items: [
            {
                title: "Manual Integration",
                url: "/manual-integ",
                active: true,
            },
            {
                title: "Wordpress Plugin",
                url: "/wp-plugin",
                active: true,
            },
            {
                title: "REST API keys",
                url: "/public-api-keys",
                active: true,
            },
            {
                title: "Public key for AMP",
                url: "/public-amp-keys",
                active: true,
            },
        ]
    },
]

const secondaryMenuData = [
    {
        title: "Collect Email/Phone",
        url: "/collect",
        icon: Mail,
        isCollapsible: true,
        items: [
            {
                title: "Configure Prompt",
                url: "/email-options",
                active: true,
            },
            {
                title: "Users",
                url: "/email-users",
                active: true,
            },
        ]
    },
    {
        title: "Trust & Privacy",
        url: "/data-and-privacy",
        icon: Lock,
    },
    {
        title: "Uptime Monitoring",
        url: "/uptime-monitoring",
        icon: Heart,
        badgeColor: "bg-green-200 text-green-700"
    },
]

// Función para verificar si una ruta está activa
function isRouteActive(currentPath: string, itemUrl: string, hasSubItems?: boolean): boolean {
    if (!itemUrl) return false;

    if (hasSubItems) {
        return currentPath.startsWith(itemUrl)
    }

    return currentPath === itemUrl
}

// Función para verificar si algún subitem está activo
function hasActiveSubItem(currentPath: string, items?: Item[]): boolean {
    if (!items) return false
    return items.some(item => item.url && currentPath === item.url)
}

// Componente para elementos del menú con posibles subitems
function NavItem({
    item,
    index,
    openMenuIndex,
    setOpenMenuIndex,
}: {
    item: Item,
    index: number,
    openMenuIndex: number | null,
    setOpenMenuIndex: (idx: number | null) => void
}) {
    const pathname = usePathname()

    const isActive = item.url ? isRouteActive(pathname, item.url, item.isCollapsible) : false
    const hasActiveSub = hasActiveSubItem(pathname, item.items)

    // Sincroniza el menú abierto con la ruta activa
    React.useEffect(() => {
        if (hasActiveSub || isActive) {
            setOpenMenuIndex(index)
        }
    }, [hasActiveSub, isActive, index, setOpenMenuIndex])

    // El menú está abierto solo si su índice coincide con el abierto globalmente
    const currentlyOpen = openMenuIndex === index

    if (item.isCollapsible && item.items) {
        return (
            <Collapsible open={currentlyOpen} onOpenChange={(open) => setOpenMenuIndex(open ? index : null)}>
                <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                            className={`flex w-full items-center ${isActive ? 'text-blue-600 dark:text-blue-400 font-semibold' : ''
                                }`}
                            isActive={isActive}
                        >
                            {item.icon && <item.icon className="h-4 w-4" />}
                            <span>{item.title}</span>
                            {item.badge && (
                                <span className={`ml-auto px-2 py-0.5 rounded text-xs font-semibold ${item.badgeColor}`}>
                                    {item.badge}
                                </span>
                            )}
                            <ChevronDown className={`ml-auto h-4 w-4 transition-transform ${currentlyOpen ? 'rotate-180' : ''}`} />
                        </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <SidebarMenuSub>
                            {item.items.map((subItem: Item) => {
                                const isSubActive = subItem.url ? pathname === subItem.url : false
                                return (
                                    <SidebarMenuSubItem key={subItem.title}>
                                        <SidebarMenuSubButton
                                            asChild
                                            isActive={isSubActive}
                                            className={`${isSubActive ? 'text-blue-600 dark:text-blue-400 font-semibold' : ''
                                                }`}
                                        >
                                            <Link href={subItem.url || '#'} className="flex items-center gap-2">
                                                <span>{subItem.title}</span>
                                                {subItem.badge && (
                                                    <span className={`ml-auto px-2 py-0.5 rounded text-xs font-semibold ${subItem.badgeColor}`}>
                                                        {subItem.badge}
                                                    </span>
                                                )}
                                            </Link>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                )
                            })}
                        </SidebarMenuSub>
                    </CollapsibleContent>
                </SidebarMenuItem>
            </Collapsible>
        )
    }

    return (
        <SidebarMenuItem>
            <SidebarMenuButton
                asChild={!item.onClick}
                isActive={isActive}
                className={`${isActive ? 'text-blue-600 dark:text-blue-400 font-semibold' : ''
                    }`}
                onClick={item.onClick}
            >
                {item.onClick ? (
                    <div className="flex items-center gap-2 cursor-pointer w-full">
                        {item.icon && <item.icon className="h-4 w-4" />}
                        <span>{item.title}</span>
                        {item.badge && (
                            <span className={`ml-auto px-2 py-0.5 rounded text-xs font-semibold ${item.badgeColor}`}>
                                {item.badge}
                            </span>
                        )}
                    </div>
                ) : (
                    <Link href={item.url || '#'} className="flex items-center">
                        {item.icon && <item.icon className="h-4 w-4" />}
                        <span>{item.title}</span>
                        {item.badge && (
                            <span className={`ml-auto px-2 py-0.5 rounded text-xs font-semibold ${item.badgeColor}`}>
                                {item.badge}
                            </span>
                        )}
                    </Link>
                )}
            </SidebarMenuButton>
        </SidebarMenuItem>
    )
}

// Hook para obtener el usuario con SSR safety
const useUser = () => {
    const { user } = useAuth()
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    // Prevent hydration mismatch by returning consistent data on server and initial client render
    if (!mounted) {
        return {
            name: 'Usuario',
            email: ''
        }
    }

    return {
        name: user?.email || 'Usuario',
        email: user?.email || ''
    }
}

// Componente SidebarRail personalizado con flecha más a la derecha
function SidebarRailCustom({ className, ...props }: React.ComponentProps<"button">) {
    const { toggleSidebar } = useSidebar()

    return (
        <button
            data-sidebar="rail"
            data-slot="sidebar-rail"
            aria-label="Toggle Sidebar"
            tabIndex={-1}
            onClick={toggleSidebar}
            title="Toggle Sidebar"
            className={cn(
                "hover:after:bg-sidebar-border absolute inset-y-0 z-10 hidden w-auto -translate-x-1/2 transition-all ease-linear group-data-[side=left]:-right-4 group-data-[side=right]:left-0 after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] sm:flex",
                "in-data-[side=left]:cursor-w-resize in-data-[side=right]:cursor-e-resize",
                "[[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize",
                "hover:group-data-[collapsible=offcanvas]:bg-sidebar group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full",
                "[[data-side=left][data-collapsible=offcanvas]_&]:-right-2",
                "[[data-side=right][data-collapsible=offcanvas]_&]:-left-2",
                "flex items-center justify-center",
                className
            )}
            {...props}
        >
            <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-white transition-transform duration-200 group-data-[state=collapsed]:rotate-180"
            >
                <path d="m15 18-6-6 6-6" />
            </svg>
        </button>
    )
}

// Componente del sidebar principal con modificaciones
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = React.useState(false)
    const [isContactModalOpen, setIsContactModalOpen] = React.useState(false)
    const [openMenuIndex, setOpenMenuIndex] = React.useState<number | null>(null)
    const user = useUser()

    React.useEffect(() => {
        setMounted(true)
    }, [])

    // Crear los datos del menú de soporte con el onClick para Contact Us
    const supportMenuData = [
        {
            title: "Troubleshooter",
            url: "/troubleshooter",
            icon: Wrench,
        },
        {
            title: "Contact Us",
            icon: Mail,
            onClick: () => setIsContactModalOpen(true),
        },
    ]

    if (!mounted) return null

    const isDark = theme === "dark"

    return (
        <>
            <Sidebar variant="inset" {...props}>
                {/* ✅ HEADER CON SELECTOR DE SITIOS */}
                <SidebarHeader className="border-b px-4 py-0 min-h-0">
                    <div className="h-10 flex items-center">
                        <SiteSelector />
                    </div>
                </SidebarHeader>

                <SidebarContent>
                    {/* Menú principal */}
                    <SidebarGroup>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {mainMenuData.map((item, idx) => (
                                    <NavItem
                                        key={item.title}
                                        item={item}
                                        index={idx}
                                        openMenuIndex={openMenuIndex}
                                        setOpenMenuIndex={setOpenMenuIndex}
                                    />
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>

                    <div className="border-t border-sidebar-border my-2" />

                    {/* Menú secundario */}
                    <SidebarGroup>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {secondaryMenuData.map((item, idx) => (
                                    <NavItem
                                        key={item.title}
                                        item={item}
                                        index={idx}
                                        openMenuIndex={openMenuIndex}
                                        setOpenMenuIndex={setOpenMenuIndex}
                                    />
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>

                    <div className="border-t border-sidebar-border my-2" />

                    {/* Menú de soporte */}
                    <SidebarGroup>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {supportMenuData.map((item, idx) => (
                                    <NavItem
                                        key={item.title}
                                        item={item}
                                        index={idx}
                                        openMenuIndex={openMenuIndex}
                                        setOpenMenuIndex={setOpenMenuIndex}
                                    />
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                </SidebarContent>

                <SidebarFooter className="gap-4 p-4">
                    {/* Switch modo oscuro/claro */}
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Modo oscuro</span>
                        <div className="flex items-center space-x-2">
                            <Sun className="h-4 w-4" />
                            <Switch
                                checked={isDark}
                                onCheckedChange={(checked: unknown) => setTheme(checked ? "dark" : "light")}
                            />
                            <Moon className="h-4 w-4" />
                        </div>
                    </div>

                    <UserDropdown user={user} />
                </SidebarFooter>

                {/* ✅ RAIL PERSONALIZADO CON FLECHA MÁS A LA DERECHA - SOLUCIONADO */}
                <SidebarRailCustom />
            </Sidebar>

            <ContactUsModal
                isOpen={isContactModalOpen}
                onClose={() => setIsContactModalOpen(false)}
            />
        </>
    )
}

// Layout principal con el provider
export default function SidebarLayout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full">
                <AppSidebar />
                <div className="flex-1 flex flex-col overflow-hidden">
                    {children}
                </div>
            </div>
        </SidebarProvider>
    )
}