import test, { beforeEach, describe } from 'node:test';
import fullstackAwsProject, { FullstackAWSProjectOptions, renderIndex, collectInput, dependsOn, inputs } from '@/project-types/fullstack-aws/project';
import fs from 'node:fs/promises';
import assert from 'node:assert';
import { fileExists } from '@/files';

describe('fullstackAWSProject', async () => {
  await fs.mkdir('test/output/fullstack-aws', { recursive: true });
  process.chdir('test/output/fullstack-aws');

  beforeEach(async () => {
    if (await fileExists('infrastructure')) {
      await fs.rm('infrastructure', { recursive: true, force: true });
    }

    await fs.mkdir('infrastructure/projects/foo-fullstack-aws', { recursive: true });
    await fs.writeFile('package.json', '{ "name": "test" }');
  });

  test('should define inputs', async () => {
    const defs = await inputs();
    assert.ok(defs.find((d: any) => d.name === 'includeStorage'));
    assert.ok(defs.find((d: any) => d.name === 'includeDb'));
    assert.ok(defs.find((d: any) => d.name === 'networkType'));
    assert.ok(defs.find((d: any) => d.name === 'storageAccess'));
    assert.ok(defs.find((d: any) => d.name === 'port'));
  });

  test('should collect inputs', async () => {
    const collected = await collectInput({
      directory: 'test/output/fullstack-aws',
    }, {});
    assert.equal(collected.includeStorage, false);
    assert.equal(collected.includeDb, false);
    assert.equal(collected.networkType, undefined);
    assert.equal(collected.storageAccess, undefined);
    assert.equal(collected.port, undefined);
  });

  test('dependsOn should depend on', async () => {
    const deps = await dependsOn({
      projectName: '',
      projectType: 'fullstack-aws',
      includeStorage: false,
      includeDb: false,
      networkType: 'public',
      storageAccess: 'unknown',
      port: ''
    });

    assert.ok(deps.files);
    assert.ok(deps.packages);
  });

  test('dependsOn should depend on extra files when includeStorage is true', async () => {
    const deps = await dependsOn({
      projectName: '',
      projectType: 'fullstack-aws',
      includeStorage: true,
      includeDb: false,
      networkType: 'public',
      storageAccess: 'unknown',
      port: ''
    });

    assert.ok(deps.files.includes('components/storage-s3.ts'));
  });

  test('dependsOn should depend on extra files when includeDb is true', async () => {
    const deps = await dependsOn({
      projectName: '',
      projectType: 'fullstack-aws',
      includeStorage: false,
      includeDb: true,
      networkType: 'public',
      storageAccess: 'unknown',
      port: ''
    });

    assert.ok(deps.files.includes('components/db-postgres-rds.ts'));
    assert.ok(deps.packages.includes('@pulumi/random'));
  });

  test('dependsOn includes bastion when networkType is private', async () => {
    const deps = await dependsOn({
      projectName: '',
      projectType: 'fullstack-aws',
      includeStorage: false,
      includeDb: false,
      networkType: 'private',
      storageAccess: 'unknown',
      port: ''
    });

    assert.ok(deps.files.includes('components/bastion-ec2.ts'));
  });
  
  test('should generate template without storage and db', async () => {
    const opts: FullstackAWSProjectOptions = {
      includeStorage: false,
      includeDb: false,
      port: 'unknown',
      networkType: 'public',
      projectName: 'testProject',
      projectType: 'fullstack-aws',
      storageAccess: 'unknown',
    };
    const template = await fullstackAwsProject(opts);
    assert(!template.includes('import { StorageS3 }'));
    assert(!template.includes('import { PostgresRdsCluster }'));
    assert(!template.includes('const storage = new StorageS3;'));
  });

  test('should generate template with storage', async () => {
    const opts: FullstackAWSProjectOptions = {
      includeStorage: true,
      includeDb: false,
      port: 'unknown',
      networkType: 'public',
      projectName: 'testProject',
      projectType: 'fullstack-aws',
      storageAccess: 'unknown',
    };
    const template = await fullstackAwsProject(opts);
    assert.ok(template.includes('import { StorageS3 }'));
    assert.ok(template.includes('const storage = new StorageS3;'));
    assert.ok(template.includes('const cdn = new CdnCloudFront'));
    assert.ok(template.includes('storage: storage.bucket,'));
    assert.ok(template.includes('export const objectStorageBucket = storage.bucket.bucket;'));
    assert.ok(!template.includes('import { PostgresRdsCluster }'));
    assert.ok(!template.includes('connectionStringSecret: db.connectionStringSecret,'));
    assert.ok(!template.includes('export const dbCluster = db.dbCluster.clusterIdentifier;'));
  });

  test('should generate template with db', async () => {
    const opts: FullstackAWSProjectOptions = {
      includeStorage: false,
      includeDb: true,
      port: 'unknown',
      networkType: 'public',
      projectName: 'testProject',
      projectType: 'fullstack-aws',
      storageAccess: 'unknown',
    };
    const template = await fullstackAwsProject(opts);
    assert.ok(template.includes('import { PostgresRdsCluster }'));
    assert.ok(template.includes('const db = new PostgresRdsCluster'));
    assert.ok(template.includes('connectionStringSecret: db.connectionStringSecret,'));
    assert.ok(template.includes('export const dbCluster = db.dbCluster.clusterIdentifier;'));
    assert.ok(!template.includes('import { StorageS3 }'));
    assert.ok(!template.includes('const storage = new StorageS3;'));
    assert.ok(!template.includes('storage: storage.bucket,'));
    assert.ok(!template.includes('export const objectStorageBucket = storage.bucket.bucket;'));
  });

  test('should generate template with storage and db', async () => {
    const opts: FullstackAWSProjectOptions = {
      includeStorage: true,
      includeDb: true,
      port: 'unknown',
      networkType: 'public',
      projectName: 'testProject',
      projectType: 'fullstack-aws',
      storageAccess: 'unknown',
    };
    const template = await fullstackAwsProject(opts);
    assert.ok(template.includes('import { StorageS3 }'));
    assert.ok(template.includes('const storage = new StorageS3;'));
    assert.ok(template.includes('storage: storage.bucket,'));
    assert.ok(template.includes('export const objectStorageBucket = storage.bucket.bucket;'));
    assert.ok(template.includes('import { PostgresRdsCluster }'));
    assert.ok(template.includes('const db = new PostgresRdsCluster'));
    assert.ok(template.includes('connectionStringSecret: db.connectionStringSecret,'));
    assert.ok(template.includes('export const dbCluster = db.dbCluster.clusterIdentifier;'));
  });

  test('should generate template with port', async () => {
    const opts: FullstackAWSProjectOptions = {
      includeStorage: false,
      includeDb: false,
      port: '8080',
      networkType: 'public',
      projectName: 'testProject',
      projectType: 'fullstack-aws',
      storageAccess: 'unknown',
    };
    const template = await fullstackAwsProject(opts);
    assert.ok(template.includes('8080'));
  });

  test('should generate template with private network and bastion', async () => {
    const opts: FullstackAWSProjectOptions = {
      includeStorage: false,
      includeDb: true,
      port: 'unknown',
      networkType: 'private',
      projectName: 'testProject',
      projectType: 'fullstack-aws',
      storageAccess: 'unknown',
    };
    const template = await fullstackAwsProject(opts);
    assert.ok(template.includes('import { BastionEc2 }'));
    assert.ok(template.includes('const bastion = new BastionEc2'));
    assert.ok(template.includes('export const bastionInstanceId'));
  });

  test('should generate template with public network and no bastion', async () => {
    const opts: FullstackAWSProjectOptions = {
      includeStorage: false,
      includeDb: false,
      port: 'unknown',
      networkType: 'public',
      projectName: 'testProject',
      projectType: 'fullstack-aws',
      storageAccess: 'unknown',
    };
    const template = await fullstackAwsProject(opts);
    assert.ok(!template.includes('import { BastionEc2 }'));
    assert.ok(!template.includes('const bastion = new BastionEc2'));
    assert.ok(!template.includes('export const bastionInstanceId'));
  });

  
});