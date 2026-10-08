import { MongoMemoryServer } from 'mongodb-memory-server';

let mongo;

export async function setup({ provide }) {
  mongo = await MongoMemoryServer.create();
  provide('mongoUri', mongo.getUri('smartbudget-test'));
}

export async function teardown() {
  await mongo?.stop();
}
