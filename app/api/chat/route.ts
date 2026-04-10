import { NextResponse } from "next/server";
import { getRAGResponse } from "@/lib/rag";

export async function POST(req: Request) {
  try {
    const { agentId, message, conversationHistory } = await req.json();

    if (!agentId || !message) {
      return NextResponse.json({ error: "agentId and message are required" }, { status: 400 });
    }

    const { answer, sources } = await getRAGResponse(agentId, message, conversationHistory || []);

    return NextResponse.json({ answer, sources });
  } catch (error: any) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
