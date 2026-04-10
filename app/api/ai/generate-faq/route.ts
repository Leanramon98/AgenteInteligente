import { NextResponse } from "next/server";
import { getOpenAIInstance } from "@/lib/openai";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, limit } from "firebase/firestore";

const openai = getOpenAIInstance();

export async function POST(req: Request) {
  try {
    const { agentId } = await req.json();

    if (!agentId) {
      return NextResponse.json({ error: "agentId is required" }, { status: 400 });
    }

    // 1. Get some context from the KB
    // Use the first 10 chunks to get a sample of the knowledge
    const chunksSnap = await getDocs(
      query(
        collection(db, "kb_chunks"), 
        where("agentId", "==", agentId),
        limit(20)
      )
    );

    const context = chunksSnap.docs.map(doc => doc.data().content).join("\n\n");

    if (!context) {
      return NextResponse.json({ error: "No knowledge found to generate FAQs. Please upload documents first." }, { status: 404 });
    }

    // 2. Generate FAQs using GPT
    const systemPrompt = `
      Eres un experto en extracción de información. 
      Basado en el siguiente CONOCIMIENTO de un Agente Inteligente, genera 5 pares de Preguntas y Respuestas (FAQ) que sean las más probables que un usuario final preguntaría.
      
      Formato de respuesta: JSON array de objetos con { "question": "...", "answer": "..." }.
      PROHIBIDO incluir texto fuera del JSON.
      Idioma: Español.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `CONOCIMIENTO:\n${context}` }
      ],
      temperature: 0.8,
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    // Ensure it's an array. If GPT returns { "faqs": [...] }
    const faqs = Array.isArray(result) ? result : (result.faqs || result.questions || []);

    return NextResponse.json({ faqs });
  } catch (error: any) {
    console.error("AI FAQ Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
