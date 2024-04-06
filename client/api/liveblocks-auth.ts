const express = require("express");
import { Liveblocks } from "@liveblocks/node";

const app = express();
app.use(express.json());

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET!,
});

app.post("/api/liveblocks-auth", async (req, res) => {
  const session = liveblocks.prepareSession(
    `user-${Math.floor(Math.random() * 10)}`
  );
  session.allow(`liveblocks:examples:*`, session.FULL_ACCESS);

  const { status, body } = await session.authorize();
  console.log(body, "body");

  res.status(status).json(body); // Use res.json for cleaner JSON response
  res.end(); // Close the connection
});

