import { z } from "zod";

export type NullableCliOption = 'true' | 'false' | 'unknown';

export const cliBoolean = () => z.enum(['true', 'false', 'unknown'])
  .transform(
    (val) => 
      ['true', 'false'].includes(val)
      ? val
      : 'unknown');