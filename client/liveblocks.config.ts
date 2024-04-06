import { createClient } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";

const storedBoardId = localStorage.getItem("boardId") || "6703bf37803f93318e31dbc9";
 var client;
if (storedBoardId) {
   client = createClient({
    throttle: 16,
    authEndpoint: `http://localhost:5000/api/liveblocks-auth?boardId=${storedBoardId}`,
  });// Presence, Storage, and other types...
  localStorage.removeItem("boardId");
}


export const {
  suspense: {
    RoomProvider,
    useCanRedo,
    useCanUndo,
    useHistory,
    useMutation,
    useOthers,
    useOthersMapped,
    useOthersConnectionIds,
    useOther,
    useRoom,
    useSelf,
    useStorage,
    useUpdateMyPresence,
  },
} = createRoomContext(client);
