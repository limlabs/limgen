import { describe, test } from "node:test";
import assert from "node:assert";
import { parseYaml } from "@/yaml";

describe('parseYaml', () => {
  test('should parse a yaml string', () => {
    const yaml = `
    name: my-project
    description: A pulumi project created with limgen
    runtime:
      name: nodejs
      options:
        packagemanager: pnpm`

    const result: any = parseYaml(yaml);
    assert.equal(result.name, 'my-project');
  });
});