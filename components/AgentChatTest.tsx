"use client";

import { useState, useRef, useEffect } from "react";
import { Agent } from "@/types/agent";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Send, 
  RotateCcw, 
  Bot, 
  User as UserIcon, 
  Loader2, 
  ChevronDown, 
  ChevronUp,
  BookOpen
} from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: any[];
}

export function AgentChatTest({ agent }: { agent: Agent }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: agent.welcomeMessage }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [expandedSourceIndex, setExpandedSourceIndex] = useState<number | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: agent.id,
          message: userMsg,
          conversationHistory: history.slice(-6) // Send last 6 messages
        })
      });

      const data = await res.json();
      
      if (data.error) throw new Error(data.error);

      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: data.answer,
        sources: data.sources
      }]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "Lo siento, ha ocurrido un error al procesar tu solicitud." 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const resetChat = () => {
    setMessages([{ role: "assistant", content: agent.welcomeMessage }]);
    setExpandedSourceIndex(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[70vh]">
      <div className="lg:col-span-1 space-y-4">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <BookOpen size={16} /> Sobre este Agente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
               <Avatar className="h-10 w-10">
                <AvatarImage src={agent.logoUrl} />
                <AvatarFallback style={{ backgroundColor: agent.brandColor + '22', color: agent.brandColor }}>
                  {agent.name.substring(0, 1)}
                </AvatarFallback>
              </Avatar>
              <div className="text-sm">
                <p className="font-bold">{agent.name}</p>
                <p className="text-muted-foreground text-xs uppercase tracking-tighter">{agent.tone} • {agent.language}</p>
              </div>
            </div>
            <div className="text-xs space-y-2 text-muted-foreground italic">
              <p>Este chat utiliza el motor RAG para responder basándose en los documentos subidos.</p>
              <p>Si la respuesta no es precisa, revisa los fragmentos en la pestaña de Conocimiento.</p>
            </div>
            <Button variant="outline" size="sm" className="w-full gap-2" onClick={resetChat}>
              <RotateCcw size={14} /> Reiniciar Chat
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-3 flex flex-col gap-4">
        <Card className="flex-1 flex flex-col overflow-hidden border-none shadow-xl ring-1 ring-border">
          <CardHeader className="py-3 px-4 border-b bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                 <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Entorno de Prueba</span>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 overflow-hidden p-0 relative">
            <div 
              className="h-full w-full overflow-y-auto" 
              ref={scrollRef}
            >
              <div className="p-6 space-y-6">
                {messages.map((m, i) => (
                  <div key={i} className={cn(
                    "flex gap-4 w-full",
                    m.role === "user" ? "flex-row-reverse" : "flex-row"
                  )}>
                    <Avatar className={cn(
                      "h-8 w-8 mt-1 shrink-0",
                      m.role === "user" ? "bg-primary" : "border"
                    )}>
                      {m.role === "user" ? (
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">U</AvatarFallback>
                      ) : (
                        <>
                          <AvatarImage src={agent.logoUrl} />
                          <AvatarFallback style={{ backgroundColor: agent.brandColor + '22', color: agent.brandColor }}>R</AvatarFallback>
                        </>
                      )}
                    </Avatar>
                    
                    <div className={cn(
                      "flex flex-col max-w-[80%] gap-2",
                      m.role === "user" ? "items-end" : "items-start"
                    )}>
                      <div className={cn(
                        "rounded-2xl px-4 py-2 text-sm shadow-sm",
                        m.role === "user" 
                          ? "bg-primary text-primary-foreground rounded-tr-none" 
                          : "bg-muted rounded-tl-none"
                      )}>
                        {m.content}
                      </div>
                      
                      {m.sources && m.sources.length > 0 && (
                        <div className="mt-2 w-full">
                          <button 
                            onClick={() => setExpandedSourceIndex(expandedSourceIndex === i ? null : i)}
                            className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-muted-foreground hover:text-primary transition-colors"
                          >
                            <BookOpen size={10} /> 
                            Fuentes utilizadas ({m.sources.length})
                            {expandedSourceIndex === i ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                          </button>
                          
                          {expandedSourceIndex === i && (
                            <div className="mt-2 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                              {m.sources.map((src, si) => (
                                <div key={si} className="p-2 rounded bg-muted/50 text-[11px] border">
                                  <p className="font-bold text-primary mb-1">{src.source}</p>
                                  <p className="line-clamp-3 text-muted-foreground italic">"{src.content}"</p>
                                  <p className="text-[9px] mt-1 opacity-50 text-right">Relevancia: {Math.round(src.similarity * 100)}%</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {loading && (
                  <div className="flex gap-4 w-full">
                    <Avatar className="h-8 w-8 mt-1 border">
                      <AvatarFallback className="animate-pulse">...</AvatarFallback>
                    </Avatar>
                    <div className="bg-muted rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center gap-2">
                       <Loader2 size={16} className="animate-spin text-muted-foreground" />
                       <span className="text-sm text-muted-foreground font-medium">Buscando en documentos...</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>

          <CardFooter className="p-4 border-t bg-card">
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="flex w-full items-center gap-2"
            >
              <Input 
                placeholder="Escribe un mensaje para probar..." 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                autoFocus
                disabled={loading}
                className="flex-1 bg-muted/30 border-none focus-visible:ring-1"
              />
              <Button type="submit" size="icon" disabled={!input.trim() || loading}>
                <Send size={18} />
              </Button>
            </form>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
