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
  HelpCircle
} from "lucide-react";
import { useDropzone } from "react-dropzone";

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

  useEffect(() => {
    if (!agentId) return;

    // Listen for Documents
    const qDocs = query(collection(db, "kb_documents"), where("agentId", "==", agentId));
    const unsubDocs = onSnapshot(qDocs, (snap) => {
      setDocuments(snap.docs.map(d => ({ id: d.id, ...d.data() } as Document)));
    });

    // Listen for FAQs
    const qFaqs = query(collection(db, "kb_faqs"), where("agentId", "==", agentId));
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
    if (!file || !user) return;

    setUploading(true);
    setProgress(0);

    try {
      const fileName = `${Date.now()}_${file.name}`;
      const storagePath = `agents/${agentId}/knowledge/${fileName}`;
      const storageRef = ref(storage, storagePath);
      
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setProgress(p);
        }, 
        (error) => {
          console.error("Upload error:", error);
          setUploading(false);
        }, 
        async () => {
          // Success
          await addDoc(collection(db, "kb_documents"), {
            agentId,
            name: file.name,
            type: file.name.split('.').pop()?.toLowerCase() || 'txt',
            storagePath,
            status: "processing",
            createdAt: serverTimestamp(),
          });
          setUploading(false);
          setProgress(0);
        }
      );
    } catch (error) {
      console.error("Setup error:", error);
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
    },
    multiple: false
  });

  const handleDeleteDoc = async (docObj: Document) => {
    try {
      await deleteDoc(doc(db, "kb_documents", docObj.id));
      // Optionally delete from storage too
    } catch (error) {
      console.error("Error deleting doc:", error);
    }
  };

  const handleSaveFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion || !newAnswer) return;

    setSavingFaq(true);
    try {
      // 1. Get embedding via API
      const res = await fetch("/api/embeddings", {
        method: "POST",
        body: JSON.stringify({ text: `Pregunta: ${newQuestion}\nRespuesta: ${newAnswer}` }),
      });
      const { embedding } = await res.json();

      // 2. Save to Firestore
      await addDoc(collection(db, "kb_faqs"), {
        agentId,
        question: newQuestion,
        answer: newAnswer,
        embedding,
        createdAt: serverTimestamp(),
      });

      setNewQuestion("");
      setNewAnswer("");
    } catch (error) {
      console.error("Error saving FAQ:", error);
      alert("Error al generar el embedding. Verifica tu OpenAI API Key.");
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

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <Button 
          variant={activeSubTab === "docs" ? "default" : "outline"}
          onClick={() => setActiveSubTab("docs")}
          className="gap-2"
        >
          <FileText size={18} /> Documentos
        </Button>
        <Button 
          variant={activeSubTab === "faqs" ? "default" : "outline"}
          onClick={() => setActiveSubTab("faqs")}
          className="gap-2"
        >
          <HelpCircle size={18} /> Preguntas Frecuentes
        </Button>
      </div>

      {activeSubTab === "docs" ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Mis Documentos</CardTitle>
                <CardDescription>Archivos utilizados para entrenar la base de conocimiento de tu agente.</CardDescription>
              </CardHeader>
              <CardContent>
                {documents.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                    <FileBox className="mx-auto h-12 w-12 opacity-20 mb-4" />
                    <p>No hay documentos subidos. Usa la zona de la derecha para empezar.</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {documents.map((d) => (
                      <div key={d.id} className="py-4 flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-50 text-blue-600 rounded">
                            <FileText size={20} />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{d.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-[10px] uppercase">{d.type}</Badge>
                              {d.status === "processing" && (
                                <span className="flex items-center gap-1 text-[10px] text-orange-500 font-medium animate-pulse">
                                  <Loader2 size={10} className="animate-spin" /> Procesando...
                                </span>
                              )}
                              {d.status === "ready" && (
                                <span className="flex items-center gap-1 text-[10px] text-green-600 font-medium">
                                  <CheckCircle2 size={10} /> Listo
                                </span>
                              )}
                              {d.status === "error" && (
                                <span className="flex items-center gap-1 text-[10px] text-red-500 font-medium">
                                  <AlertCircle size={10} /> Error
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteDoc(d)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <div 
              {...getRootProps()} 
              className={`p-10 border-2 border-dashed rounded-xl text-center cursor-pointer transition-all ${
                isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/20 hover:border-primary/50'
              }`}
            >
              <input {...getInputProps()} />
              <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className="text-primary" size={24} />
              </div>
              <p className="text-sm font-semibold">Haz clic o arrastra un archivo</p>
              <p className="text-xs text-muted-foreground mt-2">Soportamos PDF y TXT (Max 5MB)</p>
            </div>

            {uploading && (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-medium">Subiendo archivo...</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div 
                      className="bg-primary h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Nueva FAQ</CardTitle>
                <CardDescription>Añade respuestas directas a preguntas específicas.</CardDescription>
              </CardHeader>
              <form onSubmit={handleSaveFaq}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="question">Pregunta</Label>
                    <Input 
                      id="question" 
                      placeholder="¿Cuál es el horario de atención?" 
                      value={newQuestion}
                      onChange={(e) => setNewQuestion(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="answer">Respuesta</Label>
                    <Textarea 
                      id="answer" 
                      placeholder="Atendemos de Lunes a Viernes de 9 a 18 hs." 
                      value={newAnswer}
                      onChange={(e) => setNewAnswer(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={savingFaq}>
                    {savingFaq ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                    Guardar FAQ
                  </Button>
                </CardContent>
              </form>
            </Card>
          </div>

          <div className="md:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Listado de FAQs</CardTitle>
              </CardHeader>
              <CardContent>
                {faqs.length === 0 ? (
                  <p className="text-center py-6 text-muted-foreground">No hay preguntas guardadas aún.</p>
                ) : (
                  <div className="space-y-4">
                    {faqs.map((faq) => (
                      <div key={faq.id} className="p-4 rounded-lg border bg-card/50 relative group">
                         <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleDeleteFaq(faq.id)} 
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 size={14} className="text-muted-foreground" />
                          </Button>
                        <p className="font-bold text-sm mb-1 pr-8 text-primary">Q: {faq.question}</p>
                        <p className="text-sm text-muted-foreground">A: {faq.answer}</p>
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
