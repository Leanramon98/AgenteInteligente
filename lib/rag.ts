import { getOpenAIInstance } from "@/lib/openai";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { cosineSimilarity } from "@/lib/similarity";

const openai = getOpenAIInstance();

export async function getRAGResponse(agentId: string, message: string, conversationHistory: any[]) {
  // 1. Get Agent Config
  const agentRef = doc(db, "agents", agentId);
  const agentSnap = await getDoc(agentRef);
  if (!agentSnap.exists()) {
    throw new Error("Agent not found");
  }
  const agent = agentSnap.data();

  // 2. Generate Embedding
  const embeddingRes = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: message,
  });
  const queryEmbedding = embeddingRes.data[0].embedding;

  // 3. Search Chunks and FAQs
  const [chunksSnap, faqsSnap] = await Promise.all([
    getDocs(query(collection(db, "kb_chunks"), where("agentId", "==", agentId))),
    getDocs(query(collection(db, "kb_faqs"), where("agentId", "==", agentId)))
  ]);

  const results: any[] = [];
  chunksSnap.forEach(d => {
    const sim = cosineSimilarity(queryEmbedding, d.data().embedding);
    if (sim > 0.75) results.push({ content: d.data().content, similarity: sim, source: d.data().metadata?.fileName || "Doc" });
  });

  faqsSnap.forEach(d => {
    const sim = cosineSimilarity(queryEmbedding, d.data().embedding);
    if (sim > 0.75) results.push({ 
      content: `P: ${d.data().question}\nR: ${d.data().answer}`, 
      similarity: sim, 
      source: "FAQ" 
    });
  });

  const topResults = results.sort((a, b) => b.similarity - a.similarity).slice(0, 5);
  const context = topResults.map(r => r.content).join("\n\n---\n\n");
  const usedFallback = topResults.length === 0;

  // 4. GPT Call
  const systemPrompt = `
    Idioma: ${agent.language || 'es'}
    Tono: ${agent.tone || 'neutral'}
    Instrucciones: ${agent.systemPrompt}
    
    BASE DE CONOCIMIENTO (Usa esta información prioritariamente):
    ${context || 'No se encontró información relevante en la base de conocimiento.'}
  `;

  const chatRes = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      ...conversationHistory,
      { role: "user", content: message }
    ],
    temperature: 0.7,
  });

  return {
    answer: chatRes.choices[0].message.content,
    sources: topResults,
    agentConfig: agent,
    usedFallback
  };
}
