export const countNewMessages = (messages, lastSeen, myId) => messages.filter(
  (message) => message.timestamp > lastSeen && message.senderId !== myId
).length;

export const getLatestTimestamp = (messages) => messages.reduce(
  (latest, message) => Math.max(latest, message.timestamp || 0),
  0
);
