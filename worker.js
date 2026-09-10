import { httpServerHandler } from 'cloudflare:node';

let expressHandler;
let initialized = false;

export default {
  async fetch(request, env, ctx) {
    try {
      // Inject Cloudflare env vars into process.env (once)
      if (!initialized && env) {
        for (const [key, value] of Object.entries(env)) {
          if (typeof value === 'string') {
            process.env[key] = value;
          }
        }
        initialized = true;
      }

      // Lazy-load Express app and start listening (once)
      if (!expressHandler) {
        const app = require('./server');
        app.listen(8787);
        expressHandler = httpServerHandler({ port: 8787 });
      }

      return expressHandler.fetch(request, env, ctx);
    } catch (err) {
      return new Response(
        JSON.stringify({ success: false, error: err.message, stack: err.stack }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }
};
