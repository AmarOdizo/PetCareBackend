import http from 'node:http';
import { httpServerHandler } from 'cloudflare:node';

let expressHandler;

export default {
  async fetch(request, env, ctx) {
    try {
      // Inject Cloudflare env vars into process.env on each request if present
      if (env) {
        for (const [key, value] of Object.entries(env)) {
          if (typeof value === 'string') {
            process.env[key] = value;
          }
        }
      }

      // Ensure MongoDB connection is ready
      const connectDB = require('./config/db');
      await connectDB();

      // Lazy-load Express app, create Node.js http.Server instance and pass to httpServerHandler
      if (!expressHandler) {
        const app = require('./server');
        const server = http.createServer(app);
        expressHandler = httpServerHandler(server);
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
