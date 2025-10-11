import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Settings, Plus, Pencil, Trash2, Save, X } from "lucide-react";
import { Client, clients } from "./ClientSelector";

const colorOptions = [
  { name: "Azul", value: "#3B82F6", class: "bg-blue-500" },
  { name: "Roxo", value: "#8B5CF6", class: "bg-purple-500" },
  { name: "Verde", value: "#10B981", class: "bg-emerald-500" },
  { name: "Amarelo", value: "#F59E0B", class: "bg-amber-500" },
  { name: "Vermelho", value: "#EF4444", class: "bg-red-500" },
  { name: "Ciano", value: "#06B6D4", class: "bg-cyan-500" },
  { name: "Laranja", value: "#EA580C", class: "bg-orange-600" },
  { name: "Rosa", value: "#EC4899", class: "bg-pink-500" },
  { name: "Índigo", value: "#6366F1", class: "bg-indigo-500" },
  { name: "Lima", value: "#84CC16", class: "bg-lime-500" },
  { name: "Violeta", value: "#7C3AED", class: "bg-violet-600" },
  { name: "Esmeralda", value: "#059669", class: "bg-emerald-600" },
];

interface ClientManagementModalProps {
  onUpdateClients: (clients: Client[]) => void;
  trigger: React.ReactNode;
}

export function ClientManagementModal({ onUpdateClients, trigger }: ClientManagementModalProps) {
  const [open, setOpen] = useState(false);
  const [clientList, setClientList] = useState<Client[]>(clients);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newClientName, setNewClientName] = useState("");
  const [newClientColor, setNewClientColor] = useState(colorOptions[0]);

  const handleSave = () => {
    onUpdateClients(clientList);
    setOpen(false);
  };

  const handleAddClient = () => {
    if (!newClientName.trim()) return;

    const newClient: Client = {
      id: Date.now().toString(),
      name: newClientName.trim(),
      color: newClientColor.value,
      colorClass: newClientColor.class,
    };

    setClientList([...clientList, newClient]);
    setNewClientName("");
    setNewClientColor(colorOptions[0]);
  };

  const handleEditClient = (id: string, newName: string, newColor: typeof colorOptions[0]) => {
    setClientList(clientList.map(client => 
      client.id === id 
        ? { ...client, name: newName, color: newColor.value, colorClass: newColor.class }
        : client
    ));
    setEditingId(null);
  };

  const handleDeleteClient = (id: string) => {
    setClientList(clientList.filter(client => client.id !== id));
  };

  const ClientEditor = ({ client }: { client: Client }) => {
    const [name, setName] = useState(client.name);
    const [selectedColor, setSelectedColor] = useState(
      colorOptions.find(color => color.value === client.color) || colorOptions[0]
    );

    return (
      <div className="flex items-center gap-2 p-2 border rounded-lg">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1"
        />
        <div className="flex gap-1">
          {colorOptions.map((color) => (
            <button
              key={color.value}
              type="button"
              className={`w-6 h-6 rounded-full ${color.class} ${
                selectedColor.value === color.value ? 'ring-2 ring-offset-2 ring-primary' : ''
              }`}
              onClick={() => setSelectedColor(color)}
            />
          ))}
        </div>
        <Button
          size="sm"
          onClick={() => handleEditClient(client.id, name, selectedColor)}
        >
          <Save className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setEditingId(null)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Gerenciar Clientes
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Add New Client */}
          <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
            <h3 className="font-medium flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Adicionar Novo Cliente
            </h3>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="newClientName">Nome do Cliente</Label>
                <Input
                  id="newClientName"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="Nome da empresa ou cliente"
                />
              </div>
              
              <div>
                <Label>Cor de Identificação</Label>
                <div className="flex gap-2 mt-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      className={`w-8 h-8 rounded-full ${color.class} ${
                        newClientColor.value === color.value ? 'ring-2 ring-offset-2 ring-primary' : ''
                      }`}
                      onClick={() => setNewClientColor(color)}
                      title={color.name}
                    />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Cor selecionada: {newClientColor.name}
                </p>
              </div>
              
              <Button onClick={handleAddClient} disabled={!newClientName.trim()}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Cliente
              </Button>
            </div>
          </div>

          {/* Existing Clients */}
          <div className="space-y-4">
            <h3 className="font-medium">Clientes Existentes</h3>
            <div className="space-y-3">
              {clientList.map((client) => (
                <div key={client.id}>
                  {editingId === client.id ? (
                    <ClientEditor client={client} />
                  ) : (
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div 
                          className={`w-4 h-4 rounded-full ${client.colorClass}`}
                        />
                        <span className="font-medium">{client.name}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingId(client.id)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteClient(client.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} className="bg-gradient-primary">
              <Save className="h-4 w-4 mr-2" />
              Salvar Alterações
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
