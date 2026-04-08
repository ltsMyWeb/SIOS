import { Link, useLocation } from "wouter";
import { GraduationCap, Landmark, LayoutDashboard, UserRound, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/teacher-console", label: "Staff", icon: Users },
  { href: "/principal-console", label: "Leadership", icon: Landmark },
  { href: "/student-portal", label: "Student", icon: UserRound },
];

export default function SchoolNav() {
  const [location] = useLocation();

  return (
    <div className="fixed inset-x-0 top-0 z-50 px-4 pt-4 md:px-8">
      <div className="mx-auto flex max-w-6xl items-center justify-between rounded-full border border-white/50 bg-card/75 px-3 py-2 shadow-[var(--shadow-1)] backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-primary/10 p-2 text-primary">
            <GraduationCap className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-foreground/45">DAV Public School</p>
            <p className="text-sm font-medium">East of Loni Road, Shahdara, Delhi</p>
          </div>
        </div>
        <nav className="hidden items-center gap-2 md:flex">
          {links.map((item) => {
            const active = location === item.href || (item.href !== "/dashboard" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}>
                <span
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors",
                    active ? "bg-primary text-primary-foreground" : "text-foreground/70 hover:bg-background/70 hover:text-foreground",
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
