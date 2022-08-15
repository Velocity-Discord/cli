#! /usr/bin/env node

const readline = require("readline");
const WebSocket = require("ws");
const crypto = require("crypto");

const randomHash = () => {
    return crypto.createHash("sha512").update(crypto.randomBytes(30).toString()).digest("hex").substring(0, 12);
};

let socket;

try {
    socket = new WebSocket("ws://localhost:1742");
} catch (e) {
    console.log("Could not connect to server. Is it running?");
    process.exit(1);
}

let clients = [];

socket.on("open", () => {
    socket.send("velocity:getData");
});

socket.on("message", (message) => {
    const msg = message.toString("utf-8");
    if (msg.startsWith("velocity:data")) {
        const data = JSON.parse(msg.substring(13));
        data.hash = randomHash();
        clients.push(data);
        getInput();
    }
    getInput();
});

const package = require("../package.json");

console.log("\x1b[1;94mVelocity CLI \x1b[0m");
console.log(`Setting up cli@${package.version}`);
console.log("run \x1b[1mhelp\x1b[0m for more information");

const logResult = (message, newline) => {
    console.log(message);
    if (newline) console.log("");
};

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

const getInput = async () => {
    rl.question("> ", (input) => {
        switch (input) {
            case "help":
                logResult("");
                logResult("Usage:", true);
                logResult("    help - shows this menu");
                logResult("    reload - reloads all connected velocity clients");
                logResult("    relaunch - relaunches all connected velocity clients");
                logResult("    reconnect - refetches data from all active velocity clients");
                logResult("    clients - lists all connected clients");
                logResult("");
                logResult(`cli@${package.version}`);
                getInput();
                break;
            case "reload":
                logResult("reloading all connected discord clients");
                socket.send("velocity:reload");
                getInput();
                break;
            case "reconnect":
                logResult("fetching new data from velocity clients");
                try {
                    socket = new WebSocket("ws://localhost:1742");
                } catch (e) {
                    console.log("Could not connect to server. Is it running?");
                    process.exit(1);
                }
                clients = [];
                socket.on("open", () => {
                    socket.send("velocity:getData");
                });
                socket.on("message", (message) => {
                    const msg = message.toString("utf-8");
                    if (msg.startsWith("velocity:data")) {
                        const data = JSON.parse(msg.substring(13));
                        data.hash = randomHash();
                        clients.push(data);
                    }
                });
                getInput();
                break;
            case "relaunch":
                logResult("relaunching all connected discord clients");
                socket.send("velocity:relaunch");
                getInput();
                break;
            case "clients":
                logResult("");
                if (clients.length) {
                    logResult("connected clients:", true);
                    for (let client of clients) {
                        logResult(`    ${client.Discord} - ${client.hash}`);
                    }
                    logResult("");
                } else {
                    logResult("no clients connected");
                }
                getInput();
                break;
            default:
                logResult(`\x1b[31mcould not find command '${input}'\x1b[0m`);
                getInput();
                break;
        }
    });
};

getInput();
