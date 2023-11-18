var defaultUserObj = {
  justCompletedFirstBattle: false,
  finishedIntro: false, 
  characters: {}, //Characters is huge. contains the characters, and their associated stories
  musicVolume: 100,
  voiceVolume: 100,
  voiceSpeed: 1.2,
  developerMode: true,
  voiceAudioOn: false, //Off by default until the service becomes cheaper

  userId: 'U' + Math.floor(Math.random() * 10000000000000), //If we haven't logged in, we get a random ID to track our "session" (even though its not in sessionStorage),
                                                            //   so we can play the first game without logging in...
                                                            //   and save our images to our "fake" user until we register and get a real ID
  userRating: undefined,
  credentialsType: undefined,
  createdAccountOn: undefined,
  headshotImageUrl: undefined,
  creditsRemaining: 25 //Each game is worth one credit
}

//Deep copy 
//Source" https://www.javascripttutorial.net/object/3-ways-to-copy-objects-in-javascript/
var userObj = JSON.parse(JSON.stringify(defaultUserObj));


loadingUser = false;
currentlyRegistering = false;
windowLocationWithoutArguments = location.protocol + '//' + location.host + location.pathname;
showingSplashLogo = true;


// Creates an AudioContext and AudioContextBuffer
var audioContext;
var audios = {} //Used for the different audios in the game

async function loadAudio(audioName,url, playImmediately) {
  var request = new XMLHttpRequest();
  request.open('GET', url, true);
  request.responseType = 'arraybuffer';

  audios[audioName] = {
    buffer: null,
    url: url,
    playASAP: false,
    source: null
  }

  // Decode asynchronously
  request.onload = function() {
    audioContext.decodeAudioData(request.response, function(buffer) {
      audios[audioName].buffer = buffer;
      if(playImmediately || audios[audioName].playAsap) {
        playAudio(audioName);
      }
  }, function(err) {
    console.log("error loading sound file ", audioName);
  });
  }
  request.send();
}

//Assumption the audio was already called with 'loadAudio'
function playAudio(audioName,delay,cb) {
  window.setTimeout(function() {
    if(!audios[audioName].buffer) {
      //This sounds like the rare possibility that the audio buffer hasn't been loaded yet.
      //Setting this to true will cause playAudio to be called again ASAP
      audios[audioName].playASAP = true;
    } else {
      var source = audioContext.createBufferSource(); // creates a sound source
      source.buffer = audios[audioName].buffer;                    // tell the source which sound to play

      //The background music is the exception - it plays at low volume (so it doesn't overpower the voice)
      if(audioName == 'mainsong') {
        // Create a gain node.
        var gainNode = audioContext.createGain();
        // Connect the source to the gain node.
        source.connect(gainNode);
        // Connect the gain node to the destination.
        gainNode.connect(audioContext.destination);
        gainNode.gain.value = 0.03; //probably should be .03?

      } else {
        source.connect(audioContext.destination);       // connect the source to the context's destination (the speakers)
      }

      source.start(0);                          // play the source now  
      audios[audioName].source = source;
      audios.playASAP = false;
      if(cb) {
        cb();
      }
    }
  }, (delay ? delay : 0));
  return audioName;
}

async function stopAudio(audioName) {
  if(audios[audioName] && audios[audioName].source) {
    try {
      audios[audioName].source.stop();
    }catch(e) {
      //Its common that it cannot be stopped because its already stopped
      //So we suppress the error message below:
      //console.log("Err Stopping " + audioName);
    }
  }
  if(audios[audioName] && audios[audioName].playASAP) {
    audios[audioName].playASAP = false;
  }
}




// Book Logic
var book = {
  currentLocation: 0,
  numOfPapers: null,
  maxLocation: null
}



var storyLogic = {
  currentCharacter: '',
  storyFinished: false,
  showLoadingTextForQAC: null,
  runThroughLoadingImages: false,
  rawStoryText: null,
  imageURLs: [],
  soundURLs: [],
  storyParts: ['','','',''],
  imageParts: ['','','','']
}

