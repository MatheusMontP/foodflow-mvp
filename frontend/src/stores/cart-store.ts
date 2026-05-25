import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ItemCarrinho, Produto, Adicional } from "@/types";

interface CartState {
  items: ItemCarrinho[];
  addItem: (produto: Produto, quantidade?: number) => void;
  removeItem: (id: string) => void;
  updateQuantidade: (id: string, quantidade: number) => void;
  addAdicional: (itemId: string, adicional: Adicional) => void;
  removeAdicional: (itemId: string, adicionalId: number) => void;
  setObservacao: (itemId: string, observacao: string) => void;
  clearCart: () => void;
  getTotal: () => number;
  getSubtotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (produto, quantidade = 1) => {
        const id = `${produto.id}-${Date.now()}`;
        set((state) => ({
          items: [
            ...state.items,
            {
              id,
              produto,
              quantidade,
              adicionais: [],
            },
          ],
        }));
      },

      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
      },

      updateQuantidade: (id, quantidade) => {
        if (quantidade <= 0) {
          get().removeItem(id);
          return;
        }
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, quantidade } : item
          ),
        }));
      },

      addAdicional: (itemId, adicional) => {
        set((state) => ({
          items: state.items.map((item) => {
            if (item.id !== itemId) return item;
            const existingIndex = item.adicionais.findIndex(
              (a) => a.adicional.id === adicional.id
            );
            if (existingIndex >= 0) {
              const newAdicionais = [...item.adicionais];
              newAdicionais[existingIndex].quantidade += 1;
              return { ...item, adicionais: newAdicionais };
            }
            return {
              ...item,
              adicionais: [...item.adicionais, { adicional, quantidade: 1 }],
            };
          }),
        }));
      },

      removeAdicional: (itemId, adicionalId) => {
        set((state) => ({
          items: state.items.map((item) => {
            if (item.id !== itemId) return item;
            return {
              ...item,
              adicionais: item.adicionais.filter(
                (a) => a.adicional.id !== adicionalId
              ),
            };
          }),
        }));
      },

      setObservacao: (itemId, observacao) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === itemId ? { ...item, observacao } : item
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      getSubtotal: () => {
        return get().items.reduce((total, item) => {
          const itemTotal = item.produto.preco * item.quantidade;
          const adicionaisTotal = item.adicionais.reduce(
            (sum, a) => sum + a.adicional.preco * a.quantidade,
            0
          );
          return total + itemTotal + adicionaisTotal * item.quantidade;
        }, 0);
      },

      getTotal: () => get().getSubtotal(),
    }),
    {
      name: "foodflow-cart",
    }
  )
);
