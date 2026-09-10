import { httpServerHandler } from 'cloudflare:node';

let handlerPromise = null;

async function getHandler() {
  if (!handlerPromise) {
    handlerPromise = (async () => {
      // Initialize DB before starting Express
      const connectDB = require('./config/db');
      await connectDB();

      const app = require('./server');

      // Cleanly close internal socket after each request to prevent stale sockets across isolate pauses
      app.use((req, res, next) => {
        res.setHeader('Connection', 'close');
        next();
      });

      // Start listening on port 0 so server.address() is initialized
      const server = app.listen(0);

      // Suppress unhandled socket errors to prevent Worker crashes
      server.on('error', (err) => {
        console.warn('Express server error caught:', err && err.message);
      });
      server.on('clientError', (err, socket) => {
        console.warn('Express client error caught:', err && err.message);
        if (socket && !socket.destroyed) {
          socket.destroy();
        }
      });

      return httpServerHandler(server);
    })().catch((err) => {
      handlerPromise = null; // Allow retry if initial boot failed
      throw err;
    });
  }
  return handlerPromise;
}

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

      const handler = await getHandler();

      // Ensure MongoDB is connected
      const connectDB = require('./config/db');
      if (!connectDB.getStatus()) {
        await connectDB();
      }

      return await handler.fetch(request, env, ctx);
    } catch (err) {
      return new Response(
        JSON.stringify({ success: false, error: err.message, stack: err.stack }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }
};
