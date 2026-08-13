import { Archive, BarChart3, BellRing, CalendarClock, Folder, KanbanSquare, Target, UserCheck, Users } from "lucide-react";

export const NAV_ITEMS = [
  { href: "/this-week", label: "This Week", icon: CalendarClock },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/pipeline", label: "Pipeline", icon: KanbanSquare },
  { href: "/reminders", label: "Reminders", icon: BellRing },
  { href: "/account-management", label: "Account Management", icon: UserCheck },
  { href: "/holding-tank", label: "Holding Tank", icon: Archive },
  { href: "/file-tracker", label: "File Tracker", icon: Folder },
  { href: "/hit-list", label: "Hit List", icon: Target },
  { href: "/contacts", label: "Contacts", icon: Users },
];
