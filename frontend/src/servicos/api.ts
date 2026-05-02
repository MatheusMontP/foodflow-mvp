const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";

export async function buscarSaude() {
  const resposta = await fetch(`${API_URL}/health`);

  if (!resposta.ok) {
    throw new Error("Nao foi possivel consultar a API.");
  }

  return resposta.json() as Promise<{
    status: string;
    app: string;
    ambiente: string;
  }>;
}

