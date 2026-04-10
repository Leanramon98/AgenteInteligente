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

// Configure options for large files
const processOptions = {
  memory: "1GiB" as const,
  timeoutSeconds: 540,
  region: "us-central1"
};

export const processAgentDocument = onDocumentCreated(processOptions, "kb_documents/{docId}", async (event) => {
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

    // Chunk text into smaller pieces
    const chunks = chunkText(text, 1000, 100);
    
    // Batch processing of embeddings (OpenAI allows up to 2048 inputs per request)
    const BATCH_SIZE = 50; 
    let processedChunks = 0;

    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const currentBatch = chunks.slice(i, i + BATCH_SIZE);
      
      const embeddingResponse = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: currentBatch,
      });

      const writeBatch = db.batch();
      
      embeddingResponse.data.forEach((embData, index) => {
        const chunkIndex = i + index;
        const chunkContent = currentBatch[index];
        const chunkRef = db.collection("kb_chunks").doc();
        
        writeBatch.set(chunkRef, {
          documentId: docId,
          agentId: agentId,
          content: chunkContent,
          embedding: embData.embedding,
          metadata: {
            fileName: name || "unknown",
            chunkIndex
          },
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      });

      await writeBatch.commit();
      processedChunks += currentBatch.length;
      
      // Update progress in the main document periodically
      await snap.ref.update({
        progress: Math.round((processedChunks / chunks.length) * 100)
      });
    }

    await snap.ref.update({
      status: "ready",
      progress: 100,
      processedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

  } catch (error: any) {
    console.error("Indexing Error:", error);
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
