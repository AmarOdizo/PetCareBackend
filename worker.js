import serverless from 'serverless-http';
import app from './server';

// Convert Express app to Cloudflare Worker fetch handler
const handler = serverless(app);

export default {
  async fetch(request, env, ctx) {
    // Forward the request to the serverless-http handler
    return handler(request, env, ctx);
  }
};
