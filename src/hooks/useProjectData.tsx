import { useState, useCallback } from "react";
import { Card, clientsCards } from "../data/clientsData";
import { Client, clients } from "../components/ClientSelector";

export function useProjectData() {
  const [cards, setCards] = useState<Card[]>(clientsCards);
  const [clientList, setClientList] = useState<Client[]>(clients);

  const addCard = useCallback((newCard: Omit<Card, 'id'>) => {
    const card: Card = {
      ...newCard,
      id: `card-${Date.now()}`,
    };
    setCards(prev => [...prev, card]);
  }, []);

  const updateCard = useCallback((cardId: string, updates: Partial<Card>) => {
    setCards(prev => prev.map(card => 
      card.id === cardId ? { ...card, ...updates } : card
    ));
  }, []);

  const handleChecklistToggle = useCallback((cardId: string, itemId: string) => {
    setCards(prevCards =>
      prevCards.map(card => {
        if (card.id === cardId) {
          const updatedChecklist = card.checklist.map(item =>
            item.id === itemId ? { ...item, completed: !item.completed } : item
          );
          
          const completedItems = updatedChecklist.filter(item => item.completed).length;
          const progress = updatedChecklist.length > 0 ? (completedItems / updatedChecklist.length) * 100 : 0;
          
          return {
            ...card,
            checklist: updatedChecklist,
            progress: Math.round(progress),
          };
        }
        return card;
      })
    );
  }, []);

  const exportData = useCallback((clientId?: string) => {
    const dataToExport = {
      clients: clientList,
      cards: clientId ? cards.filter(card => card.clientId === clientId) : cards,
      exportDate: new Date().toISOString(),
      exportedClient: clientId ? clientList.find(c => c.id === clientId)?.name : "Todos os clientes",
    };

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
      type: 'application/json',
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = clientId 
      ? `projeto-${clientList.find(c => c.id === clientId)?.name || 'cliente'}-${new Date().toISOString().split('T')[0]}.json`
      : `todos-projetos-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [cards, clientList]);

  const updateClients = useCallback((newClients: Client[]) => {
    setClientList(newClients);
  }, []);

  return {
    cards,
    clientList,
    addCard,
    updateCard,
    handleChecklistToggle,
    exportData,
    updateClients,
  };
}