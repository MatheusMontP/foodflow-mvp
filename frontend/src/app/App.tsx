import { Activity, Boxes, LayoutDashboard, ShoppingCart } from "lucide-react";

const cards = [
  {
    titulo: "Painel gerencial",
    texto: "Base preparada para dashboard, produtos, insumos, estoque e relatorios.",
    Icone: LayoutDashboard,
  },
  {
    titulo: "PDV web",
    texto: "Espaco inicial para o fluxo de venda responsivo do caixa.",
    Icone: ShoppingCart,
  },
  {
    titulo: "Modulos",
    texto: "Backend organizado por areas de negocio em camadas simples.",
    Icone: Boxes,
  },
];

export function App() {
  return (
    <main className="app-shell">
      <section className="topbar">
        <div>
          <p className="eyebrow">FoodFlow Gestao</p>
          <h1>Fundacao tecnica pronta para evoluir o MVP</h1>
        </div>
        <span className="status">
          <Activity size={18} aria-hidden="true" />
          Base inicial
        </span>
      </section>

      <section className="grid">
        {cards.map(({ titulo, texto, Icone }) => (
          <article className="card" key={titulo}>
            <Icone size={24} aria-hidden="true" />
            <h2>{titulo}</h2>
            <p>{texto}</p>
          </article>
        ))}
      </section>
    </main>
  );
}

