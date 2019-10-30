"use strict";
const net = require("net");
const reconnect = require("reconnect-net");
const multiplex = require("multiplex");
const chalk = require("chalk");
const { processFridgeEventsStream } = require("./utils/fridgeEvents");
const setupRpc = require("./utils/setupRpc");
const runCli = require("./utils/cli");

const { host, port, cmdOpts } = runCli(process.argv);
onServerConn(net.createConnection(port), cmdOpts);

function onServerConn(fridgeServer, cmdOpts) {
    console.log(chalk.gray("connected"));

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
