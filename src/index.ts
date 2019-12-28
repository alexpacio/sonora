import * as path from 'path';
import Bravia from './controllers/Bravia';
import { Command } from './controllers/Command';
import { exec } from 'child_process';
import * as speech from '@google-cloud/speech';
import * as Sonus from 'sonus';

const clientBravia = new Bravia('192.168.0.XXX', 'password');

exec("sudo amixer cset numid=4 40%");
exec("sudo aplay /home/pi/tv-remote-control/bell.wav");

const language = "it-IT";
const dirnameArray = __dirname.split("/");
const client = new speech.SpeechClient({
  projectId: 'streaming-speech-sample',
  keyFilename: path.resolve(dirnameArray.slice(0, dirnameArray.length - 1).join("/") + "/googleApi/", 'aaaaa-xxxxxxxxxxxx.json')
})
const hotwords = [{ file: 'dict/ehicapo.pmdl', hotword: 'ehi capo', sensitivity: 0.5 }]
const sonus = Sonus.init({ hotwords, language, recordProgram: "arecord", device: "hw:1,0" }, client)
Sonus.start(sonus);
sonus.on('hotword', (word) => {
    //console.log("!")
    try {
      exec("sudo aplay /home/pi/tv-remote-control/bell.wav")
      //new Sound(__dirname.toString() + "/bell.wav").play();
    } catch (err) {
      console.error(err)
    }
})
sonus.on('final-result', async (result: string) => {
  //console.log('"' + result + '"');
  await new Command(clientBravia).runCommand(result.toLowerCase().trim())
})
