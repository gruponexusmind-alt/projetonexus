import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';
import { Calendar, CheckCircle2, Loader2, XCircle, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useState } from 'react';

interface GoogleCalendarConnectProps {
  variant?: 'card' | 'button';
  showStats?: boolean;
}

export const GoogleCalendarConnect = ({
  variant = 'card',
  showStats = true
}: GoogleCalendarConnectProps) => {
  const {
    isConnected,
    isConnecting,
    isLoadingToken,
    connect,
    disconnect,
    isDisconnecting,
    googleEvents,
    storedToken,
  } = useGoogleCalendar();

  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);

  const handleDisconnect = () => {
    disconnect();
    setShowDisconnectDialog(false);
  };

  // Button variant (compact)
  if (variant === 'button') {
    if (isLoadingToken) {
      return (
        <Button variant="outline" disabled>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Carregando...
        </Button>
      );
    }

    if (isConnected) {
      return (
        <Button
          variant="outline"
          onClick={() => setShowDisconnectDialog(true)}
          disabled={isDisconnecting}
        >
          <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
          Google Calendar Conectado
        </Button>
      );
    }

    return (
      <Button
        onClick={connect}
        disabled={isConnecting}
        variant="default"
      >
        {isConnecting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Conectando...
          </>
        ) : (
          <>
            <Calendar className="h-4 w-4 mr-2" />
            Conectar Google Calendar
          </>
        )}
      </Button>
    );
  }

  // Card variant (detailed)
  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <CardTitle>Google Calendar</CardTitle>
            </div>
            {isConnected ? (
              <Badge variant="default" className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Conectado
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1">
                <XCircle className="h-3 w-3" />
                Desconectado
              </Badge>
            )}
          </div>
          <CardDescription>
            {isConnected
              ? 'Suas reuniões estão sincronizadas com o Google Calendar'
              : 'Conecte sua conta para sincronizar reuniões (popup)'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {isLoadingToken ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {isConnected && showStats && (
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground">Eventos sincronizados</p>
                    <p className="text-2xl font-bold">{googleEvents.length}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Última sincronização</p>
                    <p className="text-sm font-medium">
                      {storedToken?.last_sync_at
                        ? new Date(storedToken.last_sync_at).toLocaleString('pt-BR')
                        : 'Agora'}
                    </p>
                  </div>
                </div>
              )}

              {!isConnected && (
                <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                  <div className="text-xs text-blue-900 dark:text-blue-100">
                    <p className="font-medium mb-1">Benefícios da integração:</p>
                    <ul className="list-disc list-inside space-y-0.5">
                      <li>Visualize reuniões do Google Calendar aqui</li>
                      <li>Crie reuniões que sincronizam automaticamente</li>
                      <li>Mantenha tudo em um só lugar</li>
                      <li>Popup rápido - sem redirect!</li>
                    </ul>
                  </div>
                </div>
              )}

              {isConnected ? (
                <Button
                  variant="outline"
                  onClick={() => setShowDisconnectDialog(true)}
                  disabled={isDisconnecting}
                  className="w-full"
                >
                  {isDisconnecting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Desconectando...
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 mr-2" />
                      Desconectar Google Calendar
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={connect}
                  disabled={isConnecting}
                  className="w-full"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Aguarde o popup...
                    </>
                  ) : (
                    <>
                      <Calendar className="h-4 w-4 mr-2" />
                      Conectar Google Calendar (Popup)
                    </>
                  )}
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Disconnect Confirmation Dialog */}
      <Dialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Desconectar Google Calendar?</DialogTitle>
            <DialogDescription>
              Você não poderá mais visualizar ou criar eventos sincronizados com o Google Calendar.
              Seus eventos existentes não serão afetados.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDisconnectDialog(false)}
              disabled={isDisconnecting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDisconnect}
              disabled={isDisconnecting}
            >
              {isDisconnecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Desconectando...
                </>
              ) : (
                'Desconectar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
