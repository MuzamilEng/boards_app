import { createClient } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";

  const client = createClient({
    throttle: 16,
   publicApiKey: "pk_dev_dJFH98OBPgcmlvT_9y1yn7QZdV1JztcPRFIeFQtEwjzjR_7XwR_GjMtFTJfOU7Ua",
  });

export const {
   suspense : {
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
   }
} = createRoomContext(client);
