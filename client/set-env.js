const fs = require('fs');

function parseEnv() {
  try {
    const envFile = fs.readFileSync('.env', 'utf-8');
    const envVars = {};
    envFile.split('\n').forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        envVars[match[1]] = match[2];
      }
    });
    return envVars;
  } catch (err) {
    console.warn('No .env file found in client directory, using defaults.');
    return { API_URL: 'http://localhost:3000/api' };
  }
}

const env = parseEnv();
const apiUrl = env.API_URL || 'http://localhost:3000/api';

const envConfigFile = `export const environment = {
  apiUrl: '${apiUrl}'
};
`;

const dir = './src/environments';
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}

fs.writeFileSync(`${dir}/environment.ts`, envConfigFile);
console.log(`Environment file generated correctly at ${dir}/environment.ts \n`);
