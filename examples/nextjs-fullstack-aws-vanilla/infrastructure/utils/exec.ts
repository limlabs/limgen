import { exec } from "node:child_process";
import util from "node:util";

export const execPromise = util.promisify(exec);