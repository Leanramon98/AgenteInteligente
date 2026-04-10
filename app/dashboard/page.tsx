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
import { Plus, Users, Bot, CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function DashboardPage() {
  const { user } = useAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

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
    return <div className="space-y-4">
      <div className="h-40 bg-muted animate-pulse rounded-lg" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />)}
      </div>
    </div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">¡Bienvenido, {user?.displayName?.split(' ')[0]}!</h1>
          <p className="text-muted-foreground">Aquí está el resumen de tus agentes conversacionales.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/agents/new">
            <Plus className="mr-2 h-4 w-4" /> Nuevo Agente
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Agentes</CardTitle>
            <Bot className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{agents.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Agentes Activos</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeAgents}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Conversaciones</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold italic opacity-30">Coming soon</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Tiempo Promedio</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold italic opacity-30">Coming soon</div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold">Tus Agentes</h2>
        {agents.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-xl bg-card text-center space-y-4">
            <div className="bg-primary/10 p-4 rounded-full">
              <Plus className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">No tienes agentes todavía</h3>
              <p className="text-muted-foreground">Crea tu primer asistente para empezar a conversar.</p>
            </div>
            <Button asChild>
              <Link href="/dashboard/agents/new">Crear mi primer agente</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent) => (
              <Card key={agent.id} className="group hover:shadow-lg transition-all border-none shadow-sm overflow-hidden ring-1 ring-border">
                <CardHeader className="pb-4 relative">
                  <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: agent.brandColor }} />
                  <div className="flex items-start justify-between">
                    <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                      <AvatarImage src={agent.logoUrl} />
                      <AvatarFallback className="text-lg font-bold" style={{ backgroundColor: agent.brandColor + '33', color: agent.brandColor }}>
                        {agent.name.substring(0, 1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <Badge variant={agent.isActive ? "default" : "secondary"}>
                      {agent.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                  <CardTitle className="pt-4">{agent.name}</CardTitle>
                  <CardDescription className="line-clamp-2 min-h-[2.5rem]">
                    {agent.description}
                  </CardDescription>
                </CardHeader>
                <CardFooter className="flex items-center justify-between border-t py-4 bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Switch 
                      checked={agent.isActive} 
                      onCheckedChange={() => toggleAgentStatus(agent.id, agent.isActive)} 
                    />
                    <span className="text-xs font-medium uppercase tracking-tight text-muted-foreground">
                      {agent.isActive ? "Online" : "Offline"}
                    </span>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/dashboard/agents/${agent.id}`}>Configurar</Link>
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
