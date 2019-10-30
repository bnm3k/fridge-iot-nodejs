"use strict";
const net = require("net");
const reconnect = require("reconnect-net");
const multiplex = require("multiplex");
const chalk = require("chalk");
const { processFridgeEventsStream } = require("./utils/fridgeEvents");
const setupRpc = require("./utils/setupRpc");
const runCli = require("./utils/cli");

const { host, port, cmdOpts } = runCli(process.argv);
sendCmdToServer(host, port, cmdOpts);

function sendCmdToServer(host, port, cmdOpts) {
    if (cmdOpts.reconnect === true) {
        reconnect(conn => onServerConn(conn, cmdOpts))
            .on("reconnect", (n, d) => {
                console.log(`reconnect attempts n=${n} delay=${d}`);
            })
            .on("disconnect", err => {
                !err && console.log("disconect");
            })
            .on("error", err => {
                console.error(chalk.red("err: "), err);
                process.exit();
            })
            .connect(port, host);
    } else onServerConn(net.createConnection(port), cmdOpts);
}

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
