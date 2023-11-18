async function writePngToJpeg(base64Png) {
  return new Promise(function (resolve,reject) {
    let canvas = document.createElement("canvas");
    let ctx = canvas.getContext("2d");
    
    var image = new Image();
    image.onload = function() {
      canvas.width = image.width;                                         
      canvas.height = image.height;       
      ctx.drawImage(image, 0, 0,canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg',.75));
    };
    image.src = base64Png;
  });
}

function saveImage(imageJpegClob, userId, characterName, storyId, fileName) {
  return new Promise(function (resolve, reject) {

    const xhr = new XMLHttpRequest();
    xhr.open('POST',
        'https://g8of6q1nn0.execute-api.us-east-1.amazonaws.com/staging/image');
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.responseType = 'json';

    xhr.onload = function() {
      if (xhr.status >= 200 && xhr.status < 300) {
          console.log('saveImage', xhr.response)
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

    xhr.send(
      JSON.stringify(
        {
          imageBinary: imageJpegClob,
          key: userId + '/' + characterName + '/' + storyId +  '/' + fileName + '.jpeg'
        }
      )
    );

});
}