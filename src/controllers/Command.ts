import Bravia from "./Bravia";

interface ICommand {
    regex: RegExp;
    braviaCommand: string;
}

export class Command {
    private commandsList: ICommand[];
    private clientBravia: Bravia;

    constructor(clientBravia: Bravia) {
        this.clientBravia = clientBravia;
        this.commandsList = [
            {
                regex: new RegExp(/accendi tv/g),
                braviaCommand: "WakeUp"
            },
            /* {
                name: "spegni tv",
                regex: new RegExp(/spegni tv/g),
                braviaCommand: "PowerOff"
            }, */
            {
                regex: new RegExp(/spegni tv/g),
                braviaCommand: "Sleep"
            },
            {
                regex: new RegExp(/alza volume/g),
                braviaCommand: "VolumeUp"
            },
            {
                regex: new RegExp(/abbassa volume/g),
                braviaCommand: "VolumeDown"
            },
            {
                regex: new RegExp(/volume attivo/g),
                braviaCommand: "Mute"
            },
            {
                regex: new RegExp(/volume muto/g),
                braviaCommand: "Mute"
            },
            {
                regex: new RegExp(/canale successivo/g),
                braviaCommand: "ChannelUp"
            },
            {
                regex: new RegExp(/canale precedente/g),
                braviaCommand: "ChannelDown"
            }
        ];
    }

    async runCommand(sonusIncomingPhrase): Promise<void> {
        const numberFound = new RegExp(/\d+/g).exec(sonusIncomingPhrase);
        const commandFound = this.commandsList.find(e => e.regex.test(sonusIncomingPhrase));
        if (numberFound && commandFound && (commandFound.braviaCommand === "VolumeUp" || commandFound.braviaCommand === "VolumeDown")) {
            const ticks = parseInt(numberFound[0]);
            for (let i = 0; i < ticks; i++) {
                await this.clientBravia.exec(commandFound.braviaCommand);
            }
        } else if (isNaN(sonusIncomingPhrase) && !numberFound && commandFound) {
            await this.clientBravia.exec(commandFound.braviaCommand);
        } else if (!commandFound) {
            let number = sonusIncomingPhrase;
            if (sonusIncomingPhrase.substr(0, 6) === "canale") {
                number = sonusIncomingPhrase.substr(7)
            }
            for (let i = 0; i < number.length; i++) {
                await this.clientBravia.exec("Num" + number[i]);
            }
        }

    }
}
