import fs from 'fs/promises';
import { fileExists } from './files';

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
    "include": ["components/**/*.ts", "projects/**/*.ts", "utils/**/*.ts"],
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

export const generateCoreWorkspaceFiles = async () => {
  await fs.mkdir('infrastructure/utils', { recursive: true });
  await fs.mkdir('infrastructure/components', { recursive: true });
  
  await fs.cp(`${__dirname}/utils`, 'infrastructure/utils', { recursive: true });
}

export const addGitignore = async () => {
  if (!(await fileExists('infrastructure/.gitignore'))) {
    return;
  }

  const gitignore = `
node_modules

`.trimStart();

  await fs.writeFile('infrastructure/.gitignore', gitignore);
}

export const renderWorkspace = async () => {
  await initWorkspace();
  await Promise.all([
    generateCoreWorkspaceFiles(),
    generateTSConfig(),
    generatePackageJSON(),
    addGitignore()
  ]);
}