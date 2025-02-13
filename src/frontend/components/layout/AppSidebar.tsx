"use client"

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/frontend/components/ui/tooltip"
import Link from "next/link"
import { Users, PiggyBank, Settings, LayoutDashboard } from "lucide-react"
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

  const navItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Household", href: "/household", icon: Users },
    { name: "Pension", href: "/pension", icon: PiggyBank },
  ]

  export const AppSidebar = () => {  
    return (
      <Sidebar>
        <SidebarHeader>
            <div className="flex items-center gap-2 p-2">
                <Image 
                    src="/goldfinch_logo.jpg" 
                    alt="Goldfinch Logo" 
                    width={72} 
                    height={72}
                />
                <h2 className="group-data-[collapsible=icon]:hidden text-2xl font-bold">Goldfinch</h2>
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
                            href="/settings"
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
  