import { NextResponse } from "next/server";
import { getOpenAIInstance } from "@/lib/openai";

const openai = getOpenAIInstance();

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });

    const embedding = response.data[0].embedding;

    return NextResponse.json({ embedding });
  } catch (error: any) {
    console.error("Embedding API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
