function _arrayBufferToBase64( buffer ) {
  var binary = '';
  var bytes = new Uint8Array( buffer );
  var len = bytes.byteLength;
  for (var i = 0; i < len; i++) {
      binary += String.fromCharCode( bytes[ i ] );
  }
  return window.btoa( binary );
}


function getStableDiffusion(prompt,imgObj) {
  return new Promise(function (resolve, reject) {

    const xhr = new XMLHttpRequest();
    xhr.open('POST',
        'https://api.stability.ai/v1alpha/generation/stable-diffusion-512-v2-0/text-to-image');
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Accept', 'image/png');
    xhr.setRequestHeader('Authorization', 'sk-mDgWkl4FO4mgQ1Rw4lGWFCY0CtqzfiWGZJIBCxUCVQfqiWMi');

    const data = {
      "cfg_scale": 7,
      "clip_guidance_preset": "SLOWEST",
      "height": 512,
      "width": 512,
      "samples": 1,
      "sampler": "K_DPM_2_ANCESTRAL",
      "steps": 150,
      "text_prompts": [
        {
          "text": prompt + " - 4k, detailed, bright colors, stylized RPG art",
          "weight": 1
        }, {
          "text": 'Amateur,Low rated,Phone,Wedding,Frame,Painting,tumblr,((watermark)),(text),(overlay),getty images,(cropped),low quality,worst quality, Photo, Photo Realistic, Poor Lighting, Low lighting, Ugly, blurry',
          "weight": -1
        }
      ]
    }
    xhr.responseType = 'arraybuffer';

    
    xhr.onreadystatechange = function() { 
      if (xhr.readyState == 4 && xhr.status == 200) { 
        if(imgObj) {
          imgObj.src = 'data:image/png;base64,' + _arrayBufferToBase64(xhr.response)
        }
        resolve('data:image/png;base64,' + _arrayBufferToBase64(xhr.response));
      } else if (xhr.status >= 300)(
        reject({
          status: xhr.status,
          statusText: xhr.statusText
        })
      )
    }

    xhr.send(JSON.stringify(data));

    xhr.onerror = function () {
        reject({
            status: xhr.status,
            statusText: xhr.statusText
        });
    };
  
  });  
}

