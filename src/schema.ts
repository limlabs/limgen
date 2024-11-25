import z from "zod";

export type NullableCliOption = 'true' | 'false' | 'unknown';

export const cliBoolean = () => z.enum(['true', 'false', 'unknown'])
  .transform(
    (val) => 
      ['true', 'false'].includes(val)
      ? val
      : 'unknown');

export const cliInteger = () => z.string().refine((val) => {
  const parsed = parseInt(val);
  if (isNaN(parsed)) {
    return -1;
  }

  return parsed;
});

export const cliEnum = (options: any) => z.enum(options);