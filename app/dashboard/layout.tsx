import type React from "react"
import {
  BarChart,
  BookOpen,
  Calendar,
  CheckSquare,
  CreditCard,
  Grid,
  Layout,
  List,
  MapPin,
  MessageCircle,
  PieChart,
  Sliders,
  Star,
  Users,
  Bot,
} from "react-feather"

import Sidebar from "@/components/Sidebar"

const navMain = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Layout,
    isActive: true,
  },
  {
    title: "Analytics",
    url: "/dashboard/analytics",
    icon: BarChart,
  },
  {
    title: "Finance",
    url: "/dashboard/finance",
    icon: CreditCard,
  },
  {
    title: "Social",
    url: "/dashboard/social",
    icon: Users,
  },
  {
    title: "AI Automation",
    url: "#",
    icon: Bot,
    isActive: true,
    items: [
      {
        title: "Social Automation",
        url: "/dashboard/social-automation",
        icon: MessageCircle,
        badge: "AI",
      },
    ],
  },
]

const navApps = [
  {
    title: "Tasks",
    url: "/dashboard/tasks",
    icon: CheckSquare,
  },
  {
    title: "Calendar",
    url: "/dashboard/calendar",
    icon: Calendar,
  },
  {
    title: "Kanban",
    url: "/dashboard/kanban",
    icon: List,
  },
]

const navPages = [
  {
    title: "Profile",
    url: "/profile",
    icon: Users,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Sliders,
  },
  {
    title: "Pricing",
    url: "/pricing",
    icon: CreditCard,
  },
  {
    title: "Chat",
    url: "/chat",
    icon: MessageCircle,
  },
  {
    title: "Blank Page",
    url: "/blank",
    icon: BookOpen,
  },
]

const navComponents = [
  {
    title: "UI Elements",
    url: "/components/alerts",
    icon: Grid,
    children: [
      {
        title: "Alerts",
        url: "/components/alerts",
      },
      {
        title: "Buttons",
        url: "/components/buttons",
      },
      {
        title: "Cards",
        url: "/components/cards",
      },
      {
        title: "Carousel",
        url: "/components/carousel",
      },
      {
        title: "General",
        url: "/components/general",
      },
      {
        title: "Grid",
        url: "/components/grid",
      },
      {
        title: "Modals",
        url: "/components/modals",
      },
      {
        title: "Tabs",
        url: "/components/tabs",
      },
      {
        title: "Typography",
        url: "/components/typography",
      },
    ],
  },
  {
    title: "Charts",
    url: "/charts/chartjs",
    icon: PieChart,
    children: [
      {
        title: "Chart.js",
        url: "/charts/chartjs",
      },
    ],
  },
  {
    title: "Forms",
    url: "/forms/basic-inputs",
    icon: CheckSquare,
    children: [
      {
        title: "Basic Inputs",
        url: "/forms/basic-inputs",
      },
      {
        title: "Advanced Inputs",
        url: "/forms/advanced-inputs",
      },
      {
        title: "Input Groups",
        url: "/forms/input-groups",
      },
      {
        title: "Editors",
        url: "/forms/editors",
      },
      {
        title: "Validation",
        url: "/forms/validation",
      },
    ],
  },
  {
    title: "Tables",
    url: "/tables/basic",
    icon: List,
    children: [
      {
        title: "Basic",
        url: "/tables/basic",
      },
      {
        title: "Advanced",
        url: "/tables/advanced",
      },
    ],
  },
  {
    title: "Maps",
    url: "/maps/google-maps",
    icon: MapPin,
    children: [
      {
        title: "Google Maps",
        url: "/maps/google-maps",
      },
      {
        title: "Vector Maps",
        url: "/maps/vector-maps",
      },
    ],
  },
]

const navDocumentation = [
  {
    title: "Getting Started",
    url: "/documentation/getting-started",
    icon: Star,
  },
  {
    title: "Changelog",
    url: "/documentation/changelog",
    icon: List,
  },
]

interface Props {
  children: React.ReactNode
}

const DashboardLayout: React.FC<Props> = ({ children }) => {
  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      <Sidebar
        navMain={navMain}
        navApps={navApps}
        navPages={navPages}
        navComponents={navComponents}
        navDocumentation={navDocumentation}
      />
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">{children}</div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
