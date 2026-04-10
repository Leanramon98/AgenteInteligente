"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { 
  LayoutDashboard, 
  Bot, 
  MessageSquare, 
  BarChart3, 
  LogOut, 
  Menu,
  ChevronRight,
  Settings,
  Bell
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const sidebarItems = [
  { name: "Resumen", href: "/dashboard", icon: LayoutDashboard },
  { name: "Mis Agentes", href: "/dashboard", icon: Bot }, // Redirect to dashboard until separate page is needed or ready
  { name: "Conversaciones", href: "#", icon: MessageSquare, badge: "Próximamente" },
  { name: "Analíticas", href: "#", icon: BarChart3, badge: "Próximamente" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const SidebarContent = () => (
    <div className="flex h-full flex-col gap-4 py-8 px-4">
      <div className="flex items-center gap-2.5 px-3 pb-8">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20 text-primary-foreground transform rotate-3">
          <Bot size={22} strokeWidth={2.5} />
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/70">
            AgentHub
          </span>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/70 -mt-1">
            Plataforma AI
          </span>
        </div>
      </div>

      <ScrollArea className="flex-1 -mx-2 px-2">
        <nav className="flex flex-col gap-1.5">
          {sidebarItems.map((item) => (
            <Link
              key={item.name}
              href={(item as any).badge ? "#" : item.href}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200",
                pathname === item.href 
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                  : "text-muted-foreground hover:bg-white hover:text-foreground hover:shadow-sm ring-1 ring-transparent hover:ring-border/50",
                (item as any).badge && "opacity-60 cursor-not-allowed hover:bg-transparent hover:ring-transparent hover:shadow-none"
              )}
            >
              <item.icon size={20} className={cn(pathname === item.href ? "" : "text-primary/70 group-hover:text-primary")} />
              <span className="flex-1">{item.name}</span>
              {(item as any).badge && (
                <span className="text-[9px] font-bold uppercase tracking-wider bg-muted px-1.5 py-0.5 rounded-md">
                  {(item as any).badge}
                </span>
              )}
              {! (item as any).badge && pathname === item.href && (
                <ChevronRight size={14} className="opacity-50" />
              )}
            </Link>
          ))}
        </nav>
      </ScrollArea>

      <div className="mt-auto space-y-4">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/10">
          <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Tu Plan</p>
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold">Pro Beta</span>
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          </div>
        </div>

        <div className="flex items-center gap-3 px-3 py-3 rounded-[20px] bg-white shadow-sm ring-1 ring-border/50">
          <Avatar className="h-10 w-10 border-2 border-primary/10">
            <AvatarImage src={user.photoURL || ""} alt={user.displayName || "User"} />
            <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold uppercase">
              {user.displayName?.substring(0, 2) || user.email?.substring(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col truncate flex-1">
            <span className="text-sm font-bold truncate leading-none mb-1">
              {user.displayName?.split(' ')[0] || "Usuario"}
            </span>
            <span className="text-[10px] text-muted-foreground truncate font-medium">
              {user.email}
            </span>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={handleLogout}>
            <LogOut size={14} className="text-muted-foreground hover:text-destructive" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen">
      {/* Desktop Sidebar */}
      <aside className="hidden w-72 lg:block fixed h-screen top-0 left-0 bg-background/50 backdrop-blur-sm">
        <div className="h-full border-r">
          <SidebarContent />
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-72 flex flex-col">
        {/* Header (Top Nav) */}
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between bg-background/60 backdrop-blur-xl px-4 lg:px-12">
          <div className="flex items-center gap-4">
            <div className="lg:hidden">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger 
                  render={
                    <Button variant="ghost" size="icon" className="rounded-xl border bg-white/50 backdrop-blur-sm">
                      <Menu size={20} />
                    </Button>
                  }
                />
                <SheetContent side="left" className="p-0 w-72 border-r-0">
                  <SidebarContent />
                </SheetContent>
              </Sheet>
            </div>
            
            <div className="hidden lg:flex flex-col">
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground leading-tight">Métrica Principal</h2>
              <p className="text-sm font-bold text-foreground">Sistemas Operativos</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl bg-white shadow-sm border-border/50">
              <Bell size={18} className="text-muted-foreground" />
            </Button>
            <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl bg-white shadow-sm border-border/50">
              <Settings size={18} className="text-muted-foreground" />
            </Button>
          </div>
        </header>

        {/* Dynamic Content */}
        <main className="flex-1 px-4 py-8 lg:px-12 lg:py-10 max-w-[1600px] mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
