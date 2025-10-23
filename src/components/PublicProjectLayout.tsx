import { Building2, Clock, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PublicProjectLayoutProps {
  children: React.ReactNode;
  expiresAt?: number;
}

export function PublicProjectLayout({ children, expiresAt }: PublicProjectLayoutProps) {
  const getExpirationText = () => {
    if (!expiresAt) return null;

    const timeLeft = expiresAt - Date.now();

    if (timeLeft <= 0) {
      return 'Link expirado';
    }

    const daysLeft = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hoursLeft = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (daysLeft > 0) {
      return `Expira em ${daysLeft} dia${daysLeft > 1 ? 's' : ''}`;
    } else {
      return `Expira em ${hoursLeft} hora${hoursLeft > 1 ? 's' : ''}`;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur-md shadow-sm">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-purple-600 shadow-md">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 tracking-tight">Nexus Gestão de Projetos</h1>
              <p className="text-xs text-gray-600">Visualização de Projeto</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            <Badge variant="outline" className="flex items-center gap-1 shadow-sm">
              <Eye className="h-3 w-3" />
              <span className="hidden sm:inline">Somente Leitura</span>
              <span className="sm:hidden">Leitura</span>
            </Badge>
            {expiresAt && (
              <Badge variant="secondary" className="flex items-center gap-1 shadow-sm">
                <Clock className="h-3 w-3" />
                {getExpirationText()}
              </Badge>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-6 md:py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t bg-gray-50 py-8 mt-12">
        <div className="container px-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="h-8 w-8 flex items-center justify-center rounded-lg bg-gradient-to-br from-primary to-purple-600">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <p className="font-semibold text-gray-900">Nexus Gestão de Projetos</p>
            </div>
            <p className="text-sm text-gray-600 mb-1">Este é um link temporário de visualização do projeto.</p>
            <p className="text-xs text-gray-500">
              O acesso expira automaticamente em 7 dias a partir da criação do link.
            </p>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                © 2025 Nexus. Todos os direitos reservados.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
