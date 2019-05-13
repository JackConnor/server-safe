
/////to send a multichannel request (have to first push to a bucket)
curl -s -H "Content-Type: application/json" \
    -H "Authorization: Bearer "$(gcloud auth application-default print-access-token) \
    https://speech.googleapis.com/v1/speech:recognize \
    --data "{
  'config': {
    'languageCode': 'en-US',
    'audioChannelCount': 2,
    'enableSeparateRecognitionPerChannel': true,
    'model': 'video'
  },
  'audio': {
    'uri':'gs://vq-audio-test/CHANGE ME.wav'
  }
}"

//Single channel .wav that was uploaded to google cloud
curl -s -H "Content-Type: application/json" \
    -H "Authorization: Bearer "$(gcloud auth application-default print-access-token) \
    https://speech.googleapis.com/v1/speech:recognize \
    --data "{
  'config': {
    'languageCode': 'en-US',
    'model': 'video',
    'enableAutomaticPunctuation': true
  },
  'audio': {
    'uri':'gs://vq-audio-test/mono-0.09573010021160555daemon.wav'
  }
}"

//Speaker Diarization
curl -s -H "Content-Type: application/json" \
    -H "Authorization: Bearer "$(gcloud auth application-default print-access-token) \
    https://speech.googleapis.com/v1/speech:recognize \
    --data "{
  'config': {
    'languageCode': 'en-US',
    'model': 'video',
    "enableSpeakerDiarization": true,
    "diarizationSpeakerCount": 2,
    'enableAutomaticPunctuation': true
  },
  'audio': {
    'uri':'gs://vq-audio-test/mono-0.09573010021160555daemon.wav'
  }
}"

//Long Running (ie over 60 seconds)
curl -s -H "Content-Type: application/json" \
    -H "Authorization: Bearer "$(gcloud auth application-default print-access-token) \
    https://speech.googleapis.com/v1/speech:longrunningrecognize \
    --data "{
  'config': {
    'languageCode': 'en-US',
    'model': 'video'
  },
  'audio': {
    'uri':'gs://vq-audio-test/CHANGE ME.wav'
  }
}"

// ONE form of curl command for long-Running
gcloud ml speech recognize-long-running --enable-automatic-punctuation='true' 'gs://vq-audio-test/" + newFileName + "' --language-code='en-US' --async

//TEST
`curl -s -H "Content-Type: application/json" \
    -H "Authorization: Bearer "$(gcloud auth application-default print-access-token) \
    https://speech.googleapis.com/v1p1beta1/speech:recognize \
    --data "{
  'config': {
    'languageCode': 'en-US',
    'model': 'video',
    'enableAutomaticPunctuation': true
  },
  'audio': {
    'uri':'gs://vq-audio-test/mono-0.09573010021160555daemon.wav'
  }
}"`
