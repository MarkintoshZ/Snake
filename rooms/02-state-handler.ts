import { Room } from "colyseus";
import { Schema, type, MapSchema, ArraySchema } from "@colyseus/schema";
import { number } from "@colyseus/schema/lib/encoding/decode";

var colors: string[] = ['red', 'green', 'blue', 'magenta'];

export class Block extends Schema {
    @type("number")
    x: number;

    @type("number")
    y: number;

    constructor(x?: number, y?: number) {
        super();
        this.x = x ? x : Math.floor(Math.random() * 50) + 1;
        this.y = y ? y : Math.floor(Math.random() * 35) + 1;
    }
}

export class Food extends Block {
    @type("number")
    reward: number

    constructor() {
        super();

        this.reward = Math.floor(Math.random() * 3) + 1;
    }
}

export class Foods extends Schema {
    static foodNumber: number = 5
    
    @type([Food])
    foods = new ArraySchema<Food>();

    constructor() {
        super();
        for (let i = 0; i < Foods.foodNumber; i++) {
            this.foods.push(new Food());
        }
    }
}

export class Player extends Schema {

    @type("boolean")
    alive = true;

    // 0 up 1 right 2 down 3 left
    @type("number")
    direction = 0;

    @type("string")
    color: string;

    @type([ Block ])
    body = new ArraySchema<Block>(new Block());

    @type("number")
    blocksReadyToAdd = 0;
    
    constructor() {
        super();

        let n = Math.floor(Math.random() * colors.length);
        this.color = colors[n];
        colors.splice(n, 1);
    }
}

export class State extends Schema {
    foodNumber = 5
    gridNumX = 50
    gridNumY = 35

    @type({ map: Player })
    players = new MapSchema<Player>();

    @type( Foods )
    foods = new Foods();

    createPlayer (id: string) {
        this.players[ id ] = new Player();
    }

    removePlayer (id: string) {
        colors.push(this.players[id].color);
        delete this.players[id];
    }

    readMsg (id: string, msg: any) {
        if (msg.direction !== null) {
            this.players[ id ].direction = msg.direction;
        }

        if (msg.restart !== null) {
            if (msg === true) {
                this.players[id].alive = true;
                this.players[id].body.splice(0)
                this.players[id].body.push(new Block());
            }
        }
    }

    update () {

        // move
        for (const key in this.players) {
            var player = this.players[key];

            if (!player.alive)
                continue;

            let block = player.body[player.body.length - 1];
            let head: Block;

            // Todo: set bound limit
            if (player.direction === 0) {
                if (block.y === 1) 
                    head = new Block(block.x, this.gridNumY);
                else
                    head = new Block(block.x, block.y - 1);
            } else if (player.direction === 1) {
                if (block.x === this.gridNumX)
                    head = new Block(1, block.y);
                else
                    head = new Block(block.x + 1, block.y);
            } else if (player.direction === 2) {
                if (block.y === this.gridNumY)
                    head = new Block(block.x, 1);
                else
                    head = new Block(block.x, block.y + 1);
            } else if (player.direction === 3) {
                if (block.x === 1)
                    head = new Block(this.gridNumX, block.y);
                else
                    head = new Block(block.x - 1, block.y);
            }
            
            player.body.push(head);

            if (player.blocksReadyToAdd === 0) {
                // delete player.body[0];
                player.body.shift();
            }
            else
                player.blocksReadyToAdd--;
        }

        // test collision between snakes
        for (const key in this.players) {
            var player = this.players[key];

            if (!player.alive)
                continue;
            
            const headPosBlock = player.body[player.body.length - 1];
            for (const k in this.players) {
                var p = this.players[k];
                p.body.forEach((b: Block, ind: number) => {
                    if (ind === p.body.length - 1)
                        return;

                    if (b.x === headPosBlock.x && b.y === headPosBlock.y)
                        // console.log("dead");
                        player.alive = false;
                });
            }
        }

        // test collision with food
        for (const key in this.players) {
            var player = this.players[key];

            // if (!player.alive)
            //     continue;
            
            const headPosBlock = player.body[player.body.length - 1];
            this.foods.foods.forEach(f => {
                if (f.x === headPosBlock.x && f.y === headPosBlock.y) {
                    player.blocksReadyToAdd += f.reward;

                    this.foods.foods.splice(this.foods.foods.indexOf(f), 1);
                    this.foods.foods.push(new Food());
                }
            });
        }
    }
}

export class StateHandlerRoom extends Room<State> {
    onInit (options) {
        console.log("StateHandlerRoom created!", options);

        this.setState(new State());
        this.setSimulationInterval((deltaTime) => this.update(deltaTime), 200);
    }

    onJoin (client) {
        this.state.createPlayer(client.sessionId);
    }

    onLeave (client) {
        this.state.removePlayer(client.sessionId);
    }

    onMessage (client, data) {
        // console.log("StateHandlerRoom received message from", client.sessionId, ":", data);
        this.state.readMsg(client.sessionId, data);
    }

    update (deltaTime) {
        this.state.update();
    }

    onDispose () {
        console.log("Dispose StateHandlerRoom");
    }

}