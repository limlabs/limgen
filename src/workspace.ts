import fs from 'fs/promises';

export const initWorkspace = async () => {
  await fs.mkdir('infrastructure', { recursive: true });
}

export const generateTSConfig = async () => {
  const tsconfig = JSON.stringify({
    "compilerOptions": {
      "baseUrl": ".",
      "target": "ES6",
      "module": "commonjs",
      "strict": false,
      "esModuleInterop": true,
      "skipLibCheck": true,
      "forceConsistentCasingInFileNames": true
    },
    "include": ["index.ts", "components/**/*.ts", "utils/**/*.ts"],
    "exclude": ["node_modules", "dist"]
  }, null, 2)

  await fs.writeFile('infrastructure/tsconfig.json', tsconfig);
}

export const generatePackageJSON = async () => {
  await fs.writeFile('infrastructure/package.json', JSON.stringify({ 
    name: `infrastructure`, 
    version: '1.0.0'
  }, null, 2));
}