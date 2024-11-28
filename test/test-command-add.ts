
import fs from 'fs/promises';
import { before, beforeEach, describe, it } from "node:test";
import assert from "node:assert";
import { add as command } from "@/commands/add";

describe('add command', async () => {
  // @ts-ignore
  process.exit = () => { };

  it('should have the correct name and description', () => {
    assert.strictEqual(command.name(), 'add');
    assert.strictEqual(command.description(), 'Add a new component to the workspace');
  });

  it('should exit with error if no component name is provided', async () => {
    let thrown = false;
    try {
      await command.parseAsync(['node', 'add']);
    } catch (error) {
      thrown = true;
    }

    assert.ok(thrown);
  });

  it('should exit with error if component does not exist', async () => {
    let thrown = false;
    try {
      await command.parseAsync(['node', 'add', 'nonExistentComponent']);
    } catch (error) {
      thrown = true;
    }

    assert.ok(thrown);
  });

  it('should add the component if it exists', async () => {
    try {
      await fs.rmdir('test/output/test-command-add', { recursive: true });
    } catch {
      // ignore
    }
    
    await fs.mkdir('test/output/test-command-add/infrastructure', { recursive: true });
    await fs.writeFile('test/output/test-command-add/infrastructure/package.json', JSON.stringify({ name: 'test' }));

    let error = null;
    try {
      await command.parseAsync(['node', 'add', 'storage-s3', '--directory', 'test/output/test-command-add']);
    } catch (err) {
      error = err;
    }

    assert.equal(error, null);
    await assert.doesNotReject(() =>
      fs.access('infrastructure/components/storage-s3.ts')
    );

    const packageJson = JSON.parse(await fs.readFile('infrastructure/package.json', 'utf8'));
    assert.ok(packageJson.dependencies['@pulumi/pulumi']);
    assert.ok(packageJson.dependencies['@pulumi/aws']);
  });
});