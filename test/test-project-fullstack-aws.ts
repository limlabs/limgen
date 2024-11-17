import test, { describe } from 'node:test';
import { fullstackAWSProject, FullstackAWSProjectOptions } from '@/projects/fullstack-aws';
import assert from 'node:assert';

describe('fullstackFargateTemplate', () => {
  test('should generate template without storage and db', async () => {
    const opts: FullstackAWSProjectOptions = {
      includeStorage: false,
      includeDb: false,
    };
    const template = await fullstackAWSProject(opts);
    assert(!template.includes('import { StorageS3 }'));
    assert(!template.includes('import { PostgresRdsClusterComponent }'));
    assert(!template.includes('const storage = new StorageS3;'));
    assert(!template.includes('const db = new PostgresRdsClusterComponent'));
    assert(!template.includes('mediaBucket: storage.mediaBucket,'));
    assert(!template.includes('connectionStringSecret: db.connectionStringSecret,'));
    assert(!template.includes('export const mediaBucket = storage.mediaBucket.bucket;'));
    assert(!template.includes('export const dbCluster = db.dbCluster.clusterIdentifier;'));
  });

  test('should generate template with storage', async () => {
    const opts: FullstackAWSProjectOptions = {
      includeStorage: true,
      includeDb: false,
      storageProvider: 's3',
    };
    const template = await fullstackAWSProject(opts);
    assert.ok(template.includes('import { StorageS3 }'));
    assert.ok(template.includes('const storage = new StorageS3;'));
    assert.ok(template.includes('const cdn = new CdnCloudFront'));
    assert.ok(template.includes('mediaBucket: storage.mediaBucket,'));
    assert.ok(template.includes('export const objectStorageBucket = storage.mediaBucket.bucket;'));
    assert.ok(!template.includes('import { PostgresRdsClusterComponent }'));
    assert.ok(!template.includes('const db = new PostgresRdsClusterComponent'));
    assert.ok(!template.includes('connectionStringSecret: db.connectionStringSecret,'));
    assert.ok(!template.includes('export const dbCluster = db.dbCluster.clusterIdentifier;'));
  });

  test('should generate template with db', async () => {
    const opts: FullstackAWSProjectOptions = {
      includeStorage: false,
      includeDb: true,
      dbProvider: 'postgres',
    };
    const template = await fullstackAWSProject(opts);
    assert.ok(template.includes('import { PostgresRdsCluster }'));
    assert.ok(template.includes('const db = new PostgresRdsCluster'));
    assert.ok(template.includes('connectionStringSecret: db.connectionStringSecret,'));
    assert.ok(template.includes('export const dbCluster = db.dbCluster.clusterIdentifier;'));
    assert.ok(!template.includes('import { StorageS3 }'));
    assert.ok(!template.includes('const storage = new StorageS3;'));
    assert.ok(!template.includes('mediaBucket: storage.mediaBucket,'));
    assert.ok(!template.includes('export const mediaBucket = storage.mediaBucket.bucket;'));
  });

  test('should generate template with storage and db', async () => {
    const opts: FullstackAWSProjectOptions = {
      includeStorage: true,
      includeDb: true,
      storageProvider: 's3',
      dbProvider: 'postgres',
    };
    const template = await fullstackAWSProject(opts);
    assert.ok(template.includes('import { StorageS3 }'));
    assert.ok(template.includes('const storage = new StorageS3;'));
    assert.ok(template.includes('mediaBucket: storage.mediaBucket,'));
    assert.ok(template.includes('export const objectStorageBucket = storage.mediaBucket.bucket;'));
    assert.ok(template.includes('import { PostgresRdsCluster }'));
    assert.ok(template.includes('const db = new PostgresRdsCluster'));
    assert.ok(template.includes('connectionStringSecret: db.connectionStringSecret,'));
    assert.ok(template.includes('export const dbCluster = db.dbCluster.clusterIdentifier;'));
  });
});