import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, Plus, Pencil, Trash2, User, Shield } from "lucide-react";
import type { Usuario } from "@/types";

const usuariosIniciais: Usuario[] = [
  { id: 1, nome: "Administrador", email: "admin@foodflow.com", tipo: "admin", ativo: true },
  { id: 2, nome: "João Silva", email: "joao@foodflow.com", tipo: "gerente", ativo: true },
  { id: 3, nome: "Maria Santos", email: "maria@foodflow.com", tipo: "caixa", ativo: true },
  { id: 4, nome: "Pedro Costa", email: "pedro@foodflow.com", tipo: "caixa", ativo: true },
  { id: 5, nome: "Ana Oliveira", email: "ana@foodflow.com", tipo: "caixa", ativo: false },
];

const tipoLabels = {
  admin: { label: "Administrador", variant: "default" as const },
  gerente: { label: "Gerente", variant: "secondary" as const },
  caixa: { label: "Caixa", variant: "outline" as const },
};

export function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>(usuariosIniciais);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    tipo: "caixa" as "admin" | "gerente" | "caixa",
    senha: "",
  });

  const filteredUsuarios = usuarios.filter(
    (u) =>
      u.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenDialog = (usuario?: Usuario) => {
    if (usuario) {
      setEditingUsuario(usuario);
      setFormData({
        nome: usuario.nome,
        email: usuario.email,
        tipo: usuario.tipo,
        senha: "",
      });
    } else {
      setEditingUsuario(null);
      setFormData({ nome: "", email: "", tipo: "caixa", senha: "" });
    }
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.nome || !formData.email) return;

    if (editingUsuario) {
      setUsuarios((prev) =>
        prev.map((u) =>
          u.id === editingUsuario.id
            ? { ...u, nome: formData.nome, email: formData.email, tipo: formData.tipo }
            : u
        )
      );
    } else {
      if (!formData.senha) {
        alert("Senha é obrigatória para novos usuários");
        return;
      }
      const newUsuario: Usuario = {
        id: Math.max(...usuarios.map((u) => u.id)) + 1,
        nome: formData.nome,
        email: formData.email,
        tipo: formData.tipo,
        ativo: true,
      };
      setUsuarios((prev) => [...prev, newUsuario]);
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: number) => {
    if (confirm("Deseja realmente excluir este usuário?")) {
      setUsuarios((prev) => prev.filter((u) => u.id !== id));
    }
  };

  const handleToggleAtivo = (id: number) => {
    setUsuarios((prev) =>
      prev.map((u) => (u.id === id ? { ...u, ativo: !u.ativo } : u))
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar usuário..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="size-4" />
          Novo Usuário
        </Button>
      </div>

      {/* Cards de resumo */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <User className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usuarios.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ativos</CardTitle>
            <Shield className="size-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usuarios.filter((u) => u.ativo).length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Inativos</CardTitle>
            <Shield className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usuarios.filter((u) => !u.ativo).length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usuários Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsuarios.map((usuario) => (
                <TableRow key={usuario.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                        {usuario.nome.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium">{usuario.nome}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{usuario.email}</TableCell>
                  <TableCell>
                    <Badge variant={tipoLabels[usuario.tipo].variant}>
                      {tipoLabels[usuario.tipo].label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={usuario.ativo ? "success" : "secondary"}
                      className="cursor-pointer"
                      onClick={() => handleToggleAtivo(usuario.id)}
                    >
                      {usuario.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(usuario)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => handleDelete(usuario.id)}
                        disabled={usuario.tipo === "admin"}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingUsuario ? "Editar Usuário" : "Novo Usuário"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, nome: e.target.value }))
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="tipo">Tipo</Label>
              <select
                id="tipo"
                value={formData.tipo}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    tipo: e.target.value as "admin" | "gerente" | "caixa",
                  }))
                }
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              >
                <option value="caixa">Caixa</option>
                <option value="gerente">Gerente</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            {!editingUsuario && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="senha">Senha</Label>
                <Input
                  id="senha"
                  type="password"
                  value={formData.senha}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, senha: e.target.value }))
                  }
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
