/**
 * Woobi - Backend Module
 * Router.js - HTTP REST Router with Parameter Extraction & Middleware Pipeline
 */

import { HTTP_STATUS } from './ApiContract.js';

export class Router {
  constructor() {
    this.routes = []; // { method, pattern, regex, paramNames, handler }
    this.middlewares = [];
  }

  use(fn) {
    this.middlewares.push(fn);
  }

  addRoute(method, pattern, handler) {
    const paramNames = [];
    const regexPattern = pattern
      .replace(/:([a-zA-Z0-9_]+)/g, (_, name) => {
        paramNames.push(name);
        return '([^/]+)';
      })
      .replace(/\//g, '\\/');

    const regex = new RegExp(`^${regexPattern}$`);
    this.routes.push({
      method: method.toUpperCase(),
      pattern,
      regex,
      paramNames,
      handler
    });
  }

  get(pattern, handler) { this.addRoute('GET', pattern, handler); }
  post(pattern, handler) { this.addRoute('POST', pattern, handler); }
  put(pattern, handler) { this.addRoute('PUT', pattern, handler); }
  delete(pattern, handler) { this.addRoute('DELETE', pattern, handler); }

  async parseBody(req) {
    return new Promise((resolve) => {
      if (req.body) return resolve(req.body);

      const chunks = [];
      let totalLength = 0;
      const MAX_BODY = 10 * 1024 * 1024; // 10MB limit

      req.on('data', (chunk) => {
        totalLength += chunk.length;
        if (totalLength > MAX_BODY) {
          req.destroy();
          return resolve(null);
        }
        chunks.push(chunk);
      });

      req.on('end', () => {
        const raw = Buffer.concat(chunks);
        const contentType = (req.headers && req.headers['content-type']) || '';

        if (contentType.includes('application/json')) {
          try {
            resolve(JSON.parse(raw.toString('utf8')));
          } catch {
            resolve(null);
          }
        } else if (contentType.includes('application/octet-stream') || contentType.startsWith('image/')) {
          resolve(raw);
        } else {
          // Plain text fallback or empty
          resolve(raw.length > 0 ? raw.toString('utf8') : {});
        }
      });

      req.on('error', () => resolve(null));
    });
  }

  sendJson(res, statusCode, payload) {
    if (res.headersSent) return;
    res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(payload));
  }

  async handle(req, res) {
    const parsedUrl = new URL(req.url, 'http://localhost');
    const pathname = parsedUrl.pathname;
    const method = req.method.toUpperCase();

    req.query = Object.fromEntries(parsedUrl.searchParams.entries());

    // Run global middlewares
    for (const mw of this.middlewares) {
      let nextCalled = false;
      await mw(req, res, () => { nextCalled = true; });
      if (!nextCalled || res.headersSent) return true;
    }

    // Match routes
    for (const route of this.routes) {
      if (route.method === method) {
        const match = pathname.match(route.regex);
        if (match) {
          req.params = {};
          route.paramNames.forEach((name, idx) => {
            req.params[name] = match[idx + 1];
          });

          if (['POST', 'PUT', 'PATCH'].includes(method) && !req.body) {
            req.body = await this.parseBody(req);
          }

          return route.handler(req, res);
        }
      }
    }

    // No route matched
    return false;
  }
}

export function createRouter() {
  return new Router();
}

export default Router;
