"use client"

import Link from "next/link"
import { Users, PiggyBank, Settings, LayoutDashboard, Compass, Wallet } from "lucide-react"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
    SidebarTrigger,
    SidebarMenuButton,
    SidebarProvider
  } from "@/frontend/components/ui/sidebar"
import { ModeToggle } from "@/frontend/components/layout/mode-toggle"
import Image from "next/image"
import { BASE_ROUTES } from "@/frontend/lib/routes/constants"
import { usePathname } from "next/navigation"

const navItems = [
  { name: "Dashboard", href: BASE_ROUTES.PAGES.HOME, icon: LayoutDashboard },
  { name: "Household", href: BASE_ROUTES.PAGES.HOUSEHOLD, icon: Users },
  { name: "Pension Plans", href: BASE_ROUTES.PAGES.PENSION, icon: PiggyBank },
  { name: "Compass", href: BASE_ROUTES.PAGES.COMPASS, icon: Compass },
  { name: "Payout Strategy", href: BASE_ROUTES.PAGES.PAYOUT_STRATEGY, icon: Wallet },
]

export const AppSidebar = () => {
  const pathname = usePathname()
  
  // Check if a pathname is active, accounting for nested routes
  const isPathActive = (path: string) => {
    // Handle root path specially to avoid highlighting root for all pages
    if (path === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(path)
  }
  
  return (
    <SidebarProvider>
      <>
        <Sidebar collapsible="icon" className="group">
          <SidebarHeader>
              <div className="flex items-center gap-2 p-1.5">
                  <div className="relative w-[50px] h-[50px] group-data-[collapsible=icon]:w-[24px] group-data-[collapsible=icon]:h-[24px] transition-all duration-300 ease-in-out flex-shrink-0">
                    <Image 
                        src="/goldfinch-high-resolution-logo-only-transparent.svg"
                        alt="Goldfinch Logo"
                        fill
                        className="object-contain" 
                    />
                  </div>
                  <div className="overflow-hidden transition-all duration-300 ease-in-out max-w-[150px] group-data-[collapsible=icon]:max-w-0">
                    <h2 className="text-3xl ml-1 whitespace-nowrap transition-all duration-300 ease-in-out opacity-100 group-data-[collapsible=icon]:opacity-0"
                    >Goldfinch</h2>
                  </div>
              </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = isPathActive(item.href);
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton 
                      asChild
                      tooltip={item.name}
                      className="h-12 text-md group-data-[collapsible=icon]:p-2! pl-4"
                      isActive={isActive}
                    >
                      <Link href={item.href} className="flex items-center gap-4">
                        <div className="w-6 h-6 group-data-[collapsible=icon]:w-4 group-data-[collapsible=icon]:h-4 flex items-center justify-center">
                          <Icon />
                        </div>
                        <span className="text-base">{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem className="py-2">
                <SidebarMenuButton 
                  asChild
                  tooltip="Settings"
                  className="h-12 text-md group-data-[collapsible=icon]:p-2! pl-4"
                  isActive={isPathActive(BASE_ROUTES.PAGES.SETTINGS)}
                >
                  <Link href={BASE_ROUTES.PAGES.SETTINGS} className="flex items-center gap-4">
                    <div className="w-6 h-6 group-data-[collapsible=icon]:w-4 group-data-[collapsible=icon]:h-4 flex items-center justify-center">
                      <Settings />
                    </div>
                    <span className="text-base">Settings</span>
                    <div onClick={(e) => e.preventDefault()} className="ml-auto">
                      <ModeToggle />
                    </div>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        <div className="w-10 flex flex-col items-center pl-2 pt-6">
          <SidebarTrigger />
        </div>
      </>
    </SidebarProvider>
  )
}
  