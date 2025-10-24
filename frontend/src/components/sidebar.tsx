'use client'

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useSiteContext } from "@/contexts/SiteContext"
import { useAuth } from "@/contexts/AuthContext"
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
  User,
  LogOut,
  UserCircle,
  Globe,
  Plus
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { sitesService } from "@/services/api"

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
      }
      // ⚠️ ITEM TEMPORALMENTE OCULTO - Necesita más trabajo
      // {
      //   title: "Geek Me Out",
      //   url: "/dashboard/analytics",
      //   badgeColor: "bg-orange-200 text-orange-700"
      // },
    ],
  },
  // ⚠️ ITEM TEMPORALMENTE OCULTO - Solo placeholder "Incomming..."
  // {
  //   title: "Optin Funnel",
  //   url: "/optin-funnel",
  //   icon: Puzzle,
  //   badgeColor: "bg-yellow-200 text-yellow-700"
  // },
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
    }
    // ⚠️ ITEMS TEMPORALMENTE OCULTOS - Comentados 2025-10-24
    // {
    //   title: "Push via API",
    //   url: "/campaigns/api",
    //   active: true,
    // }, {
    //   title: "Push via WP Plugin",
    //   url: "/campaigns/wordpress",
    //   active: true,
    // }, {
    //   title: "Journey Builder",
    //   url: "/journeys",
    //   active: true,
    // }
    ]
  },
  {
    title: "Setup",
    url: "/setup",
    icon: Settings,
    isCollapsible: true,
    items: [{
      title: "Sites",
      url: "/sites",
      active: true,
    }, {
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
  // ⚠️ SECTION TEMPORALMENTE OCULTA - Ambas páginas broken/incomplete
  // {
  //   title: "Logs",
  //   url: "/logs",
  //   icon: FileText,
  //   isCollapsible: true,
  //   items: [
  //     {
  //       title: "Subscribers",
  //       url: "/active-users",
  //       active: true,
  //     },
  //     {
  //       title: "Custom Attributes",
  //       url: "/attributes",
  //       active: true,
  //     },
  //   ]
  // },
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
      }
      // ⚠️ ITEMS TEMPORALMENTE OCULTOS - Comentados 2025-10-24
      // {
      //   title: "Wordpress Plugin",
      //   url: "/wp-plugin",
      //   active: true,
      // },
      // {
      //   title: "REST API keys",
      //   url: "/public-api-keys",
      //   active: true,
      // },
      // {
      //   title: "Public key for AMP",
      //   url: "/public-amp-keys",
      //   active: true,
      // },
    ]
  },
]

