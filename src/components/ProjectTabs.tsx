import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjectBoard } from "./ProjectBoard";
import { ProjectDashboard } from "./ProjectDashboard";
import { ClientSelector } from "./ClientSelector";
import { useProjectData } from "../hooks/useProjectData";
import { BarChart3, Kanban } from "lucide-react";

export function ProjectTabs() {
  const [selectedClient, setSelectedClient] = useState("1");
  const { 
    cards, 
    clientList, 
    addCard, 
    handleChecklistToggle, 
    exportData, 
    updateClients 
  } = useProjectData();

  return (
    <div className="min-h-screen bg-gradient-background">
      <Tabs defaultValue="dashboard" className="w-full">
        {/* Header with tabs */}
        <div className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="container mx-auto px-6 py-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Fluxo de Acompanhamento de Projetos IA
                </h1>
                <p className="text-muted-foreground mt-1">
                  Gestão completa do desenvolvimento de agentes inteligentes
                </p>
              </div>
              <TabsList className="grid w-[400px] grid-cols-2">
                <TabsTrigger value="dashboard" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Dashboard
                </TabsTrigger>
                <TabsTrigger value="board" className="flex items-center gap-2">
                  <Kanban className="h-4 w-4" />
                  Board Kanban
                </TabsTrigger>
              </TabsList>
            </div>
            
            {/* Client Selector */}
            <div className="flex items-center justify-center">
              <ClientSelector 
                selectedClient={selectedClient} 
                onClientChange={setSelectedClient}
                clients={clientList}
              />
            </div>
          </div>
        </div>

        {/* Tab content */}
        <TabsContent value="dashboard" className="mt-0">
          <ProjectDashboard selectedClient={selectedClient} cards={cards} clients={clientList} />
        </TabsContent>
        
        <TabsContent value="board" className="mt-0">
          <ProjectBoard />
        </TabsContent>
      </Tabs>
    </div>
  );
}