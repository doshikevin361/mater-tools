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
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "BrandBuzz Ventures",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
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
        },
        {
          title: "Facebook",
          url: "/dashboard/facebook",
        },
        {
          title: "Twitter",
          url: "/dashboard/twitter",
        },
        {
          title: "YouTube",
          url: "/dashboard/youtube",
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
        },
        {
          title: "Facebook Accounts",
          url: "/dashboard/create-facebook",
        },
        {
          title: "Twitter Accounts",
          url: "/dashboard/create-twitter",
        },
        {
          title: "All Social Accounts",
          url: "/dashboard/social-accounts",
        },
        {
          title: "Email Accounts",
          url: "/dashboard/accounts",
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
          url: "#",
        },
        {
          title: "Team",
          url: "#",
        },
        {
          title: "Billing",
          url: "#",
        },
        {
          title: "Limits",
          url: "#",
        },
      ],
    },
  ],
  projects: [
    {
      name: "Design Engineering",
      url: "#",
      icon: Frame,
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: PieChart,
    },
    {
      name: "Travel",
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
