"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { Agent } from "@/types/agent";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Plus, 
  Users, 
  Bot, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ArrowRight, 
  Settings2,
  MoreVertical,
  Activity,
  ArrowUpRight
} from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { user } = useAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Simulation of missing config for the banner (we'll make it dynamic later)
  const isConfigMissing = typeof window !== 'undefined' && !process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, "agents"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const agentsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Agent[];
      setAgents(agentsList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const toggleAgentStatus = async (agentId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, "agents", agentId), {
        isActive: !currentStatus
      });
    } catch (error) {
      console.error("Error updating agent status:", error);
    }
  };

  const activeAgents = agents.filter(a => a.isActive).length;

  if (loading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col gap-2">
          <div className="h-10 w-48 bg-muted animate-pulse rounded-lg" />
          <div className="h-5 w-72 bg-muted animate-pulse rounded-lg opacity-50" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-muted animate-pulse rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-64 bg-muted animate-pulse rounded-3xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Configuration Alert Banner */}
      {isConfigMissing && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 flex items-start gap-4 shadow-sm">
          <div className="bg-amber-100 p-3 rounded-2xl text-amber-700">
            <AlertCircle size={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-amber-900">Configuración Pendiente</h3>
            <p className="text-amber-800/80 text-sm mt-1 max-w-2xl text-balance">
              Hemos detectado que faltan algunas variables de entorno (API Keys). Esto impedirá que tus agentes puedan responder. Revisa la documentación o contacta a soporte.
            </p>
          </div>
          <Button variant="outline" className="bg-white border-amber-200 text-amber-900 hover:bg-amber-100 hidden md:flex">
            Ver Configuración
          </Button>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tight text-foreground">
            Monitor de <span className="text-primary italic">Sistemas</span>
          </h1>
          <p className="text-muted-foreground font-medium">Control total sobre tus asistentes inteligentes.</p>
        </div>
        <Button size="lg" className="rounded-2xl shadow-xl shadow-primary/25 h-14 px-8 group" asChild>
          <Link href="/dashboard/agents/new">
            <Plus className="mr-2 h-5 w-5 group-hover:rotate-90 transition-transform duration-300" /> Nuevo Agente
          </Link>
        </Button>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: "Total Agentes", value: agents.length, icon: Bot, color: "text-indigo-600", bg: "bg-indigo-50", trend: "+2" },
          { title: "Activos Ahora", value: activeAgents, icon: Activity, color: "text-emerald-600", bg: "bg-emerald-50", trend: "Estable" },
          { title: "Conversaciones", value: "852", icon: Users, color: "text-blue-600", bg: "bg-blue-50", trend: "+15%" },
          { title: "Tiempo Médio", value: "1.2m", icon: Clock, color: "text-amber-600", bg: "bg-amber-50", trend: "-5s" },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-premium rounded-[2rem] overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
            <CardContent className="p-7">
              <div className="flex items-start justify-between">
                <div className={cn("p-3.5 rounded-2xl group-hover:scale-110 transition-transform duration-300", stat.bg, stat.color)}>
                  <stat.icon size={22} strokeWidth={2.5} />
                </div>
                <Badge variant="outline" className="rounded-lg border-none bg-muted text-[10px] font-bold uppercase tracking-wider">
                  {stat.trend}
                </Badge>
              </div>
              <div className="mt-6 flex flex-col">
                <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">{stat.title}</span>
                <span className="text-3xl font-black mt-1 tracking-tight">{stat.value}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Agents Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-2xl font-black tracking-tight">Ecosistema AI</h2>
          <Button variant="ghost" size="sm" className="font-bold text-primary group">
            Ver detalle completo <ArrowRight size={14} className="ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>

        {agents.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-20 border-2 border-dashed rounded-[3rem] glass text-center space-y-6">
            <div className="bg-primary/10 p-6 rounded-[2rem] animate-bounce">
              <Bot className="w-12 h-12 text-primary" />
            </div>
            <div className="max-w-md mx-auto space-y-2">
              <h3 className="text-2xl font-black">Tu panel está vacío</h3>
              <p className="text-muted-foreground font-medium text-balance">
                Comienza creando tu primer agente inteligente. Podrás configurarlo para WhatsApp, Web o Telegram en minutos.
              </p>
            </div>
            <Button size="lg" className="rounded-2xl px-10 shadow-lg" asChild>
              <Link href="/dashboard/agents/new">Crear mi primer agente</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {agents.map((agent) => (
              <Card key={agent.id} className="group relative border-none shadow-premium bg-white/60 backdrop-blur-sm rounded-[2.5rem] overflow-hidden hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                <div 
                  className="absolute top-0 left-0 w-full h-1.5 opacity-60 group-hover:opacity-100 transition-opacity" 
                  style={{ backgroundColor: agent.brandColor }} 
                />
                
                <CardHeader className="p-8 pb-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="relative">
                      <Avatar className="h-16 w-16 border-4 border-white shadow-xl">
                        <AvatarImage src={agent.logoUrl} className="object-cover" />
                        <AvatarFallback className="text-xl font-black" style={{ backgroundColor: agent.brandColor + '22', color: agent.brandColor }}>
                          {agent.name.substring(0, 1).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {agent.isActive && (
                        <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 border-4 border-white shadow-sm" />
                      )}
                    </div>
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted">
                       <MoreVertical size={18} className="text-muted-foreground" />
                    </Button>
                  </div>
                  <CardTitle className="text-2xl font-black tracking-tight group-hover:text-primary transition-colors">
                    {agent.name}
                  </CardTitle>
                  <CardDescription className="line-clamp-2 mt-2 font-medium leading-relaxed text-muted-foreground/80 h-10">
                    {agent.description || "Sin descripción establecida."}
                  </CardDescription>
                </CardHeader>

                <CardContent className="px-8 pb-4 pt-4">
                   <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Users size={12} className="text-primary" /> 124 Chats
                      </div>
                      <div className="flex items-center gap-1.5">
                         <CheckCircle2 size={12} className="text-emerald-500" /> 98% Precisión
                      </div>
                   </div>
                </CardContent>

                <CardFooter className="px-8 py-7 flex items-center justify-between border-t border-border/40 bg-muted/20">
                  <div className="flex items-center gap-3">
                    <Switch 
                      checked={agent.isActive} 
                      onCheckedChange={() => toggleAgentStatus(agent.id, agent.isActive)} 
                      className="data-[state=checked]:bg-emerald-500"
                    />
                    <span className="text-xs font-black uppercase tracking-widest text-muted-foreground/70">
                      {agent.isActive ? "Online" : "Offline"}
                    </span>
                  </div>
                  <Button variant="ghost" className="rounded-xl font-bold bg-white shadow-sm ring-1 ring-border group/btn" asChild>
                    <Link href={`/dashboard/agents/${agent.id}`} className="flex items-center gap-2">
                       Ajustes <Settings2 size={14} className="group-hover/btn:rotate-90 transition-transform" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
