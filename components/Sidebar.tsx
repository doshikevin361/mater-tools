"use client"

import type * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"

type Icon = React.ComponentType<React.SVGProps<SVGSVGElement>>

export interface NavEntry {
  title: string
  url: string
  icon?: Icon
  badge?: string
  isActive?: boolean
  items?: NavEntry[]
}

export interface SidebarProps {
  navMain?: NavEntry[]
  navApps?: NavEntry[]
  navPages?: NavEntry[]
  navComponents?: NavEntry[]
  navDocumentation?: NavEntry[]
}

const sections: Array<keyof SidebarProps> = ["navMain", "navApps", "navPages", "navComponents", "navDocumentation"]

export default function Sidebar(props: SidebarProps) {
  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r bg-white shadow-sm">
      <div className="flex h-16 items-center justify-center border-b px-6 text-xl font-bold">BrandBuzz</div>

      <nav className="flex-1 overflow-y-auto py-4">
        {sections.map((key) => {
          const data = props[key]
          if (!data?.length) return null

          return (
            <div key={key} className="mb-6">
              <ul className="space-y-1 px-4">
                {data.map((item) => (
                  <SidebarLink key={item.url} {...item} />
                ))}
              </ul>
            </div>
          )
        })}
      </nav>
    </aside>
  )
}

function SidebarLink(item: NavEntry) {
  const Icon = item.icon
  return (
    <li>
      <Link
        href={item.url}
        className={cn(
          "flex items-center gap-2 rounded-md px-2 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100",
          item.isActive && "bg-gray-200 font-semibold",
        )}
      >
        {Icon && <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />}
        <span className="truncate">{item.title}</span>
        {item.badge && (
          <span className="ml-auto rounded-full bg-gray-200 px-2 py-0.5 text-xs font-semibold">{item.badge}</span>
        )}
      </Link>
    </li>
  )
}
