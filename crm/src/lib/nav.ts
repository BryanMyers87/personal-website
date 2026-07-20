import { Archive, BarChart3, KanbanSquare, UserCheck, Users } from "lucide-react";

export const NAV_ITEMS = [
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/pipeline", label: "Pipeline", icon: KanbanSquare },
  { href: "/account-management", label: "Account Management", icon: UserCheck },
  { href: "/holding-tank", label: "Holding Tank", icon: Archive },
  { href: "/contacts", label: "Contacts", icon: Users },
];
