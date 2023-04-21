//Source: https://stackoverflow.com/questions/105034/how-do-i-create-a-guid-uuid
function uuidv4() {
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}



function getUserObj(userId) {

  return new Promise(function (resolve, reject) {

    const xhr = new XMLHttpRequest();
      xhr.open('GET',
          'https://g8of6q1nn0.execute-api.us-east-1.amazonaws.com/staging/user?userId=' + userId);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.responseType = 'json';

      xhr.onload = function() {
          if (xhr.status >= 200 && xhr.status < 300) {
              console.log('userObj', xhr.response)
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
 
//Uses the 'global' variables to write the story to the end user
//Todo: rewrite the code so everything goes off of the userObj
//      then here my life should be easy... just push the userObj
//Assumption: userObj already exists so we've already authenticated
function saveUser() {

  return new Promise(function (resolve, reject) {

    const xhr = new XMLHttpRequest();
    xhr.open('POST',
        'https://g8of6q1nn0.execute-api.us-east-1.amazonaws.com/staging/user');
    xhr.setRequestHeader('Content-Type', 'application/json');
    //xhr.setRequestHeader('x-cors-api-key', 'live_f144e8a3a8e52eb9bb0b4a6a302356af186f99b873a1816b17d4c84f548ad5af')

    xhr.responseType = 'json';

    xhr.onload = function() {
      if (xhr.status >= 200 && xhr.status < 300) {
          console.log('userObj', xhr.response)
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

    //Remove the image clobs for now... change to other api...
    //Some of the image API's use a base64 URL which is too big to store in dynamoDB
    //Uncomment out the code to remove those images... if and only if you're testing with them..
    //At some point we may store the base64 image inthe cloud...
    /*
    for(c in userObj.characters) {
      var arr = userObj.characters[c].stories;
      for(var i =0; i<arr.length;i++){
        userObj.characters[c].stories[i].storyImageUrls = [];
        userObj.characters[c].stories[i].imageParts = []        
      }
    }*/

    //Remove whether we just completed the first battle, since when the page reloads this should be false now....
    userObj.justCompletedFirstBattle = false;

    //Remove all clob, etc. data from userObj... too big to store in dynamoDB... 
    //TODO: while the images are being saved (elsewhere in imageUpload.js), the audio isn't... but we should save it...
    for(var key in userObj.characters) {
      var cha = userObj.characters[key];
  
      for(var i=0; i < cha.stories.length; i++) {
          console.log(userObj.characters[key].stories[i])
          userObj.characters[key].stories[i].chunks[0].image = null;
          userObj.characters[key].stories[i].chunks[1].image = null;
          userObj.characters[key].stories[i].chunks[2].image = null;
          userObj.characters[key].stories[i].chunks[3].image = null;
          userObj.characters[key].stories[i].soundTitleUrl = null;
          userObj.characters[key].stories[i].soundUrls = null;
      }
    
      //Give all of our characters a UUID if they don't already have it.. so we can save to opponent_characters in dynamodb
      //Source: https://stackoverflow.com/questions/105034/how-do-i-create-a-guid-uuid
      if(!userObj.characters[key].character_uuid) {
        userObj.characters[key].character_uuid = uuidv4()
      }


      if(!userObj.characters[key].ignorethiscolumn) {
        userObj.characters[key].ignorethiscolumn = "ignorethiscolumn";
      }      

    }
  
  
   
   xhr.send(JSON.stringify(userObj));

});
}


function getAllUsers() {

  return new Promise(function (resolve, reject) {

    const xhr = new XMLHttpRequest();
      xhr.open('GET',
          'https://g8of6q1nn0.execute-api.us-east-1.amazonaws.com/staging/user');
          
      xhr.setRequestHeader('Content-Type', 'application/json');
      //xhr.setRequestHeader('x-cors-api-key', 'live_f144e8a3a8e52eb9bb0b4a6a302356af186f99b873a1816b17d4c84f548ad5af')
      xhr.responseType = 'json';

      xhr.onload = function() {
          if (xhr.status >= 200 && xhr.status < 300) {
              console.log('userObj', xhr.response)
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


function getOpponentsFromCloud(avoidCharacterUUID) {

  return new Promise(function (resolve, reject) {

    const xhr = new XMLHttpRequest();
      xhr.open('GET',
          'https://g8of6q1nn0.execute-api.us-east-1.amazonaws.com/staging/opponentcharacters?avoidCharacterUUID=' + avoidCharacterUUID);
      xhr.setRequestHeader('Content-Type', 'application/json');
      //xhr.setRequestHeader('x-cors-api-key', 'live_f144e8a3a8e52eb9bb0b4a6a302356af186f99b873a1816b17d4c84f548ad5af')

      xhr.responseType = 'json';

      xhr.onload = function() {
          if (xhr.status >= 200 && xhr.status < 300) {
              console.log('userObj', xhr.response)
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
