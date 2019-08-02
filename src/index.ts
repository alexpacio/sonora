import * as path from 'path';
import Bravia from './controllers/Bravia';
import { Command } from './controllers/Command';
import { execSync } from 'child_process';

let tvIp = ""
let presharedKey = ""
let clientBravia = new Bravia(tvIp, presharedKey);

execSync("sudo amixer cset numid=4 50%")
execSync("sudo aplay /home/pi/tv-remote-control/bell.wav")

const Sonus = require('sonus')
const speech = require('@google-cloud/speech')
const language = "it-IT"
const dirnameArray = __dirname.split("/");
const client = new speech.SpeechClient({
    projectId: 'streaming-speech-sample',
    keyFilename: path.resolve(dirnameArray.slice(0, dirnameArray.length - 1).join("/") + "/googleApi/", 'apiKey.json')
  })
const hotwords = [{ file: 'dict/sonora.pmdl', hotword: 'sonora' }]
const sonus = Sonus.init({ hotwords, language, recordProgram: "arecord", device: "hw:1,0"}, client)
Sonus.start(sonus)
sonus.on('hotword', (index, keyword) => {
  console.log("!")
  try {
    execSync("sudo aplay /home/pi/tv-remote-control/bell.wav")
    //new Sound(__dirname.toString() + "/bell.wav").play();
  } catch(err) {
    console.error(err)
  }
})
sonus.on('final-result', (result: string) => {
  console.log('"' + result + '"');
  new Command(clientBravia).runCommand(result.toLowerCase().trim())
})