const secondaryMenuData = [
  // ⚠️ SECTION TEMPORALMENTE OCULTA - Páginas incompletas (no save, no data)
  // {
  //   title: "Collect Email/Phone",
  //   url: "/collect",
  //   icon: Mail,
  //   isCollapsible: true,
  //   items: [
  //     {
  //       title: "Configure Prompt",
  //       url: "/email-options",
  //       active: true,
  //     },
  //     {
  //       title: "Users",
  //       url: "/email-users",
  //       active: true,
  //     },
  //   ]
  // },
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

// Componente del modal de Contact Us
function ContactUsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-lg font-semibold">Useful Links</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <p className="text-gray-600">
            For fastest help <span className="font-medium">(preferred method)</span>, ask the{" "}
            <a
              href="https://webpushr.com/forum"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Webpushr Forum
            </a>
          </p>

          <div className="space-y-2">
            <p>
              <span className="text-gray-600">E-mail (Sales): </span>
              <a
                href="mailto:sales@webpushr.com"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                sales@webpushr.com
              </a>
            </p>

            <div>
              <p>
                <span className="text-gray-600">E-mail (Support): </span>
                <a
                  href="mailto:support@webpushr.com"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  support@webpushr.com
                </a>
              </p>
              <p className="text-gray-600 text-xs mt-1">
                Please send us your e-mail id if you decide to e-mail us. As you can imagine, we cannot locate your account unless we get your e-mail id.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={onClose} variant="secondary">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Componente para selector de sitios
function SiteSelector() {
  const { selectedSite, setSelectedSite, sites, loading, refreshSites } = useSiteContext();
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [newSiteData, setNewSiteData] = React.useState({
    name: '',
    domain: '',
    description: ''
  });
  const [isCreating, setIsCreating] = React.useState(false);

  // Crear nuevo sitio
  const handleCreateSite = async () => {
    if (!newSiteData.name.trim() || !newSiteData.domain.trim()) {
      alert('El nombre y dominio son obligatorios');
      return;
    }

    // Validación básica de dominio
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!domainRegex.test(newSiteData.domain.trim())) {
      alert('El formato del dominio no es válido. Ejemplo: ejemplo.com');
      return;
    }

    // Verificar si ya existe un sitio con el mismo dominio
    const domainExists = sites.some(site =>
      site.domain.toLowerCase() === newSiteData.domain.trim().toLowerCase()
    );

    if (domainExists) {
      alert('Ya tienes un sitio registrado con este dominio');
      return;
    }

    try {
      setIsCreating(true);
      const response = await sitesService.createSite(newSiteData);

      if (response.success && response.data) {
        await refreshSites(); // Refrescar la lista desde el contexto
        setSelectedSite(response.data);
        setIsCreateModalOpen(false);
        setNewSiteData({ name: '', domain: '', description: '' });

        // Mostrar mensaje de éxito
        alert(`¡Sitio "${response.data.name}" creado exitosamente!`);
      }
    } catch (error: unknown) {
      console.error('Error creating site:', error);

      // Mostrar mensaje de error específico al usuario
      let errorMessage = 'Error al crear el sitio';

      if (error && typeof error === 'object') {
        const apiError = error as { status?: number; code?: string; details?: string[]; message?: string };

        if (apiError.status === 409 || apiError.code === 'DOMAIN_EXISTS') {
          errorMessage = 'Ya tienes un sitio registrado con este dominio. Usa un dominio diferente.';
        } else if (apiError.status === 403 || apiError.code === 'SITES_LIMIT_EXCEEDED') {
          errorMessage = 'Has alcanzado el límite máximo de sitios permitidos (5 sitios).';
        } else if (apiError.status === 400 || apiError.code === 'VALIDATION_ERROR') {
          if (apiError.details && Array.isArray(apiError.details)) {
            errorMessage = `Datos inválidos: ${apiError.details.join(', ')}`;
          } else {
            errorMessage = 'Los datos del sitio no son válidos. Verifica el formato del dominio.';
          }
        } else if (apiError.message) {
          errorMessage = apiError.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      // TODO: Implementar toast/notification system
      alert(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-full">
        <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={`w-full justify-between h-auto p-3 font-bold text-xl hover:bg-transparent ${!selectedSite ? 'bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800' : ''
                }`}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Globe className={`h-5 w-5 flex-shrink-0 ${!selectedSite ? 'text-yellow-600 dark:text-yellow-400' : ''
                  }`} />
                <div className="flex-1 min-w-0 text-left">
                  <div className={`font-bold text-xl truncate ${!selectedSite ? 'text-yellow-800 dark:text-yellow-200' : ''
                    }`}>
                    {selectedSite?.name || '⚠️ Seleccionar sitio'}
                  </div>
                  {!selectedSite && (
                    <div className="text-xs text-yellow-600 dark:text-yellow-400">
                      Haz clic para elegir un sitio
                    </div>
                  )}
                </div>
              </div>
              <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent className="w-64" align="start">
            <DropdownMenuLabel>Mis Sitios</DropdownMenuLabel>
            <DropdownMenuSeparator />

            {sites.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                <Globe className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <div className="text-sm">No tienes sitios</div>
                <div className="text-xs">Crea uno para comenzar</div>
              </div>
            ) : (
              sites.map((site) => (
                <DropdownMenuItem
                  key={site.id}
                  className="cursor-pointer"
                  onClick={() => {
                    setSelectedSite(site);
                    setIsDropdownOpen(false);
                  }}
                >
                  <div className="flex items-center gap-2 w-full">
                    <Globe className="h-4 w-4" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{site.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {site.domain}
                      </div>
                    </div>
                    {selectedSite?.id === site.id && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                </DropdownMenuItem>
              ))
            )}

            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="cursor-pointer text-blue-600"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              <span>Añadir nuevo sitio</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Modal para crear nuevo sitio */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Nuevo Sitio</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="site-name">Nombre del sitio</Label>
              <Input
                id="site-name"
                value={newSiteData.name}
                onChange={(e) => setNewSiteData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Mi sitio web"
              />
            </div>

            <div>
              <Label htmlFor="site-domain">Dominio</Label>
              <Input
                id="site-domain"
                value={newSiteData.domain}
                onChange={(e) => setNewSiteData(prev => ({ ...prev, domain: e.target.value }))}
                placeholder="ejemplo.com"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Sin https:// (ejemplo: ejemplo.com). Debe ser único.
              </p>
            </div>

            <div>
              <Label htmlFor="site-description">Descripción (opcional)</Label>
              <Input
                id="site-description"
                value={newSiteData.description}
                onChange={(e) => setNewSiteData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descripción del sitio web"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
              disabled={isCreating}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateSite}
              disabled={isCreating || !newSiteData.name.trim() || !newSiteData.domain.trim()}
            >
              {isCreating ? 'Creando...' : 'Crear Sitio'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
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

// Componente del dropdown de usuario
function UserDropdown({ user }: { user: { name: string; email?: string } }) {
  const { logout } = useAuth()
  const router = useRouter()

  const handleLogout = () => {
    console.log('🚪 Cerrando sesión...')
    // Usar el método del AuthContext que maneja toda la limpieza
    logout()
    console.log('✅ Sesión cerrada correctamente')
    // Navigate using Next.js router after logout
    router.push('/login')
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 p-2 h-auto hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <UserCircle className="h-5 w-5 text-purple-400" />
          <div className="flex flex-col items-start">
            <span className="text-xs font-medium">{user.name}</span>
            {user.email && (
              <span className="text-xs text-muted-foreground">{user.email}</span>
            )}
          </div>
          <ChevronDown className="h-4 w-4 ml-auto" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem className="cursor-pointer">
          <User className="mr-2 h-4 w-4" />
          <span>Perfil</span>
        </DropdownMenuItem>

        <DropdownMenuItem className="cursor-pointer">
          <Settings className="mr-2 h-4 w-4" />
          <span>Configuración</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Cerrar Sesión</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
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
    // ⚠️ ITEM TEMPORALMENTE OCULTO - Solo placeholder "Incoming..."
    // {
    //   title: "Troubleshooter",
    //   url: "/troubleshooter",
    //   icon: Wrench,
    // },
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