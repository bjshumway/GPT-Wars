function _arrayBufferToBase64( buffer ) {
  var binary = '';
  var bytes = new Uint8Array( buffer );
  var len = bytes.byteLength;
  for (var i = 0; i < len; i++) {
      binary += String.fromCharCode( bytes[ i ] );
  }
  return window.btoa( binary );
}


function startEvokeJob(prompt) {
  return new Promise(function (resolve, reject) {

    const xhr = new XMLHttpRequest();
    xhr.open('POST',
        'https://xarrreg662.execute-api.us-east-1.amazonaws.com/sdAddEle');
    xhr.setRequestHeader('Content-Type', 'application/json');

    const data =  {
      "token": 'a1-IvWSx0H5BVVUlV4XJeLNUt0gdu02_3j5yyJ5qHCshBLjGtwlQvqqQq',
      "prompt": prompt + " - 4k, detailed, bright colors, stylized RPG art",
      /*"guidance_scale": 7,
      "height": 512,
      "width": 512,
      "negative_prompt":[
          'Amateur,Low rated,Phone,Wedding,Frame,Painting,tumblr,((watermark)),(text),(overlay),getty images,(cropped),low quality,worst quality, Photo, Photo Realistic, Poor Lighting, Low lighting, Ugly, blurry'
      ],*/
      "num_inference_steps":150
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

function attemptGetEvokeImageUrl(uuid) {
  return new Promise(function (resolve, reject) {

    const xhr = new XMLHttpRequest();
    xhr.open('POST',
        'https://qrlh34e4y6.execute-api.us-east-1.amazonaws.com/sdCheckEle');
    xhr.setRequestHeader('Content-Type', 'application/json');
    const data = {
      token: 'a1-IvWSx0H5BVVUlV4XJeLNUt0gdu02_3j5yyJ5qHCshBLjGtwlQvqqQq',
      UUID: uuid
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



var lastEvokeRunAt = (new Date()).getTime();
async function getImageUrl(prompt, voice,position) {
  console.log('trace getImageUrl', prompt);
  var data;
  for(var i = 0; i < 10; i++) {
    try {
      now = (new Date()).getTime();
      if((now - lastEvokeRunAt) <= 6000) {
        await delay(6000);
      }      
      lastEvokeRunAt = (new Date()).getTime();
      data = await startEvokeJob(prompt, voice);
    }
    catch(e) {
      //If at first you dont succeed.... try try again...
      await delay(5000);
    }
  }

  console.log('trace UUID obj?', data.body.UUID);
  for(var i = 0; i < 10; i++) {
    try {
      now = (new Date()).getTime();
      if((now - lastEvokeRunAt) <= 6000) {
        await delay(6000);
      }      
      lastEvokeRunAt = (new Date()).getTime();      
      var data2 = await attemptGetEvokeImageUrl(data.body.UUID);
      console.log('trace after passing back UUID', data2);
      if(data2.errorMessage) {
        //Dp nothing... there will be a delay (see below);
      } else if (data2.body) {
        return data2.body;
      }  
    } catch(e) {

    }
    await delay(5000);
  }
}
