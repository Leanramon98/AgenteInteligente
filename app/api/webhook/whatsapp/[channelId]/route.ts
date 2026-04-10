import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  addDoc, 
  serverTimestamp, 
  updateDoc,
  limit,
  orderBy
} from "firebase/firestore";
import { getRAGResponse } from "@/lib/rag";
import twilio from "twilio";

export async function POST(req: Request, { params }: { params: { channelId: string } }) {
  try {
    const channelId = params.channelId;
    const bodyText = await req.text();
    const paramsMap = new URLSearchParams(bodyText);
    
    const from = paramsMap.get("From") || ""; // Number (whatsapp:+...)
    const body = paramsMap.get("Body") || "";
    
    if (!from || !body) return new Response("Missing data", { status: 400 });

    // 1. Get Channel
    const channelRef = doc(db, "channels", channelId);
    const channelSnap = await getDoc(channelRef);
    if (!channelSnap.exists() || !channelSnap.data().isActive) {
      console.error("Channel not found or inactive:", channelId);
      return new Response("Channel inactive", { status: 404 });
    }
    const channelData = channelSnap.data();
    const agentId = channelData.agentId;

    // 2. Find or Create Conversation
    const convQuery = query(
      collection(db, "conversations"), 
      where("agentId", "==", agentId),
      where("externalUserId", "==", from),
      limit(1)
    );
    const convSnap = await getDocs(convQuery);
    
    let conversationId = "";
    if (convSnap.empty) {
      const newConv = await addDoc(collection(db, "conversations"), {
        agentId,
        channelId,
        externalUserId: from,
        status: "active",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      conversationId = newConv.id;
    } else {
      conversationId = convSnap.docs[0].id;
      await updateDoc(doc(db, "conversations", conversationId), {
        updatedAt: serverTimestamp()
      });
    }

    // 3. Save User Message
    await addDoc(collection(db, "messages"), {
      conversationId,
      agentId,
      role: "user",
      content: body,
      createdAt: serverTimestamp()
    });

    // 4. Get History (last 10)
    const historyQuery = query(
      collection(db, "messages"),
      where("conversationId", "==", conversationId),
      orderBy("createdAt", "desc"),
      limit(10)
    );
    const historySnap = await getDocs(historyQuery);
    const history = historySnap.docs
      .map(d => ({ role: d.data().role, content: d.data().content }))
      .reverse();

    // 5. RAG Response
    const { answer, sources, usedFallback } = await getRAGResponse(agentId, body, history.slice(0, -1));

    // 6. Save Assistant Message
    await addDoc(collection(db, "messages"), {
      conversationId,
      agentId,
      role: "assistant",
      content: answer,
      metadata: { sources, usedFallback },
      createdAt: serverTimestamp()
    });

    // 7. Send via Twilio
    const client = twilio(channelData.config.accountSid, channelData.config.authToken);
    
    // Twilio limit is 1600 chars. We split if needed (basic split)
    const messagesToSend = answer?.match(/.{1,1500}/g) || [answer];

    for (const msg of messagesToSend) {
      await client.messages.create({
        from: channelData.config.phoneNumber, // e.g. 'whatsapp:+14155238886'
        to: from,
        body: msg || ""
      });
    }

    return new Response("OK", { status: 200 });

  } catch (error: any) {
    console.error("WhatsApp Webhook Error:", error);
    return new Response("Error: " + error.message, { status: 500 });
  }
}
