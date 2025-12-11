import test from 'node:test';
import assert from 'node:assert';
import express from 'express';
import request from 'supertest';
import timelineRouter from '../src/routes/timeline.js';

process.env['NODE_ENV'] = 'development';

const authHeader = { Authorization: 'Bearer dev-token' };

test('timeline routes support CRUD, reorder, and buffer insert', async () => {
  const app = express();
  app.use(express.json());
  app.use('/timeline', timelineRouter);

  const start = new Date();
  const end = new Date(start.getTime() + 30 * 60000);

  const createRes = await request(app)
    .post('/timeline/blocks')
    .set(authHeader)
    .send({
      title: 'Test block',
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      type: 'task',
    });

  assert.strictEqual(createRes.status, 201);
  const blockId = createRes.body.block.id;
  assert.ok(blockId);

  const listRes = await request(app).get('/timeline/blocks').set(authHeader);
  assert.strictEqual(listRes.status, 200);
  assert.ok(listRes.body.blocks.some((b: any) => b.id === blockId));

  const reorderRes = await request(app)
    .post('/timeline/blocks/reorder')
    .set(authHeader)
    .send({ orderedIds: [blockId] });
  assert.strictEqual(reorderRes.status, 200);

  const bufferRes = await request(app)
    .post(`/timeline/blocks/${blockId}/buffer`)
    .set(authHeader)
    .send({ minutes: 5 });
  assert.strictEqual(bufferRes.status, 201);
  assert.ok(bufferRes.body.block.isBuffer);

  const deleteRes = await request(app).delete(`/timeline/blocks/${blockId}`).set(authHeader);
  assert.strictEqual(deleteRes.status, 200);
});
