const http = require("http");
const websocketServer = require("websocket").server
const uuid = require("uuid");
const cors = require("cors");
require("dotenv").config();

const httpServer = http.createServer();
httpServer.listen(process.env.PORT || 8080, () => console.log('Server running...'))

const clients = {};
const games = {};

const wsServer = new websocketServer({
    "httpServer": httpServer
})

wsServer.on("request", request => {
    // connect
    const connection = request.accept(null, request.origin);
    connection.on("open", () => console.log("opened !!"))
    connection.on("close", () => console.log("closed !!"))
    connection.on("message", message => {
        //  I have recieved a message from the client
        const result = JSON.parse(message.utf8Data)

        //  user want to create a new game
        if(result.method === "create"){
            const gameId = uuid.v4()
            const gameName = result.gameName;
            games[gameId] = {
                "id" : gameId,
                "gameName": gameName,
                "clients": [],
                "scores": []
            }

            const payload = {
                "method": "create",
                "game": games[gameId]
            }

            const con = clients[clientId].connection;

            con.send(JSON.stringify(payload))
        }

        // client want to join
        if(result.method === "join"){
            const clientId = result.clientId;
            const clientName = result.clientName;
            const gameId = result.gameId;
            const game = games[gameId];

            game.clients.push({
                "clientId": clientId,
                "clientName": clientName
            })

            const payload = {
                "method": "join",
                "game": game
            }

            // loop through all clients and tell them that people have joined
            game.clients.forEach(c => {
                clients[c.clientId].connection.send(JSON.stringify(payload))
            })
        }

        // client submits a score
        if(result.method === "scoreSubmit"){
            const clientId = result.clientId;
            const clientName = result.clientName;
            const gameId = result.gameId;
            const score = result.score;
            const distance = result.distance
            const game = games[gameId];
            game.scores.push({
                "clientId": clientId,
                "clientName": clientName,
                "score": score,
                "distance": distance
            })

            const payload = {
                "method": "scoreSubmit",
                "game": game
            }

            game.clients.forEach(c => {
                clients[c.clientId].connection.send(JSON.stringify(payload))
            })
        }

        // client enters name
        if(result.method === "name"){
            const clientId = result.clientId;
            const clientName = result.clientName;
            clients[clientId] = { ...clients[clientId], clientName }

            const payload = {
                "method": "name",
                "clientName": clientName
            }

            clients[clientId].connection.send(JSON.stringify(payload))
        }
    })

    //  generate a new client-id
    const clientId = uuid.v4();
    clients[clientId] = {
        "connection": connection,
        "clientName": "Anonymous"
    }

    const payload = {
        "method": "connect",
        "clientId": clientId
    }

    // send back the client connect
    connection.send(JSON.stringify(payload))
})