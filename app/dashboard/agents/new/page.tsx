"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, Loader2, Sparkles, Wand2 } from "lucide-react";
import Link from "next/link";
import { AgentTone, AgentLanguage } from "@/types/agent";

export default function NewAgentPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [brandColor, setBrandColor] = useState("#6366f1");
  const [language, setLanguage] = useState<AgentLanguage>("es");
  const [tone, setTone] = useState<AgentTone>("neutral");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    try {
      const docRef = await addDoc(collection(db, "agents"), {
        userId: user.uid,
        name,
        description,
        brandColor,
        language,
        tone,
        systemPrompt: "Eres un asistente útil y amable.", // Default
        welcomeMessage: "¡Hola! ¿En qué puedo ayudarte hoy?",
        fallbackMessage: "Lo siento, no he entendido eso. ¿Podrías repetirlo?",
        isActive: true,
        logoUrl: "",
        createdAt: serverTimestamp(),
      });
      
      router.push(`/dashboard/agents/${docRef.id}`);
    } catch (error) {
      console.error("Error creating agent:", error);
      alert("Error al crear el agente. Revisa la consola.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10 max-w-3xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="rounded-full hover:bg-white shadow-sm ring-1 ring-border/50">
          <Link href="/dashboard">
            <ChevronLeft size={20} />
          </Link>
        </Button>
        <div className="space-y-0.5">
          <h1 className="text-3xl font-black tracking-tight text-foreground">Crear <span className="text-primary">Ecosistema</span></h1>
          <p className="text-sm font-medium text-muted-foreground">Define el ADN de tu nuevo asistente inteligente.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2">
          <Card className="border-none shadow-premium rounded-[2.5rem] overflow-hidden bg-white/70 backdrop-blur-md">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Wand2 size={20} className="text-primary" /> Configuración Inicial
              </CardTitle>
              <CardDescription className="text-sm font-medium">
                Define los aspectos básicos. Podrás ajustar la personalidad avanzada más tarde.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="p-8 space-y-8">
                <div className="space-y-3">
                  <Label htmlFor="name" className="text-xs font-black uppercase tracking-widest ml-1 text-muted-foreground">Nombre de Identidad</Label>
                  <Input 
                    id="name" 
                    placeholder="Ej. Soporte Hub" 
                    className="h-14 rounded-2xl px-5 text-lg font-medium border-border/50 bg-white/50 focus:bg-white transition-all shadow-sm"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required 
                  />
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="description" className="text-xs font-black uppercase tracking-widest ml-1 text-muted-foreground">Propósito del Agente</Label>
                  <Textarea 
                    id="description" 
                    placeholder="Describe brevemente su función principal..." 
                    className="min-h-[120px] rounded-2xl p-5 font-medium border-border/50 bg-white/50 focus:bg-white transition-all shadow-sm"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label htmlFor="language" className="text-xs font-black uppercase tracking-widest ml-1 text-muted-foreground">Idioma Nativo</Label>
                    <Select value={language} onValueChange={(v: any) => setLanguage(v)}>
                      <SelectTrigger id="language" className="h-14 rounded-2xl px-5 font-medium border-border/50 bg-white/50">
                        <SelectValue placeholder="Selecciona idioma" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl">
                        <SelectItem value="es">Español</SelectItem>
                        <SelectItem value="en">Inglés</SelectItem>
                        <SelectItem value="pt">Portugués</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="tone" className="text-xs font-black uppercase tracking-widest ml-1 text-muted-foreground">Arquetipo de Voz</Label>
                    <Select value={tone} onValueChange={(v: any) => setTone(v)}>
                      <SelectTrigger id="tone" className="h-14 rounded-2xl px-5 font-medium border-border/50 bg-white/50">
                        <SelectValue placeholder="Selecciona tono" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl">
                        <SelectItem value="neutral">Neutral Profesional</SelectItem>
                        <SelectItem value="friendly">Cercano y Amigable</SelectItem>
                        <SelectItem value="formal">Ejecutivo Formal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-border/40">
                  <Label htmlFor="brandColor" className="text-xs font-black uppercase tracking-widest ml-1 text-muted-foreground">ADN Visual (Color)</Label>
                  <div className="flex items-center gap-6 p-4 rounded-2xl bg-muted/30 border border-border/40">
                    <div className="relative group">
                      <Input 
                        id="brandColor" 
                        type="color" 
                        className="w-16 h-16 p-1 rounded-xl cursor-pointer border-none shadow-md"
                        value={brandColor}
                        onChange={(e) => setBrandColor(e.target.value)}
                      />
                      <div className="absolute inset-0 rounded-xl pointer-events-none ring-2 ring-white/50 ring-inset" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-lg font-black font-mono uppercase text-foreground">{brandColor}</span>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Color de marca principal</span>
                    </div>
                  </div>
                </div>
              </CardContent>
              <div className="p-8 pt-0 flex justify-end gap-3">
                <Button variant="ghost" asChild disabled={loading} className="rounded-xl h-12 px-6 font-bold">
                  <Link href="/dashboard">Cancelar</Link>
                </Button>
                <Button type="submit" disabled={loading} className="rounded-xl h-12 px-10 font-bold shadow-lg shadow-primary/20">
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Finalizar y Crear
                </Button>
              </div>
            </form>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-md rounded-[2.5rem] bg-indigo-600 text-white p-2">
            <CardContent className="p-8 space-y-4">
              <div className="bg-white/20 p-3 rounded-2xl w-fit">
                <Sparkles size={24} />
              </div>
              <h3 className="text-xl font-bold leading-tight">Tu Agente tomará vida al instante.</h3>
              <p className="text-indigo-100 text-sm font-medium leading-relaxed">
                Al terminar, podrás subir documentos PDF, conectar tu WhatsApp y probar el chat en tiempo real.
              </p>
            </CardContent>
          </Card>
          
          <div className="px-4 py-2 border-l-4 border-primary/20">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Tip Pro</p>
            <p className="text-xs text-muted-foreground mt-1">
              Dale un nombre corto y memorable para que tus clientes se familiaricen rápido con él.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
