function escapeHtml(unsafe)
{
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
 }

function makeGPTInternal(prompt, maxTok=4097, tempr = 0.7, frequenceyPenalty = 0.0,suffix) {


  return new Promise(function (resolve, reject) {
      var numPromptTok = mod.encode(prompt + suffix).length;
      
      const xhr = new XMLHttpRequest();
      xhr.open('POST',
          'https://api.openai.com/v1/completions');
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('Authorization', 'Bearer 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');
      const data = {
          model: 'text-davinci-003',
          prompt: prompt,
          temperature: tempr,
          max_tokens: (maxTok - numPromptTok),
          frequency_penalty: frequenceyPenalty,
          presence_penalty: 0,
          suffix: suffix
      };
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

async function makeGPT(prompt, maxTok=4097, tempr = 0.7, frequenceyPenalty = 0.0,suffix) {
  for(var i = 0; i < 5; i++) {
    try {
      var rslt = await makeGPTInternal(prompt, maxTok, tempr, frequenceyPenalty, suffix);
      return rslt; 
    } catch(e) {
      console.log("Error calling GPT try #" + i,e);
      await delay(5000);//Wait 5 seconds and then try again
    }
  } 
}

async function commentOnArchitype(architype) {
  storyLogic.showLoadingTextForQAC = window.setInterval(function() {
    $('#quick-architype-comment').html($('#quick-architype-comment').html() + '. ')
  },1000);

  var data = await makeGPT('In one sentence, say something interesting about the character architype of "' + architype + '":',
          100,
          1);

  var comment = data.choices[0].text;
  console.log(comment);
  
  //var voiceStr = 'Perhaps ' + comment;

  //var soundUrl = await getSoundUrl(voiceStr);
  clearInterval(storyLogic.showLoadingTextForQAC);

  $('#architype-comment-voice').remove();
  //$('body').append("<audio id=\"architype-comment-voice\" src=\"" + soundUrl + "\"></audio>")
  //var architypeVoice = $('#architype-comment-voice')[0];
  //await architypeVoice.play();
  $('#quick-architype-comment').html('<br /><br/><br />Perhaps ' + escapeHtml(comment)) 
  //await delay(architypeVoice.duration * 1000 + 500)
  //architypeVoice = $("#architype2-voice")[0];
  //await architypeVoice.play();
  $('#quick-architype-comment').html(
    $('#quick-architype-comment').html() +
    '<br><br/>Interesting! If you\'re satisfied with this architype click \'Confirm\'<br /><br />');
  //await delay(architypeVoice.duration*1000);
  $('#go-to-name-creation').show();
  $('#try-another-architype').show();

}

async function suggestName(characterArchetype) {
  var currName =  $('#char-name').val().trim();
  var otherThan = ' (other than "' + currName + '")'
  var data = await makeGPT('Suggest a name for a character "' + characterArchetype +
          (currName != "" ? otherThan : "") + 
          ':',
          30,
          1);


  //Data cleanse
  var name = data.choices[0].text;
  console.log(name);
  name = name.trim();
  if(name.split('\n').length > 1) {
    name = name.split('\n')[0];
    //Get rid of 1. 2. 3.
    name = name.replace(/^[1,a][,\.]/,'')
  }
  //Get rid of weird characters
  name = name.replace(/[^A-Za-z0-9 ,]/g,'').trim();

  console.log(name);
  $('#char-name').val(name);
  $('#generate-description').prop('disabled',false);      
}

async function suggestDescription(characterArchetype) {
      $('#describe-text-area').prop('readonly',true);
      $('#describe-text-area').val('Loading');
      let interval = window.setInterval(function() {
        $('#describe-text-area').val($('#describe-text-area').val() + '.');
      },175)
      
      /*
      var data = (await makeGPT('In a single paragraph, write a brief funny and epic character sketch for ' + storyLogic.currentCharacter + ', ' + characterArchetype + ', including a backstory, the character\'s motivations and goals, personality, specific skills and resources. (Use present tence) (Use proper nouns for people/places):',
             undefined,
             1, 
             0.00)).choices[0].text.trim()
      */
      var data2 = (await makeGPT(
              'Write three different epic fictional character sketches for ' + storyLogic.currentCharacter + ', ' + characterArchetype + ' (Use present tence) (Use proper nouns for people):',
              undefined,
              1,
              0.00
            )).choices[0].text;
            
      //Pick the longest one
      var option1 = data2.split('1')[0].trim();
      var option2 = data2.split('2')[1].split('3')[0].trim();
      var option3 = data2.split('3')[1].trim()
      
      if(option1.length > option2.length && option1.length > option3.length) {
        data2 = option1;
      } else {
        if(option2.length > option3.length) {
          data2 = option2;
        } else {
          data2 = option3;
        }
      }

      data2 = data2.replace(/^(\:|\.| \-)/,"").trim() //Get rid of the "3" or "Two" at the start
      

      //Data cleanse
      var desc = data2; //data
      console.log(desc);

      //desc = desc.replace(/[^.]+$/,'');
      //For now only grab the first paragraph
      //desc = desc.split('\n\n')[0];
      clearInterval(interval);
      $('#describe-text-area').prop('readonly',false); 
      $('#describe-text-area').val(desc)      

}

/*
async function commentOnDescription(description) {
  
  storyLogic.showLoadingTextForQAC = window.setInterval(function() {
    $('#quick-description-comment').html($('#quick-description-comment').html() + '.')
  },1000);

  var data = await makeGPT(description + '\n---\n' + 'In a single sentence, say something crazy / imaginative / wacky / cool about the character above:',
          200,
          .7);

  var comment = data.choices[0].text;
  console.log(comment);

  //lower-case first letter
  comment = comment.charAt(0).toUpperCase() + comment.slice(1);
  
  var voiceStr = 'Sounds to me like ' + comment + '\n\nCool.';

  var soundUrl = await getSoundUrl(voiceStr);
  $('#architype-comment-voice').remove();
  $('body').append("<audio id=\"architype-comment-voice\" src=\"" + soundUrl + "\"></audio>")
  $('#quick-description-comment').html('<br />Sounds to me like ' + escapeHtml(comment) + ' Cool.<br /><br />');

  clearInterval(storyLogic.showLoadingTextForQAC);
      
  await $('#architype-comment-voice')[0].play();
  await delay($('#architype-comment-voice')[0].duration * 1000 + 500);
  await $('#power-intro')[0].play();
  await delay($('#power-intro')[0].duration * 1000 - 5000);
    
  $('#go-to-pick-first-opponent').show();
}
*/
 
var currentLoadStep = 0;
function incrementLoadingBar() {
  currentLoadStep++;
  if((currentLoadStep/numLoadSteps)*100 >= 100) {
    currentLoadStep--;
    currentLoadStep += (numLoadSteps + currentLoadStep)/2;
  }
  $('.meter > span').css('width', Math.round((currentLoadStep/numLoadSteps)*100) + '%');
}

async function writeStory(opponent, opponentDescription, isIntroStory) {

      if(userObj.voiceAudioOn) {
        numLoadSteps = 26;      
      } else {
        numLoadSteps = 18;
      }

      storyLogic.storyFinished = false;
      $('#loading-page').show();
      let i = 1;
      let interval = window.setInterval(function() {
        if(storyLogic.storyFinished == true) {
          clearInterval(interval);
          goNextPage()      
          playStory(1);
          storyLogic.runThroughLoadingImages = false;
        } else {
          storyLogic.runThroughLoadingImages = true;
        }
      },5000) /*every 5 seconds change the gif. TODO, always start from the previous gif. Keep index saved in long term storage.*/

      incrementLoadingBar();
      

      storyLogic.opponent = opponent;
      storyLogic.characterDescription = storyLogic.currentCharacter + ':\n' + userObj.characters[storyLogic.currentCharacter].description;

      if(isIntroStory) {
        switch(storyLogic.opponent) {
          case 'Merlin': storyLogic.opponentDescription = 'Merlin:\nThe wize mage of King Arthur\'s court'
                break;
          case 'Farmer Joe': storyLogic.opponentDescription = "Farmer Joe:\n\"Get away from my goats, y'darn theiven good fer nothin' rascal! I've got a rootin' tootin' tractor and a cow named Bessey comin' ter ram your rawhide!\""
                break;
          case 'Jace "The Ace"': storyLogic.opponentDescription = 'Jace The Ace:\nBorn into a family of bounty hunters, Jace "The Ace" Orion inherited his father\'s signature weapon, a plasma cannon capable peircing the toughest armor. Jayce is known for taking any job, no matter the risk, if the pay is good.'
                break;
        }
     } else {
      storyLogic.opponentDescription = opponent + ":\n" + opponentDescription;
     }

      var bothCharactersTopOfPrompt = 'Characters:\n' + storyLogic.characterDescription + '\n\n' + storyLogic.opponentDescription + '\n---\n';

      storyLogic.backStory = (await makeGPT(
        bothCharactersTopOfPrompt +
        'Based on the character descriptions above, come up with three different creative backstories that explain the bitter rivalry between ' + storyLogic.currentCharacter +' and ' + storyLogic.opponent +':',
        undefined,
        .7,
        0.00
      )).choices[0].text;
      incrementLoadingBar();      
      
      storyLogic.backStory = storyLogic.backStory.trim().split('\n\n')[1].trim() //Choose middle one arbitrarilly
      storyLogic.backStory = storyLogic.backStory.replace(/^[^\s]+/,"").trim() //Get rid of the "2." or "Two" at the start

      storyLogic.chunks = [{
        image: null,
        text: null,
        audio: null
      },{
        image: null,
        text: storyLogic.backStory,
        audio: null
      },{
        image: null,
        text: null,
        audio: null
      },{
        image: null,
        text: null,
        audio: null
      }];
      

storyLogic.chunks[0].text = 
(await makeGPT(
`#Award Wining Fan Fiction
Write an epic fan fiction depicting the rivalry between ${storyLogic.currentCharacter} and ${storyLogic.opponent} and the wacky showdown that ensued
---
${bothCharactersTopOfPrompt}

Step 1. Describe the scene. Then contrast ${storyLogic.currentCharacter}'s and ${storyLogic.opponent}'s appearance and moods.
`, undefined,.7,0.00,
`
Step 2. Backstory
${storyLogic.backStory}
Step 3. A line of dialog from each character (in the style of the two characters).
TBD
Step 4. Fas forward to the conflict. Describe the two character's attacks. Come up with something unexpected that elevates the tension.
TBD
Step 5. Play-by-play showdown. The two characters using their respective skills and resources. Leading up to a moment of crisis. The fight's pivotal moment and resolution.
TBD
The End`
)).choices[0].text.replace('TBD','').replace(/\n{3,}/g,'\n\n')
incrementLoadingBar();


storyLogic.chunks.push(
(await makeGPT(
`#Award Wining Fan Fiction
Below is an epic fan fiction depicting the rivalry between ${storyLogic.currentCharacter} and ${storyLogic.opponent} and the wacky showdown that ensued
---
${bothCharactersTopOfPrompt}

${storyLogic.chunks[0]}

${storyLogic.backStory}

Step 1: Fast forward to the conflict. Write a few clever lines of dialog between ${storyLogic.currentCharacter} and ${storyLogic.opponent}`, undefined,.7,0.00,
`
Step 2. Describe the two character's attacks. Come up with something unexpected that elevates the tension.
<Complete Step 2 Here>
Step 3. Play-by-play showdown. The two characters using their respective skills and resources. Leading up to a moment of crisis. The fight's pivotal moment and resolution.
<Complete Step 3 Here>
The End`
)).choices[0].text.replace('TBD','').replace(/\n{3,}/g,'\n\n'))
incrementLoadingBar();

//For some reason GPT's quotes aren't breaking into new paragraphs. Fixing that here.
storyLogic.chunks[1] = storyLogic.chunks[1].replace(/\n/g,'\n\n').trim().replace(/\n{3,}/g,'\n\n');

/*
storyLogic.chunks.push(
(await makeGPT(
`${bothCharactersTopOfPrompt}
#Award Wining Fan Fiction
Below is an epic fan fiction depicting the rivalry between ${storyLogic.currentCharacter} and ${storyLogic.opponent} and the wacky showdown that ensued

1. Describe the scene/scenery. Then contrast the two character's appearance and moods.
${storyLogic.chunks[0]}
2. Threatening quote by one character, clever retort by the other (in the style of the two characters).
${storyLogic.chunks[1]}
3. Backstory
${storyLogic.backStory}
4. Describe a challenge one of the two characters brought upon the other to get to this moment`, undefined,.3,0.00,
`
5. Fas forward to the conflict. Describe the two character's attacks. Come up with something unexpected that elevates the tension.
TBD
6. Play-by-play showdown. The two characters using their respective skills and resources. Leading up to a moment of crisis. The fight's pivotal moment and resolution.
TBD
7. In one sentence, write a lesson that can be learned from this showdown.
TBD
The End`
)).choices[0].text)*/

storyLogic.chunks.push(
(await makeGPT(
`#Award Wining Fan Fiction
Below is an epic fan fiction depicting the rivalry between ${storyLogic.currentCharacter} and ${storyLogic.opponent} and the wacky showdown that ensued
---
${bothCharactersTopOfPrompt}

${storyLogic.chunks[0]}

${storyLogic.backStory}

${storyLogic.chunks[1]}

Instructions: Given the story above, describe the epic showdown between ${storyLogic.currentCharacter} and ${storyLogic.opponent}. Finish the story.
`, undefined,1,0.00,
`
The End`
)).choices[0].text.replace('TBD','').replace(/\n{3,}/g,'\n\n'))
incrementLoadingBar();

/*
storyLogic.chunks.push(
(await makeGPT(
`${bothCharactersTopOfPrompt}
#Award Wining Fan Fiction
Below is an epic fan fiction depicting the rivalry between ${storyLogic.currentCharacter} and ${storyLogic.opponent} and the wacky showdown that ensued

${storyLogic.chunks[0]}

${storyLogic.backStory}

${storyLogic.chunks[1]}

${storyLogic.chunks[2]}

Given the story above, come up with the fight's pivotol moment between ${storyLogic.currentCharacter} and ${storyLogic.opponent} and its resolution.`, undefined,1,0.00,
`
The End`
)).choices[0].text.replace('TBD','').replace(/\n{3,}/g,'\n\n'))
*/
incrementLoadingBar();


/*
storyLogic.chunks.push(
(await makeGPT(
`${bothCharactersTopOfPrompt}
#Award Wining Fan Fiction
Below is an epic fan fiction depicting the rivalry between ${storyLogic.currentCharacter} and ${storyLogic.opponent} and the wacky showdown that ensued

1. Describe the scene/scenery. Then contrast the two character's appearance and moods.
${storyLogic.chunks[0]}
2. Threatening quote by one character, clever retort by the other (in the style of the two characters).
${storyLogic.chunks[1]}
3. Backstory
${storyLogic.backStory}
4. Fas forward to the conflict. Describe the two character's attacks. Come up with something unexpected that elevates the tension.
${storyLogic.chunks[2]}
5. Play-by-play showdown. The two characters using their respective skills and resources. Leading up to a moment of crisis. The fight's pivotal moment and resolution.
${storyLogic.chunks[3]}
6. In one sentence, write a lesson that can be learned from this showdown.`, undefined,.4,0.00,
`
The End`
)).choices[0].text.replace('TBD','').replace(/\n{3,}/g,'\n\n'))
*/

console.log('Story chunks from GPT creation calls', storyLogic.chunks);


      let numParagraphs = storyLogic.rawStoryText.split('\n\n').length;
      
      let firstImageStory = storyLogic.rawStoryText.split('\n\n').slice(0, Math.round(numParagraphs/4)).join('\n\n');
      let secondImageStory = storyLogic.rawStoryText.split('\n\n').slice(0, Math.round(numParagraphs * 2/4)).join('\n\n');
      let thirdImageStory  = storyLogic.rawStoryText.split('\n\n').slice(0, Math.round(numParagraphs * 3 /4)).join('\n\n');
      let fourthImageStory = storyLogic.rawStoryText;

      let imagePromptForCharacter;
      let imagePromptForCharacter2;
      let imagePromptForOpponent;
      let imagePromptForOpponent2;                     

      let imageForCharacter = '';
      let imageForOpponent = '';
      let imageForCharacter2 = '';
      let imageForOpponent2 = '';
      
      audios['storyVoice1'] = {};
      audios['storyVoice2'] = {};
      audios['storyVoice3'] = {};
      audios['storyVoice4'] = {};

      let numFinished   = 0;
      let totalSubparts = 0;

      storyLogic.loadingScreenFor = 11.1;



      
      window.handlePostStoryXHR = function(data,finishedFor,index) {
        numFinished++;
            if(finishedFor == 'Character') {
                  incrementLoadingBar();              
                  imageForCharacter = data;
            } else if(finishedFor == 'Character2') {
                  incrementLoadingBar();              
                  imageForCharacter2 = data;
            } else if(finishedFor == 'Opponent') {
                  incrementLoadingBar();              
                  imageForOpponent = data;
            } else if(finishedFor == 'Opponent2') {
                  incrementLoadingBar();              
                  imageForOpponent2 = data;
            } else if(finishedFor == 'part0') {
                  incrementLoadingBar();incrementLoadingBar();
                  audios['storyVoice1'][index] = data;
            } else if(finishedFor == 'part1') {
                  incrementLoadingBar();incrementLoadingBar();
              audios['storyVoice2'][index] = data;
            } else if(finishedFor == 'part2') {
                  incrementLoadingBar();incrementLoadingBar();
                  audios['storyVoice3'][index] = data;
            } else if(finishedFor == 'part3') {
                  incrementLoadingBar();incrementLoadingBar();
                  audios['storyVoice4'][index] = data;
            }  else if(finishedFor == 'title') {
              incrementLoadingBar(); 
              storyLogic.title = data.choices[0].text.trim();      
              if(userObj.voiceAudioOn) {
                //get audio for the title 
                totalSubparts++;
                getSoundUrl(storyLogic.title.replace(/"/g,''), "Abram").then(function(data){
                            console.log('Callback from getSoundUrl of Title')
                            console.log(data);
                            handlePostStoryXHR(data,'titleAudio')
                          })
              }
            }
            else if(finishedFor == 'titleAudio') {
              incrementLoadingBar();
              audios['title'] = data;
              storyLogic['soundTitleUrl'] = data;
            } 
            else if(finishedFor == 'winner') {
              incrementLoadingBar();
              storyLogic.winner = data.choices[0].text.trim();      
              storyLogic.winner = storyLogic.winner.match(/A|B/i)[0];      
            } 
            else if(finishedFor == 'imagePromptForCharacter') {
              incrementLoadingBar();
              imagePromptForCharacter = data.choices[0].text.trim();
              totalSubparts++;
              getImageUrl(imagePromptForCharacter).then(function(data) {handlePostStoryXHR(data,'Character')})
            } else if(finishedFor == 'imagePromptForCharacter2') {
              incrementLoadingBar();
              imagePromptForCharacter2 = data.choices[0].text.trim();
              totalSubparts++;
              getImageUrl(imagePromptForCharacter2).then(function(data) {handlePostStoryXHR(data,'Character2')})
            } else if(finishedFor == 'imagePromptForOpponent') {
              incrementLoadingBar();
              imagePromptForOpponent = data.choices[0].text.trim();
              totalSubparts++;
              getImageUrl(imagePromptForOpponent).then(function(data) {handlePostStoryXHR(data,'Opponent')})
            } else if(finishedFor == 'imagePromptForOpponent2') {
              incrementLoadingBar();
              imagePromptForOpponent2 = data.choices[0].text.trim();
              totalSubparts++;
              getImageUrl(imagePromptForOpponent2).then(function(data) {handlePostStoryXHR(data,'Opponent2')})
            }
            
            if(numFinished == totalSubparts) {
                  storyLogic.rawStoryText = escapeHtml(storyLogic.rawStoryText).trim();
                  storyLogic.storyImageUrls = ['','','','']
                  storyLogic.storyImageUrls[0] = imageForCharacter;
                  storyLogic.storyImageUrls[1] = imageForOpponent;
                  storyLogic.storyImageUrls[2] = imageForOpponent2;
                  storyLogic.storyImageUrls[3] = imageForCharacter2;

                  if(!userObj.characters[storyLogic.currentCharacter].stories) {
                    userObj.characters[storyLogic.currentCharacter].stories =  [];
                  }

                  storyLogic.id =  Math.floor(Math.random() * 10000000000000);
                  storyLogic.soundUrls = [audios['storyVoice1'], audios['storyVoice2'], audios['storyVoice3'], audios['storyVoice4']]

                  userObj.characters[storyLogic.currentCharacter].stories.push(storyLogic);

                  let story = storyLogic.rawStoryText.split('\n\n');
                  var story1 = story.splice(Math.round(numParagraphs/4),0,'<div id="story-div-1"><img src="' + imageForCharacter + '" class="story-img"></img>' +
                                                              '<center><span>' + storyLogic.currentCharacter + ' - AI Illustration</span></center></div>');
                  
                  var story2 = story.splice(Math.round(numParagraphs * 2/4) + 1,0,'<div id="story-div-2"><img src="' + imageForOpponent + '" class="story-img"></img>' +
                                                              '<center><span>' + storyLogic.opponent + ' - AI Illustration</span></center></div>');

                  var story3 = story.splice(Math.round(numParagraphs * 3/4) + 2,0,'<div id="story-div-3"><img src="' + imageForOpponent2 + '" class="story-img"></img>' +
                                                              '<center><span>' + storyLogic.opponent + ' - AI Illustration</span></center></div>');

                  var story4 = story.splice(Math.round(numParagraphs) + 3,0,'<div id="story-div-4"><img src="' + imageForCharacter2 + '" class="story-img"></img>' +
                                                              '<center><span>' + storyLogic.currentCharacter + ' - AI Illustration</span></center></div>');
                                                              
                  var j = 0;


                  for(var i = 0; i <= story.length; i++) {
                    if(story[i] && story[i].indexOf('class="story-img"') != -1) {
                      storyLogic.imageParts[j] = story[i];
                      j++;
                    } else {
                      storyLogic.storyParts[j] += '\n\n' + story[i];
                    }
                  }

                  //We add the image parts before the flip because of some weird bug rendering an image after the page turns
                  $('#p11-1-content').html('<center><b>' + storyLogic.title.trim() + '</b></center><br /><br />' + 
                                          '<p class="story-text" id="story-text-1"></p>' + 
                                           storyLogic.imageParts[0] +
                                          '<button class="continue-button" id="go-to-story-part-2" style="margin-bottom:5vh;margin-top:1vh;">Next Page</button>');
                  $('#p11-2-content').html('<center><b>' + storyLogic.title.trim() + '</b></center><br /><br />' + 
                                          '<p class="story-text" id="story-text-2"></p>' + 
                                           storyLogic.imageParts[1] +
                                          '<button class="continue-button" id="go-to-story-part-3" style="margin-bottom:5vh;margin-top:1vh;">Next Page</button>');

                  $('#p11-3-content').html('<center><b>' + storyLogic.title.trim() + '</b></center><br /><br />' + 
                                          '<p class="story-text" id="story-text-3"></p>' + 
                                           storyLogic.imageParts[2] +
                                          '<button class="continue-button" id="go-to-story-part-4" style="margin-bottom:5vh;margin-top:1vh;">Next Page</button>');

                  $('#p11-4-content').html('<center><b>' + storyLogic.title.trim() + '</b></center><br /><br />' + 
                                          '<p class="story-text" id="story-text-4"></p>' + 
                                           storyLogic.imageParts[3] +
                                          '<button class="continue-button" id="go-to-after-fight-page" style="margin-bottom:5vh;margin-top:1vh;">Next Page</button>');

                  $('#go-to-story-part-2,#go-to-story-part-3,#go-to-story-part-4,#go-to-after-fight-page').on('click', handleClicks);

                  let resultsBlurb = "";
                  if(storyLogic.winner == "B") {
                    resultsBlurb = "The AI determined that you lost. Better luck next time! Maybe try adjusting your character.";
                  }
                  else if(storyLogic.winner == "A") {
                      resultsBlurb = "You won!"
                  }

                  resultsBlurb += "<br />&lt;Insert cool 'unlocked bonuses' screen here.&gt;<br /><br />"

                  $('#p12-content').html(
                    '<center><b>Congratulations!</b><br />You have survived your first battle</center><br /><br />' + resultsBlurb + 
                    '<br /><br />To continue please register an account <a href="#" id="first-battle-login">here</a>')
                  
                  $('#first-battle-login').on('click',function() {
                    $('#login-div').show();
                    $('#start-button').hide();
                    return false;
                  })

                  storyLogic.storyFinished = true;
                  userObj.justCompletedFirstBattle = true;
            }
      }

      totalSubparts++;
      makeGPT('Given the story below, specify the winner of the fight. It can be either ' + storyLogic.currentCharacter + ' or ' + storyLogic.opponent + ':\n---\n' + storyLogic.rawStoryText + '\n---\n' +
                       'Given the story above, specify the winner of the fight. Answer only as "A" or "B". \nA) ' + storyLogic.currentCharacter + '\nB)' + storyLogic.opponent + ':\n\nThe winner is:',
                       undefined,
                       0.00,
                      0.00).then(function(data) {handlePostStoryXHR(data,'winner')});
      
      totalSubparts++;                      
      makeGPT('Come up with a title for the story below: \n---\n' + storyLogic.rawStoryText + '\n---\nCome up with a title for the story above:',
                 undefined,
                0.5,
                0.00).then(function(data) {handlePostStoryXHR(data,'title')});

      totalSubparts++;
      makeGPT('The following is a passage from a book. Read the passage and then write a brief image prompt to be used as an illustration for ' + storyLogic.currentCharacter + '.\n---\n' +
                 bothCharactersTopOfPrompt + '\n' + storyLogic.chunks[0] + 
                 '\n---\n' +
                 'Above is a passage from a book. Read the passage and then write a brief image prompt to be used as an illustration.\n' +
                'Brief image prompt for ' + storyLogic.currentCharacter + ':',
                  undefined,
                  0.00,
                  0.00).then(function(data) {handlePostStoryXHR(data,'imagePromptForCharacter')})
      
      totalSubparts++;      
      makeGPT('The following is a passage from a book. Read the passage and then write a brief image prompt to be used as an illustration for ' + storyLogic.opponent + '.\n---\n' +
                 bothCharactersTopOfPrompt + '\n' + storyLogic.chunks[0] + '\n' + storyLogic.chunks[1] +
                '\n---\n' + 
                'Above is a passage from a book. Read the passage and then write a brief image prompt to be used as an illustration.\n' +
                'Brief image prompt for ' + storyLogic.opponent + ':',
                undefined,
                0.00,
                0.00).then(function(data) {handlePostStoryXHR(data,'imagePromptForOpponent')})

      totalSubparts++;      
      makeGPT('The following is a passage from a book. Read the passage and then write a brief image prompt to be used as an illustration for ' + storyLogic.opponent + '.\n---\n' +
              bothCharactersTopOfPrompt + '\n' + storyLogic.chunks[0] + '\n' + storyLogic.chunks[1] + '\n' + storyLogic.chunks[2] + 
              '\n---\n' + 
              'Above is a passage from a book. Read the passage and then write a brief image prompt to be used as an illustration.\n' +
              'Brief image prompt for ' + storyLogic.opponent + ':',
              undefined,
              0.50,
              0.00).then(function(data) {handlePostStoryXHR(data,'imagePromptForOpponent2')})


      totalSubparts++;      
      makeGPT('The following is a passage from a book. Read the passage and then write a brief image prompt to be used as an illustration for ' + storyLogic.currentCharacter + '\n---\n' +
              bothCharactersTopOfPrompt + '\n' + storyLogic.chunks[0] + '\n' + storyLogic.chunks[1] + '\n' + storyLogic.chunks[2] + '\n' + storyLogic.chunks[3] +
              '\n---\n' + 
              'Above is a passage from a book. Read the passage and then write a brief image prompt to be used as an illustration.\n' +
              'Brief image prompt for ' + storyLogic.currentCharacter + ':',
              undefined,
              0.50,
              0.00).then(function(data) {handlePostStoryXHR(data,'imagePromptForCharacter2')})

      function countWords(str) {
        const re = /[\s\t\r\n]+/g
        return ((str || '').match(re) || []).length
      }
  
      function chunkStory(story) {
        var chunks = [];
        story = story.split('\n\n');
        console.log(story);
        for(var i = 0; i < story.length; i+=0) {
          var length = 0;
          var chunk = "";
          console.log('i',i);
          for(var j = i; j < story.length; j++) {
            console.log('j',j);
            if(countWords(chunk) + countWords(story[j]) < 250) {
              chunk += story[j] + '\n\n';
              i=j;
              if(j == story.length -1) {
                chunks.push(chunk.trim());
                return chunks;
              }
            } else {
              if(j != i) { //We went forward at least one paragraph... add the chunks so far, and then start with this over-tipping paragraph
                chunks.push(chunk);
                i = j;
                break;
              } else {
                //Uh oh, this singular paragraph is too big! Chunk it into sentences and hope this doesn't happen often....
                var sentences = story[j].split('.');
                var firstBatch = "";
                for(var k = 0; countWords(firstBatch) + countWords(sentences[k]) < 250; k++ ) {
                  firstBatch += sentences[k]; 
                }
                console.log("Xtra Large Paragraph detected, firstBatch", firstBatch);
                chunks.push(firstBatch + '.')
                //Then we will be less greedy and just take it one sentence at a time...
                for(var l = k; l < sentences.length; l++) {
                  if(sentences[l].trim() == "") {
                    continue;
                  }
                  chunks.push(sentences[l] + '.');
                }

                i++;
                break;
              }
            }
          }
        }
 
        return chunks;
      }

      if(userObj.voiceAudioOn) {
        //Generate the voice if the setting is turned on
        var part1 = storyLogic.chunks[0].text;
        var part2 = storyLogic.chunks[1].text;
        var part3 = storyLogic.chunks[2].text;
        var part4 = storyLogic.chunks[3].text;
        
        part1 = chunkStory(part1);
        part2 = chunkStory(part2);
        part3 = chunkStory(part3);
        part4 = chunkStory(part4);
  
        getCounts = function(part) {
          for(var i = 0; i < part.length; i++) {
            console.log(countWords(part[i]));
            if(countWords(part[i]) > 250) {
              console.log(part[i]);
              debugger;
            }
          }
        }
  
        getCounts(part1);
        getCounts(part2);
        getCounts(part3);
        getCounts(part4);
        
  
        var parts = [part1, part2,part3,part4]
        console.log('parts for voice, before sending', parts);
        for(var x = 0; x < parts.length; x++) {
          for(var j = 0; j < parts[x].length; j++) {
            totalSubparts++;
            getSoundUrl(parts[x][j], "Abram",{x:x,j:j}).then(function(data){
              console.log('Callback from getSoundUrl of Story')
              console.log(data);
              console.log(data.position);
              handlePostStoryXHR(data.url,'part' + data.position.x, data.position.j)
            });
          }
        }  

      }

}