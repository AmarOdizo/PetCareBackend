const fs = require('fs');
const path = require('path');

const iconvFile = path.join(__dirname, 'node_modules', 'iconv-lite', 'lib', 'index.js');
if (fs.existsSync(iconvFile)) {
    let content = fs.readFileSync(iconvFile, 'utf8');
    content = content.replace('require("./streams")(iconv);', '/* require("./streams")(iconv); */');
    content = content.replace('require("./extend-node")(iconv);', '/* require("./extend-node")(iconv); */');
    fs.writeFileSync(iconvFile, content);
    console.log('Successfully patched iconv-lite for Cloudflare Workers.');
}

const mongoosePkg = path.join(__dirname, 'node_modules', 'mongoose', 'package.json');
if (fs.existsSync(mongoosePkg)) {
    let pkg = JSON.parse(fs.readFileSync(mongoosePkg, 'utf8'));
    if (pkg.browser) {
        delete pkg.browser;
        fs.writeFileSync(mongoosePkg, JSON.stringify(pkg, null, 2));
        console.log('Successfully patched mongoose for Cloudflare Workers (removed browser field).');
    }
}
