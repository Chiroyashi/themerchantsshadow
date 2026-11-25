import test from 'node:test';
import assert from 'node:assert';
import { countNewMessages, getLatestTimestamp } from '../src/utils/chatUnread.js';

const messages = [
  { id: 'a', senderId: 'me', timestamp: 100 },
  { id: 'b', senderId: 'other', timestamp: 200 },
  { id: 'c', senderId: 'other', timestamp: 300 }
];

test('countNewMessages tidak menghitung pesan sendiri', () => {
  assert.strictEqual(countNewMessages(messages, 50, 'me'), 2);
  assert.strictEqual(countNewMessages(messages, 200, 'me'), 1);
});

test('getLatestTimestamp dipakai untuk majukan baca terakhir', () => {
  assert.strictEqual(getLatestTimestamp(messages), 300);
  assert.strictEqual(getLatestTimestamp([]), 0);
});
