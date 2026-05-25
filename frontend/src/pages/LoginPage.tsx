import { useState } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Utensils, Eye, EyeOff, Loader2 } from "lucide-react";
import { buscarUsuarioAtual, login as loginApi } from "@/servicos/api";

export function LoginPage() {
  const { login } = useAuthStore();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!email || !senha) {
        setError("Preencha todos os campos");
        return;
      }

      const tokens = await loginApi({ email, senha });
      localStorage.setItem("foodflow_token", tokens.access_token);
      const usuarioAtual = await buscarUsuarioAtual();

      login(
        {
          id: usuarioAtual.id,
          nome: usuarioAtual.nome,
          email: usuarioAtual.email,
          tipo:
            usuarioAtual.papel === "OWNER"
              ? "admin"
              : usuarioAtual.papel === "MANAGER"
                ? "gerente"
                : "caixa",
          ativo: usuarioAtual.ativo,
          created_at: usuarioAtual.criado_em,
        },
        tokens.access_token
      );
    } catch (erro) {
      setError(erro instanceof Error ? erro.message : "Erro ao fazer login. Verifique suas credenciais.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-primary">
            <Utensils className="size-8 text-primary-foreground" />
          </div>
          <h1 className="mt-4 text-3xl font-bold">FoodFlow</h1>
          <p className="mt-1 text-muted-foreground">Sistema de Gestao</p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>Entrar</CardTitle>
            <CardDescription>Acesse sua conta para continuar</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="senha">Senha</Label>
                <div className="relative">
                  <Input
                    id="senha"
                    type={showPassword ? "text" : "password"}
                    placeholder="Sua senha"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  "Entrar"
                )}
              </Button>
            </form>

            <p className="mt-4 text-center text-xs text-muted-foreground">
              Owner local: owner@example.com / 12345678
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
