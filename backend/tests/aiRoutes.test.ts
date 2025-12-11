import assert from 'node:assert/strict';
import test from 'node:test';
import { projectMatchSchema, parseJsonFromText } from '../src/routes/ai';

test('projectMatchSchema validates minimal payload', () => {
  const parsed = projectMatchSchema.parse({
    body: {
      taskTitle: 'Write progress update',
      projects: [
        { id: 'work', name: 'Work' },
        { id: 'home', name: 'Home' },
      ],
    },
  });

  assert.equal(parsed.body.taskTitle, 'Write progress update');
  assert.equal(parsed.body.projects.length, 2);
});

test('parseJsonFromText extracts JSON when present', () => {
  const sample = `
Here is your data:
{ "foo": "bar", "count": 3 }
Thanks!`;

  const parsed = parseJsonFromText(sample, { foo: 'fallback' });
  assert.deepEqual(parsed, { foo: 'bar', count: 3 });
});

test('parseJsonFromText returns fallback for malformed data', () => {
  const fallback = { ok: true };
  const parsed = parseJsonFromText('No JSON here', fallback);
  assert.equal(parsed, fallback);
});
