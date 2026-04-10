import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { getRAGResponse } from "@/lib/rag";
import twilio from "twilio";
import * as admin from "firebase-admin";

export async function POST(req: Request, { params }: { params: { channelId: string } }) {
  try {
    const channelId = params.channelId;
    const bodyText = await req.text();
    const paramsMap = new URLSearchParams(bodyText);
    
    const from = paramsMap.get("From") || ""; // Number (whatsapp:+...)
    const body = paramsMap.get("Body") || "";
    
    if (!from || !body) return new Response("Missing data", { status: 400 });

    // 1. Get Channel
    const channelSnap = await adminDb.collection("channels").doc(channelId).get();
    if (!channelSnap.exists || !channelSnap.data()?.isActive) {
      console.error("Channel not found or inactive:", channelId);
      return new Response("Channel inactive", { status: 404 });
    }
    const channelData = channelSnap.data() || {};
    const agentId = channelData.agentId;

    // 2. Find or Create Conversation
    const convSnap = await adminDb.collection("conversations")
      .where("agentId", "==", agentId)
      .where("externalUserId", "==", from)
      .limit(1)
      .get();
    
    let conversationId = "";
    if (convSnap.empty) {
      // Get userId from the channel or agent
      const userId = channelData.userId || (await adminDb.collection("agents").doc(agentId).get()).data()?.userId;

      const newConv = await adminDb.collection("conversations").add({
        agentId,
        userId, // Critical for rules!
        channelId,
        externalUserId: from,
        status: "active",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      conversationId = newConv.id;
    } else {
      conversationId = convSnap.docs[0].id;
      await adminDb.collection("conversations").doc(conversationId).update({
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    // 3. Save User Message
    await adminDb.collection("messages").add({
      conversationId,
      agentId,
      role: "user",
      content: body,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // 4. Get History (last 10)
    const historySnap = await adminDb.collection("messages")
      .where("conversationId", "==", conversationId)
      .orderBy("createdAt", "desc")
      .limit(10)
      .get();
    
    const history = historySnap.docs
      .map(d => ({ role: d.data().role, content: d.data().content }))
      .reverse();

    // 5. RAG Response
    const { answer, sources, usedFallback } = await getRAGResponse(agentId, body, history.slice(0, -1));

    // 6. Save Assistant Message
    await adminDb.collection("messages").add({
      conversationId,
      agentId,
      role: "assistant",
      content: answer,
      metadata: { sources, usedFallback },
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // 7. Send via Twilio
    const client = twilio(channelData.config.accountSid, channelData.config.authToken);
    
    const messagesToSend = answer?.match(/.{1,1500}/g) || [answer];

    for (const msg of messagesToSend) {
      await client.messages.create({
        from: channelData.config.phoneNumber,
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
