import ora, { Options as OraOptions } from "ora";

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

export const spinnerStyle: OraOptions = {
  color: 'magenta',
};

export const spinner = (text: string, style: OraOptions = spinnerStyle) => {
  return ora({ text, ...style });
}

export const ColorCodes = {
  black: 30, red: 31, green: 32, yellow: 33, blue: 34, magenta: 35, cyan: 36, white: 37,
  bgBlack: 40, bgRed: 41, bgGreen: 42, bgYellow: 43, bgBlue: 44, bgMagenta: 45, bgCyan: 46, bgWhite: 47
} as const;

export type CliColor = keyof typeof ColorCodes;

export const colorize = (color: CliColor, text: string) => {
  const code = ColorCodes[color];
  if (code === undefined) {
    throw new Error(`Unknown color: ${color}`);
  }

  return `\x1b[${code}m${text}\x1b[0m`;
};

export const bold = (text: string) => {
  return `\x1b[1m${text}\x1b[0m`;
}
  