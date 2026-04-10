import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground p-4">
      <main className="max-w-3xl text-center space-y-8">
        <h1 className="text-6xl font-extrabold tracking-tight sm:text-7xl">
          Agent<span className="text-blue-600">Hub</span>
        </h1>
        <p className="text-xl text-muted-foreground sm:text-2xl">
          La plataforma definitiva para la gestión de agentes conversacionales multi-agente.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className="px-8 py-6 text-lg">
            <Link href="/register">Empezar Ahora</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="px-8 py-6 text-lg">
            <Link href="/login">Iniciar Sesión</Link>
          </Button>
        </div>
      </main>

      <footer className="mt-16 text-muted-foreground text-sm">
        © 2026 AgentHub. Todos los derechos reservados.
      </footer>
    </div>
  );
}
