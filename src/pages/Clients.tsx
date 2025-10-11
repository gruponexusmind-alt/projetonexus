import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Pencil, Building2, Mail, Phone, MoreHorizontal } from 'lucide-react';
import { CreateClientModal } from '@/components/CreateClientModal';
import { PageHeader } from '@/components/ui/page-header';
import { toast } from '@/hooks/use-toast';

interface Client {
  cliente_id: string;
  nome: string;
  contato: string;
  email: string;
  telefone?: string;
  segmento?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cnpj?: string;
  observacoes?: string;
  status_contrato: string;
  tipo_servico: string;
  created_at: string;
}

const Clients = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: clients, isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nm_clientes')
        .select(`
          *,
          nm_contratos(
            status,
            tipo_servico
          )
        `)
        .eq('nm_contratos.status', 'ativo')
        .order('nome', { ascending: true });

      if (error) throw error;
      
      // Flatten the contract data and map to our interface
      const processedData = data?.map((client: any) => ({
        cliente_id: client.id,
        nome: client.nome,
        contato: client.contato,
        email: client.email,
        telefone: client.telefone,
        segmento: client.segmento,
        endereco: client.endereco,
        cidade: client.cidade,
        estado: client.estado,
        cnpj: client.cnpj,
        observacoes: client.observacoes,
        created_at: client.created_at,
        status_contrato: client.nm_contratos?.[0]?.status || 'ativo',
        tipo_servico: client.nm_contratos?.[0]?.tipo_servico || ''
      })) || [];

      return processedData as Client[];
    },
  });

  const createClientMutation = useMutation({
    mutationFn: async (clientData: Omit<Client, 'cliente_id' | 'created_at' | 'status_contrato' | 'tipo_servico'>) => {
      // Transform data to match nm_clientes table structure
      const insertData = {
        nome: clientData.nome,
        contato: clientData.contato,
        email: clientData.email,
        telefone: clientData.telefone || '',
        segmento: clientData.segmento,
        endereco: clientData.endereco,
        cidade: clientData.cidade,
        estado: clientData.estado,
        cnpj: clientData.cnpj,
        observacoes: clientData.observacoes,
      };

      const { data, error } = await supabase
        .from('nm_clientes')
        .insert([insertData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({
        title: 'Cliente criado',
        description: 'Cliente criado com sucesso!',
      });
      setIsCreateModalOpen(false);
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Erro ao criar cliente: ' + error.message,
        variant: 'destructive',
      });
    },
  });

  const filteredClients = clients?.filter(client =>
    client.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.contato.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.cidade && client.cidade.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (client.tipo_servico && client.tipo_servico.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  return (
    <div className="flex flex-col h-full">
      <PageHeader 
        title="Clientes" 
        description="Gerencie seus clientes e informações de contato"
      >
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Cliente
        </Button>
      </PageHeader>
      
      <div className="flex-1 p-6 space-y-6">

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar clientes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="h-5 bg-muted rounded w-1/4"></div>
                      <div className="h-4 bg-muted rounded w-1/3"></div>
                    </div>
                    <div className="h-8 bg-muted rounded w-20"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredClients.map((client) => (
              <Card key={client.cliente_id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg truncate">{client.nome}</h3>
                          <Badge variant="outline" className="text-xs shrink-0">
                            {client.status_contrato}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            <span className="truncate">
                              {client.cidade && client.estado ? `${client.cidade}, ${client.estado}` : 'Localização não informada'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            <span className="truncate">{client.email}</span>
                          </div>
                          {client.telefone && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              <span>{client.telefone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right">
                          <p className="font-medium text-sm">{client.contato}</p>
                          <div className="flex gap-1 justify-end">
                            {client.segmento && (
                              <Badge variant="secondary" className="text-xs">
                                {client.segmento}
                              </Badge>
                            )}
                            {client.tipo_servico && (
                              <Badge variant="outline" className="text-xs">
                                {client.tipo_servico}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0">
                      <Button variant="outline" size="sm">
                        <Pencil className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

      {filteredClients.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhum cliente encontrado</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm ? 'Tente buscar com outros termos.' : 'Comece criando seu primeiro cliente.'}
          </p>
          {!searchTerm && (
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Cliente
            </Button>
          )}
        </div>
      )}

      <CreateClientModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={(data) => createClientMutation.mutate(data)}
        isLoading={createClientMutation.isPending}
      />
      </div>
    </div>
  );
};

export default Clients;