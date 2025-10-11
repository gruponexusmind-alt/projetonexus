import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  Search,
  Mail,
  Phone,
  ChevronRight,
  MapPin,
  User,
  FileText,
  Tag
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageHeader } from '@/components/ui/page-header';

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

// Componente helper para exibir informações no modal
function InfoItem({ label, value, icon }: { label: string; value?: string; icon?: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground flex items-center gap-1">
        {icon}
        {label}
      </Label>
      <p className="text-sm font-medium">
        {value || <span className="text-muted-foreground italic">Não informado</span>}
      </p>
    </div>
  );
}

const Clients = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

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

  // Filtros combinados
  const filteredClients = clients?.filter(client => {
    // Filtro de busca
    const matchesSearch =
      client.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.contato.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.cidade && client.cidade.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (client.segmento && client.segmento.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (client.tipo_servico && client.tipo_servico.toLowerCase().includes(searchTerm.toLowerCase()));

    // Filtro de status
    const matchesStatus =
      statusFilter === 'all' ||
      client.status_contrato.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  }) || [];

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Clientes"
        description="Dados sincronizados do sistema externo"
      >
        <Badge variant="outline" className="text-sm">
          {filteredClients.length} {filteredClients.length === 1 ? 'cliente' : 'clientes'}
        </Badge>
      </PageHeader>

      <div className="flex-1 p-6 space-y-6">

        {/* Barra de Busca e Filtros */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar por nome, contato, email, cidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="ativo">Ativos</SelectItem>
              <SelectItem value="inativo">Inativos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="h-5 bg-muted rounded w-1/4"></div>
                      <div className="h-4 bg-muted rounded w-1/2"></div>
                    </div>
                    <div className="h-4 w-4 bg-muted rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            {/* Lista de Clientes - Cards Compactos */}
            <div className="space-y-2">
              {filteredClients.map((client) => (
                <Card
                  key={client.cliente_id}
                  className="hover:shadow-lg cursor-pointer transition-all hover:border-primary/50"
                  onClick={() => setSelectedClient(client)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">

                      {/* Coluna Principal */}
                      <div className="flex-1 min-w-0">
                        {/* Linha 1: Nome + Status */}
                        <div className="flex items-center gap-2 mb-2">
                          <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                          <h3 className="font-semibold truncate">{client.nome}</h3>
                          <Badge
                            variant={client.status_contrato === 'ativo' ? 'default' : 'secondary'}
                            className="shrink-0 text-xs"
                          >
                            {client.status_contrato}
                          </Badge>
                        </div>

                        {/* Linha 2: Informações de Contato */}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                          <span className="flex items-center gap-1 truncate">
                            <User className="h-3 w-3 shrink-0" />
                            {client.contato}
                          </span>
                          <span className="flex items-center gap-1 truncate">
                            <Mail className="h-3 w-3 shrink-0" />
                            {client.email}
                          </span>
                          {client.telefone && (
                            <span className="flex items-center gap-1 shrink-0">
                              <Phone className="h-3 w-3" />
                              {client.telefone}
                            </span>
                          )}
                        </div>

                        {/* Linha 3: Tags e Localização */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {client.cidade && client.estado && (
                            <Badge variant="outline" className="text-xs">
                              <MapPin className="h-3 w-3 mr-1" />
                              {client.cidade}, {client.estado}
                            </Badge>
                          )}
                          {client.segmento && (
                            <Badge variant="secondary" className="text-xs">
                              <Tag className="h-3 w-3 mr-1" />
                              {client.segmento}
                            </Badge>
                          )}
                          {client.tipo_servico && (
                            <Badge variant="outline" className="text-xs">
                              <FileText className="h-3 w-3 mr-1" />
                              {client.tipo_servico}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Indicador de "Ver Mais" */}
                      <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Empty State */}
            {filteredClients.length === 0 && (
              <div className="text-center py-16">
                <Building2 className="mx-auto h-16 w-16 text-muted-foreground opacity-50 mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum cliente encontrado</h3>
                <p className="text-muted-foreground">
                  {searchTerm || statusFilter !== 'all'
                    ? 'Tente ajustar os filtros de busca.'
                    : 'Aguardando sincronização de dados do sistema externo.'}
                </p>
              </div>
            )}
          </>
        )}

        {/* Modal de Detalhes (Read-Only) */}
        <Dialog open={!!selectedClient} onOpenChange={() => setSelectedClient(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <Building2 className="h-6 w-6" />
                {selectedClient?.nome}
                <Badge variant={selectedClient?.status_contrato === 'ativo' ? 'default' : 'secondary'}>
                  {selectedClient?.status_contrato}
                </Badge>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 mt-4">
              {/* Seção: Informações de Contato */}
              <div className="space-y-4">
                <h4 className="font-semibold text-base flex items-center gap-2 border-b pb-2">
                  <User className="h-4 w-4" />
                  Informações de Contato
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoItem
                    label="Pessoa de Contato"
                    value={selectedClient?.contato}
                    icon={<User className="h-3 w-3" />}
                  />
                  <InfoItem
                    label="Email"
                    value={selectedClient?.email}
                    icon={<Mail className="h-3 w-3" />}
                  />
                  <InfoItem
                    label="Telefone"
                    value={selectedClient?.telefone}
                    icon={<Phone className="h-3 w-3" />}
                  />
                  <InfoItem
                    label="CNPJ"
                    value={selectedClient?.cnpj}
                    icon={<FileText className="h-3 w-3" />}
                  />
                </div>
              </div>

              {/* Seção: Localização */}
              <div className="space-y-4">
                <h4 className="font-semibold text-base flex items-center gap-2 border-b pb-2">
                  <MapPin className="h-4 w-4" />
                  Localização
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoItem
                    label="Endereço"
                    value={selectedClient?.endereco}
                    icon={<MapPin className="h-3 w-3" />}
                  />
                  <InfoItem
                    label="Cidade"
                    value={selectedClient?.cidade}
                  />
                  <InfoItem
                    label="Estado"
                    value={selectedClient?.estado}
                  />
                  <InfoItem
                    label="Segmento"
                    value={selectedClient?.segmento}
                    icon={<Tag className="h-3 w-3" />}
                  />
                </div>
              </div>

              {/* Seção: Informações de Contrato */}
              <div className="space-y-4">
                <h4 className="font-semibold text-base flex items-center gap-2 border-b pb-2">
                  <FileText className="h-4 w-4" />
                  Informações de Contrato
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoItem
                    label="Status do Contrato"
                    value={selectedClient?.status_contrato}
                  />
                  <InfoItem
                    label="Tipo de Serviço"
                    value={selectedClient?.tipo_servico}
                  />
                </div>
              </div>

              {/* Seção: Observações */}
              {selectedClient?.observacoes && (
                <div className="space-y-4">
                  <h4 className="font-semibold text-base flex items-center gap-2 border-b pb-2">
                    📝 Observações
                  </h4>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {selectedClient.observacoes}
                    </p>
                  </div>
                </div>
              )}

              {/* Data de Criação */}
              <div className="text-xs text-muted-foreground text-right pt-4 border-t">
                Cadastrado em: {new Date(selectedClient?.created_at || '').toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric'
                })}
              </div>
            </div>

            {/* Rodapé do Modal */}
            <div className="flex justify-end mt-6 pt-4 border-t">
              <Button variant="outline" onClick={() => setSelectedClient(null)}>
                Fechar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Clients;
