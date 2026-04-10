export type AgentTone = "friendly" | "formal" | "neutral";
export type AgentLanguage = "es" | "en" | "pt";

export interface Agent {
  id: string;
  userId: string;
  name: string;
  description: string;
  logoUrl?: string;
  brandColor: string;
  systemPrompt: string;
  language: AgentLanguage;
  tone: AgentTone;
  welcomeMessage: string;
  fallbackMessage: string;
  isActive: boolean;
  createdAt: any; // Firestore Timestamp
}
