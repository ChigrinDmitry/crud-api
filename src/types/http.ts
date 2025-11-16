import { IncomingMessage, ServerResponse } from 'http';

export interface Request extends IncomingMessage {
  body?: any;
  params?: Record<string, string>;
  query?: Record<string, string>;
}

export interface Response extends ServerResponse {
  status: (code: number) => Response;
  json: (data: any) => void;
  send: (data?: any) => void;
}

export type RouteHandler = (req: Request, res: Response) => Promise<void> | void;

export interface Route {
  method: string;
  path: string;
  handler: RouteHandler;
}

