const net = require("net");
const fridge = require("./fridge");
const Rpc = require("rpc-stream");
const multiplex = require("multiplex");
const fs = require("fs");
const path = require("path");
const tls = require("tls");

const certsPath = path.join(path.resolve(".."), "certs");
const serverOpts = {
    key: fs.readFileSync(path.join(certsPath, "key.pem")),
    cert: fs.readFileSync(path.join(certsPath, "certificate.pem"))
};
const server = tls.createServer(serverOpts);
server.on("secureConnection", handleConnection);
server.on("close", () => console.log("Server is now closed"));
server.on("error", err => console.error(err));
server.listen(8000);

function setupRpc(clientConn, remoteAddress) {
    const plex = multiplex();
    const rpc = Rpc({
        ping: cb => {
            cb(null, "pong");
        },
        powerOn: cb => {
            fridge.powerOn();
            cb(null, "OK power:on");
        },
        powerOff: cb => {
            fridge.powerOff();
            cb(null, "OK power:off");
        },
        getDoorState: cb => {
            const doorStream = plex.createStream("door");
            fridge.door.addListener(remoteAddress, doorStream);
            cb(null, `OK stream:door`);
        },
        getTemp: cb => {
            const tempStream = plex.createStream("temp");
            fridge.thermometer.addListener(remoteAddress, tempStream);
            cb(null, `OK stream:temp`);
        },
        setTargetTemp: (temp, cb) => {
            fridge.setTargetTemp(temp);
            cb(null, `OK setTargetTemp: ${temp}`);
        },
        getFridgeState: cb => {
            const fridgeState = fridge.getFridgeState();
            cb(null, `OK fridgeState:\n${fridgeState}`);
        },
        defrost: cb => {
            const defrost = fridge.toggleDefrost();
            cb(null, `OK defrost: ${defrost}`);
        }
    });

    clientConn.pipe(plex).pipe(clientConn);
    rpc.pipe(plex.createSharedStream("rpc")).pipe(rpc);

    const handleClose = () => {
        fridge.door.removeListener(remoteAddress);
        fridge.thermometer.removeListener(remoteAddress);
    };
    return handleClose;
}

function handleConnection(clientConn) {
    const remoteAddress =
        clientConn.remoteAddress + ":" + clientConn.remotePort;
    const handleClose = setupRpc(clientConn);
    console.log("new client connection from %s", remoteAddress);

    clientConn.once("close", () => {
        console.log("connection from %s closed", remoteAddress);
        handleClose();
    });
    clientConn.on("error", err =>
        console.log("Connection %s error: %s", remoteAddress, err.message)
    );
}
