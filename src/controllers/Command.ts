import Bravia from "./Bravia";

interface ICommand {
    name: string;
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
                name: "accendi tv",
                regex: new RegExp(/accendi tv/g),
                braviaCommand: "WakeUp"
            },
            /* {
                name: "spegni tv",
                regex: new RegExp(/spegni tv/g),
                braviaCommand: "PowerOff"
            }, */
            {
                name: "spegni tv",
                regex: new RegExp(/spegni tv/g),
                braviaCommand: "Sleep"
            },
            {
                name: "alza volume",
                regex: new RegExp(/alza volume/g),
                braviaCommand: "VolumeUp"
            },
            {
                name: "abbassa volume",
                regex: new RegExp(/abbassa volume/g),
                braviaCommand: "VolumeDown"
            },
            {
                name: "volume attivo",
                regex: new RegExp(/volume attivo/g),
                braviaCommand: "Mute"
            },
            {
                name: "volume muto",
                regex: new RegExp(/volume muto/g),
                braviaCommand: "Mute"
            },
            {
                name: "canale successivo",
                regex: new RegExp(/canale successivo/g),
                braviaCommand: "ChannelUp"
            },
            {
                name: "canale precedente",
                regex: new RegExp(/canale precedente/g),
                braviaCommand: "ChannelDown"
            }
        ];
    }

    async runCommand(sonusIncomingPhrase): Promise<void> {
        if(isNaN(sonusIncomingPhrase) && new RegExp(/\d/g).test(sonusIncomingPhrase) === false) {
            for(const i in this.commandsList) {
                if(this.commandsList[i].regex.test(sonusIncomingPhrase)) {
                    await this.clientBravia.exec(this.commandsList[i].braviaCommand);
                    break;
                }
            }
        } else {
            let number = sonusIncomingPhrase;
            if(sonusIncomingPhrase.substr(0, 6) === "canale") {
                number = sonusIncomingPhrase.substr(7)
            }
            for(let i = 0; i < number.length; i++) {
                await this.clientBravia.exec("Num" + number[i]);
            }
        }
        
    }
}