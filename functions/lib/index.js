"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processAgentDocument = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const v2_1 = require("firebase-functions/v2");
const admin = __importStar(require("firebase-admin"));
const openai_1 = __importDefault(require("openai"));
const pdf = require("pdf-parse");
admin.initializeApp();
const db = admin.firestore();
(0, v2_1.setGlobalOptions)({ region: "us-central1" });
const openai = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY || "dummy",
});
exports.processAgentDocument = (0, firestore_1.onDocumentCreated)("kb_documents/{docId}", async (event) => {
    const snap = event.data;
    if (!snap)
        return;
    const data = snap.data();
    if (!data || data.status !== "processing")
        return;
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
        }
        else {
            text = buffer.toString("utf-8");
        }
        if (!text)
            throw new Error("Extract failed");
        const chunks = chunkText(text, 2000, 200);
        const batch = db.batch();
        for (let i = 0; i < chunks.length; i++) {
            const chunkContent = chunks[i];
            const embeddingResponse = await openai.embeddings.create({
                model: "text-embedding-3-small",
                input: chunkContent,
            });
            const embedding = embeddingResponse.data[0]?.embedding;
            if (!embedding)
                continue;
            const chunkRef = db.collection("kb_chunks").doc();
            batch.set(chunkRef, {
                documentId: docId,
                agentId: agentId,
                content: chunkContent,
                embedding,
                metadata: {
                    fileName: name || "unknown",
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
    }
    catch (error) {
        console.error("Error:", error);
        await snap.ref.update({
            status: "error",
            errorMessage: error.message
        });
    }
});
function chunkText(text, size, overlap) {
    const chunks = [];
    let index = 0;
    while (index < text.length) {
        const chunk = text.substring(index, index + size);
        chunks.push(chunk);
        index += (size - overlap);
        if (size <= overlap)
            break;
    }
    return chunks;
}
//# sourceMappingURL=index.js.map