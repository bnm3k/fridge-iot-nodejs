const pkg = require("../../package.json");
const program = require("commander");
const chalk = require("chalk");

module.exports = args => {
    let cmdOpts;
    program
        .version(pkg.version)
        .description(pkg.description)
        .option("-H, --HOST [host]", "fridge server host", "localhost")
        .option(
            "-P, --PORT [port]",
            "fridge server port",
            p => Number(p),
            8000
        );

    program
        .command("ping")
        .description(
            "connects to fridge server and sends ping, expects 'pong' reply"
        )
        .action(({ _name: cmd }) => (cmdOpts = { cmd }));

    program
        .command("powerOn")
        .description("connects to fridge server and sets its power to 'on'")
        .action(({ _name: cmd }) => (cmdOpts = { cmd }));

    program
        .command("powerOff")
        .description("connects to fridge server and sets its power to 'off'")
        .action(({ _name: cmd }) => (cmdOpts = { cmd }));

    program
        .command("getTemp")
        .description(
            "connects to fridge server and receives streams with regards to the fridge's temperature warnings if above threshold"
        )
        .action(({ _name: cmd }) => (cmdOpts = { cmd }));

    program
        .command("getFridgeState")
        .description(
            "connects to fridge server and sends request for current fridge state"
        )
        .action(({ _name: cmd }) => (cmdOpts = { cmd }));

    program
        .command("setTargetTemp <temp>")
        .description(
            "connects to fridge server and sets threshold temperature above which warnings are sent"
        )
        .action((temp, { _name: cmd }) => {
            let arg = Number(temp);
            if (Number.isNaN(arg))
                console.error(
                    chalk.red("Invalid <temp> argument, provide valid number")
                );
            else cmdOpts = { cmd, arg };
        });

    program
        .command("getDoorState")
        .description(
            "connects to fridge server and receives streams on its door state, ie when it's openned or closed"
        )
        .action(({ _name: cmd }) => (cmdOpts = { cmd }));

    program
        .command("defrost")
        .description("connects to fridge server and sets it to defrost")
        .action(({ _name: cmd }) => (cmdOpts = { cmd }));

    program.parse(args);
    if (!program.args.filter(arg => typeof arg === "object").length) {
        program.help();
    }
    return { host: program.HOST, port: program.PORT, cmdOpts };
};
