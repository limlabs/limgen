import test, { describe } from 'node:test';
import fullstackAWSProject, { FullstackAWSProjectOptions } from '@/projects/fullstack-aws';
import assert from 'node:assert';

describe('fullstackAWSProject', () => {
  test('should generate template without storage and db', async () => {
    const opts: FullstackAWSProjectOptions = {
      includeStorage: false,
      includeDb: false,
    };
    const template = await fullstackAWSProject(opts);
    assert(!template.includes('import { StorageS3 }'));
    assert(!template.includes('import { PostgresRdsCluster }'));
    assert(!template.includes('const storage = new StorageS3;'));
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
      dbProvider: 'postgres',
    };
    const template = await fullstackAWSProject(opts);
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
      storageProvider: 's3',
      dbProvider: 'postgres',
    };
    const template = await fullstackAWSProject(opts);
    assert.ok(template.includes('import { StorageS3 }'));
    assert.ok(template.includes('const storage = new StorageS3;'));
    assert.ok(template.includes('storage: storage.bucket,'));
    assert.ok(template.includes('export const objectStorageBucket = storage.bucket.bucket;'));
    assert.ok(template.includes('import { PostgresRdsCluster }'));
    assert.ok(template.includes('const db = new PostgresRdsCluster'));
    assert.ok(template.includes('connectionStringSecret: db.connectionStringSecret,'));
    assert.ok(template.includes('export const dbCluster = db.dbCluster.clusterIdentifier;'));
  });
});