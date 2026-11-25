import { ref, remove, get, query, orderByChild, endAt } from "firebase/database";
import { db, auth } from "../lib/firebase";
import { CLEANUP_DAYS, DAY_MS, canCleanupRoom } from "./roomSafety";

export { CLEANUP_DAYS };

export const cleanupOldRooms = async () => {
  try {
    const now = Date.now();
    const cutoff = now - CLEANUP_DAYS * DAY_MS;
    const roomsQuery = query(ref(db, "rooms"), orderByChild("createdAt"), endAt(cutoff));
    const snapshot = await get(roomsQuery);

    if (!snapshot.exists()) return 0;

    let deletedCount = 0;
    const uid = auth.currentUser?.uid;
    for (const [roomCode, roomData] of Object.entries(snapshot.val())) {
      if (canCleanupRoom(roomData, uid, now)) {
        await remove(ref(db, `rooms/${roomCode}`));
        deletedCount++;
        console.log(`[Cleanup] Deleted old room: ${roomCode}`);
      }
    }

    return deletedCount;
  } catch (error) {
    console.error("[Cleanup] Error:", error);
    return 0;
  }
};

export const deleteRoom = async (roomCode) => {
  await remove(ref(db, `rooms/${roomCode}`));
  console.log(`[Room] Deleted: ${roomCode}`);
  return true;
};
