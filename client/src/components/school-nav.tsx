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
      <div className="mx-auto max-w-7xl rounded-[30px] border border-white/35 bg-[linear-gradient(135deg,hsl(var(--card))/0.88,hsl(var(--card))/0.72)] px-4 py-3 shadow-[var(--shadow-2)] backdrop-blur-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-[18px] border border-primary/20 bg-[radial-gradient(circle_at_30%_30%,hsl(var(--primary))/0.24,transparent_70%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--card)))] text-primary shadow-[0_18px_35px_-18px_hsl(var(--primary)/0.6)]">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-foreground/45">DAV Public School</p>
              <p className="text-sm font-semibold tracking-[0.08em] text-foreground/92">East of Loni Road, Shahdara, Delhi</p>
            </div>
          </div>

          <nav className="flex gap-2 overflow-x-auto pb-1 lg:justify-end">
            {links.map((item) => {
              const active = location === item.href || (item.href !== "/dashboard" && location.startsWith(item.href));
              return (
                <Link key={item.href} href={item.href}>
                  <span
                    className={cn(
                      "inline-flex min-w-fit items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-all",
                      active
                        ? "border-primary/40 bg-primary text-primary-foreground shadow-[0_16px_30px_-20px_hsl(var(--primary)/0.95)]"
                        : "border-transparent bg-background/55 text-foreground/70 hover:-translate-y-0.5 hover:border-white/35 hover:bg-background/85 hover:text-foreground",
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
    </div>
  );
}
