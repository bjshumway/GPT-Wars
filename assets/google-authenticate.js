function parseJwt (token) {
  var base64Url = token.split('.')[1];
  var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));

  return JSON.parse(jsonPayload);
}

async function handleCredentialResponse(response) {
  console.log("Encoded JWT ID token: " + response.credential);

  $('.loading-container').show();
  loadingUser = true;



  
  // decodeJwtResponse() is a custom function defined by you
    // to decode the credential response.
  const responsePayload = parseJwt(response.credential);

  var rslt = await googleAuthRegister(responsePayload.sub);
  if(rslt.Item && rslt.Item.brandNew) {

  }else {
    if(rslt.Item) {
      userObj = rslt.Item;
    } else {
      userObj = rslt;
    }
  }

  console.log("ID: " + responsePayload.sub);
  console.log('Full Name: ' + responsePayload.name);
  console.log('Given Name: ' + responsePayload.given_name);
  console.log('Family Name: ' + responsePayload.family_name);
  console.log("Image URL: " + responsePayload.picture);
  console.log("Email: " + responsePayload.email);

  sessionStorage["userId"] = responsePayload.sub;
    
  if(userObj.justCompletedFirstBattle) {
    userObj.userId = responsePayload.sub;
    //We completed the first battle! (Hazaah!)
    //Now reload the client so we can re-initialize
    userObj.justCompletedFirstBattle = false;
    await saveUser();
    sessionStorage["userId"] = userObj.userId;
    window.location.reload();
  } 
  else {
    userObj = await googleAuthRegister(responsePayload.sub);
    if(userObj.voiceAudioOn === undefined) {
      userObj.voiceAudioOn = true;
    }
    sessionStorage["userId"] = responsePayload.sub;

    $('#login-div').hide();
    $('#start-button').hide();
    $('#battle').show();
    $('#store').show();
    $('#front-page-coin').show();
    $('#front-page-coin-img').show();
    $('#characters').show();
    $('#settings').show();
    $('#login').hide();
    $('#logout').show();
    $('.loading-container').hide();
    loadingUser = false;

  }
}



async function googleAuthRegister(credential) {
    return new Promise(function (resolve, reject) {
      const xhr = new XMLHttpRequest();
      fixUnloggedInImages = "";
      if(("" + userObj.userId).indexOf("U") == 0) {
        fixUnloggedInImages = "&fixUnloggedInImages=" + userObj.userId;
      }
      xhr.open('GET',
          'https://g8of6q1nn0.execute-api.us-east-1.amazonaws.com/staging/user?userId=' + credential + '&authenticationType=google&fixUnloggedInImages='+userObj.userId);
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
  })
}
  
   

