const https = require('https');
const payload = JSON.stringify({ email: "test@test.com", password: "test" });
const options = {
  hostname: 'odizopetcare.onrender.com',
  port: 443,
  path: '/api/auth/login',
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
};
const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (c) => data += c);
  res.on('end', () => console.log("STATUS:", res.statusCode, "BODY:", data));
});
req.on('error', console.error);
req.write(payload);
req.end();
