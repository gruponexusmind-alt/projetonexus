import React, { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Building2,
  Users,
  UserCheck,
  Plug,
  Shield,
  Settings as SettingsIcon,
  Tags
} from 'lucide-react';

// Tab components
import { OrganizationTab } from '@/components/settings/OrganizationTab';
import { UsersAccessTab } from '@/components/settings/UsersAccessTab';
import { ResourcesTab } from '@/components/settings/ResourcesTab';
import { IntegrationsTab } from '@/components/settings/IntegrationsTab';
import { SecurityTab } from '@/components/settings/SecurityTab';
import { LabelsTab } from '@/components/settings/LabelsTab';

const settingsTabs = [
  {
    id: 'organization',
    label: 'Organização',
    icon: Building2,
    description: 'Configurações da empresa e informações gerais',
  },
  {
    id: 'users',
    label: 'Usuários e Acesso',
    icon: Users,
    description: 'Gerenciar usuários, roles e permissões',
  },
  {
    id: 'resources',
    label: 'Recursos e Capacidade',
    icon: UserCheck,
    description: 'Funcionários, capacidade e alocação',
  },
  {
    id: 'labels',
    label: 'Labels',
    icon: Tags,
    description: 'Gerenciar labels para organizar projetos e tarefas',
  },
  {
    id: 'integrations',
    label: 'Integrações',
    icon: Plug,
    description: 'Conectar com sistemas externos',
  },
  {
    id: 'security',
    label: 'Segurança',
    icon: Shield,
    description: 'Configurações de segurança e privacidade',
  },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState('organization');

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Configurações" 
        description="Gerenciar configurações do sistema e da organização"
      >
        <div className="flex items-center gap-2 text-muted-foreground">
          <SettingsIcon className="h-4 w-4" />
          <span className="text-sm">Administração</span>
        </div>
      </PageHeader>
      
      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Vertical Navigation */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <TabsList className="grid w-full grid-cols-1 lg:grid-rows-6 h-auto bg-gradient-to-b from-muted/30 to-muted/50 p-3 rounded-xl border shadow-sm">
                {settingsTabs.map((tab) => {
                  const IconComponent = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className={`flex items-start gap-3 p-4 h-auto text-left justify-start rounded-lg transition-all duration-200 hover:bg-background/60 ${
                        isActive 
                          ? 'bg-background shadow-md border border-primary/20 text-primary' 
                          : 'hover:shadow-sm'
                      }`}
                    >
                      <IconComponent className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                        isActive ? 'text-primary' : 'text-muted-foreground'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className={`font-medium text-sm ${
                          isActive ? 'text-primary' : 'text-foreground'
                        }`}>{tab.label}</div>
                        <div className="text-xs text-muted-foreground mt-1 hidden lg:block leading-relaxed">
                          {tab.description}
                        </div>
                      </div>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>

            {/* Content Area */}
            <div className="lg:col-span-3 space-y-6">
              <TabsContent value="organization" className="mt-0">
                <OrganizationTab />
              </TabsContent>

              <TabsContent value="users" className="mt-0">
                <UsersAccessTab />
              </TabsContent>

              <TabsContent value="resources" className="mt-0">
                <ResourcesTab />
              </TabsContent>

              <TabsContent value="labels" className="mt-0">
                <LabelsTab />
              </TabsContent>

              <TabsContent value="integrations" className="mt-0">
                <IntegrationsTab />
              </TabsContent>

              <TabsContent value="security" className="mt-0">
                <SecurityTab />
              </TabsContent>
            </div>
          </div>
        </Tabs>
      </div>
    </div>
  );
}