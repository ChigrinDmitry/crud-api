import { Request, Response, Route, RouteHandler } from '../types/http';
import { URL } from 'url';

export class Router {
  private routes: Route[] = [];

  get(path: string, handler: RouteHandler) {
    this.routes.push({ method: 'GET', path, handler });
  }

  post(path: string, handler: RouteHandler) {
    this.routes.push({ method: 'POST', path, handler });
  }

  put(path: string, handler: RouteHandler) {
    this.routes.push({ method: 'PUT', path, handler });
  }

  delete(path: string, handler: RouteHandler) {
    this.routes.push({ method: 'DELETE', path, handler });
  }

  findRoute(method: string, url: string): { route: Route; params: Record<string, string> } | null {
    const urlPath = new URL(url, 'http://localhost').pathname;

    for (const route of this.routes) {
      if (route.method !== method) continue;

      const params: Record<string, string> = {};
      const routeParts = route.path.split('/').filter((p) => p);
      const urlParts = urlPath.split('/').filter((p) => p);

      if (routeParts.length !== urlParts.length) continue;

      let matches = true;
      for (let i = 0; i < routeParts.length; i++) {
        if (routeParts[i].startsWith(':')) {
          const paramName = routeParts[i].slice(1);
          params[paramName] = urlParts[i];
        } else if (routeParts[i] !== urlParts[i]) {
          matches = false;
          break;
        }
      }

      if (matches) {
        return { route, params };
      }
    }

    return null;
  }

  getRoutes(): Route[] {
    return this.routes;
  }
}

