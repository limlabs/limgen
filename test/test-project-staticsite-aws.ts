import { before, beforeEach, describe, test } from "node:test";
import assert from "node:assert";
import fs from "node:fs/promises";
import staticSiteAws, { dependsOn, inputs, collectInput } from "@/project-types/staticsite-aws/project";
import { fileExists } from "@/files";


describe('staticsite-aws', async () => {
  before(async () => {
    await fs.mkdir('test/output/staticsite-aws', { recursive: true });
    process.chdir('test/output/staticsite-aws');
  });

  beforeEach(async () => {
    if (await fileExists('package.json')) {
      await fs.rm('package.json', { force: true });
    }

    if (await fileExists('infrastructure')) {
      await fs.rm('infrastructure', { recursive: true, force: true });
    }

    await fs.mkdir('infrastructure/projects/foo-staticsite-aws', { recursive: true });
    await fs.writeFile('package.json', '{ "name": "test" }');
  });

  test('defines inputs', async () => {
    const defs = await inputs();
    assert.ok(defs.find((d: any) => d.name === 'outputDir'));
  });

  test('collects inputs', async () => {
    const collected = await collectInput({}, {});
    assert.ok(collected.outputDir);
  });

  test('depends on', async () => {
    const deps = dependsOn();
    assert.ok(deps.files);
    assert.ok(deps.packages);
  });

  test('renders the pulumi script', async () => {
    const result = await staticSiteAws({
      projectName: 'foo',
      projectType: 'staticsite-aws',
      outputDir: 'out'
    });

    assert.ok(result.includes('new aws.s3.BucketWebsiteConfigurationV2'));
    assert.ok(result.includes('new CdnCloudFront'));
    assert.ok(result.includes('export const bucketName'));
    assert.ok(result.includes('export const websiteUrl'));
  });

  // test('renders the deploy script with default outputDir', async () => {
  //   await staticSiteAws({
  //     projectName: 'foo',
  //     projectType: 'staticsite-aws',
  //     outputDir: 'out'
  //   });

  //   const result = await fs.readFile('infrastructure/scripts/deploy.sh', 'utf-8');
  //   assert.ok(result.includes('aws s3 sync ../../../out/'));
  // });

  // test('renders the deploy script with custom outputDir', async () => {
  //   await staticSiteAws({
  //     projectName: 'foo',
  //     projectType: 'staticsite-aws',
  //     outputDir: 'build'
  //   });

  //   const result = await fs.readFile('infrastructure/scripts/deploy.sh', 'utf-8');
  //   assert.ok(result.includes('aws s3 sync ../../../build/'));
  // });


  // test('updates the package.json with the deploy script', async () => {
  //   await staticSiteAws({
  //     projectName: 'foo',
  //     projectType: 'staticsite-aws',
  //     outputDir: 'out'
  //   });

  //   const packageJson = JSON.parse(await fs.readFile('package.json', 'utf-8'));
  //   assert.ok(packageJson.scripts['deploy-site']);
  // });
});