import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { setGlobalOptions } from "firebase-functions/v2";
import * as admin from "firebase-admin";
import OpenAI from "openai";

const pdf = require("pdf-parse");

admin.initializeApp();
const db = admin.firestore();

setGlobalOptions({ region: "us-central1" });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy",
});

export const processAgentDocument = onDocumentCreated("kb_documents/{docId}", async (event) => {
  const snap = event.data;
  if (!snap) return;
  
  const data = snap.data();
  if (!data || data.status !== "processing") return;

  const docId = event.params.docId;
  const agentId = data.agentId;
  const storagePath = data.storagePath;
  const type = data.type;
  const name = data.name;

  try {
    const bucket = admin.storage().bucket();
    const file = bucket.file(storagePath);
    const [buffer] = await file.download();

    let text = "";

    if (type === "pdf") {
      const pdfData = await pdf(buffer);
      text = pdfData.text;
    } else {
      text = buffer.toString("utf-8");
    }

    if (!text) throw new Error("Extract failed");

    const chunks = chunkText(text, 2000, 200);
    const batch = db.batch();
    
    for (let i = 0; i < chunks.length; i++) {
      const chunkContent = chunks[i] as string;
      
      const embeddingResponse = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: chunkContent,
      });

      const embedding = embeddingResponse.data[0]?.embedding;
      if (!embedding) continue;

      const chunkRef = db.collection("kb_chunks").doc();
      
      batch.set(chunkRef, {
        documentId: docId as string,
        agentId: agentId as string,
        content: chunkContent,
        embedding,
        metadata: {
          fileName: (name as string) || "unknown",
          chunkIndex: i
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      if ((i + 1) % 400 === 0) {
        await batch.commit();
      }
    }

    await batch.commit();

    await snap.ref.update({
      status: "ready",
      processedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

  } catch (error: any) {
    console.error("Error:", error);
    await snap.ref.update({
      status: "error",
      errorMessage: error.message
    });
  }
});

function chunkText(text: string, size: number, overlap: number): string[] {
  const chunks: string[] = [];
  let index = 0;

  while (index < text.length) {
    const chunk = text.substring(index, index + size);
    chunks.push(chunk);
    index += (size - overlap);
    if (size <= overlap) break;
  }

  return chunks;
}
