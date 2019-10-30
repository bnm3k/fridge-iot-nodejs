"use strict";
const tls = require("tls");
const path = require("path");
const fs = require("fs");
const multiplex = require("multiplex");
const chalk = require("chalk");
const { processFridgeEventsStream } = require("./utils/fridgeEvents");
const setupRpc = require("./utils/setupRpc");
const runCli = require("./utils/cli");

const { host, port, cmdOpts } = runCli(process.argv);
const certsPath = path.resolve(path.dirname(__filename), "../certs");
const connOpts = {
    host,
    port,
    ca: [fs.readFileSync(path.join(certsPath, "certificate.pem"))],
    rejectUnauthorized: true
};
const server = tls.connect(connOpts);
server.once("connect", () => {
    console.log(chalk.gray(`connected to server on port: ${port}`));
    onServerConn(server, cmdOpts);
});
server.on("close", () => console.log(chalk.gray("Server closed connection")));
server.on("error", err => {
    if (err.code === "ECONNREFUSED")
        console.error(
            chalk.red(`Cannot connect to server ${err.address}:${err.port}`)
        );
    else console.error(err);
});

function onServerConn(fridgeServer, cmdOpts) {
    const plex = multiplex((stream, id) => {
        if (id === "temp" || id === "door") {
            processFridgeEventsStream(stream);
        } else {
            console.error(chalk.red(`unrecognized stream: ${id}`));
        }
    });
    const rpcConn = plex.createSharedStream("rpc");
    plex.pipe(fridgeServer).pipe(plex);
    setupRpc(rpcConn, fridgeServer, cmdOpts);
}