var appLocation;
var currentLoadImage = 0;

var isMobile = false;


function openAccordian(id) {
  $('.w3-inside').removeClass("w3-show");
  $('#' + id).addClass('w3-show')
}

var randomIndexes = [];
var numLoadImages = 95;
for (var i = 1; i <= numLoadImages; i++) {
  randomIndexes.push(i);
}
function shuffle(array) {
  let currentIndex = array.length,  randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex != 0) {

    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }

  return array;
}
shuffle(randomIndexes);

audioContext = new AudioContext();
//TODO: If we detect that we are running the mobile APP - then we can play this sound. Otherwise, it won't play until a user clicks something
//      and that doesn't make any sense.
//loadAudio("introsound", "../assets/modern-tech-logo-13492.mp3",true);
// Wait for the deviceready event before using any of Cordova's device APIs.
// See https://cordova.apache.org/docs/en/latest/cordova/events/events.html#deviceready
/*
document.addEventListener('deviceready', onDeviceReady, false);
function onDeviceReady() {
  // Cordova is now initialized. Have fun!
  deviceReady = true;
  console.log('Running cordova-' + cordova.platformId + '@' + cordova.version);
  document.getElementById('deviceready').classList.add('ready');
}
*/
window.addEventListener('load', function() {

  var ua = navigator.userAgent;
  if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i.test(ua)) {
    isMobile = true;
  }

  const urlSearchParams = new URLSearchParams(window.location.search);
  const params = Object.fromEntries(urlSearchParams.entries());

  if(params.activationHash && !sessionStorage["userId"]) {
    //Check if the user is activated already... if not popup the #create-account div
    getActivationStatus(params.activationHash,params.userId).then(function(rslt) {
      if(rslt.userId) {
        currentlyRegistering = true;

        //Set the user to the user obj
        userObj = rslt;

        //Off for now until voice audio becomes cheaper
        userObj.voiceAudioOn = false;

        //Show the "register account" div
        $("#create-account").show();
        $("#start-button").hide();
        $('.loading-container').hide();
        $("#login").hide();
        

        $('#register-button').on("click",function() {
          var pw1 = $('#register-password-1').val().trim();
          var pw2 = $('#register-password-2').val().trim();
          var userName = $('#register-username').val().trim();

          if(pw1 != pw2) {
            alert("Passwords do not match");
          } else if (!userName) {
            alert("Please enter a username")
          } else if (pw1.length < 8) {
            alert("Password must be at least 8 characters");
          }else {
            registerNormalAccount(userName, pw1,userObj.userId,userObj.activationHash).then(function(rslt) {
              if(rslt && rslt.accountActivation == "activated") {
                //TODO: Flash an "Account Created!" for two seconds
                sessionStorage["userId"] = userObj.userId;
                window.location.href = windowLocationWithoutArguments;
              }
            })
          }
        });

      }
    });
  }  
  
  

  $('html').on('click',function() {
    if(!audios.mainsong.paused) {
      audios.mainSongPlayed = true;
    } else {
      //This will be ignored due to browsers forcing the users to interact first
      //But this should eventually srtart the song...
      //and when it does mainSongPlayed will get flipped on the next time
      if(!audios.mainSongPlayed) {
        playAudio("mainsong");
      }
    }

    $('#show-reason-outcome').hide();
    $('#choose-your-character').hide();
    $('#replace-existing-powerup').hide();

    //Hide the "Welcome" popup
    if(!showingSplashLogo) {
      $('#thank-you-for-your-interest').hide();
    }
  })
  

  $('#login').on('click', function() {
    $('#login-div').show();
    $('#start-button').hide();
    return false;
  })

  $('#login-button').on('click',function() {
    $('.loading-container').show();
    var login = $("#login-username").val().trim();
    var pw    = $('#login-password').val().trim();

    if(!login) {
      alert("Please enter username");
      $('.loading-container').hide();
      return false;
    }
    if(!pw) {
      alert("Please enter password");
      $('.loading-container').hide();
      return false;
    }
    if(pw.length < 8) {
      alert("Invalid username/password");
      $('.loading-container').hide();
      return false;
    }
    
    loginNormalAccount(login,pw).then(function(rslt) {
      $('.loading-container').hide();
      if(rslt.userId) {
        sessionStorage["userId"] = rslt.userId;
        alert("Login Successful");
        window.location.href = windowLocationWithoutArguments;
      } else {
        //TOOD: replace alerts with a more friendly looking UI component
        alert("Invalid username/password");
      } 
    });
    return false;
  });

  $('#logout').on('click', function() {
    sessionStorage.clear();
    window.location.href = windowLocationWithoutArguments;
    return false;
  })


  $('#p0-content').on('click', function() {
    $('#login-div').hide();
    $('#apply-settings').hide();
    $('#choose-your-character').hide();    
    if(!sessionStorage["userId"]) {

      //Don't show it if we are in the middle of loading the user...
      if(!loadingUser || currentlyRegistering) {
        $('#start-button').show();
      }
    }
  })

  if(sessionStorage["userId"]) {
    $('#start-button').hide();
    loadingUser = true;
    getUserObj(sessionStorage["userId"]).then(function(data) {
      userObj = data;
      //Off for now until the audio api's get cheaper
      userObj.voiceAudioOn = false;
      loadingUser = false;
      if(userObj.finishedIntro) {
        $('#start-button').hide();
        $('#battle').show();
        $('#characters').show();
        $('#settings').show();    
      } else {
        $('#start-button').show();
        $('#battle').hide();
        $('#characters').hide();
        $('#settings').hide();    
      }
      $('#login').hide();
      $('#logout').show();  
      $('.loading-container').hide();
    })



  } else {
    $('#login').show();
    $('#logout').hide();
    $('#battle').hide();
    $('#characters').hide();
    $('#settings').hide();
  }
  
	//front.send('get-data', app.getPath('userData'));


  book.numOfPapers = $('.paper').length;
  book.maxLocation = book.numOfPapers + 1;


  loadAudio("mainsong", "../assets/An-Epic-Story.mp3");
  loadAudio("clicksound", "../assets/mixkit-classic-click-1117.wav")
  loadAudio("pageturnsound", "../assets/mixkit-page-turn-single-1104.wav")
  loadAudio("introduction-voice", "../assets/voice/Deep in the COSM.wav")
  loadAudio("introduction2-voice", "../assets/voice/Hello I am.wav")
  loadAudio("tournament-voice", "../assets/voice/You may enter.wav")
  loadAudio("ladder-voice", "../assets/voice/Or test your.wav")
  loadAudio("architype-voice", "../assets/voice/First things first.wav")
  loadAudio("name-voice", "../assets/voice/Great now give.wav")
  loadAudio("desc-intro", "../assets/voice/Now is the most important.wav")
  loadAudio("power-intro", "../assets/voice/start at 5.wav")
  
  $('#loading-page').prepend('<img src="../assets/loadinggifs/' + randomIndexes[0] + '.gif" class="load-image" id="load-image-' + randomIndexes[0] + '"></img>');
  currentLoadImage = 0;


  //The dice doesn't translate for some reason in the html file so just doing the update here...
  $('.dice').html('&#127922;');
  

  window.setTimeout(function() {
       $('#splash-logo').hide();
       $('#splash-backscreen').hide();
       playAudio("mainsong");
       if(sessionStorage["userId"] && userObj.userId.indexOf("U") == 1) {
         //We are still loading the userId... its taking more time than expected
         $('.loading-container').show();
       }
       showingSplashLogo = false;
    },5000)

    $('#description-architype').on('keyup',function() {
       if($(this).val().trim().replace(/[^A-za-z]/g,'')) {
         $('#comment-on-architype').removeAttr('disabled',false)
       } else {
         $('#comment-on-architype').prop('disabled',true);         
       }
    });

    $('#char-name').on('keyup',function() {
       if($(this).val().trim().replace(/[^A-za-z]/g,'')) {
         $('#generate-description').removeAttr('disabled',false)
       } else {
         $('#generate-description').prop('disabled',true);         
       }
    });

  
    $("#start-button,.continue-button,#back-page-btn,#settings,#gear-settings,#link-to-show-reason-outcome").on('click',handleClicks)

  google.accounts.id.initialize({
    client_id: "766962979530-0qlpihuhsl99ct1oulr2ofc14sftl5rj.apps.googleusercontent.com",
    callback: handleCredentialResponse
  });

  google.accounts.id.renderButton(
      document.getElementById("buttonDiv"),
      { theme: "outline", size: "large" }  // customization attributes
    );

  google.accounts.id.renderButton(
    document.getElementById("buttonDiv2"),
    { theme: "outline", size: "large" }  // customization attributes
  );

    $('#voice-audio-on-off').on('change',function() {
      if($(this).prop('checked')) {
        userObj.voiceAudioOn = true;
      } else {
        userObj.voiceAudioOff = false;
      }
    })

    if(userObj.voiceAudioOn === undefined) {
      userObj.voiceAudioOn = true;
    }

})


