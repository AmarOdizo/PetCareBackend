const serverless = require('serverless-http');
const app = require('./server');

// Convert Express app to Cloudflare Worker fetch handler
const handler = serverless(app);

module.exports = {
  async fetch(request, env, ctx) {
    // Forward the request to the serverless-http handler
    return handler(request, env, ctx);
  }
};
