import test from 'node:test';
import assert from 'node:assert';
import { eventKey, getSeenEvents, hasSeenEvent, markEventSeen } from '../src/utils/eventSeen.js';

const createStorage = () => {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value)
  };
};

test('eventKey memisahkan jenis event dengan timestamp yang sama', () => {
  assert.strictEqual(eventKey('dead', 123), 'dead:123');
  assert.notStrictEqual(eventKey('dead', 123), eventKey('vote', 123));
});

test('eventKey memisahkan payload berbeda dengan timestamp yang sama', () => {
  const first = eventKey('dead', { timestamp: 123, day: 1 });
  const second = eventKey('dead', { timestamp: 123, day: 2 });

  assert.notStrictEqual(first, second);
});

test('markEventSeen mencegah event yang sama diproses ulang', () => {
  const storage = createStorage();
  const key = eventKey('vote', 1000);

  assert.strictEqual(hasSeenEvent(storage, 'ROOM1', key), false);
  assert.strictEqual(markEventSeen(storage, 'ROOM1', key), true);
  assert.strictEqual(hasSeenEvent(storage, 'ROOM1', key), true);
  assert.strictEqual(markEventSeen(storage, 'ROOM1', key), false);
  assert.strictEqual(hasSeenEvent(storage, 'ROOM2', key), false);
});

test('seen events dibatasi agar localStorage tidak tumbuh terus', () => {
  const storage = createStorage();
  for (let i = 0; i < 205; i += 1) {
    markEventSeen(storage, 'ROOM1', eventKey('dead', i));
  }

  const seen = getSeenEvents(storage, 'ROOM1');
  assert.strictEqual(seen.length, 200);
  assert.strictEqual(hasSeenEvent(storage, 'ROOM1', eventKey('dead', 0)), false);
  assert.strictEqual(hasSeenEvent(storage, 'ROOM1', eventKey('dead', 204)), true);
});
