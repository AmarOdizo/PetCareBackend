import serverless from 'serverless-http';

let handler;

export default {
  async fetch(request, env, ctx) {
    try {
      // Inject Cloudflare env bindings into process.env so that
      // Express code using process.env.X works as expected.
      if (env) {
        for (const [key, value] of Object.entries(env)) {
          if (typeof value === 'string') {
            process.env[key] = value;
          }
        }
      }

      // Lazy-load the Express app on the first request so that all
      // modules that read process.env at require-time (supabase, db,
      // imagekit, etc.) see the injected values.
      if (!handler) {
        const app = require('./server');
        handler = serverless(app);
      }

      return await handler(request, env, ctx);
    } catch (err) {
      return new Response(
        JSON.stringify({ success: false, error: err.message, stack: err.stack }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }
};
