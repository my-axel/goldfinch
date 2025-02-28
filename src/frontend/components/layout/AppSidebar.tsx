"use client"

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/frontend/components/ui/tooltip"
import Link from "next/link"
import { Users, PiggyBank, Settings, LayoutDashboard, Compass, Wallet } from "lucide-react"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
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
    <Sidebar>
      <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
              <Image 
                  src="/goldfinch-high-resolution-logo-only-transparent.svg" 
                  alt="Goldfinch Logo" 
                  className="logo"
                  width={50}
                  height={50}
              />
              <h2 className="text-3xl ml-1">Goldfinch</h2>
          </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.name}>
                  <TooltipProvider>
                  <Tooltip>
                      <TooltipTrigger asChild>
                          <Link
                          href={item.href}
                          className="flex items-center rounded-md px-4 py-3.5 text-md hover:bg-sidebar-accent"
                          >   
                              <div className="flex items-center">
                                  <item.icon />
                                  <span className="group-data-[collapsible=icon]:hidden pl-4">{item.name}</span>
                              </div>
                          </Link>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="group-data-[collapsible=icon]:block hidden">
                              {item.name}
                          </TooltipContent>
                      </Tooltip>
                  </TooltipProvider>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
              <TooltipProvider>
                      <Tooltip>
                          <TooltipTrigger asChild>
                          <Link
                          href={BASE_ROUTES.PAGES.SETTINGS}
                          className="flex items-center justify-between rounded-md px-4 py-2 text-md hover:bg-sidebar-accent"
                          >
                              <div className="flex items-center">
                                  <Settings />
                                  <span className="group-data-[collapsible=icon]:hidden pl-4">Settings</span>
                              </div>
                              <div onClick={(e) => e.preventDefault()}>
                                  <ModeToggle />
                              </div>
                          </Link>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="group-data-[collapsible=icon]:block hidden">
                              Settings
                          </TooltipContent>
                      </Tooltip>
                  </TooltipProvider>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
  