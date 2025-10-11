import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, X } from "lucide-react";
import { Card, ChecklistItem } from "../data/clientsData";
import { clients } from "./ClientSelector";

interface CreateCardModalProps {
  selectedClient: string;
  onCreateCard: (card: Omit<Card, 'id'>) => void;
  trigger: React.ReactNode;
}

const columns = [
  { id: "onboarding", title: "Onboarding" },
  { id: "strategy", title: "Estratégia & Arquitetura" },
  { id: "development", title: "Desenvolvimento" },
  { id: "validation", title: "Validação & Testes" },
  { id: "delivery", title: "Entrega / Go Live" },
  { id: "tracking", title: "Acompanhamento" },
];

export function CreateCardModal({ selectedClient, onCreateCard, trigger }: CreateCardModalProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [responsible, setResponsible] = useState("");
  const [complexity, setComplexity] = useState<"baixa" | "media" | "alta">("media");
  const [columnId, setColumnId] = useState("onboarding");
  const [checklistItems, setChecklistItems] = useState<string[]>([""]);

  const currentClient = clients.find(client => client.id === selectedClient);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) return;

    const checklist: ChecklistItem[] = checklistItems
      .filter(item => item.trim())
      .map((item, index) => ({
        id: `new-${Date.now()}-${index}`,
        text: item.trim(),
        completed: false,
      }));

    const newCard: Omit<Card, 'id'> = {
      title: title.trim(),
      description: description.trim() || undefined,
      deadline: deadline.trim() || undefined,
      responsible: responsible.trim() || undefined,
      complexity,
      progress: 0,
      checklist,
      columnId,
      clientId: selectedClient,
    };

    onCreateCard(newCard);
    
    // Reset form
    setTitle("");
    setDescription("");
    setDeadline("");
    setResponsible("");
    setComplexity("media");
    setColumnId("onboarding");
    setChecklistItems([""]);
    setOpen(false);
  };

  const addChecklistItem = () => {
    setChecklistItems([...checklistItems, ""]);
  };

  const removeChecklistItem = (index: number) => {
    setChecklistItems(checklistItems.filter((_, i) => i !== index));
  };

  const updateChecklistItem = (index: number, value: string) => {
    const updated = [...checklistItems];
    updated[index] = value;
    setChecklistItems(updated);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Criar Novo Card
            {currentClient && (
              <Badge 
                className="text-white border-0"
                style={{ backgroundColor: currentClient.color }}
              >
                {currentClient.name}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Nome do projeto/tarefa"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="column">Coluna</Label>
              <Select value={columnId} onValueChange={setColumnId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {columns.map((column) => (
                    <SelectItem key={column.id} value={column.id}>
                      {column.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o projeto ou tarefa"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="deadline">Prazo</Label>
              <Input
                id="deadline"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                placeholder="Ex: 30 dias"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="responsible">Responsável</Label>
              <Input
                id="responsible"
                value={responsible}
                onChange={(e) => setResponsible(e.target.value)}
                placeholder="Equipe ou pessoa"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="complexity">Complexidade</Label>
              <Select value={complexity} onValueChange={(value: "baixa" | "media" | "alta") => setComplexity(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Checklist</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addChecklistItem}
              >
                <Plus className="h-4 w-4 mr-1" />
                Adicionar Item
              </Button>
            </div>
            
            <div className="space-y-2">
              {checklistItems.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={item}
                    onChange={(e) => updateChecklistItem(index, e.target.value)}
                    placeholder={`Item ${index + 1} do checklist`}
                  />
                  {checklistItems.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeChecklistItem(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-gradient-primary">
              Criar Card
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}