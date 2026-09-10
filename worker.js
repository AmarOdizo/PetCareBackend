import serverless from 'serverless-http';

let handler;

// Cloudflare Workers' Request objects are immutable (read-only properties).
// serverless-http tries to assign to request.body which throws.
// This Proxy wrapper intercepts writes and stores them in a separate map.
function wrapRequest(request) {
  const overrides = {};
  return new Proxy(request, {
    get(target, prop, receiver) {
      if (prop in overrides) return overrides[prop];
      const value = Reflect.get(target, prop, target);
      if (typeof value === 'function') return value.bind(target);
      return value;
    },
    set(target, prop, value) {
      overrides[prop] = value;
      return true;
    }
  });
}

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

      return await handler(wrapRequest(request), env, ctx);
    } catch (err) {
      return new Response(
        JSON.stringify({ success: false, error: err.message, stack: err.stack }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }
};
