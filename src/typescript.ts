export const extractImports = (code: string) => {
  const importRegex = /import\s+(?:\*\s+as\s+.+?|{(.+?)}|.+?)\s+from\s+['"](.+?)['"]/g;
  const imports = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = importRegex.exec(code))) {
    imports.add(match[2]);
  }
  
  return Array.from(imports).filter((i) => !i.startsWith('.') && !i.startsWith('@/'));
}