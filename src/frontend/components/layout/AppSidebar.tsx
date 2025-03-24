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

const navItems = [
  { name: "Dashboard", href: BASE_ROUTES.PAGES.HOME, icon: LayoutDashboard },
  { name: "Household", href: BASE_ROUTES.PAGES.HOUSEHOLD, icon: Users },
  { name: "Pension Plans", href: BASE_ROUTES.PAGES.PENSION, icon: PiggyBank },
  { name: "Compass", href: BASE_ROUTES.PAGES.COMPASS, icon: Compass },
  { name: "Payout Strategy", href: BASE_ROUTES.PAGES.PAYOUT_STRATEGY, icon: Wallet },
]

export const AppSidebar = () => {
  return (
    <SidebarProvider>
      <>
        <Sidebar collapsible="icon" className="group/sidebar">
          <SidebarHeader>
              <div className="flex items-center gap-2 p-2">
                  <Image 
                      src="/goldfinch-high-resolution-logo-only-transparent.svg"
                      alt="Goldfinch Logo" 
                      className="logo transition-all duration-200 ease-in-out w-[50px] h-[50px] group-data-[collapsible=icon]:w-[24px] group-data-[collapsible=icon]:h-[24px]"
                      width={50}
                      height={50}
                  />
                  <h2 className="text-3xl ml-1 transition-opacity duration-200 ease-in-out group-data-[collapsible=icon]:opacity-0"
                  >Goldfinch</h2>
              </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton 
                    asChild
                    tooltip={item.name}
                  >
                    <Link href={item.href}>
                      <item.icon className="min-w-5" />
                      <span>{item.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild
                  tooltip="Settings"
                >
                  <Link href={BASE_ROUTES.PAGES.SETTINGS}>
                    <Settings className="min-w-5" />
                    <span>Settings</span>
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
  