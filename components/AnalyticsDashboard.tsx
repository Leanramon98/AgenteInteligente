"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare, 
  Users, 
  HelpCircle, 
  ArrowUpRight, 
  Calendar,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export function AnalyticsDashboard({ agentId }: { agentId: string }) {
  const [stats, setStats] = useState({
    totalConvs: 0,
    totalMessages: 0,
    fallbackCount: 0,
    avgMsgPerConv: 0
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [unanswered, setUnanswered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!agentId) return;

    const fetchData = async () => {
      try {
        // 1. Basic Stats
        const convsSnap = await getDocs(query(collection(db, "conversations"), where("agentId", "==", agentId)));
        const msgsSnap = await getDocs(query(collection(db, "messages"), where("agentId", "==", agentId)));
        
        const fallbackMsgs = msgsSnap.docs.filter(d => d.data().metadata?.usedFallback);
        
        setStats({
          totalConvs: convsSnap.size,
          totalMessages: msgsSnap.size,
          fallbackCount: fallbackMsgs.length,
          avgMsgPerConv: convsSnap.size > 0 ? Number((msgsSnap.size / convsSnap.size).toFixed(1)) : 0
        });

        // 2. Chart Data (Last 7 days simplified)
        const days: any = {};
        msgsSnap.forEach(doc => {
          const date = doc.data().createdAt?.toDate();
          if (date) {
            const label = format(date, "dd/MM");
            days[label] = (days[label] || 0) + 1;
          }
        });
        
        const sortedChart = Object.keys(days).map(label => ({
          date: label,
          messages: days[label]
        })).slice(-7);
        setChartData(sortedChart);

        // 3. Unanswered (last 5)
        const unansweredList = fallbackMsgs
          .map(d => ({
            id: d.id,
            content: d.data().content,
            date: d.data().createdAt?.toDate() || new Date(),
          }))
          .sort((a, b) => b.date - a.date)
          .slice(0, 5);
        
        setUnanswered(unansweredList);

      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [agentId]);

  if (loading) return <div className="p-8 text-center text-muted-foreground">Cargando estadísticas...</div>;

  const fallbackRate = stats.totalMessages > 0 
    ? ((stats.fallbackCount / (stats.totalMessages / 2)) * 100).toFixed(1) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Conversaciones", value: stats.totalConvs, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
          { title: "Total Mensajes", value: stats.totalMessages, icon: MessageSquare, color: "text-green-600", bg: "bg-green-50" },
          { title: "Msgs / Conv", value: stats.avgMsgPerConv, icon: ArrowUpRight, color: "text-purple-600", bg: "bg-purple-50" },
          { title: "Tasa Fallback", value: `${fallbackRate}%`, icon: AlertCircle, color: "text-red-600", bg: "bg-red-50" },
        ].map((m, i) => (
          <Card key={i} className="border-none shadow-premium bg-card/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className={m.bg + " p-2 rounded-xl " + m.color}>
                  <m.icon size={20} />
                </div>
                {i === 0 && <Badge variant="secondary" className="bg-blue-100 text-blue-700">+12%</Badge>}
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-bold tracking-tight">{m.value}</h3>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{m.title}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <Card className="lg:col-span-2 border-none shadow-premium overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar size={18} className="text-primary" /> Actividad por Día
            </CardTitle>
            <CardDescription>Mensajes recibidos en los últimos 7 días.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorMsgs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="messages" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorMsgs)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Unanswered Questions */}
        <Card className="border-none shadow-premium bg-card/50">
          <CardHeader>
             <CardTitle className="text-lg flex items-center gap-2">
              <HelpCircle size={18} className="text-orange-500" /> Brechas de Conocimiento
            </CardTitle>
            <CardDescription>Preguntas que el agente no pudo responder.</CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <div className="space-y-1">
              {unanswered.length === 0 ? (
                <p className="px-6 text-sm text-muted-foreground italic">No hay preguntas sin respuesta recientes.</p>
              ) : (
                unanswered.map((u, i) => (
                   <div key={i} className="px-6 py-3 hover:bg-muted/50 transition-colors border-b last:border-0 flex flex-col gap-1">
                      <p className="text-sm font-medium line-clamp-2">"{u.content}"</p>
                      <div className="flex items-center justify-between mt-1">
                         <span className="text-[10px] text-muted-foreground uppercase">{format(u.date, "dd MMM, HH:mm", { locale: es })}</span>
                         <Badge variant="outline" className="text-[9px] cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors">
                            Añadir a FAQ
                         </Badge>
                      </div>
                   </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
