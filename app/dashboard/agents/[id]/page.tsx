"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db, storage } from "@/lib/firebase";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Agent, AgentTone, AgentLanguage } from "@/types/agent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronLeft, 
  Save, 
  Trash2, 
  Upload, 
  Loader2, 
  Settings, 
  Brain, 
  Database, 
  Globe, 
  Activity,
  AlertTriangle,
  MessageSquare,
  Sparkles,
  ExternalLink
} from "lucide-react";
import Link from "next/link";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";

import { KnowledgeBase } from "@/components/KnowledgeBase";
import { AgentChatTest } from "@/components/AgentChatTest";
import { ChannelsManager } from "@/components/ChannelsManager";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import { ConversationsList } from "@/components/ConversationsList";
import { cn } from "@/lib/utils";

export default function AgentDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user || !id) return;

    const fetchAgent = async () => {
      try {
        const docRef = doc(db, "agents", id as string);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists() && docSnap.data().userId === user.uid) {
          setAgent({ id: docSnap.id, ...docSnap.data() } as Agent);
        } else {
          router.push("/dashboard");
        }
      } catch (error) {
        console.error("Error fetching agent:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAgent();
  }, [user, id, router]);

  const handleUpdate = async (updatedFields: Partial<Agent>) => {
    if (!agent) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "agents", agent.id), updatedFields);
      setAgent({ ...agent, ...updatedFields });
    } catch (error) {
      console.error("Error updating agent:", error);
      alert("Error al guardar los cambios.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!agent) return;
    try {
      await deleteDoc(doc(db, "agents", agent.id));
      router.push("/dashboard");
    } catch (error) {
      console.error("Error deleting agent:", error);
      alert("Error al eliminar el agente.");
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !agent || !user) return;

    setUploading(true);
    try {
      const storageRef = ref(storage, `users/${user.uid}/agents/${agent.id}/logo`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      await handleUpdate({ logoUrl: url });
    } catch (error) {
      console.error("Error uploading logo:", error);
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  if (!agent) return null;

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
        <div className="flex items-center gap-6">
          <Button variant="ghost" size="icon" asChild className="rounded-full bg-white shadow-sm ring-1 ring-border/50 hidden md:flex">
            <Link href="/dashboard">
              <ChevronLeft size={20} />
            </Link>
          </Button>
          <div className="relative">
            <Avatar className="h-20 w-20 border-4 border-white shadow-2xl relative z-10">
              <AvatarImage src={agent.logoUrl} className="object-cover" />
              <AvatarFallback className="text-2xl font-black" style={{ backgroundColor: agent.brandColor + '22', color: agent.brandColor }}>
                {agent.name.substring(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-emerald-500 border-4 border-white shadow-sm z-20" />
            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-150 opacity-20 -z-10" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
               <h1 className="text-3xl md:text-4xl font-black tracking-tight">{agent.name}</h1>
               <Badge variant="outline" className="rounded-full bg-white/50 backdrop-blur-sm border-none shadow-sm text-[10px] font-black tracking-widest hidden sm:flex">
                 SISTEMA ACTIVO
               </Badge>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: agent.brandColor }} />
                <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider">ID: {agent.id.substring(0, 8)}...</p>
              </div>
              <span className="text-muted-foreground/30">•</span>
              <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider">{agent.language} native</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-xl h-11 px-6 font-bold bg-white/50 backdrop-blur-sm border-none shadow-sm hover:shadow-md transition-all gap-2">
            <ExternalLink size={16} /> Ver Chat
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-11 w-11 rounded-xl text-destructive hover:bg-destructive/10">
                <Trash2 size={20} />
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[2.5rem] p-8 border-none shadow-2xl">
              <DialogHeader>
                <div className="bg-destructive/10 w-12 h-12 rounded-2xl flex items-center justify-center text-destructive mb-4">
                   <AlertTriangle size={24} />
                </div>
                <DialogTitle className="text-2xl font-black tracking-tight">
                  ¿Eliminar Ecosistema?
                </DialogTitle>
                <DialogDescription className="text-base font-medium leading-relaxed pt-2">
                  Esta acción no se puede deshacer. Se eliminarán permanentemente todos los datos de <strong>{agent.name}</strong>, incluyendo su base de conocimiento y chats.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="pt-6 gap-3">
                <Button variant="ghost" className="rounded-2xl h-12 px-6 font-bold">Cancelar</Button>
                <Button variant="destructive" onClick={handleDelete} className="rounded-2xl h-12 px-8 font-bold shadow-lg shadow-destructive/20">
                  Confirmar Eliminación
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="personality" className="w-full space-y-10">
        <ScrollArea className="w-full whitespace-nowrap pb-2">
          <TabsList className="inline-flex h-14 p-1.5 bg-white/40 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm w-fit">
            {[
              { id: "personality", label: "Personalidad", icon: Brain },
              { id: "knowledge", label: "Conocimiento", icon: Database },
              { id: "test", label: "Prueba Real", icon: Sparkles },
              { id: "channels", label: "Canales", icon: Globe },
              { id: "conversations", label: "Chats", icon: MessageSquare },
              { id: "analytics", label: "Métricas", icon: Activity },
              { id: "general", label: "Ajustes", icon: Settings },
            ].map((tab) => (
              <TabsTrigger 
                key={tab.id} 
                value={tab.id} 
                className="rounded-xl px-6 py-2.5 gap-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg shadow-primary/20 transition-all font-bold text-xs uppercase tracking-widest"
              >
                <tab.icon size={16} /> {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </ScrollArea>

        <div className="min-h-[60vh]">
          <TabsContent value="knowledge" className="mt-0 focus-visible:ring-0">
            <KnowledgeBase agentId={agent.id} />
          </TabsContent>

          <TabsContent value="test" className="mt-0 focus-visible:ring-0">
            <div className="grid grid-cols-1 gap-6">
              <AgentChatTest agent={agent} />
            </div>
          </TabsContent>

          <TabsContent value="channels" className="mt-0 focus-visible:ring-0">
            <ChannelsManager agentId={agent.id} />
          </TabsContent>

          <TabsContent value="conversations" className="mt-0 focus-visible:ring-0">
            <ConversationsList agentId={agent.id} />
          </TabsContent>

          <TabsContent value="analytics" className="mt-0 focus-visible:ring-0">
            <AnalyticsDashboard agentId={agent.id} />
          </TabsContent>

          <TabsContent value="general" className="mt-0 focus-visible:ring-0">
            <Card className="border-none shadow-premium rounded-[2.5rem] bg-white/70 backdrop-blur-md overflow-hidden">
              <CardHeader className="p-10 pb-4">
                <CardTitle className="text-2xl font-black tracking-tight">Identidad Visual</CardTitle>
                <CardDescription className="text-base font-medium">Define cómo el mundo ve a tu asistente.</CardDescription>
              </CardHeader>
              <CardContent className="p-10 space-y-12">
                <div className="flex flex-col lg:flex-row gap-16 items-start">
                  <div className="space-y-6 flex flex-col items-center shrink-0 w-full lg:w-48">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mr-auto lg:mx-auto">Logo Actual</Label>
                    <div className="relative group">
                       <Avatar className="h-40 w-40 border shadow-2xl rounded-[3rem] transition-transform group-hover:scale-105 duration-500">
                        <AvatarImage src={agent.logoUrl} className="object-cover" />
                        <AvatarFallback className="text-6xl font-black" style={{ backgroundColor: agent.brandColor + '22', color: agent.brandColor }}>
                          {agent.name.substring(0, 1).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute inset-0 bg-black/40 rounded-[3rem] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                      >
                         <Upload size={32} />
                      </button>
                    </div>
                    <input 
                      type="file" 
                      className="hidden" 
                      ref={fileInputRef} 
                      onChange={handleLogoUpload}
                      accept="image/*"
                    />
                    <div className="text-center space-y-1">
                       <p className="text-[10px] font-bold text-muted-foreground uppercase">Formato recomendado</p>
                       <p className="text-[10px] text-muted-foreground/60 italic">PNG/JPG de 512x512</p>
                    </div>
                  </div>
                  
                  <div className="flex-1 space-y-10 w-full">
                    <div className="space-y-3">
                      <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Nombre del Ecosistema</Label>
                      <Input 
                        id="name" 
                        defaultValue={agent.name} 
                        className="h-14 rounded-2xl px-6 text-xl font-bold border-border/50 bg-white shadow-sm focus:ring-primary/20"
                        onBlur={(e) => handleUpdate({ name: e.target.value })} 
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Descripción Interna</Label>
                      <Textarea 
                        id="description" 
                        defaultValue={agent.description}
                        className="min-h-[120px] rounded-2xl p-6 text-base font-medium border-border/50 bg-white shadow-sm focus:ring-primary/20 leading-relaxed"
                        onBlur={(e) => handleUpdate({ description: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 border-t pt-10 border-border/40">
                       <div className="flex flex-col gap-4">
                          <div className="space-y-1">
                             <Label className="text-base font-black">Color Distinctivo</Label>
                             <p className="text-xs font-medium text-muted-foreground">Utilizado en la interfaz del chat y branding.</p>
                          </div>
                          <div className="flex items-center gap-4 bg-muted/30 p-2 rounded-2xl border border-border/40 w-fit">
                            <Input 
                              type="color" 
                              defaultValue={agent.brandColor}
                              className="w-12 h-12 p-1 border-none bg-transparent cursor-pointer rounded-xl"
                              onChange={(e) => handleUpdate({ brandColor: e.target.value })}
                            />
                            <span className="font-mono text-sm font-black uppercase mr-4 tracking-wider">{agent.brandColor}</span>
                          </div>
                       </div>

                       <div className="flex flex-col gap-4">
                          <div className="space-y-1">
                             <Label className="text-base font-black">Visibilidad Global</Label>
                             <p className="text-xs font-medium text-muted-foreground">Activa el procesamiento de IA para este agente.</p>
                          </div>
                          <div className="flex items-center gap-3 bg-muted/30 p-4 rounded-2xl border border-border/40 w-fit">
                            <Switch 
                              checked={agent.isActive} 
                              className="data-[state=checked]:bg-emerald-500"
                              onCheckedChange={(v) => handleUpdate({ isActive: v })} 
                            />
                            <span className={cn("text-xs font-black uppercase tracking-widest", agent.isActive ? "text-emerald-700" : "text-muted-foreground")}>
                               {agent.isActive ? "En Línea" : "Desconectado"}
                            </span>
                          </div>
                       </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="personality" className="mt-0 focus-visible:ring-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <div className="lg:col-span-2 space-y-10">
                <Card className="border-none shadow-premium rounded-[2.5rem] bg-white/70 backdrop-blur-md overflow-hidden">
                  <CardHeader className="p-10 pb-0">
                    <CardTitle className="text-2xl font-black tracking-tight">Cerebro del Sistema</CardTitle>
                    <CardDescription className="text-base font-medium">Instrucciones críticas que definen el comportamiento de tu asistente.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-10 space-y-6">
                    <div className="space-y-3">
                      <Label htmlFor="systemPrompt" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Directivas del Prompter</Label>
                      <div className="relative">
                        <Textarea 
                          id="systemPrompt" 
                          className="min-h-[400px] rounded-[2rem] p-8 font-mono text-xs leading-relaxed border-border/50 bg-white/50 shadow-inner focus:bg-white focus:ring-primary/20"
                          defaultValue={agent.systemPrompt}
                          placeholder="Propósito: Actuar como un especialista en..."
                          onBlur={(e) => handleUpdate({ systemPrompt: e.target.value })}
                        />
                        <div className="absolute top-4 right-4 text-primary opacity-20">
                          <Brain size={48} />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-premium rounded-[2.5rem] bg-white/70 backdrop-blur-md overflow-hidden">
                  <CardHeader className="p-10 pb-0">
                    <CardTitle className="text-2xl font-black tracking-tight">Micro-conversión</CardTitle>
                    <CardDescription className="text-base font-medium">Respuestas instantáneas pre-programadas.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-10 space-y-10">
                    <div className="space-y-3">
                      <Label htmlFor="welcome" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Apertura (Bienvenida)</Label>
                      <Textarea 
                        id="welcome" 
                        defaultValue={agent.welcomeMessage}
                        className="rounded-2xl p-6 font-medium bg-white/50 focus:bg-white"
                        onBlur={(e) => handleUpdate({ welcomeMessage: e.target.value })}
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="fallback" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Contención (Mensaje de Error)</Label>
                      <Textarea 
                        id="fallback" 
                        defaultValue={agent.fallbackMessage}
                        className="rounded-2xl p-6 font-medium bg-white/50 focus:bg-white"
                        onBlur={(e) => handleUpdate({ fallbackMessage: e.target.value })}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-8">
                <Card className="border-none shadow-premium rounded-[2.5rem] bg-white/70 backdrop-blur-md overflow-hidden">
                  <CardHeader className="p-8 pb-4">
                    <CardTitle className="text-xl font-black tracking-tight uppercase tracking-widest text-[11px] text-muted-foreground">Configuración Lingüística</CardTitle>
                  </CardHeader>
                  <CardContent className="p-8 pt-0 space-y-8">
                    <div className="space-y-3">
                      <Label className="text-xs font-black uppercase tracking-widest text-primary/70">Idioma Nativo</Label>
                      <Select value={agent.language} onValueChange={(v: any) => handleUpdate({ language: v as AgentLanguage })}>
                        <SelectTrigger className="h-14 rounded-2xl px-5 font-bold border-border/50 bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl">
                          <SelectItem value="es" className="font-bold">Español (ES)</SelectItem>
                          <SelectItem value="en" className="font-bold">English (EN)</SelectItem>
                          <SelectItem value="pt" className="font-bold">Português (PT)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-3 pt-4 border-t border-border/40">
                      <Label className="text-xs font-black uppercase tracking-widest text-primary/70">Arquetipo de Voz</Label>
                      <Select value={agent.tone} onValueChange={(v: any) => handleUpdate({ tone: v as AgentTone })}>
                        <SelectTrigger className="h-14 rounded-2xl px-5 font-bold border-border/50 bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl">
                          <SelectItem value="neutral" className="font-bold">Neutral Profesional</SelectItem>
                          <SelectItem value="friendly" className="font-bold">Cercano y Amigable</SelectItem>
                          <SelectItem value="formal" className="font-bold">Formal Ejecutivo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                <div className="p-8 rounded-[2.5rem] bg-primary text-primary-foreground shadow-2xl shadow-primary/30 relative overflow-hidden group">
                   <div className="relative z-10 space-y-4">
                      <Sparkles size={32} className="opacity-40 group-hover:scale-125 transition-transform" />
                      <h3 className="text-2xl font-black leading-tight">Optimización Automática</h3>
                      <p className="text-primary-foreground/80 text-sm font-medium leading-relaxed">
                        Nuestro motor analiza el tono y lo ajusta dinámicamente según el canal de salida.
                      </p>
                   </div>
                   <div className="absolute top-0 right-0 h-32 w-32 bg-white/10 blur-3xl -mr-10 -mt-10 rounded-full" />
                </div>
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
      
      {saving && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 duration-300">
           <div className="bg-foreground text-background px-8 py-4 rounded-[2rem] shadow-2xl flex items-center gap-4 border border-white/10 ring-8 ring-background/50">
             <Loader2 className="animate-spin h-5 w-5 text-primary" />
             <span className="text-sm font-black uppercase tracking-widest">Sincronizando Cambios...</span>
           </div>
        </div>
      )}
    </div>
  );
}
