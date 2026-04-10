"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy, onSnapshot, doc, getDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  MessageSquare, 
  Search, 
  ChevronRight, 
  Phone, 
  Clock,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  BookOpen,
  ArrowLeft
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Conversation {
  id: string;
  agentId: string;
  externalUserId: string;
  status: string;
  updatedAt: any;
  lastMessage?: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: any;
  metadata?: any;
}

export function ConversationsList({ agentId }: { agentId: string }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!agentId) return;

    const q = query(
      collection(db, "conversations"),
      where("agentId", "==", agentId),
      orderBy("updatedAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Conversation));
      setConversations(data);
      setLoading(false);
    });

    return () => unsub();
  }, [agentId]);

  useEffect(() => {
    if (!selectedId) return;

    const q = query(
      collection(db, "messages"),
      where("conversationId", "==", selectedId),
      orderBy("createdAt", "asc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      setMessages(data);
    });

    return () => unsub();
  }, [selectedId]);

  const maskPhone = (phone: string) => {
    if (phone.startsWith("whatsapp:")) return phone.replace("whatsapp:+", "+").replace(/(\d{5})\d{4}(\d{2})/, "$1****$2");
    return phone.replace(/(\d{3})\d{4}(\d{3})/, "$1****$3");
  };

  const filtered = conversations.filter(c => 
    c.externalUserId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[75vh]">
      {/* Sidebar List */}
      <Card className={cn(
        "lg:col-span-1 flex flex-col overflow-hidden border-none shadow-premium",
        selectedId ? "hidden lg:flex" : "flex"
      )}>
        <CardHeader className="px-4 py-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input 
              placeholder="Buscar por teléfono..." 
              className="pl-10 bg-muted/30 border-none h-9 text-xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-0 overflow-hidden">
          <ScrollArea className="h-full">
            {filtered.map((c) => (
              <div 
                key={c.id} 
                onClick={() => setSelectedId(c.id)}
                className={cn(
                  "px-4 py-4 flex items-center justify-between cursor-pointer border-b last:border-0 hover:bg-muted/30 transition-colors",
                  selectedId === c.id && "bg-muted/50 border-r-4 border-r-primary"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <Phone size={18} />
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-sm tracking-tight">{maskPhone(c.externalUserId)}</p>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium uppercase">
                      <Clock size={10} /> {c.updatedAt ? format(c.updatedAt.toDate(), "dd MMM, HH:mm", { locale: es }) : "..."}
                    </div>
                  </div>
                </div>
                <ChevronRight size={16} className="text-muted-foreground/50" />
              </div>
            ))}
            {filtered.length === 0 && !loading && (
              <div className="p-8 text-center text-muted-foreground space-y-2">
                <MessageSquare size={32} className="mx-auto opacity-20" />
                <p className="text-xs">No se encontraron conversaciones.</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Detail Thread */}
      <Card className={cn(
        "lg:col-span-2 flex flex-col overflow-hidden border-none shadow-premium",
        !selectedId ? "hidden lg:flex bg-muted/10 items-center justify-center" : "flex"
      )}>
        {!selectedId ? (
          <div className="text-center space-y-4 max-w-xs px-6">
            <div className="p-6 bg-muted/50 rounded-full w-fit mx-auto text-muted-foreground/30">
              <MessageSquare size={48} />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-lg">Historial de Mensajes</h3>
              <p className="text-sm text-muted-foreground italic">Selecciona una conversación a la izquierda para ver el detalle de la interacción.</p>
            </div>
          </div>
        ) : (
          <>
            <CardHeader className="py-3 px-4 border-b flex flex-row items-center justify-between bg-muted/20">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSelectedId(null)}>
                  <ArrowLeft size={18} />
                </Button>
                <div>
                  <CardTitle className="text-sm font-bold">{maskPhone(conversations.find(c => c.id === selectedId)?.externalUserId || "")}</CardTitle>
                  <CardDescription className="text-[10px] uppercase font-bold tracking-widest text-primary/70">Conversation ID: {selectedId.substring(0, 8)}</CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="bg-background/50 border-green-500/20 text-green-600 px-2 flex items-center gap-1">
                 <div className="w-1.5 h-1.5 rounded-full bg-green-500" /> WhatsApp
              </Badge>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden relative bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-opacity-5">
              <ScrollArea className="h-full w-full">
                <div className="p-6 space-y-6">
                  {messages.map((m, i) => (
                    <div key={m.id} className={cn(
                      "flex gap-4 w-full",
                      m.role === "assistant" ? "flex-row" : "flex-row-reverse"
                    )}>
                      <Avatar className={cn(
                        "h-8 w-8 mt-1",
                        m.role === "assistant" ? "border" : "bg-primary"
                      )}>
                         <AvatarFallback className="text-[10px]">{m.role === "assistant" ? "AH" : "U"}</AvatarFallback>
                      </Avatar>
                      <div className={cn(
                        "flex flex-col gap-1.5 max-w-[80%]",
                        m.role === "assistant" ? "items-start" : "items-end"
                      )}>
                        <div className={cn(
                          "px-4 py-2.5 rounded-2xl text-sm shadow-sm",
                          m.role === "assistant" 
                            ? "bg-card rounded-tl-none border" 
                            : "bg-primary text-primary-foreground rounded-tr-none"
                        )}>
                          {m.content}
                        </div>
                        <span className="text-[9px] text-muted-foreground uppercase font-bold">
                          {m.createdAt ? format(m.createdAt.toDate(), "HH:mm") : "..."}
                        </span>

                        {m.metadata?.sources && (
                          <div className="w-full mt-2">
                            <button 
                              onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}
                              className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors font-bold uppercase"
                            >
                              <BookOpen size={10} /> Fuentes {expandedIndex === i ? <ChevronUp size={10}/> : <ChevronDown size={10}/>}
                            </button>
                            {expandedIndex === i && (
                              <div className="mt-2 space-y-2 animate-in fade-in duration-300">
                                {m.metadata.sources.map((s: any, si: number) => (
                                  <div key={si} className="p-2 bg-muted/50 rounded-lg text-[11px] border">
                                    <p className="font-bold text-primary mb-1">{s.source}</p>
                                    <p className="italic text-muted-foreground line-clamp-2">"{s.content}"</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
