"use client"

import type * as React from "react"
import {
  AudioWaveform,
  Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Settings2,
  SquareTerminal,
  Phone,
  MessageSquare,
  Mail,
  Users,
  BarChart3,
  CreditCard,
  Bell,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Smartphone,
  PhoneCall,
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
      plan: "Startup",
    },
    {
      name: "Sales Division",
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
      title: "Contacts",
      url: "/dashboard/contacts",
      icon: Users,
    },
    {
      title: "Email Marketing",
      url: "/dashboard/email",
      icon: Mail,
    },
    {
      title: "SMS Marketing",
      url: "/dashboard/sms",
      icon: Smartphone,
    },
    {
      title: "WhatsApp",
      url: "/dashboard/whatsapp",
      icon: MessageSquare,
    },
    {
      title: "Voice Calling",
      url: "/dashboard/calling",
      icon: PhoneCall,
    },
    {
      title: "Voice Broadcasting",
      url: "/dashboard/voice",
      icon: Phone,
    },
    {
      title: "Social Media",
      url: "#",
      icon: Frame,
      items: [
        {
          title: "Facebook",
          url: "/dashboard/facebook",
          icon: Facebook,
        },
        {
          title: "Instagram",
          url: "/dashboard/instagram",
          icon: Instagram,
        },
        {
          title: "Twitter",
          url: "/dashboard/twitter",
          icon: Twitter,
        },
        {
          title: "YouTube",
          url: "/dashboard/youtube",
          icon: Youtube,
        },
      ],
    },
    {
      title: "Analytics",
      url: "/dashboard/analytics",
      icon: BarChart3,
    },
    {
      title: "Account Management",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "Email Accounts",
          url: "/dashboard/accounts",
        },
        {
          title: "Social Accounts",
          url: "/dashboard/social-accounts",
        },
      ],
    },
    {
      title: "Billing",
      url: "/dashboard/billing",
      icon: CreditCard,
    },
    {
      title: "Notifications",
      url: "/dashboard/notifications",
      icon: Bell,
    },
  ],
  projects: [
    {
      name: "Email Campaign 2024",
      url: "#",
      icon: Frame,
    },
    {
      name: "Social Media Boost",
      url: "#",
      icon: PieChart,
    },
    {
      name: "SMS Outreach",
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
