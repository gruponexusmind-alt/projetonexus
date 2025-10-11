// TypeScript declarations for Google Identity Services (GIS) and Google API Client

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          prompt: () => void;
          renderButton: (parent: HTMLElement, options: any) => void;
        };
        oauth2?: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: string }) => void;
            prompt?: string;
            error_callback?: (error: any) => void;
          }) => {
            requestAccessToken: (options?: { prompt?: string }) => void;
          };
        };
      };
    };
    gapi?: {
      load: (api: string, callback: () => void) => void;
      client: {
        init: (config: {
          apiKey?: string;
          discoveryDocs?: string[];
        }) => Promise<void>;
        calendar?: {
          calendarList: {
            list: (params?: any) => Promise<any>;
          };
          events: {
            list: (params: {
              calendarId: string;
              timeMin?: string;
              timeMax?: string;
              singleEvents?: boolean;
              orderBy?: string;
              maxResults?: number;
            }) => Promise<any>;
            insert: (params: {
              calendarId: string;
              resource: any;
            }) => Promise<any>;
            update: (params: {
              calendarId: string;
              eventId: string;
              resource: any;
            }) => Promise<any>;
            delete: (params: {
              calendarId: string;
              eventId: string;
            }) => Promise<any>;
          };
        };
      };
    };
  }
}

export {};
