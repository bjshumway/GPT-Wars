

async function getElevenLabsTTSInternal(prompt, voiceId, position) {


  return new Promise(function (resolve, reject) {

    const xhr = new XMLHttpRequest();
    xhr.open('POST',
        'https://api.elevenlabs.io/v1/text-to-speech/' + voiceId + '/stream', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('xi-api-key', 'd537e1d9110b6de4f63109cbcf8941b0');
    const data = {
        text: prompt
    };
    xhr.responseType = 'json';
    console.log(data)

    const audioContextBuffer = audioContext.createBufferSource()
    xhr.responseType = 'arraybuffer'

    xhr.onload = function() {
    if (xhr.status >= 200 && xhr.status < 300) {
      // The callback that handles the request data
      // Decode the stream into something we can digest
      audioContext.decodeAudioData(xhr.response, function(buffer) {

            console.log('trace in decodeAudioData, position:', position);
            // These three lines of code will play the audio stream
            try {
              audioContextBuffer.buffer = buffer
              resolve({
                audioBuffer: audioContextBuffer,
                position: position
              });
            }
            catch(e) {
              if(isMobile) {
                alert("Error connecting buffer -audioContextBuffer: " + audioContextBuffer);
              }
            }
          }, error => {
            console.log('Unable to decode audio stream')
            if(isMobile) {
              alert("Unable to decode audio stream")
            }              
        })
      }
      else 
      {
        if(isMobile) {
          alert("Error calling 11labsAPI in mobile")
        }
        console.log(xhr.statusText);
        reject({
        status: xhr.status,
        statusText: xhr.statusText
      });
    }  
  }

  xhr.onerror = function () {
      console.log(xhr.statusText)
      if(isMobile) {
        alert("Error calling 11labsAPI in mobile")
      }
      reject({
          status: xhr.status,
          statusText: xhr.statusText
      });
  };

  xhr.send(JSON.stringify(data));
  })
}
  

let lastElevenLabsRunAt = (new Date()).getTime();
                                     //Defaults to "Anthony"
                                     //adam: pNInz6obpgDQGcFmaJgB
                                     //anthony: ErXwobaYiN019PkySvjV
async function getElevenLabsTTS(prompt, position, voiceId="pNInz6obpgDQGcFmaJgB") {
  for(var i = 0; i < 10; i++) {
    try {
      //Always wait at least 2 seconds from the last time a GPT query was run
      //This is due to some weirdness with the rate limiter... hoping this will help...
      var now = (new Date()).getTime();
      if((now - lastElevenLabsRunAt) <= 2000) {
        await delay(2000);
      }
      lastElevenLabsRunAt = (new Date()).getTime();

      var rslt = await getElevenLabsTTSInternal(prompt, voiceId,position);
      return rslt;
    } catch(e) {
      console.log("Error calling ElevenLabs try #" + i,e);
      await delay(5000);//Wait 5 seconds and then try again
    }
  } 
}

