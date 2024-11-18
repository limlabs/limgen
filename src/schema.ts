import { z } from "zod";

export const cliBoolean = () => z.enum(['true', 'false', 'unknown'])
  .transform((val) => val !== 'unknown' 
    ? `${val === 'true'}` 
    : 'unknown');