const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'node_modules', 'iconv-lite', 'lib', 'index.js');
if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    // Comment out the problematic dynamic requires that esbuild resolves to empty objects
    content = content.replace('require("./streams")(iconv);', '/* require("./streams")(iconv); */');
    content = content.replace('require("./extend-node")(iconv);', '/* require("./extend-node")(iconv); */');
    fs.writeFileSync(file, content);
    console.log('Successfully patched iconv-lite for Cloudflare Workers.');
} else {
    console.log('iconv-lite not found, skipping patch.');
}
