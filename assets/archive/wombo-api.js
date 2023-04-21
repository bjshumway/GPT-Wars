/*NOTE: using cors proxy sserver provided for FREE 
        https://blog.grida.co/cors-anywhere-for-everyone-free-reliable-cors-proxy-service-73507192714e
*/

function getWomboTaskId() {
  return new Promise(function (resolve, reject) {
  const xhr = new XMLHttpRequest();
  xhr.open('POST',
     //https://paint.api.wombo.ai/api/v2/tasks/
      'https://proxy.cors.sh/https://api.luan.tools/api/tasks/');
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.setRequestHeader('Authorization', 'Bearer 1SXN4gNBSdjHl2NpRoGZ8j9oeWWAes7m');
  xhr.setRequestHeader('x-cors-api-key', 'live_f144e8a3a8e52eb9bb0b4a6a302356af186f99b873a1816b17d4c84f548ad5af')
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

  xhr.send(JSON.stringify({use_target_image:false})); 
});  
}

function startWomboJob(prompt, id) {
  return new Promise(function (resolve, reject) {
    const data = {
      "input_spec": {
          "style": 5,
          "prompt": prompt,
          "width": 512,
          "height": 512
      }
   };

   const xhr = new XMLHttpRequest();   


    xhr.open('PUT',
        //https://paint.api.wombo.ai/api/v2/tasks/    
        'https://proxy.cors.sh/https://api.luan.tools/api/tasks/' + id);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Authorization', 'Bearer 1SXN4gNBSdjHl2NpRoGZ8j9oeWWAes7m');
    xhr.setRequestHeader('x-cors-api-key', 'live_f144e8a3a8e52eb9bb0b4a6a302356af186f99b873a1816b17d4c84f548ad5af')
    xhr.responseType = 'json';
    console.log(data)

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

function attemptGetWomboImageUrl(taskId) {
  return new Promise(function (resolve, reject) {
    const xhr = new XMLHttpRequest();
    xhr.open('GET',
        //https://paint.api.wombo.ai/api/v2/tasks/    
        'https://proxy.cors.sh/https://api.luan.tools/api/tasks/' + taskId);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Authorization', 'Bearer 1SXN4gNBSdjHl2NpRoGZ8j9oeWWAes7m');
    xhr.setRequestHeader('x-cors-api-key', 'live_f144e8a3a8e52eb9bb0b4a6a302356af186f99b873a1816b17d4c84f548ad5af')
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



async function getWomboImageUrl(prompt) {
  prompt = prompt + ', stylized RPG art';
  console.log('trace getImageUrl', prompt);

  for(var i =0; i < 100; i++) {
    try {
      var data = await getWomboTaskId();
      console.log('trace wombo task id', data.id);
      break;
    } catch(e) {
      console.log('Err in 1st Step of Wombo', e);
    }  
  }

  for(var i = 0; i < 100; i++) {
    try {
      data = await startWomboJob(prompt,data.id);
      console.log('trace wombo task id', data.id);    
      break;
    } catch(e) {
      console.log('Err in 2nd Step of Wombo', e);
    }
  }

  for(var i = 0; i < 100; i++) {
    try {
      var data2 = await attemptGetWomboImageUrl(data.id);
      console.log('data2', data2) 
  
      if (data2.state == "failed") {
        //For now.... return '#' on the fail
        return '#'
      }
      else if(data2.state == "completed"){
        console.log('COMPLETED', data2.data);
        return data2.result
      }
  
    }catch(e) {

    }
    await delay(5000);
  }
}