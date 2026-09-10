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

      // Lazy-load Express app and initialize httpServerHandler
      if (!expressHandler) {
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

        expressHandler = httpServerHandler(server);
      }

      return await expressHandler.fetch(request, env, ctx);
    } catch (err) {
      return new Response(
        JSON.stringify({ success: false, error: err.message, stack: err.stack }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }
};
