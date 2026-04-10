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
import { ChevronLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { AgentTone, AgentLanguage } from "@/types/agent";

export default function NewAgentPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [brandColor, setBrandColor] = useState("#2563eb");
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
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard">
            <ChevronLeft size={20} />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Crear Nuevo Agente</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuración Inicial</CardTitle>
          <CardDescription>
            Define los aspectos básicos de tu nuevo asistente. Podrás ajustar la personalidad más tarde.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del Agente</Label>
              <Input 
                id="name" 
                placeholder="Ej. Asistente de Ventas" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea 
                id="description" 
                placeholder="¿Qué hace este agente?" 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="language">Idioma Principal</Label>
                <Select value={language} onValueChange={(v: any) => setLanguage(v)}>
                  <SelectTrigger id="language">
                    <SelectValue placeholder="Selecciona idioma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="en">Inglés</SelectItem>
                    <SelectItem value="pt">Portugués</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tone">Tono de Voz</Label>
                <Select value={tone} onValueChange={(v: any) => setTone(v)}>
                  <SelectTrigger id="tone">
                    <SelectValue placeholder="Selecciona tono" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="neutral">Neutral</SelectItem>
                    <SelectItem value="friendly">Amigable</SelectItem>
                    <SelectItem value="formal">Formal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="brandColor">Color de Marca</Label>
              <div className="flex items-center gap-4">
                <Input 
                  id="brandColor" 
                  type="color" 
                  className="w-20 h-10 p-1"
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                />
                <span className="text-sm font-mono uppercase font-medium">{brandColor}</span>
              </div>
            </div>
          </CardContent>
          <div className="p-6 pt-0 flex justify-end gap-3">
            <Button variant="ghost" asChild disabled={loading}>
              <Link href="/dashboard">Cancelar</Link>
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear Agente
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
