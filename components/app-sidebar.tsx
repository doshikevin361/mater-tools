"use client"

import type * as React from "react"
import {
  AudioWaveform,
  Bot,
  Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Settings2,
  SquareTerminal,
  Users,
  MessageSquare,
  BarChart3,
  CreditCard,
  UserPlus,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from "@/components/ui/sidebar"

// This is sample data.
const data = {
  user: {
    name: "BrandBuzz User",
    email: "user@brandbuzz.com",
    avatar: "/placeholder-user.jpg",
  },
  teams: [
    {
      name: "BrandBuzz Ventures",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Marketing Team",
      logo: AudioWaveform,
      plan: "Pro",
    },
    {
      name: "Growth Team",
      logo: Command,
      plan: "Startup",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: SquareTerminal,
      isActive: true,
    },
    {
      title: "Communication",
      url: "#",
      icon: MessageSquare,
      items: [
        {
          title: "WhatsApp",
          url: "/dashboard/whatsapp",
          badge: "New",
        },
        {
          title: "SMS",
          url: "/dashboard/sms",
        },
        {
          title: "Email",
          url: "/dashboard/email",
        },
        {
          title: "Voice",
          url: "/dashboard/voice",
        },
        {
          title: "Calling",
          url: "/dashboard/calling",
          badge: "Live",
        },
      ],
    },
    {
      title: "Social Media",
      url: "#",
      icon: Bot,
      items: [
        {
          title: "Instagram",
          url: "/dashboard/instagram",
          badge: "Growth",
        },
        {
          title: "Facebook",
          url: "/dashboard/facebook",
          badge: "Growth",
        },
        {
          title: "Twitter",
          url: "/dashboard/twitter",
          badge: "Trading",
        },
        {
          title: "YouTube",
          url: "/dashboard/youtube",
          badge: "Growth",
        },
      ],
    },
    {
      title: "Account Creation",
      url: "#",
      icon: UserPlus,
      items: [
        {
          title: "Instagram Accounts",
          url: "/dashboard/create-instagram",
          badge: "Auto",
        },
        {
          title: "Facebook Accounts",
          url: "/dashboard/create-facebook",
          badge: "Auto",
        },
        {
          title: "Twitter Accounts",
          url: "/dashboard/create-twitter",
          badge: "Auto",
        },
        {
          title: "All Social Accounts",
          url: "/dashboard/social-accounts",
        },
        {
          title: "Email Accounts",
          url: "/dashboard/accounts",
          badge: "New",
        },
      ],
    },
    {
      title: "Analytics",
      url: "/dashboard/analytics",
      icon: BarChart3,
    },
    {
      title: "Contacts",
      url: "/dashboard/contacts",
      icon: Users,
    },
    {
      title: "Billing",
      url: "/dashboard/billing",
      icon: CreditCard,
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "General",
          url: "/dashboard/settings/general",
        },
        {
          title: "Team",
          url: "/dashboard/settings/team",
        },
        {
          title: "Billing",
          url: "/dashboard/settings/billing",
        },
        {
          title: "Limits",
          url: "/dashboard/settings/limits",
        },
      ],
    },
  ],
  projects: [
    {
      name: "Marketing Campaigns",
      url: "#",
      icon: Frame,
    },
    {
      name: "Social Growth",
      url: "#",
      icon: PieChart,
    },
    {
      name: "Lead Generation",
      url: "#",
      icon: Map,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
