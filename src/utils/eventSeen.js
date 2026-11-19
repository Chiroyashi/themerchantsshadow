const MAX_SEEN_EVENTS = 200;

const storageKey = (roomCode) => `shadow_seen_events_${roomCode}`;

export const eventKey = (kind, timestamp) => `${kind}:${timestamp}`;

export const getSeenEvents = (storage, roomCode) => {
  try {
    const parsed = JSON.parse(storage.getItem(storageKey(roomCode)));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const hasSeenEvent = (storage, roomCode, key) => getSeenEvents(storage, roomCode).includes(key);

export const markEventSeen = (storage, roomCode, key) => {
  const seen = getSeenEvents(storage, roomCode);
  if (seen.includes(key)) return false;
  try {
    storage.setItem(storageKey(roomCode), JSON.stringify([...seen, key].slice(-MAX_SEEN_EVENTS)));
    return true;
  } catch {
    return false;
  }
};
