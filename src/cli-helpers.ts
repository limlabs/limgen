
export const parseProcessArgs = (args: string[] = process.argv.slice(2)): Record<string, string> => {
  const result: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    let [key, value] = args[i].split('=');
    if (!value && i + 1 < args.length && !args[i + 1].startsWith('-')) {
      value = args[++i];
    }
    if (key) {
      result[key.replace(/^--?/, '')] = value !== undefined ? value : 'true';
    }
  }
  return result;
};