import { useState } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { LoginPage } from "@/pages/LoginPage";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DashboardPage } from "@/pages/DashboardPage";
import { PDVPage } from "@/pages/PDVPage";
import { ProdutosPage } from "@/pages/ProdutosPage";
import { CategoriasPage } from "@/pages/CategoriasPage";
import { InsumosPage } from "@/pages/InsumosPage";
import { EstoquePage } from "@/pages/EstoquePage";
import { PromocoesPage } from "@/pages/PromocoesPage";
import { RelatoriosPage } from "@/pages/RelatoriosPage";
import { UsuariosPage } from "@/pages/UsuariosPage";

export type Page =
  | "dashboard"
  | "pdv"
  | "produtos"
  | "categorias"
  | "insumos"
  | "estoque"
  | "promocoes"
  | "relatorios"
  | "usuarios";

function App() {
  const { isAuthenticated } = useAuthStore();
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <DashboardPage />;
      case "pdv":
        return <PDVPage />;
      case "produtos":
        return <ProdutosPage />;
      case "categorias":
        return <CategoriasPage />;
      case "insumos":
        return <InsumosPage />;
      case "estoque":
        return <EstoquePage />;
      case "promocoes":
        return <PromocoesPage />;
      case "relatorios":
        return <RelatoriosPage />;
      case "usuarios":
        return <UsuariosPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <DashboardLayout currentPage={currentPage} onPageChange={setCurrentPage}>
      {renderPage()}
    </DashboardLayout>
  );
}

export default App;
