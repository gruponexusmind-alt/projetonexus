import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Building2 } from "lucide-react";

export interface Client {
  id: string;
  name: string;
  color: string;
  colorClass: string;
}

export const clients: Client[] = [
  { id: "1", name: "TechCorp Solutions", color: "#3B82F6", colorClass: "bg-blue-500" },
  { id: "2", name: "Innovate Digital", color: "#8B5CF6", colorClass: "bg-purple-500" },
  { id: "3", name: "FutureAI Labs", color: "#10B981", colorClass: "bg-emerald-500" },
  { id: "4", name: "SmartBiz Automation", color: "#F59E0B", colorClass: "bg-amber-500" },
  { id: "5", name: "NextGen Analytics", color: "#EF4444", colorClass: "bg-red-500" },
  { id: "6", name: "CloudFirst Systems", color: "#06B6D4", colorClass: "bg-cyan-500" },
  { id: "7", name: "DataDriven Co", color: "#EA580C", colorClass: "bg-orange-600" },
  { id: "8", name: "AI Revolution Inc", color: "#EC4899", colorClass: "bg-pink-500" },
  { id: "9", name: "Quantum Solutions", color: "#6366F1", colorClass: "bg-indigo-500" },
  { id: "10", name: "Digital Transform Ltd", color: "#84CC16", colorClass: "bg-lime-500" },
];

interface ClientSelectorProps {
  selectedClient: string;
  onClientChange: (clientId: string) => void;
  clients: Client[];
}

export function ClientSelector({ selectedClient, onClientChange, clients }: ClientSelectorProps) {
  const currentClient = clients.find(client => client.id === selectedClient);

  return (
    <div className="flex items-center gap-3">
      <Building2 className="h-5 w-5 text-muted-foreground" />
      <Select value={selectedClient} onValueChange={onClientChange}>
        <SelectTrigger className="w-[280px] bg-card/50 border-border/50">
          <SelectValue>
            {currentClient && (
              <div className="flex items-center gap-2">
                <div 
                  className={`w-3 h-3 rounded-full ${currentClient.colorClass}`}
                />
                <span className="font-medium">{currentClient.name}</span>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {clients.map((client) => (
            <SelectItem key={client.id} value={client.id}>
              <div className="flex items-center gap-2">
                <div 
                  className={`w-3 h-3 rounded-full ${client.colorClass}`}
                />
                <span>{client.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}