function handleClicks(e) {
  playAudio("clicksound");
  var id = $(this).prop('id');




  //Handle just the sounds
  let voicePlay;


  if(['start-button','go-to-intro2','go-to-intro-tournament','go-to-architype-intro','go-to-name-creation','go-to-description-comment','continue-to-writing-the-description',
      'link-to-show-reason-outcome','first-battle-login','comment-on-architype']
      .includes(id)) {

    stopAudio('introduction-voice');
    stopAudio('introduction2-voice');
    stopAudio('architype-voice');
    stopAudio('name-voice');
    stopAudio('desc-intro');

  }

  if(id == 'first-battle-login') {
    $('#login-div').show();
    $('#start-button').hide();
    return false;
  }

  //This is handled if appLocation is in Battle or in intro
  if(id =="go-to-story-part-2") {
    if(storyLogic.chunks[1].loadStatus == 'finished') {
      playStory(2);
      goNextPage()  
    } else {
      showLoading(11.2);
      goSpecificPage('10');
    }
    return;
  }
  else if(id =="go-to-story-part-3") {
    if(storyLogic.chunks[2].loadStatus == 'finished') {
     playStory(3);
     goNextPage(11.3)
    } else {
      showLoading(11.3);
      goSpecificPage('10');
    }
    return;
  }
  else if(id =="go-to-story-part-4") {
    if(storyLogic.chunks[1].loadStatus == 'finished') {
      playStory(4);
      goNextPage()
      return;  
    } else {
      showLoading(11.4);
      goSpecificPage('10');
    }
    return;
  } 
  else if (id=='go-to-after-fight-page') {
    playAudio("mainsong");
    goNextPage();
    return;
  }



  if(id == "settings" || id== "gear-settings") {
    $('#apply-settings').show();
    return false;
  }


  let disableButton;
  let audioVoiceSounded;

  var disableTheButton = function() {
    disableButton = $('#' + disableButton);
    if(!userObj.developerMode) {
      disableButton.hide();
    }
    setTimeout(function() {disableButton.show()}, audios[audioVoiceSounded].buffer.duration * 1000);
  }

  if(id=="start-button") {
    //In case the page loaded w/o the music... start audio now..
    
    audioVoiceSounded = playAudio('introduction-voice',500,disableTheButton);

    disableButton = 'go-to-intro2';

    appLocation = 'intro';

    $('#gear-settings').show();

  }

  if(appLocation != 'intro' && appLocation != 'characters' && appLocation != 'Battle') {
    //Exit this handler... the back button was clicked somewhere else in the app
    return false;
  }

  if(appLocation == 'intro') {
    //Handle intro sounds
    if (id =="go-to-intro2") {
      audioVoiceSounded = playAudio('introduction2-voice',500,disableTheButton);
      disableButton = 'go-to-intro-tournament';
    }else if (id == "go-to-intro-tournament") {
      audioVoiceSounded = playAudio('architype-voice',500,disableTheButton);
      disableButton = 'go-to-architype-intro';
    }else if(id == "go-to-architype-intro") {

    }else if(id =="go-to-name-creation") {
      audioVoiceSounded = playAudio('name-voice',500,disableTheButton);
      disableButton = 'generate-description';
    }else if(id =="generate-description") {
      audioVoiceSounded = playAudio('desc-intro',500,disableTheButton);      
      disableButton = 'continue-to-writing-the-description';
    }else if (id=="go-to-description-comment") {

    }
  }
        

  //Handle everything else
  if(id == 'suggest-name') {
    suggestName($('#description-architype').val());
    return;
  } else if(id =='suggest-architype') {
    var rn = Math.floor(Math.random() * architypes.length)
    var str = architypes[rn]
    $('#description-architype').val(str);
    $('#comment-on-architype').prop('disabled',false);        
    return;
  } else if (id =='comment-on-architype') {
    $('#go-to-name-creation').hide();
    $('#try-another-architype').hide();
    $('#quick-architype-comment').html('<br /><br /><br />Loading response (can take up to a minute)');
    commentOnArchitype($('#description-architype').val());
  }
  else if (id =='generate-description') {
    $('#char-name2').text($('#char-name').val());
    $('#char-name3').text($('#char-name').val());  
    if(!userObj.characters) {
      userObj.characters = {};
    }
    userObj.characters[$('#char-name').val()] = {
      architype: $('#description-architype').val(),
      rating: 1200
    };


    storyLogic.currentCharacter = $('#char-name').val();
    storyLogic.characterArchetype = $('#description-architype').val();
    suggestDescription(storyLogic.characterArchetype);
    if(appLocation == "characters") {
      goSpecificPage(8);
      return false;  
    }
  } else if (id == 'go-to-description-comment') {
    userObj.characters[storyLogic.currentCharacter].description = $('#describe-text-area').val();
    if(!    userObj.characters[storyLogic.currentCharacter].stories) {
      userObj.characters[storyLogic.currentCharacter].stories = [];
    }
    if(appLocation == 'characters') {
      goSpecificPage(0);

      //TODO: display a "created" message on the main page for like 3-5 seconds. It should look "pretty"
      alert("Character Created!");
      saveUser()
      return false;
    }
  } else if(id == 'link-to-show-reason-outcome') {
    $('#show-reason-outcome').html('The AI Story Teller interpretted the battle as objectively as possible.<br /><br />Winner: ' + storyLogic.winnerParagraph);
    $('#show-reason-outcome').show();
    return false; //returning false so it doesn't bubble up into the body
  } else if(id == 'powerup-choose-1' || id == 'powerup-choose-2' || id=='powerup-choose-none') {
    var powerups = userObj.characters[storyLogic.currentCharacter].powerups;
    if(!powerups) {
      powerups = [];
    }

    var choice = id.match(/[^\-]+$/)[0]
    if(choice == 'none') {
      //DO Nothing
    } else {
      storyLogic.chosenPowerup = {
        description: storyLogic["powerup" + choice],
        name: storyLogic["powerupName"  + choice],
        obtainedFrom: storyLogic.opponent
      }

      if(powerups.length < 3) {
        powerups.push(
          storyLogic.chosenPowerup    
        );
      }
      else {
        $('#replace-existing-powerup').html("Choose a powerup to replace:\n");
        for(var i = 0; i < powerups.length; i++) {
          $('#replace-existing-powerup').append('<div class="replace-powerup" data-powerupidx="' + i + '"><b>' + powerups[i].name + '</b>\n' + powerups[i].description + '</div>') 
        }
      
        $('.replace-powerup').on('click', function() {
          userObj.characters[storyLogic.currentCharacter].powerups.splice(1,$(this).data('powerupidx'),storyLogic.chosenPowerup);
          $('#replace-existing-powerup').hide();
          $('#back-page-btn').show();
          goSpecificPage(0);
          alert("Character Updated!");
          saveUser();
        });
      
        $('#replace-existing-powerup').show();
        return false;
      }
    }
    
    userObj.characters[storyLogic.currentCharacter].powerups = powerups;
    
    if(!userObj.finishedIntro) {
      userObj.finishedIntro = true;
      goSpecificPage(13);
      //The user is not logged in. Most likely a brand new user... but we will handle a returning user on page 13 just as well...
      //Ugh the concept of a user who can only keep 2 characters since its a 'trial' account. Do they get to keep their new user? Right?
      return;
    } else {
      goSpecificPage(0);

      //TODO: display a "saved" message on the main page for like 3-5 seconds. It should look "pretty"
      alert("Character Updated!");
      saveUser()
      return;
    }

  }

  
  

  if($(this).hasClass('load-first-story')) {
    var characterName = $(this).data("character-name");
    if(battle && battle.opponents) {
      var opponent;
      for(var i = 0; i < battle.opponents.length; i++) {
        if(battle.opponents[i].name == characterName) {
          opponent = battle.opponents[i];
          break;
        }
      }
      writeStory(characterName,opponent.description, false, opponent.rating,opponent.powerups)
    } else {
      writeStory(characterName,undefined, true);
    }
  }
  
  if(id == 'back-page-btn' || id == 'try-another-architype') {
    if(appLocation == "characters" && id =='back-page-btn' && book.currentLocation == 5) {
      goSpecificPage(0);
    }
    else if(appLocation == "characters" && id =='back-page-btn' && book.currentLocation == 8) {
      delete userObj.characters[$('#char-name').val()];
      goPrevPage();
    } 
    else if(appLocation =="characters" && book.currentLocation == 0) {
      $('#char-book').hide();
      goSpecificPage(0);
    }
    else if(appLocation == "Battle") {
      goSpecificPage(0);
    }else if(book.currentLocation > 0){
      goPrevPage()
    }
  } 
  else {
    goNextPage()      
  }
  if(book.currentLocation > 0 ){
    $('#back-page-btn').show();
  } else {
    $('#back-page-btn').hide();        
  }

}


