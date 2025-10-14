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
    <div className="light min-h-screen bg-gradient-to-br from-white via-gray-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Building2 className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Nexus Gestão de Projetos</h1>
              <p className="text-xs text-gray-600">Visualização de Projeto</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              Somente Leitura
            </Badge>
            {expiresAt && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {getExpirationText()}
              </Badge>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t bg-gray-50 py-6 mt-12">
        <div className="container px-4 text-center text-sm text-gray-600">
          <p>Este é um link temporário de visualização do projeto.</p>
          <p className="mt-1">
            O acesso expira automaticamente em 7 dias a partir da criação do link.
          </p>
        </div>
      </footer>
    </div>
  );
}
