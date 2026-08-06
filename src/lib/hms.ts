import "server-only";
import { SDK as HMSSDK } from "@100mslive/server-sdk";

/**
 * Server-only 100ms helper. HMS_SECRET must never be imported from a
 * client component — the "server-only" import guard enforces this at build time.
 */

const HMS_ACCESS_KEY = process.env.HMS_ACCESS_KEY;
const HMS_SECRET = process.env.HMS_SECRET;
const HMS_TEMPLATE_ID = process.env.HMS_TEMPLATE_ID;

function assertEnv() {
  if (!HMS_ACCESS_KEY || !HMS_SECRET || !HMS_TEMPLATE_ID) {
    throw new Error(
      "Missing HMS_ACCESS_KEY, HMS_SECRET, or HMS_TEMPLATE_ID environment variables"
    );
  }
}

let hmsClient: HMSSDK | null = null;

function getHmsClient(): HMSSDK {
  assertEnv();
  if (!hmsClient) {
    hmsClient = new HMSSDK(HMS_ACCESS_KEY, HMS_SECRET);
  }
  return hmsClient;
}

/**
 * Creates a 100ms room using the configured template and returns its room ID.
 */
export async function createHmsRoom(name: string): Promise<string> {
  const hms = getHmsClient();
  const room = await hms.rooms.create({
    name,
    template_id: HMS_TEMPLATE_ID,
  });
  return room.id;
}

/**
 * Generates a fresh, short-lived client join token. Never cache or reuse this token.
 */
export async function generateHmsAuthToken({
  hmsRoomId,
  userId,
  role,
}: {
  hmsRoomId: string;
  userId: string;
  userName: string;
  role: string;
}): Promise<string> {
  const hms = getHmsClient();
  const { token } = await hms.auth.getAuthToken({
    roomId: hmsRoomId,
    userId,
    role,
  });
  return token;
}

/**
 * Ends the active 100ms room for everyone. `lock: false` leaves the room
 * enabled so a new CallSession can create/reuse a room for this chat later.
 */
export async function endHmsRoom(hmsRoomId: string): Promise<void> {
  const hms = getHmsClient();
  await hms.activeRooms.end(hmsRoomId, { reason: "Call ended", lock: false });
}
