const rpc = require("rpc-stream");
const chalk = require("chalk");

function setupRpc(rpcConn, fridgeServer, { cmd, arg}) {
    const rpcClient = rpc();
    rpcClient.pipe(rpcConn).pipe(rpcClient);

    function getResponseHandler(closeOnComplete = true) {
        return (err, msg) => {
            if (closeOnComplete) fridgeServer.end();
            if (err) return console.error(chalk.red(err));
            else console.log(chalk.green(msg));
        };
    }
    const remote = rpcClient.wrap([
        "ping",
        "powerOn",
        "powerOff",
        "getDoorState",
        "getTemp",
        "setTargetTemp",
        "getFridgeState",
        "defrost"
    ]);
    switch (cmd) {
        case "ping":
            remote.ping(getResponseHandler());
            break;
        case "powerOn":
            remote.powerOn(getResponseHandler());
            break;
        case "powerOff":
            remote.powerOff(getResponseHandler());
            break;
        case "getDoorState":
            remote.getDoorState(getResponseHandler());
            break;
        case "getTemp":
            remote.getTemp(getResponseHandler());
            break;
        case "setTargetTemp":
            remote.setTargetTemp(arg, getResponseHandler());
            break;
        case "getFridgeState":
            remote.getFridgeState(getResponseHandler());
            break;
        case "defrost":
            remote.defrost(getResponseHandler());
            break;
        default:
            console.error("Invalid command");
    }

    return rpcClient;
}

module.exports = setupRpc;
