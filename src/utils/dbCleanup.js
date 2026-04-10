import { ref, remove, get } from "firebase/database";
import { db } from "../lib/firebase";

export const CLEANUP_DAYS = 7;

export const cleanupOldRooms = async () => {
  try {
    const roomsRef = ref(db, "rooms");
    const snapshot = await get(roomsRef);
    
    if (!snapshot.exists()) return 0;

    const rooms = snapshot.val();
    const now = Date.now();
    const maxAge = CLEANUP_DAYS * 24 * 60 * 60 * 1000;
    let deletedCount = 0;

    for (const [roomCode, roomData] of Object.entries(rooms)) {
      const roomTime = roomData.createdAt || roomData.introStartedAt || 0;
      const isOld = (now - roomTime) > maxAge;
      const isEnded = roomData.status === "ended" || roomData.status === "destroyed";
      
      if (isOld && isEnded) {
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
  try {
    await remove(ref(db, `rooms/${roomCode}`));
    console.log(`[Room] Deleted: ${roomCode}`);
    return true;
  } catch (error) {
    console.error("[Room] Delete error:", error);
    return false;
  }
};
