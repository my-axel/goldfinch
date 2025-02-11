"use client"

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import Link from "next/link"
import { Home, TrendingUp, Users, PiggyBank, Settings } from "lucide-react"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
  } from "@/components/ui/sidebar"
  import { ModeToggle } from "@/components/layout/mode-toggle"

  const navItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "ETF", href: "/etf", icon: TrendingUp },
    { name: "Household", href: "/household", icon: Users },
    { name: "Private Pension", href: "/private-pension", icon: PiggyBank },
  ]

  export const AppSidebar = () => {  
    return (
      <Sidebar>
        <SidebarHeader>
            <h2 className="group-data-[collapsible=icon]:hidden text-2xl font-bold p-2">Goldfinch</h2>
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
                            className="flex items-center rounded-md px-4 py-3.5 text-md hover:bg-gray-200/50 dark:hover:bg-gray-800/50"
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
                            href="/settings"
                            className="flex items-center justify-between rounded-md px-4 py-2 text-md hover:bg-gray-200/50 dark:hover:bg-gray-800/50"
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
  