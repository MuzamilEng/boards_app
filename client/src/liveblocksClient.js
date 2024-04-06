// liveblocksClient.js
import { createClient } from "@liveblocks/client";

const getClient = (boardId) => {
  if (!boardId) {
    console.error("Board ID not available. Cannot create Liveblocks client.");
    return null; // Return null for genuine errors
  }

  const authEndpoint = `http://localhost:5000/api/liveblocks-auth?boardId=${boardId}`;
  const client = createClient({
    throttle: 16,
    authEndpoint,
  });
  return client;
};

export default getClient;