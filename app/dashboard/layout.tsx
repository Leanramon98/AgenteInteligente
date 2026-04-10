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
  User as UserIcon,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const sidebarItems = [
  { name: "Panel", href: "/dashboard", icon: LayoutDashboard, disabled: false },
  { name: "Agentes", href: "/dashboard/agents", icon: Bot, disabled: false },
  { name: "Conversaciones", href: "#", icon: MessageSquare, disabled: true },
  { name: "Analíticas", href: "#", icon: BarChart3, disabled: true },
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
    <div className="flex h-full flex-col gap-4 py-6 px-4">
      <div className="flex items-center gap-2 px-2 pb-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Bot size={20} />
        </div>
        <span className="text-xl font-bold tracking-tight">AgentHub</span>
      </div>
      <ScrollArea className="flex-1 px-2">
        <nav className="flex flex-col gap-1">
          {sidebarItems.map((item) => (
            <Link
              key={item.name}
              href={item.disabled ? "#" : item.href}
              className={cn(
                "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted",
                pathname === item.href ? "bg-muted text-foreground" : "text-muted-foreground",
                item.disabled && "cursor-not-allowed opacity-50 hover:bg-transparent"
              )}
            >
              <item.icon size={18} />
              {item.name}
              {pathname === item.href && (
                <ChevronRight className="ml-auto" size={14} />
              )}
            </Link>
          ))}
        </nav>
      </ScrollArea>
      <div className="mt-auto border-t pt-4">
        <div className="flex items-center gap-3 px-2 py-3 rounded-lg bg-card border shadow-sm mb-4">
          <Avatar className="h-9 w-9 border">
            <AvatarImage src={user.photoURL || ""} alt={user.displayName || "User"} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold font-mono uppercase">
              {user.displayName?.substring(0, 2) || user.email?.substring(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col truncate">
            <span className="text-sm font-semibold truncate leading-none">
              {user.displayName || "Usuario"}
            </span>
            <span className="text-xs text-muted-foreground truncate">
              {user.email}
            </span>
          </div>
        </div>
        <Button 
          variant="ghost" 
          className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10" 
          onClick={handleLogout}
        >
          <LogOut size={18} />
          Cerrar Sesión
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-50/50">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 border-r bg-background lg:block fixed h-screen top-0 left-0">
        <SidebarContent />
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-64 flex flex-col">
        {/* Header (Top Nav) */}
        <header className="sticky top-0 z-30 flex h-16 items-center border-b bg-background/80 backdrop-blur-md px-4 lg:px-8">
          <div className="lg:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger>
                <Button variant="ghost" size="icon" className="mr-2">
                  <Menu size={20} />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64">
                <SidebarContent />
              </SheetContent>
            </Sheet>
          </div>
          
          <div className="flex items-center gap-2 lg:hidden">
            <Bot className="text-primary" size={24} />
            <span className="font-bold">AgentHub</span>
          </div>

          <div className="ml-auto flex items-center gap-4">
            <Avatar className="h-8 w-8 cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all border">
              <AvatarImage src={user.photoURL || ""} alt={user.displayName || ""} />
              <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold font-mono">
                {user.displayName?.substring(0, 2).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Dynamic Content */}
        <main className="flex-1 p-4 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
