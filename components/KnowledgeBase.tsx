"use client";

import { useState, useEffect } from "react";
import { db, storage } from "@/lib/firebase";
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  FileText, 
  Plus, 
  Trash2, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  FileBox,
  HelpCircle,
  Sparkles,
  Search,
  BookOpen,
  ArrowRight,
  Wand2
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import { cn } from "@/lib/utils";

interface Document {
  id: string;
  name: string;
  type: string;
  status: "processing" | "ready" | "error";
  storagePath: string;
  createdAt: any;
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
  createdAt: any;
}

export function KnowledgeBase({ agentId }: { agentId: string }) {
  const { user } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<"docs" | "faqs">("docs");
  
  // States for Documents
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  // States for FAQs
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [savingFaq, setSavingFaq] = useState(false);
  const [generatingAi, setGeneratingAi] = useState(false);

  useEffect(() => {
    if (!agentId || !db || !user) return;

    // Listen for Documents
    const qDocs = query(
      collection(db, "kb_documents"), 
      where("agentId", "==", agentId),
      where("userId", "==", user.uid)
    );
    const unsubDocs = onSnapshot(qDocs, (snap) => {
      setDocuments(snap.docs.map(d => ({ id: d.id, ...d.data() } as Document)));
    });

    // Listen for FAQs
    const qFaqs = query(
      collection(db, "kb_faqs"), 
      where("agentId", "==", agentId),
      where("userId", "==", user.uid)
    );
    const unsubFaqs = onSnapshot(qFaqs, (snap) => {
      setFaqs(snap.docs.map(d => ({ id: d.id, ...d.data() } as FAQ)));
    });

    return () => {
      unsubDocs();
      unsubFaqs();
    };
  }, [agentId]);

  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file || !user || !storage || !db) {
      if (!storage || !db) alert("Error: Firebase no está inicializado correctamente. Revisa tus variables de entorno.");
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const fileName = `${Date.now()}_${file.name}`;
      const storagePath = `users/${user.uid}/agents/${agentId}/knowledge/${fileName}`;
      const storageRef = ref(storage, storagePath);
      
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setProgress(p);
        }, 
        (error) => {
          console.error("Upload error:", error);
          alert("Error al subir archivo: " + error.message);
          setUploading(false);
        }, 
        async () => {
          // Success
          try {
            await addDoc(collection(db, "kb_documents"), {
              agentId,
              userId: user.uid,
              name: file.name,
              type: file.name.split('.').pop()?.toLowerCase() || 'txt',
              storagePath,
              status: "processing",
              createdAt: serverTimestamp(),
            });
          } catch (e: any) {
             console.error("Firestore error:", e);
             alert("Error al registrar el documento: " + e.message);
          } finally {
            setUploading(false);
            setProgress(0);
          }
        }
      );
    } catch (error: any) {
      console.error("Setup error:", error);
      alert("Error en la preparación: " + error.message);
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
    },
    multiple: false,
    maxSize: 100 * 1024 * 1024 // 100MB
  });

  const handleDeleteDoc = async (docObj: Document) => {
    if (!db) return;
    try {
      await deleteDoc(doc(db, "kb_documents", docObj.id));
    } catch (error) {
      console.error("Error deleting doc:", error);
    }
  };

  const handleSaveFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion || !newAnswer || !db) return;

    setSavingFaq(true);
    try {
      // 1. Get embedding via API
      const res = await fetch("/api/embeddings", {
        method: "POST",
        body: JSON.stringify({ text: `Pregunta: ${newQuestion}\nRespuesta: ${newAnswer}` }),
      });
      const data = await res.json();
      
      if (data.error) throw new Error(data.error);
      const { embedding } = data;

      // 2. Save to Firestore
      await addDoc(collection(db, "kb_faqs"), {
        agentId,
        userId: user.uid,
        question: newQuestion,
        answer: newAnswer,
        embedding,
        createdAt: serverTimestamp(),
      });

      setNewQuestion("");
      setNewAnswer("");
    } catch (error: any) {
      console.error("Error saving FAQ:", error);
      alert("Error al generar el conocimiento AI: " + error.message);
    } finally {
      setSavingFaq(false);
    }
  };

  const handleDeleteFaq = async (id: string) => {
    try {
      await deleteDoc(doc(db, "kb_faqs", id));
    } catch (error) {
      console.error("Error deleting FAQ:", error);
    }
  };

  const generateWithAi = async () => {
    if (!agentId || !user) return;
    setGeneratingAi(true);
    try {
      const res = await fetch("/api/ai/generate-faq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId })
      });
      const data = await res.json();
      if (data.faqs && data.faqs.length > 0) {
        setNewQuestion(data.faqs[0].question);
        setNewAnswer(data.faqs[0].answer);
      } else if (data.error) {
        alert(data.error);
      }
    } catch (e: any) {
       alert("Error al generar sugerencias: " + e.message);
    } finally {
      setGeneratingAi(false);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
             <BookOpen className="text-primary" size={24} /> Base de Conocimiento
           </h2>
           <p className="text-muted-foreground text-sm font-medium mt-1">
             Entrena a tu agente con documentos y preguntas específicas para respuestas precisas.
           </p>
        </div>
        <div className="flex bg-muted/30 p-1.5 rounded-2xl border border-border/40 w-fit">
          <Button 
            variant={activeSubTab === "docs" ? "default" : "ghost"}
            onClick={() => setActiveSubTab("docs")}
            className={cn("rounded-xl h-10 px-6 font-bold text-xs uppercase tracking-widest gap-2", activeSubTab === "docs" ? "shadow-md shadow-primary/20" : "")}
          >
            <FileText size={16} /> Documentos
          </Button>
          <Button 
            variant={activeSubTab === "faqs" ? "default" : "ghost"}
            onClick={() => setActiveSubTab("faqs")}
            className={cn("rounded-xl h-10 px-6 font-bold text-xs uppercase tracking-widest gap-2", activeSubTab === "faqs" ? "shadow-md shadow-primary/20" : "")}
          >
            <HelpCircle size={16} /> FAQs AI
          </Button>
        </div>
      </div>

      {activeSubTab === "docs" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-none shadow-premium rounded-[2.5rem] overflow-hidden bg-white/70 backdrop-blur-md">
              <CardHeader className="p-10 pb-4">
                <CardTitle className="text-xl font-black tracking-tight">Archivos de Entrenamiento</CardTitle>
                <CardDescription className="text-sm font-medium">Documentos PDF o TXT que el agente leerá antes de responder.</CardDescription>
              </CardHeader>
              <CardContent className="p-10 pt-4">
                {documents.length === 0 ? (
                  <div className="text-center py-20 border-2 border-dashed rounded-[2rem] bg-muted/10 group hover:bg-muted/20 transition-all">
                    <div className="bg-white/50 p-6 rounded-[2rem] w-fit mx-auto mb-6 shadow-sm group-hover:scale-110 transition-transform">
                      <FileBox className="text-muted-foreground/40 h-10 w-10" />
                    </div>
                    <h3 className="text-lg font-bold">Biblioteca Vacía</h3>
                    <p className="text-muted-foreground text-xs mt-2 font-medium">Sube tu primer manual o guía técnica para empezar.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {documents.map((d) => (
                      <div key={d.id} className="p-5 flex items-center justify-between bg-white rounded-3xl border border-border/30 hover:border-primary/30 hover:shadow-md transition-all group">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-primary/5 text-primary rounded-2xl">
                            <FileText size={20} strokeWidth={2.5} />
                          </div>
                          <div>
                            <p className="font-black text-sm text-foreground">{d.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-none bg-muted px-2 py-0.5">{d.type}</Badge>
                              {d.status === "processing" && (
                                <span className="flex items-center gap-1.5 text-[10px] text-amber-600 font-black uppercase tracking-widest animate-pulse">
                                  <Loader2 size={12} className="animate-spin" /> Indexando...
                                </span>
                              )}
                              {d.status === "ready" && (
                                <span className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-black uppercase tracking-widest">
                                  <CheckCircle2 size={12} /> Procesado
                                </span>
                              )}
                              {d.status === "error" && (
                                <span className="flex items-center gap-1.5 text-[10px] text-destructive font-black uppercase tracking-widest">
                                  <AlertCircle size={12} /> Error de Carga
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteDoc(d)} className="rounded-full hover:bg-destructive/10 hover:text-destructive group-hover:scale-110 transition-transform">
                          <Trash2 size={18} />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <div 
              {...getRootProps()} 
              className={cn(
                "p-12 border-2 border-dashed rounded-[2.5rem] text-center cursor-pointer transition-all duration-500",
                isDragActive ? "border-primary bg-primary/5 scale-[1.02]" : "border-border/60 bg-white/40 hover:border-primary/40 hover:bg-white/60"
              )}
            >
              <input {...getInputProps()} />
              <div className="bg-primary shadow-lg shadow-primary/20 w-16 h-16 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 transform rotate-3">
                <Upload className="text-primary-foreground" size={28} strokeWidth={2.5} />
              </div>
              <h3 className="text-lg font-black tracking-tight">Cargar Cerebro</h3>
              <p className="text-xs text-muted-foreground font-medium mt-2 leading-relaxed">
                Arrastra aquí tus manuales PDF o archivos TXT.<br /><span className="font-bold opacity-60">Límite: 100MB por archivo</span>
              </p>
            </div>

            {uploading && (
              <Card className="border-none shadow-xl rounded-[2.5rem] bg-foreground text-background overflow-hidden animate-in slide-in-from-right-4">
                <CardContent className="p-8">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest mb-4">
                    <span className="flex items-center gap-2">
                       <Loader2 className="animate-spin h-3 w-3" /> Transfiriendo Data
                    </span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300 shadow-[0_0_15px_rgba(var(--primary),0.5)]"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="p-8 rounded-[2.5rem] bg-indigo-50 border border-indigo-100 flex flex-col gap-4">
               <div className="p-3 bg-white rounded-2xl w-fit shadow-sm">
                 <Sparkles className="text-indigo-600" size={20} />
               </div>
               <h4 className="text-sm font-black text-indigo-900 uppercase tracking-widest">Optimización RAG</h4>
               <p className="text-xs text-indigo-800/70 font-medium leading-relaxed">
                 Nuestro sistema fragmenta tus documentos en vectores semánticos para que la IA encuentre respuestas en milisegundos.
               </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-1">
            <Card className="border-none shadow-premium rounded-[2.5rem] bg-white/70 backdrop-blur-md sticky top-10">
              <CardHeader className="p-10 pb-4">
                <CardTitle className="text-xl font-black tracking-tight flex items-center gap-2">
                  <Plus className="text-primary" size={20} /> Nueva Respuesta Directa
                </CardTitle>
                <CardDescription className="text-sm font-medium">Asegura que tu agente siempre responda esto ante estas dudas.</CardDescription>
              </CardHeader>
              <form onSubmit={handleSaveFaq}>
                <CardContent className="p-10 pt-4 space-y-8">
                  <div className="space-y-3">
                    <Label htmlFor="question" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Pregunta del Usuario</Label>
                    <Input 
                      id="question" 
                      placeholder="Ej. ¿Cómo pido una cita?" 
                      className="h-12 rounded-2xl bg-white focus:ring-primary/20"
                      value={newQuestion}
                      onChange={(e) => setNewQuestion(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="answer" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Respuesta del Agente</Label>
                    <Textarea 
                      id="answer" 
                      placeholder="Puedes pedir cita llamando al..." 
                      className="min-h-[150px] rounded-2xl p-5 bg-white focus:ring-primary/20 leading-relaxed"
                      value={newAnswer}
                      onChange={(e) => setNewAnswer(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex gap-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] border-dashed border-primary/30 hover:border-primary/60"
                      onClick={generateWithAi}
                      disabled={generatingAi}
                    >
                      {generatingAi ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Wand2 className="mr-2 h-4 w-4 text-primary" />}
                      Sugerir con AI
                    </Button>
                    <Button type="submit" className="flex-[2] h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20 group" disabled={savingFaq}>
                      {savingFaq ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Sparkles className="mr-2 h-4 w-4 group-hover:rotate-12 transition-transform" />}
                      Indexar
                    </Button>
                  </div>
                </CardContent>
              </form>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <Card className="border-none shadow-premium rounded-[2.5rem] bg-white/70 backdrop-blur-md overflow-hidden">
              <CardHeader className="p-10 pb-4 flex flex-row items-center justify-between">
                <div>
                   <CardTitle className="text-xl font-black tracking-tight">Biblioteca de FAQs</CardTitle>
                   <CardDescription className="text-sm font-medium">Preguntas curadas manualmente.</CardDescription>
                </div>
                <div className="relative">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Buscar en FAQs..." className="pl-10 h-10 w-48 lg:w-64 rounded-xl border-dashed bg-white/50" />
                </div>
              </CardHeader>
              <CardContent className="p-10 pt-4">
                {faqs.length === 0 ? (
                  <div className="text-center py-20 border-2 border-dashed rounded-[2rem] bg-muted/10">
                     <HelpCircle className="mx-auto h-12 w-12 opacity-10 mb-4" />
                     <p className="text-muted-foreground font-medium italic">No se han registrado respuestas directas aún.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {faqs.map((faq) => (
                      <div key={faq.id} className="p-6 rounded-[2rem] bg-white border border-border/30 shadow-sm relative group hover:shadow-xl hover:scale-[1.01] transition-all">
                         <div className="flex items-start justify-between">
                            <div className="space-y-3 flex-1">
                               <div className="flex items-center gap-2">
                                  <Badge className="bg-primary/10 text-primary border-none text-[8px] font-black tracking-[0.2em] px-2">QUESTION</Badge>
                                  <p className="font-black text-sm pr-10">{faq.question}</p>
                               </div>
                               <div className="flex items-start gap-3 pt-2 border-t border-border/20">
                                  <ArrowRight size={14} className="text-muted-foreground mt-1 shrink-0" />
                                  <p className="text-sm font-medium text-muted-foreground leading-relaxed italic">{faq.answer}</p>
                               </div>
                            </div>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleDeleteFaq(faq.id)} 
                                className="opacity-0 group-hover:opacity-100 transition-opacity rounded-full hover:bg-destructive/10 hover:text-destructive"
                              >
                                <Trash2 size={16} />
                              </Button>
                         </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
