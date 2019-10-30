const EventEmitter = require("events").EventEmitter;

const randomNum = (min, max) => Math.floor(Math.random() * (max - min) + min);

const fridgeState = {
    targetTemp: 10,
    powerState: "on",
    defrost: "off",
    isDoorOpen: false,
    currTemp: -10
};

const door = new EventEmitter();
const doorEventsListeners = {};
const ivDoor = setInterval(() => {
    fridgeState.isDoorOpen = !fridgeState.isDoorOpen; // flip state
    door.emit("change", {
        type: "door",
        ts: Date.now(),
        isOpen: fridgeState.isDoorOpen
    });
}, 3000);
door.on("change", event => {
    Object.values(doorEventsListeners).forEach(listener => {
        listener.write(JSON.stringify(event) + "\n");
    });
});

const thermometer = new EventEmitter();
const tempEventsListeners = {};
const ivTemp = setInterval(() => {
    fridgeState.currTemp = randomNum(-30, 10);
    const measurement = {
        type: "temperature",
        ts: Date.now(),
        temp: fridgeState.currTemp,
        units: "cs"
    };
    thermometer.emit("reading", measurement);
}, 1000);
thermometer.on("reading", reading => {
    Object.values(tempEventsListeners).forEach(listener => {
        listener.write(JSON.stringify(reading) + "\n");
    });
});

module.exports = {
    powerOn: () => (fridgeState.powerState = "on"),
    powerOff: () => (fridgeState.powerState = "off"),
    setTargetTemp: temp => (fridgeState.targetTemp = temp),
    getFridgeState: () => JSON.stringify(fridgeState, null, 4),
    toggleDefrost: () => {
        fridgeState.defrost = fridgeState.defrost === "on" ? "off" : "on";
        return fridgeState.defrost;
    },
    end: () => {
        clearInterval(ivDoor);
        clearInterval(ivTemp);
    },
    door: {
        addListener: (id, listener) => (doorEventsListeners[id] = listener),
        removeListener: id => delete doorEventsListeners[id]
    },
    thermometer: {
        addListener: (id, listener) => (tempEventsListeners[id] = listener),
        removeListener: id => delete tempEventsListeners[id]
    }
};
