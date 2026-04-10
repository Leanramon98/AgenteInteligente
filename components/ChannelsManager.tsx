"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  MessageCircle, 
  Copy, 
  Check, 
  ShieldCheck, 
  Zap, 
  Smartphone,
  Share2, 
  Camera,
  Send as SendIcon,
  Globe
} from "lucide-react";

interface Channel {
  id: string;
  type: string;
  config: {
    accountSid: string;
    authToken: string;
    phoneNumber: string;
  };
  isActive: boolean;
}

export function ChannelsManager({ agentId }: { agentId: string }) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Form states for WhatsApp
  const [sid, setSid] = useState("");
  const [token, setToken] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!agentId) return;

    const q = query(collection(db, "channels"), where("agentId", "==", agentId));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Channel));
      setChannels(data);
      
      const whatsapp = data.find(c => c.type === "whatsapp_twilio");
      if (whatsapp) {
        setSid(whatsapp.config.accountSid);
        setToken(whatsapp.config.authToken);
        setPhone(whatsapp.config.phoneNumber);
      }
      setLoading(false);
    });

    return () => unsub();
  }, [agentId]);

  const handleSaveWhatsApp = async () => {
    setSaving(true);
    try {
      const existing = channels.find(c => c.type === "whatsapp_twilio");
      const config = { accountSid: sid, authToken: token, phoneNumber: phone };
      
      if (existing) {
        await updateDoc(doc(db, "channels", existing.id), { config });
      } else {
        await addDoc(collection(db, "channels"), {
          agentId,
          type: "whatsapp_twilio",
          config,
          isActive: true,
          createdAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error("Error saving channel:", error);
    } finally {
      setSaving(false);
    }
  };

  const toggleChannel = async (channel: Channel) => {
    await updateDoc(doc(db, "channels", channel.id), {
      isActive: !channel.isActive
    });
  };

  const whatsappChannel = channels.find(c => c.type === "whatsapp_twilio");
  const webhookUrl = whatsappChannel ? `${window.location.protocol}//${window.location.host}/api/webhook/whatsapp/${whatsappChannel.id}` : "";

  const copyToClipboard = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* WhatsApp Twilio Card */}
        <Card className="border-t-4 border-t-green-500">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-lg text-green-600">
                  <MessageCircle size={24} />
                </div>
                <div>
                  <CardTitle>WhatsApp (Twilio)</CardTitle>
                  <CardDescription>Conecta tu agente a WhatsApp Business.</CardDescription>
                </div>
              </div>
              {whatsappChannel && (
                 <Switch 
                  checked={whatsappChannel.isActive} 
                  onCheckedChange={() => toggleChannel(whatsappChannel)} 
                />
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sid">Twilio Account SID</Label>
              <Input id="sid" value={sid} onChange={(e) => setSid(e.target.value)} placeholder="AC..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="token">Twilio Auth Token</Label>
              <Input id="token" type="password" value={token} onChange={(e) => setToken(e.target.value)} placeholder="••••••••" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Número de WhatsApp (Twilio)</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="whatsapp:+1..." />
            </div>

            {whatsappChannel && (
              <div className="mt-6 p-4 bg-muted rounded-lg border space-y-2">
                <Label className="text-xs uppercase font-bold text-muted-foreground">Webhook URL para Twilio</Label>
                <div className="flex gap-2">
                  <Input readOnly value={webhookUrl} className="text-xs font-mono bg-background" />
                  <Button size="icon" variant="outline" onClick={copyToClipboard}>
                    {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground italic">Copia este URL y pégalo en "A MESSAGE COMES IN" dentro de tu Sandbox o número de Twilio.</p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button className="w-full bg-green-600 hover:bg-green-700" onClick={handleSaveWhatsApp} disabled={saving}>
              {saving ? "Guardando..." : whatsappChannel ? "Actualizar Credenciales" : "Conectar WhatsApp"}
            </Button>
          </CardFooter>
        </Card>

        {/* Placeholders Card */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="opacity-50 grayscale cursor-not-allowed border-dashed">
            <CardHeader className="p-4 items-center gap-2">
               <div className="p-3 bg-blue-100 rounded-full text-blue-600"><SendIcon size={24}/></div>
               <CardTitle className="text-sm">Telegram</CardTitle>
               <Badge variant="outline" className="text-[10px]">Próximamente</Badge>
            </CardHeader>
          </Card>
          <Card className="opacity-50 grayscale cursor-not-allowed border-dashed">
            <CardHeader className="p-4 items-center gap-2">
               <div className="p-3 bg-pink-100 rounded-full text-pink-600"><Camera size={24}/></div>
               <CardTitle className="text-sm">Instagram</CardTitle>
               <Badge variant="outline" className="text-[10px]">Próximamente</Badge>
            </CardHeader>
          </Card>
          <Card className="opacity-50 grayscale cursor-not-allowed border-dashed">
            <CardHeader className="p-4 items-center gap-2">
               <div className="p-3 bg-indigo-100 rounded-full text-indigo-600"><Globe size={24}/></div>
               <CardTitle className="text-sm">Web Widget</CardTitle>
               <Badge variant="outline" className="text-[10px]">Próximamente</Badge>
            </CardHeader>
          </Card>
          <Card className="opacity-50 grayscale cursor-not-allowed border-dashed">
            <CardHeader className="p-4 items-center gap-2">
               <div className="p-3 bg-orange-100 rounded-full text-orange-600"><Smartphone size={24}/></div>
               <CardTitle className="text-sm">SMS</CardTitle>
               <Badge variant="outline" className="text-[10px]">Próximamente</Badge>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
}
