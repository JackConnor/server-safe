const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const app = express();
const port = 5555;
const exec = require('child_process').exec;
const socketUtils = require('./sockets.js');
let multer = require('multer');



const speech = require('@google-cloud/speech');
const client = new speech.SpeechClient();
const {Storage} = require('@google-cloud/storage');
const storage = new Storage();

let upload = multer();
let mainSocket;
let token;
const server = app.listen(port, () => console.log(`Example app listening on port ${port}!`));

server.setTimeout(60000000);

this.io = socketUtils.initIo(server);
this.io.on('connection', (socket) => {
  mainSocket = socket;
})

app.use(function(req, res, next) {
 res.header("Access-Control-Allow-Origin", "*");
 res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));


const createTranscriptHandler = (req, res) => {
  const fileName = req.body.fileName;
  const rand = Math.random();
  const newFileName = 'mono-' + rand + fileName;
  const multiFile = 'audio/multi/' + fileName;
  const monoFile = 'audio/mono/' + newFileName;
  const numberOfChannels = parseInt(req.body.channelCount) || 1;
  const volume = req.body.volume || 1;
  //MONO
  // const convertToMonoSh = exec('ffmpeg -i ' + multiFile + ' -ac ' + numberOfChannels + ' ' + monoFile, (a, b, c) => {VOLUME
  const convertToMonoSh = exec('ffmpeg -i ' + multiFile + ' -filter:a "volume="' + volume + '".0" ' + ' ' + monoFile, (a, b, c) => {
    if (c) {
      console.log('Starting upload to GCloud');
      uploadToCloud(monoFile, newFileName, numberOfChannels, res);
    }
  });
}

const uploadToCloud = async (monoFile, newFileName, numberOfChannels, res) => {
  exec('gsutil cp ' + monoFile + ' gs://vq-audio-test', (d, e, f) => {
    if (f) {
      getLongTranscription(newFileName, numberOfChannels, res);
    }
  });

  const newGsUrl = 'gs://vq-audio-test/' + newFileName;
  const gcloudRequest = {
    config: {
      languageCode: 'en-US',
      enableAutomaticPunctuation: true,
    },
    audio: {
      'uri':'${newGsUrl}'
    }
  }
  // const [operation] = await client.longRunningRecognize(request);
  // const [response] = await operation.promise();
  // const transcription = response.results;
  // console.log(transcription);
  // console.log(response);
}

const getLongTranscription = (gsFileName, numberOfChannels, res) => {
  const numberOfSpeakers = 2;
  let enableSpeakerDiarization = false;
  if (numberOfSpeakers > 1) {
    enableSpeakerDiarization = true;
  }

  let enableSeparateRecognitionPerChannel = false;
  if (numberOfChannels > 1) {
    enableSeparateRecognitionPerChannel = true;
  }
  const newGsUrl = 'gs://vq-audio-test/' + gsFileName;
  console.log('About to start transcription');
  exec(`curl -s -H "Content-Type: application/json" \
      -H "Authorization: Bearer "$(gcloud auth application-default print-access-token) \
      https://speech.googleapis.com/v1p1beta1/speech:longrunningrecognize \
      --data "{
        'config': {
          'languageCode': 'en-US',
          'enableAutomaticPunctuation': true,
          'enableSpeakerDiarization': ${enableSpeakerDiarization},
          'diarizationSpeakerCount': ${numberOfSpeakers},
          'enableWordConfidence': true,
          'audioChannelCount': ${numberOfChannels},
          'enableSeparateRecognitionPerChannel': ${enableSeparateRecognitionPerChannel},
          'model': 'video',
          'speechContexts': {
            "phrases": ['J.K. Rowling']
          },
        },
      'audio': {
        'uri':'${newGsUrl}'
      }
    }"`
    , (x,y,z) => {
      if (JSON.parse(y)['name']) {
        const opName = JSON.parse(y)['name'];
        execWaitForTranscript(opName, numberOfChannels, res);
      }
      else {
        console.log('ERRRRORRRRR');
        console.log(y);
        res.status(400).send({data: 'error shiitteeee'});
      }
  });
}

execWaitForTranscript = (opName, numberOfChannels, res) => {
  console.log('Begin waiting for transcription');
  exec('gcloud ml speech operations wait ' + opName, {maxBuffer: 8192 * 8192}, (j, k, l) => {
    console.log('Transcription complete!');
    const altList = k.split('"words":');
    if (numberOfChannels === 1) {
      console.log('Creating One channel transcript');
      altlist = altList.shift();
      emitSingleChannel(altList, k);
      res.status(200).send({data: 'Single Channel transcription complete'});
    }
    else if (numberOfChannels === 2) {
      console.log('Creating two channel transcript');
      const wordList = '[' + altList[altList.length - 1].split('[')[1].split(']')[0] + ']';
      emitDoubleChannel(wordList, k);
      res.status(200).send({data: 'Double Channel transcription complete'});
    }
  });
}

const emitSingleChannel = (listArr, fullTranscriptObj) => {
  let phrasesArr = [];
  for (var i = 0; i < listArr.length; i++) {
    const wordList = '[' + listArr[i].split('[')[1].split(']')[0] + ']';
    const wordListJson = JSON.parse(wordList);
    phrasesArr = phrasesArr.concat(wordListJson);
  }
  // const formattedTransLabels = creatFormattedTranscriptLabels(phrasesArr);
  const formattedTransLabels = phrasesArr;
  mainSocket.emit('info-received', { transcript: fullTranscriptObj, wordList: phrasesArr });
}

const emitDoubleChannel = (wordList, fullTranscriptObj) => {
  let phrasesArr = JSON.parse(wordList);
  const formattedTransLabels = phrasesArr;
  mainSocket.emit('info-received', { transcript: fullTranscriptObj, wordList: phrasesArr });
}

///// HTTP Requests
//////////////////////////
app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.post('/testing-video-upload', upload.fields([]), (req, res) => {
  console.log(req.body);
  // console.log(req.body.videoBlob);
});

app.post('/push-audio', (req, res) => {
  createTranscriptHandler(req, res);
});
