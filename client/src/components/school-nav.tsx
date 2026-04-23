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
      <div className="mx-auto max-w-7xl rounded-[28px] border border-primary/10 bg-[linear-gradient(135deg,hsl(var(--card)),hsl(var(--background)))] px-4 py-3 shadow-[var(--shadow-1)] backdrop-blur">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-[16px] border border-primary/15 bg-[linear-gradient(135deg,hsl(var(--primary))/0.12,hsl(var(--card)))] text-primary shadow-[0_12px_28px_-18px_hsl(var(--primary)/0.45)]">
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
                      "inline-flex min-w-fit items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-[transform,background-color,border-color,color] duration-150",
                      active
                        ? "border-primary/20 bg-[linear-gradient(135deg,hsl(var(--primary)),hsl(233_90%_73%))] text-primary-foreground shadow-[0_14px_26px_-18px_hsl(var(--primary)/0.55)]"
                        : "border-transparent bg-background/75 text-foreground/70 hover:-translate-y-0.5 hover:border-primary/10 hover:bg-card hover:text-foreground",
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
