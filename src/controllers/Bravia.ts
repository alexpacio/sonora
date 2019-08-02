import * as request from 'request';
import * as readline from 'readline';
import * as uuid from 'node-uuid';
import FileCookieStore from 'tough-cookie-filestore';
import * as wol from 'wake_on_lan';
import * as arpTable from '../helpers/arpTable';

// Now accepts a PSKKey. No longer requires authentication cookies, so allows for a permanent connection.
// Cookie method left in for completeness

export default class Bravia {
    private ip: string;
    private device: string;
    private nickname: string;
    private pskKey: string;
    private uuid: string;
    private cookieJar: request.CookieJar;
    private commands: object;

    constructor(ip: string, pskkey: string) {
        console.log("called constructor Bravia")
        this.ip = ip;
        this.device = ip;
        this.nickname = 'Pi';
        this.pskKey = pskkey;
        this.uuid = uuid.v1();
        this.cookieJar = request.jar(new FileCookieStore('cookies.json'));
        this.commands = {};
    }

    public exec(command: string) {
        //console.log("Bravia -> called exec()")
        //console.log("command: " + command)
        return new Promise(async (resolve) => {
            if (command === 'PowerOn') {
                return this.wake();
            }
            //console.log("Auth requested")
            await this.auth();
            //console.log("Auth granted")
            const code = await this.getCommandCode(command);
            //console.log("Code obtained: " + code)
            const result = await this.makeCommandRequest(code);
            //console.log("Result: " + JSON.stringify(result, null, 4))
            resolve(result);
            });
    }

    public wake() {
        arpTable.get_arp_table((err, table) => {
            for (let i in table) {
                if (table[i].ip === this.ip) {
                    wol.wake(table[i].mac);
                }
            }
        });
    }

    public getCommandList(): Promise<object> {
        return new Promise(async (resolve, reject) => {
            if (Object.keys(this.commands).length > 0) {
                resolve(this.commands);
            }

            const response: any = await this.request({
                path: '/sony/system',
                json: {
                    'id': 20,
                    'method': 'getRemoteControllerInfo',
                    'version': '1.0',
                    'params': []
                }
            });

            if (response && response.result !== undefined && Object.keys(response.result).length === 2) {

                let list = response.result[1].map(function (item) {
                    let i = {};
                    i[item.name] = item.value;
                    return i;
                });

                let commands = {};
                commands["PowerOn"] = '';

                for (let i in list) {
                    for (let key in list[i]) {
                        commands[key] = list[i][key];
                    }
                }

                this.commands = commands;

                resolve(this.commands);
            }

        });

    }

    public async getCommandNames(): Promise<string[]> {
        return Object.keys(await this.getCommandList());

    }

    public async makeCommandRequest(code) {
        const body = '<?xml version="1.0"?>' +
            '<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">' +
            '<s:Body>' +
            '<u:X_SendIRCC xmlns:u="urn:schemas-sony-com:service:IRCC:1">' +
            '<IRCCCode>' + code + '</IRCCCode>' +
            '</u:X_SendIRCC>' +
            '</s:Body>' +
            '</s:Envelope>';

        await this.request({
            path: '/sony/IRCC',
            body: body,
            headers: {
                'Content-Type': 'text/xml; charset=UTF-8',
                'X-Auth-PSK': this.pskKey,
                'SOAPACTION': '"urn:schemas-sony-com:service:IRCC:1#X_SendIRCC"'
            }
        });
    }

    public async makeAuthRequest(headers: object): Promise<void> {
        await this.request({
            path: '/sony/accessControl',
            json: {
                method: 'actRegister',
                id: 8,
                version: '1.0',
                params: [
                    {
                        clientid: this.device + ':' + this.uuid,
                        nickname: this.nickname + ' (' + this.device + ')',
                        level: 'private'
                    },
                    [{
                        value: 'yes',
                        function: 'WOL'
                    }]
                ]
            },
            headers: headers
        })
    }

    public hasCookie(): boolean {
        return this.cookieJar.getCookies('http://' + this.ip + '/sony').length > 0;
    }

    public auth() {
        return new Promise((resolve, reject) => {
            if (!this.hasCookie() && this.pskKey == "") {

                let rl = readline.createInterface({
                    input: process.stdin,
                    output: process.stdout
                });

                rl.question('Please enter the 4-digit code shown on your TV: ', async (challenge) => {

                    await this.makeAuthRequest({
                        Authorization: 'Basic ' + new Buffer(':' + challenge).toString('base64')
                    });
                    rl.close();
                    resolve();
                });
            } else resolve();
        })

    }

    public async getCommandCode(command: string) {
        const list = await this.getCommandList()
        return list[command];
    }

    private request(options): Promise<object> {
        return new Promise((resolve, reject) => {
            options.url = 'http://' + this.ip + options.path;
            options.jar = this.cookieJar;

            request.post(options, async (error, response, body) => {
                if (error) {
                    console.error(error);
                    reject(error);
                } else {
                    //console.log("BODY: " + JSON.stringify(body, null, 4))
                    resolve(body);
                }
            });
        })
    }
}