import path from 'path';
import express from 'express';
import serveIndex from 'serve-index';
import { createServer } from 'http';
import { Server } from 'colyseus';
import { monitor } from '@colyseus/monitor';

// Import room handlers
import { StateHandlerRoom } from "./rooms/02-state-handler";

const port = Number(process.env.PORT || 8080);
const app = express();

// Attach WebSocket Server on HTTP Server.
const gameServer = new Server({
  server: createServer(app)
});

// Register StateHandlerRoom as "state_handler"
gameServer.register("snake_server", StateHandlerRoom);

app.use('/', express.static(path.join(__dirname, "static")));
app.use('/', serveIndex(path.join(__dirname, "static"), {'icons': true}))

// (optional) attach web monitoring panel
app.use('/colyseus', monitor(gameServer));

gameServer.onShutdown(function(){
  console.log(`game server is going down.`);
});

gameServer.listen(port, '0.0.0.0');

// process.on("uncaughtException", (e) => {
//   console.log(e.stack);
//   process.exit(1);
// });

console.log(`Listening on http://localhost:${ port }`);
