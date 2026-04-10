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
  MessageSquare
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

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (!agent) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard">
              <ChevronLeft size={20} />
            </Link>
          </Button>
          <Avatar className="h-16 w-16 border-2" style={{ borderColor: agent.brandColor }}>
            <AvatarImage src={agent.logoUrl} />
            <AvatarFallback className="text-xl font-bold" style={{ backgroundColor: agent.brandColor + '22', color: agent.brandColor }}>
              {agent.name.substring(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{agent.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: agent.brandColor }} />
              <p className="text-muted-foreground text-sm">ID: {agent.id}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="mr-2 h-4 w-4" /> Eliminar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle size={20} /> ¿Estás completamente seguro?
                </DialogTitle>
                <DialogDescription>
                  Esta acción no se puede deshacer. Esto eliminará permanentemente al agente <strong>{agent.name}</strong> y todos sus datos asociados.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="ghost">Cancelar</Button>
                <Button variant="destructive" onClick={handleDelete}>Confirmar Eliminación</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="general" className="w-full space-y-6">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 h-auto p-1 bg-muted/50 w-full md:w-fit">
          <TabsTrigger value="general" className="py-2 gap-2">
            <Settings size={16} /> General
          </TabsTrigger>
          <TabsTrigger value="knowledge" className="py-2 gap-2">
            <Database size={16} /> Conocimiento
          </TabsTrigger>
          <TabsTrigger value="test" className="py-2 gap-2">
            <MessageSquare size={16} /> Prueba
          </TabsTrigger>
          <TabsTrigger value="personality" className="py-2 gap-2">
            <Brain size={16} /> Personalidad
          </TabsTrigger>
          <TabsTrigger value="channels" className="py-2 gap-2">
            <Globe size={16} /> Canales
          </TabsTrigger>
          <TabsTrigger value="conversations" className="py-2 gap-2">
            <MessageSquare size={16} /> Conversaciones
          </TabsTrigger>
          <TabsTrigger value="analytics" className="py-2 gap-2">
            <Activity size={16} /> Análisis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="knowledge">
          <KnowledgeBase agentId={agent.id} />
        </TabsContent>

        <TabsContent value="test">
          <AgentChatTest agent={agent} />
        </TabsContent>

        <TabsContent value="channels">
          <ChannelsManager agentId={agent.id} />
        </TabsContent>

        <TabsContent value="conversations">
          <ConversationsList agentId={agent.id} />
        </TabsContent>

        <TabsContent value="analytics">
          <AnalyticsDashboard agentId={agent.id} />
        </TabsContent>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Configuración General</CardTitle>
              <CardDescription>Edita la identidad visual y básica de tu agente.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="space-y-4 flex flex-col items-center">
                  <Label>Logo del Agente</Label>
                  <Avatar className="h-24 w-24 border shadow-md relative group">
                    <AvatarImage src={agent.logoUrl} />
                    <AvatarFallback className="text-3xl font-bold" style={{ backgroundColor: agent.brandColor + '22', color: agent.brandColor }}>
                      {agent.name.substring(0, 1).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <input 
                    type="file" 
                    className="hidden" 
                    ref={fileInputRef} 
                    onChange={handleLogoUpload}
                    accept="image/*"
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Upload className="mr-2 h-4 w-4" />}
                    Cambiar Imagen
                  </Button>
                </div>
                
                <div className="flex-1 space-y-4 w-full">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre</Label>
                    <Input 
                      id="name" 
                      defaultValue={agent.name} 
                      onBlur={(e) => handleUpdate({ name: e.target.value })} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Descripción</Label>
                    <Textarea 
                      id="description" 
                      defaultValue={agent.description}
                      onBlur={(e) => handleUpdate({ description: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center justify-between border-t pt-4">
                    <div className="space-y-0.5">
                      <Label className="text-base font-semibold">Color de Marca</Label>
                      <p className="text-sm text-muted-foreground">Define el color principal para tu asistente.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input 
                        type="color" 
                        defaultValue={agent.brandColor}
                        className="w-12 h-12 p-1 border-none bg-transparent cursor-pointer"
                        onChange={(e) => handleUpdate({ brandColor: e.target.value })}
                      />
                      <span className="font-mono text-sm uppercase">{agent.brandColor}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t pt-4">
                    <div className="space-y-0.5">
                      <Label className="text-base font-semibold">Estado del Agente</Label>
                      <p className="text-sm text-muted-foreground">Activa o desactiva la visibilidad del agente.</p>
                    </div>
                    <Switch 
                      checked={agent.isActive} 
                      onCheckedChange={(v) => handleUpdate({ isActive: v })} 
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="personality">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Directivas del Sistema</CardTitle>
                  <CardDescription>Instrucciones básicas que definen cómo debe comportarse el agente y cuál es su objetivo.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="systemPrompt">Prompt del Sistema (Instrucciones)</Label>
                    <Textarea 
                      id="systemPrompt" 
                      className="min-h-[250px] font-mono text-sm leading-relaxed"
                      defaultValue={agent.systemPrompt}
                      placeholder="Ej. Eres un experto en atención al cliente para AgentHub..."
                      onBlur={(e) => handleUpdate({ systemPrompt: e.target.value })}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Mensajes Predeterminados</CardTitle>
                  <CardDescription>Configura las respuestas automáticas para situaciones comunes.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="welcome">Mensaje de Bienvenida</Label>
                    <Textarea 
                      id="welcome" 
                      defaultValue={agent.welcomeMessage}
                      onBlur={(e) => handleUpdate({ welcomeMessage: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fallback">Mensaje de Error (Fallback)</Label>
                    <Textarea 
                      id="fallback" 
                      defaultValue={agent.fallbackMessage}
                      onBlur={(e) => handleUpdate({ fallbackMessage: e.target.value })}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Idioma y Tono</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Idioma</Label>
                    <Select value={agent.language} onValueChange={(v: any) => handleUpdate({ language: v as AgentLanguage })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="es">Español</SelectItem>
                        <SelectItem value="en">Inglés</SelectItem>
                        <SelectItem value="pt">Portugués</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Tono de Voz</Label>
                    <Select value={agent.tone} onValueChange={(v: any) => handleUpdate({ tone: v as AgentTone })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="neutral">Neutral</SelectItem>
                        <SelectItem value="friendly">Amigable</SelectItem>
                        <SelectItem value="formal">Formal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      {saving && (
        <div className="fixed bottom-8 right-8 bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom-5">
          <Loader2 className="animate-spin h-4 w-4" />
          <span className="text-sm font-medium">Guardando cambios...</span>
        </div>
      )}
    </div>
  );
}
