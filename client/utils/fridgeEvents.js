const split = require("split2");
const through = require("through2");
const pump = require("pump");

function processFridgeEventsStream(fridgeEventsStream) {
    pump(
        fridgeEventsStream,
        split(),
        through.obj(parseJSON),
        through.obj(getFridgeEventsHandler()),
        err => (err ? console.error(err) : console.log("OK"))
    );
}

function parseJSON(buf, _, next) {
    try {
        const obj = JSON.parse(buf);
        next(null, obj);
    } catch (err) {
        next(null, { err: true, payload: buf });
    }
}

const handleDoorEvent = (() => {
    let timeoutFn;
    let warned = false;
    let timeoutSecs = Number(process.argv[4]) || 1;
    const warn = () => {
        warned = true;
        console.error(
            "DOOR OPEN FOR MORE THAN %d SECONDS, GO CLOSE IT!!!",
            timeoutSecs
        );
    };
    return door => {
        switch (door.isOpen) {
            case true:
                timeoutFn = setTimeout(warn, timeoutSecs * 1e3);
                break;
            case false:
                timeoutFn && clearTimeout(timeoutFn);
                if (warned) {
                    console.log("closed now");
                    warned = false;
                }
                break;
            default:
                console.log("invalid door event: %j", door);
        }
    };
})();

const handleTemperatureEvent = (() => {
    const maxTemperature = 0;
    return ({ temp, units, ts }) => {
        if (temp > maxTemperature) {
            console.error("FRIDGE IS TOO HOT: %d %s", temp, units);
        }
    };
})();

function getFridgeEventsHandler() {
    return (event, _, next) => {
        switch (event.type) {
            case "door":
                handleDoorEvent(event);
                break;
            case "temperature":
                handleTemperatureEvent(event);
                break;
            default:
                console.log("invalid event: %j", event);
        }
        next();
    };
}

module.exports.processFridgeEventsStream = processFridgeEventsStream;
