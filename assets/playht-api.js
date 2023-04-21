function _arrayBufferToBase64( buffer ) {
  var binary = '';
  var bytes = new Uint8Array( buffer );
  var len = bytes.byteLength;
  for (var i = 0; i < len; i++) {
      binary += String.fromCharCode( bytes[ i ] );
  }
  return window.btoa( binary );
}


function startPlayHTJob(prompt, voice = "Arthur") {
  return new Promise(function (resolve, reject) {

    const xhr = new XMLHttpRequest();
    xhr.open('POST',
        'https://play.ht/api/v1/convert');
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('X-User-ID','UpOScsFWw6dbh4I66r3Ym8gUB4C2');
    xhr.setRequestHeader('Authorization', 'c21019d663444c74b496d4976de11a8e');

    const data =  {
      "voice": voice,
      "content": (typeof prompt == "string" ?  [prompt] : prompt),
      "title": (typeof prompt == "string" ? prompt : prompt[0]).substr(0,25),
      "preset": "low-latency"
    }

    xhr.responseType = 'json';
    
    xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300) {
            console.log(xhr.response)
            resolve(xhr.response);
        } else {
            console.log(xhr.statusText);
            reject({
            status: xhr.status,
            statusText: xhr.statusText
        });
        }
    };

    xhr.onerror = function () {
        console.log(xhr.statusText)
        reject({
            status: xhr.status,
            statusText: xhr.statusText
        });
    };

    xhr.send(JSON.stringify(data));
  });  
}

function attemptGetSoundUrl(transcriptionId) {
  return new Promise(function (resolve, reject) {

    const xhr = new XMLHttpRequest();
    xhr.open('GET',
        'https://g8of6q1nn0.execute-api.us-east-1.amazonaws.com/staging/audio?transcriptionId=' + transcriptionId);
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.responseType = 'json';
    
    xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300) {
            console.log(xhr.response)
            resolve(xhr.response);
        } else {
            console.log(xhr.statusText);
            reject({
            status: xhr.status,
            statusText: xhr.statusText
        });
        }
    };

    xhr.onerror = function () {
        console.log(xhr.statusText)
        reject({
            status: xhr.status,
            statusText: xhr.statusText
        });
    };

    xhr.send();
  });  
}



async function getPlayHTSoundUrl(prompt, voice,position) {
  console.log('trace getSoundUrl', prompt);
  var data = await startPlayHTJob(prompt, voice);
  for(var i = 0; i < 100; i++) {
    var data = await attemptGetSoundUrl(data.transcriptionId);
    if(data.status == 'SUCCESS') {
        return (position ? {
          url: data.metadata.output[0],
          position: position
        }:
        data.metadata.output[0]);
    } else {
      //Wait...
      if(typeof prompt == "string") {
        await delay(5000);
      }else {
        await delay(1000);
      }
    }
  }
}