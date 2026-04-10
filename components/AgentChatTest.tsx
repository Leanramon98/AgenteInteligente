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
  BookOpen,
  Info,
  Sparkles,
  Zap,
  ShieldCheck
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
    } catch (error: any) {
      console.error("Chat error:", error);
      let errorMsg = "Lo siento, ha ocurrido un error al procesar tu solicitud.";
      if (error.message?.includes("OPENAI_API_KEY")) {
        errorMsg = "⚠️ Error de Configuración: La API Key de OpenAI no es válida o falta en el servidor.";
      }
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: errorMsg 
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
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 h-[75vh] animate-in fade-in duration-700">
      <div className="lg:col-span-1 space-y-6 flex flex-col">
        <Card className="border-none shadow-md bg-white/50 backdrop-blur-sm rounded-[2rem] overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-black flex items-center gap-2 uppercase tracking-widest text-muted-foreground">
              <Info size={16} className="text-primary" /> Perfil del Agente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-2">
            <div className="flex flex-col items-center text-center p-4 rounded-3xl bg-white shadow-sm ring-1 ring-border/50">
               <Avatar className="h-16 w-16 border-4 border-background shadow-lg mb-3">
                <AvatarImage src={agent.logoUrl} className="object-cover" />
                <AvatarFallback className="font-black text-xl" style={{ backgroundColor: agent.brandColor + '22', color: agent.brandColor }}>
                  {agent.name.substring(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <p className="font-black text-lg leading-tight">{agent.name}</p>
                <div className="flex items-center justify-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">{agent.tone} • {agent.language}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
               <div className="flex items-center gap-3 text-xs font-bold text-muted-foreground/80">
                  <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                    <Zap size={14} />
                  </div>
                  <span>Motor RAG Generativo</span>
               </div>
               <div className="flex items-center gap-3 text-xs font-bold text-muted-foreground/80">
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                    <ShieldCheck size={14} />
                  </div>
                  <span>Memoria Corto Plazo</span>
               </div>
            </div>

            <Button variant="outline" size="sm" className="w-full h-11 rounded-xl border-dashed hover:border-solid gap-2 font-bold" onClick={resetChat}>
              <RotateCcw size={14} /> Reiniciar Sesión
            </Button>
          </CardContent>
        </Card>
        
        <div className="mt-auto p-4 rounded-3xl bg-muted/30 border border-dashed flex flex-col gap-2">
           <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Estado del Servidor</p>
           <div className="flex items-center justify-between">
              <span className="text-xs font-bold">Latencia</span>
              <span className="text-xs font-mono text-emerald-600">~240ms</span>
           </div>
        </div>
      </div>

      <div className="lg:col-span-3 flex flex-col">
        <Card className="flex-1 flex flex-col overflow-hidden border-none shadow-premium bg-white/40 backdrop-blur-md rounded-[2.5rem] ring-1 ring-white/50">
          <CardHeader className="py-4 px-8 border-b border-border/40 bg-white/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="p-2 rounded-xl bg-primary/10 text-primary">
                   <Sparkles size={18} />
                 </div>
                 <div>
                    <span className="text-sm font-black tracking-tight">AI Playground</span>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Previsualización en tiempo real</p>
                 </div>
              </div>
              <Badge variant="outline" className="rounded-full bg-white border-none shadow-sm text-[9px] font-black tracking-widest px-3">
                GPT-4 ANALYTICS
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 overflow-hidden p-0 relative">
            <ScrollArea className="h-full w-full">
              <div className="p-8 space-y-8 min-h-full" ref={scrollRef}>
                {messages.map((m, i) => (
                  <div key={i} className={cn(
                    "flex gap-5 w-full animate-in fade-in slide-in-from-bottom-2 duration-500",
                    m.role === "user" ? "flex-row-reverse" : "flex-row"
                  )}>
                    <Avatar className={cn(
                      "h-10 w-10 mt-1 shrink-0 shadow-sm transition-transform hover:scale-110",
                      m.role === "user" ? "bg-primary border-4 border-white" : "border-4 border-white bg-white"
                    )}>
                      {m.role === "user" ? (
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs font-black">U</AvatarFallback>
                      ) : (
                        <>
                          <AvatarImage src={agent.logoUrl} className="object-cover" />
                          <AvatarFallback style={{ backgroundColor: agent.brandColor + '22', color: agent.brandColor }} className="font-black text-xs">AI</AvatarFallback>
                        </>
                      )}
                    </Avatar>
                    
                    <div className={cn(
                      "flex flex-col max-w-[85%] gap-2.5",
                      m.role === "user" ? "items-end" : "items-start"
                    )}>
                      <div className={cn(
                        "rounded-[1.5rem] px-5 py-3 text-sm font-medium leading-relaxed selection:bg-white/30",
                        m.role === "user" 
                          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 rounded-tr-[0.2rem] text-right" 
                          : "bg-white shadow-premium rounded-tl-[0.2rem] text-left border border-border/50"
                      )}>
                        {m.content}
                      </div>
                      
                      {m.sources && m.sources.length > 0 && (
                        <div className="mt-1 w-full flex flex-col gap-2">
                          <button 
                            onClick={() => setExpandedSourceIndex(expandedSourceIndex === i ? null : i)}
                            className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-primary/70 hover:text-primary transition-all ml-1 w-fit"
                          >
                            <BookOpen size={12} className="text-primary" /> 
                            {m.sources.length} FUENTES DE CONOCIMIENTO
                            {expandedSourceIndex === i ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          </button>
                          
                          {expandedSourceIndex === i && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1 animate-in zoom-in-95 fade-in duration-300">
                              {m.sources.map((src, si) => (
                                <div key={si} className="p-4 rounded-3xl bg-white/80 border border-border/50 shadow-sm group hover:ring-2 hover:ring-primary/20 transition-all">
                                  <div className="flex items-center justify-between mb-2">
                                     <p className="text-[10px] font-black text-primary uppercase truncate max-w-[120px]">{src.source || "Documento"}</p>
                                     <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-none text-[8px] font-black">
                                       {Math.round(src.similarity * 100)}% MATCH
                                     </Badge>
                                  </div>
                                  <p className="text-[11px] font-medium text-muted-foreground italic leading-relaxed line-clamp-3">"{src.content}"</p>
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
                  <div className="flex gap-5 w-full animate-in fade-in duration-300">
                    <Avatar className="h-10 w-10 mt-1 border-4 border-white bg-white animate-bounce">
                      <AvatarFallback className="font-black text-[10px]">...</AvatarFallback>
                    </Avatar>
                    <div className="bg-white/60 shadow-sm border border-border/50 rounded-[1.5rem] rounded-tl-[0.2rem] px-5 py-4 flex items-center gap-3">
                       <div className="flex gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                       </div>
                       <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Procesando Inteligencia Contextual</span>
                    </div>
                  </div>
                )}
                <div className="h-4" />
              </div>
            </ScrollArea>
          </CardContent>

          <CardFooter className="p-6 border-t border-border/40 bg-white/60 backdrop-blur-xl">
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="flex w-full items-center gap-3 bg-muted/40 p-2 rounded-[2rem] border border-border/50 focus-within:ring-2 ring-primary/20 transition-all shadow-inner"
            >
              <div className="p-3 bg-white rounded-full shadow-sm">
                 <Bot size={20} className="text-primary" />
              </div>
              <Input 
                placeholder="Prueba la personalidad de tu agente aquí..." 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                autoFocus
                disabled={loading}
                className="flex-1 bg-transparent border-none focus-visible:ring-0 text-sm font-medium h-12"
              />
              <Button type="submit" size="icon" disabled={!input.trim() || loading} className="h-12 w-12 rounded-full shadow-lg shadow-primary/30">
                <Send size={18} />
              </Button>
            </form>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
