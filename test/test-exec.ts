import { describe, test } from "node:test";
import assert from "node:assert";
import { execPromise } from "@/exec"

describe('exec', async () => {
  test('execPromise should return the output of a command', async () => {
    const { stdout } = await execPromise('echo "Hello, world!"');
    assert.strictEqual(stdout.trim(), 'Hello, world!');
  });

  test('execPromise should throw an error if the command fails', async () => {
    try {
      await execPromise('exit 1');
      assert.fail('Expected execPromise to throw an error');
    } catch (error: any) {
      assert.strictEqual(error.code, 1);
    }
  });
});