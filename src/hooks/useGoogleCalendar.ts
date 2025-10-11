import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  attendees?: Array<{ email: string; displayName?: string }>;
  htmlLink?: string;
  status: string;
}

interface CalendarToken {
  id: string;
  access_token: string;
  refresh_token: string;
  expires_at: string;
  is_active: boolean;
  calendar_id: string;
  last_sync_at: string | null;
}

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;
const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar';

export const useGoogleCalendar = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isConnecting, setIsConnecting] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [gapiReady, setGapiReady] = useState(false);
  const tokenClientRef = useRef<any>(null);

  // Initialize Google APIs (GIS + gapi)
  useEffect(() => {
    const initGoogleAPIs = async () => {
      // Wait for scripts to load
      const checkReady = () =>
        Boolean(window.google?.accounts?.oauth2) && Boolean(window.gapi);

      if (!checkReady()) {
        const interval = setInterval(() => {
          if (checkReady()) {
            clearInterval(interval);
            init();
          }
        }, 100);
        return;
      }

      init();
    };

    const init = async () => {
      if (!CLIENT_ID) return;

      // Initialize token client for OAuth popup
      if (window.google?.accounts?.oauth2) {
        tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: CALENDAR_SCOPE,
          callback: (resp: any) => {
            if (resp && resp.access_token) {
              setAccessToken(resp.access_token);
              saveToken(resp.access_token);
            }
          },
          prompt: 'consent',
          error_callback: (error: any) => {
            console.error('OAuth error:', error);
            toast({
              title: 'Erro na autenticação',
              description: 'Não foi possível conectar com o Google.',
              variant: 'destructive',
            });
            setIsConnecting(false);
          },
        });
      }

      // Initialize gapi client for Calendar API
      if (window.gapi) {
        await new Promise<void>((resolve) => {
          window.gapi!.load('client', resolve);
        });
        await window.gapi.client.init({
          discoveryDocs: [
            'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest',
          ],
        });
        setGapiReady(true);
      }
    };

    initGoogleAPIs();
  }, []);

  // Fetch stored token from Supabase
  const { data: storedToken, isLoading: isLoadingToken } = useQuery({
    queryKey: ['google-calendar-token'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('gp_google_calendar_tokens')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;

      // If we have a stored token, use it
      if (data && data.access_token) {
        const expiresAt = new Date(data.expires_at);
        if (new Date() < expiresAt) {
          setAccessToken(data.access_token);
        }
      }

      return data as CalendarToken | null;
    },
  });

  // Save token to Supabase
  const saveToken = async (token: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('user_id', user.id)
        .single();

      if (!profile) throw new Error('User profile not found');

      const expiresAt = new Date(Date.now() + 3600 * 1000); // 1 hour

      const { error } = await supabase
        .from('gp_google_calendar_tokens')
        .upsert({
          user_id: user.id,
          company_id: profile.company_id,
          access_token: token,
          expires_at: expiresAt.toISOString(),
          token_type: 'Bearer',
          scope: CALENDAR_SCOPE,
          is_active: true,
          calendar_id: 'primary',
        }, {
          onConflict: 'company_id,user_id',
        });

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['google-calendar-token'] });

      toast({
        title: 'Google Calendar conectado',
        description: 'Sua conta foi vinculada com sucesso.',
      });
    } catch (error: any) {
      console.error('Error saving token:', error);
      toast({
        title: 'Erro ao salvar token',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsConnecting(false);
    }
  };

  // Check if token is expired
  const isTokenExpired = useCallback(() => {
    if (!storedToken) return true;
    const expiresAt = new Date(storedToken.expires_at);
    return new Date() >= expiresAt;
  }, [storedToken]);

  // Connect to Google Calendar (open popup)
  const connect = useCallback(() => {
    if (!tokenClientRef.current) {
      toast({
        title: 'Aguarde',
        description: 'Google APIs ainda carregando...',
        variant: 'destructive',
      });
      return;
    }
    setIsConnecting(true);
    tokenClientRef.current.requestAccessToken();
  }, []);

  // Disconnect from Google Calendar
  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('gp_google_calendar_tokens')
        .update({ is_active: false })
        .eq('user_id', user.id);

      if (error) throw error;

      setAccessToken(null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['google-calendar-token'] });
      toast({
        title: 'Desconectado',
        description: 'Sua conta Google Calendar foi desvinculada.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao desconectar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Fetch events from Google Calendar using gapi
  const fetchGoogleEvents = useCallback(async (timeMin?: string, timeMax?: string) => {
    if (!accessToken || !gapiReady) {
      return [];
    }

    try {
      const params = {
        calendarId: 'primary',
        timeMin: timeMin || new Date().toISOString(),
        timeMax: timeMax,
        singleEvents: true,
        orderBy: 'startTime' as const,
        maxResults: 100,
      };

      const response = await window.gapi!.client.calendar!.events.list(params);
      return (response.result.items || []) as GoogleCalendarEvent[];
    } catch (error) {
      console.error('Error fetching events:', error);
      toast({
        title: 'Erro ao buscar eventos',
        description: 'Não foi possível carregar os eventos do Google Calendar.',
        variant: 'destructive',
      });
      return [];
    }
  }, [accessToken, gapiReady]);

  // Query for Google Calendar events
  const { data: googleEvents, isLoading: isLoadingEvents, refetch: refetchEvents } = useQuery({
    queryKey: ['google-calendar-events', accessToken],
    queryFn: () => {
      const now = new Date();
      const timeMin = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      const timeMax = new Date(now.getFullYear(), now.getMonth() + 3, 0).toISOString();
      return fetchGoogleEvents(timeMin, timeMax);
    },
    enabled: !!accessToken && !isTokenExpired() && gapiReady,
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });

  // Create event in Google Calendar using gapi
  const createGoogleEventMutation = useMutation({
    mutationFn: async (event: {
      summary: string;
      description?: string;
      start: { dateTime: string };
      end: { dateTime: string };
      attendees?: Array<{ email: string }>;
    }) => {
      if (!accessToken || !gapiReady) {
        throw new Error('Google Calendar não está conectado');
      }

      const response = await window.gapi!.client.calendar!.events.insert({
        calendarId: 'primary',
        resource: event,
      });

      return response.result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['google-calendar-events'] });
      toast({
        title: 'Evento criado',
        description: 'Evento adicionado ao Google Calendar com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar evento',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    // Connection state
    isConnected: !!accessToken && !isTokenExpired(),
    isConnecting,
    isLoadingToken,
    storedToken,

    // Actions
    connect,
    disconnect: disconnectMutation.mutate,
    isDisconnecting: disconnectMutation.isPending,

    // Google Calendar events
    googleEvents: googleEvents || [],
    isLoadingEvents,
    refetchEvents,

    // Create event
    createGoogleEvent: createGoogleEventMutation.mutate,
    isCreatingEvent: createGoogleEventMutation.isPending,
  };
};
