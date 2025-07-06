"use client"

import * as React from "react"
import { ChevronsUpDown, Plus } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar"

export function TeamSwitcher({
  teams,
}: {
  teams: {
    name: string
    logo: React.ElementType
    plan: string
  }[]
}) {
  const { isMobile } = useSidebar()
  const [activeTeam, setActiveTeam] = React.useState(teams[0])

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="sidebar-item text-white hover:text-white hover:bg-white/10 data-[state=open]:text-white data-[state=open]:bg-white/10"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-white/20 text-white">
                <activeTeam.logo className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold text-white">{activeTeam.name}</span>
                <span className="truncate text-xs text-white/70">{activeTeam.plan}</span>
              </div>
              <ChevronsUpDown className="ml-auto text-white/70" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg border-white/20 bg-white/95 backdrop-blur-md"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">Teams</DropdownMenuLabel>
            {teams.map((team, index) => (
              <DropdownMenuItem
                key={team.name}
                onClick={() => setActiveTeam(team)}
                className="gap-2 p-2 cursor-pointer hover:bg-purple-50 focus:bg-purple-50"
              >
                <div className="flex size-6 items-center justify-center rounded-sm bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                  <team.logo className="size-4 shrink-0" />
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-gray-900">{team.name}</span>
                  <span className="text-xs text-gray-600">{team.plan}</span>
                </div>
                <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator className="bg-purple-100" />
            <DropdownMenuItem className="gap-2 p-2 cursor-pointer hover:bg-purple-50 focus:bg-purple-50">
              <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                <Plus className="size-4" />
              </div>
              <div className="font-medium text-muted-foreground">Add team</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
