const fs = require('fs');
let env = fs.readFileSync('.env.development', 'utf8');
env = env.replace('6543', '5432');
fs.writeFileSync('.env.development', env);
console.log('Modified .env.development port to 5432');