function showParagraph(part, pNum) {
  //Todo, replace with add-class to make its apppearance shnazzy
  $('#story-paragraph-' + part + '-' + pNum).show();
}

async function playStory(part) {
  //"Mute" any previous stories if a story is being told. this is for the playht api
  $('[id^="storyVoice"]').each(function() {
    this.volume = 0;
  });
  //"Mute the previous stories... this is for the 11labs api"
  if(part > 1) {
    for(var i = 0; i < audios["storyVoice" + (part-1)].length; i++) {
      audios["storyVoice" + (part-1)][i].stop();
    }

  }

  stopAudio("mainsong");
  
  
  if(part == 1) {
    if(!userObj.developerMode) {
      $('#go-to-story-part-2').hide();
    }  
    await delay(1000);

    if(userObj.voiceAudioOn) {

      if(audioEngine == 'playht') {
        $('body').append('<audio id="audio-title" src="' + audios["title"] + '"></audio>');
              
        await $('#audio-title')[0].play;
        await delay($('#audio-title')[0].duration * 1000 + 1000)  
      
      }
    }

  } else if (part == 2) {
    if(!userObj.developerMode) {
      $('#go-to-story-part-3').hide();      
    }
    if(userObj.voiceAudioOn) {
      await delay(500);        
    }
  } else if (part == 3) {
    if(!userObj.developerMode) {
      $('#go-to-story-part-4').hide();      
    }
    if(userObj.voiceAudioOn) {
      await delay(500);    
    }
  } else if (part == 4) {
    if(!userObj.developerMode) {
      $('#go-to-after-fight-page').hide();      
    }
    if(userObj.voiceAudioOn) {
      await delay(500);
    }
  }

  var theChunkText = storyLogic.chunks[part-1].text;
  var chunks;
  if(userObj.voiceAudioOn) {
    //Go at approximately the speed of the audio... one sentence at a time.
    chunks = theChunkText.match(/[^\.!\?]+[\.\!\?]"?\s*/g);
  } else {
    //Break down words at a time....
    chunks = theChunkText.match(/[^\s]+\s?/g);
  }

  
  var timing = 0;

  if(part == 1) {
    timing += storyLogic.title.length * 0.05774278215 * 1000 + 500;
  }

  var timings = [];

  $('#story-div-' + part).hide()
  for(var i = 0; i < chunks.length; i++) {


    timings.push(timing);
    
    if(i == chunks.length - 1) {
        //Paragraph right before the story text....
        window.setTimeout('$("#story-div-' + part + '").show()', timing + 6000); 
    }


    var readingSpeed;
    if(userObj.voiceAudioOn) {
      readingSpeed = 1.00 //paragraphs show up slightly faster than average speech
                     //TODO Add a "reading speed" option in the settings
    } else {
      readingSpeed = .9; //The user can be a relatively fast reader, so the paragraphs show up faster here
                   //TODO: refactor this code so that the story comes out word by word
    }
    timing += (chunks[i].length * 0.05774278215 * readingSpeed) * 1000;
    

    console.log('paragraph timing', timing);

    chunks[i] = '<span id="story-paragraph-' + part + '-' + i + '" style="display:none;">' + chunks[i] + '</span>';

  }

  $("#story-text-" + part).html(chunks.join('').replace('\n','<br />'));

  for(i = 0; i < timings.length; i++) {
    window.setTimeout('showParagraph(' + part + ',' + i + ')', timings[i]);
  }

  if(userObj.voiceAudioOn) {
    let audiosArr = audios["storyVoice" + part];

    if(audiosArr) {
      if(audioEngine == 'playht') {
        for(var i = 0; audiosArr[i]; i++) {
          $('body').append('<audio id="storyVoice'+part+'-'+i+'" src="' + audios["storyVoice"+part][i] + '"></audio>');
        }
        audiosArr["length"] = i;
      
        for(var i = 0; i < audiosArr.length; i++) {
          var storyVoice = $('#storyVoice' + part + "-" + i)[0];
          $('#storyVoice' + part + "-" + i)[0].volume = 1;
          await storyVoice.play();
          var duration = storyVoice.duration * 1000 + 
                         (i == audiosArr.length -1? 0 : 500);
          await delay(duration);
         }
         $('#go-to-story-part-2').show();
         $('#go-to-story-part-3').show();      
         $('#go-to-story-part-4').show();      
         $('#go-to-after-fight-page').show();
      }   
      else {
        if(part == 1) {
          //audiosArr is NOT an array (it is not)... because I built it as an object. An object that is indexed. But not an actual array.
          //Which means we cannot use the simple array function unshift...
          //So instead we will just do this.
          for(var i = audiosArr.length; i > 0; i--) {
            audiosArr[i] = audiosArr[i-1]
          }
          audiosArr[0] = audios["title"].audioBuffer;
          audiosArr.length = audiosArr.length + 1;
        }

        let idx = 0;
        for(var i = 0; i < audiosArr.length;i++ ) {
          audiosArr[i].onended = async function (){
            console.log('trace, callback from audio ended, idx',idx)
            idx++;
            if(audiosArr[idx]) {
              await delay(500);
              try {
                audiosArr[idx].connect(audioContext.destination)                
                audiosArr[idx].start(0);
              }catch(e) {
                if(isMobile) {
                  alert("Error starting next audio, audiosArr[idx]: " + audiosArr[idx]);
                }        
              }
            } else {
              $('#go-to-story-part-2').show();
              $('#go-to-story-part-3').show();      
              $('#go-to-story-part-4').show();      
              $('#go-to-after-fight-page').show();        
            }
          }  
        }
        try {
          audiosArr[0].connect(audioContext.destination)
          audiosArr[0].start(0);
        }catch(e) {
          if(isMobile) {
            alert("Error starting audio, audiosArr[0]: " + audiosArr[0]);
          }  
        }
      }
    }
    else {
      //No audio was generated for this story when it was first built
      //Since the user hase voiceAudio turned on just tell him/her...
      //TODO: Audio for saying 'this story was generated without voice-audio turned on', or something to that effect
    }
  }
}




window.setInterval(function() {
  if(storyLogic.runThroughLoadingImages) {
    if(randomIndexes[(currentLoadImage)] == 6 ||
       randomIndexes[(currentLoadImage)] == 29) {
      currentLoadImage++;
    }
    
    $('#loading-page').prepend('<img src="../assets/loadinggifs/' + randomIndexes[(currentLoadImage)] + '.gif" class="load-image" id="load-image-' + randomIndexes[(currentLoadImage)] + '"></img>');
    $('.load-image').hide();  
    $('#load-image-' + randomIndexes[(currentLoadImage)]).show();

    currentLoadImage++;
    if(currentLoadImage == randomIndexes.length) {
      currentLoadImage = 0;
    }
  }
}, 7000
)

  
window.goNextPage = function() {
  var $nextPage = null;
  var infiniteLoopBuster = 0;
  while(!$nextPage || !$nextPage.length) {
    book.currentLocation += .1;
    book.currentLocation = Math.round(book.currentLocation*10)/10;
    var search = ('#p' + book.currentLocation).replace('.','-')
    console.log(search);
    $nextPage = $(search);
    if(infiniteLoopBuster++ > 100) {
      console.log('An error occurred atempting to go to next page');
      return;
    }
  }

  $nextPage.addClass("flipped").css('zIndex', (book.currentLocation*10));
  
}

window.goPrevPage = function() {
  $('#p' + ("" + book.currentLocation).replace('.','-')).removeClass("flipped");
  
  var $nextPage = null;
  var infiniteLoopBuster = 0;
  while(!$nextPage || !$nextPage.length) {
    book.currentLocation -= .1;
    book.currentLocation = Math.round(book.currentLocation*10)/10;
    var search = ('#p' + book.currentLocation).replace('.','-')
    console.log(search);
    $nextPage = $(search);
    if(infiniteLoopBuster++ > 100) {
      console.log('An error occurred atempting to go to next page');
      return;
    }
  }


  
}

//Goes to a speicifc page... 
//Note: doesn't flip the pages inbetween
window.goSpecificPage = function(location) {
  //TODO: There may be a bug around here related to the zIndex of prior pages not being properly set above or below
  //      the bug may rear its ugly head in unexpected ways...
  if(location < book.currentLocation) {
    $('.flipped').removeClass('flipped');
  }

  book.currentLocation = Number(location);
  var search = ('#p' + ("" + location).replace('.','-'))
  $nextPage = $(search);

  $nextPage.addClass("flipped").css('zIndex', (book.currentLocation * 10));
  
}


/*
front.on('get-data-result', function(msg){
	//if(msg != "@@"){
		let data = msg.split('@');
    console.log("data received from android device", data);
	//}
})
*/

// here define some functions to save the data into storage and get back them

function save(){
	let author = document.getElementById('author').innerHTML;
	let title = document.getElementById('title').innerHTML;
	let text = document.getElementById('text').innerHTML;
	let msg = author + "@" + title + "@" + text;
	// let make a complete string of message seperated by @
	// send this msg and path where to save file to back process to save in external storage of android
	front.send('save-data',app.getPath('userData'), msg)
}


