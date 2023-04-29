var audioEngine = 'elevenlabs'; //"play.ht" is the other engine

 
// Function to calculate the Probability
function Probability(rating1, rating2) {
  return (
      (1.0 * 1.0) / (1 + 1.0 * Math.pow(10, (1.0 * (rating1 - rating2)) / 400))
  );
  }
   
// Function to calculate Elo rating
// K is a constant.
// d determines whether Player A wins
// or Player B.  
function getNewRatings(char1Rating, char2Rating, char1Wins) {   
  const K = 30;

    // To calculate the Winning
  // Probability of Player B
  let Pb = Probability(char1Rating, char2Rating);
   
  // To calculate the Winning
  // Probability of Player A
  let Pa = Probability(char2Rating, char1Rating);
   
  if (char1Wins) {
      char1Rating = char1Rating + K * (1 - Pa);
      char2Rating = char2Rating + K * (0 - Pb);
  }
  else {
      char1Rating = char1Rating + K * (0 - Pa);
      char2Rating = char2Rating + K * (1 - Pb);
  }

  char1Rating = Math.round(char1Rating);
  char2Rating = Math.round(char2Rating);
  
  return {
      char1NewRating: char1Rating,
      char2NewRating: char2Rating
    }
}


function romanize (num) {
  if (isNaN(num))
      return NaN;
  var digits = String(+num).split(""),
      key = ["","C","CC","CCC","CD","D","DC","DCC","DCCC","CM",
             "","X","XX","XXX","XL","L","LX","LXX","LXXX","XC",
             "","I","II","III","IV","V","VI","VII","VIII","IX"],
      roman = "",
      i = 3;
  while (i--)
      roman = (key[+digits.pop() + (i * 10)] || "") + roman;
  return Array(+digits.join("") + 1).join("M") + roman;
}

function escapeRegExp(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}


function trimArrOfStr(arr) {
  for(var i =0 ; i <arr.length; i++) {
    arr[i] = arr[i].trim();
  }
  return arr;
}

function gptOptionsToArray(str, numResultsExpected) {


  //GPT's pattern for giving options seems to be to separate the options by newline
  //Then to use a numbered delimieter (1., 2., 3.)  (#1, #2, #3)
  //If I specified it to give me "A" or "B" the separator type would be ( A., B.) (A:, B:)
  //TODO: implement error handling, where if the expected numbered of results is incorrect, we re-run the GPT function
  //      this would have to be an argument we can pass into GPT, e.g. rltType 'string' or 'array'
  

  /*
  Numbered lists (e.g., 1., 2., 3.)
  Roman numerals (e.g., I., II., III.)
  Alphabetical letters (e.g., a., b., c.)
  Bullet points (e.g., -, *, +)
  Hashtags (e.g., #1, #2, #3)
  Parentheses (e.g., (1), (2), (3))
  Square brackets (e.g., [1], [2], [3])
  Angle brackets (e.g., <1>, <2>, <3>)
  Dashes (e.g., 1 -, 2 -, 3 -)
  Colons (e.g., 1:, 2:, 3:)
  Periods (e.g., 1., 2., 3.)
  */
 str = str.trim();
 var delimiterStart = str.match(/^[\S]+/)[0]; //Get all non-spaces
 
 if(delimiterStart.indexOf('1') == -1
    &&
    (delimiterStart.indexOf('I') == -1 || delimiterStart.indexOf('I') > 1)
    &&
    (delimiterStart.indexOf('i') == -1 || delimiterStart.indexOf(i) > 1)) {

    //We have something like "Option 1" or "Sketch 1.", etc. grab the next word
    delimiterStart = str.match(/^[\S]+\s[\S]+/)[0]; 
  }


 //Get the delimiter type, if its a nonNumeric
 var nonNumericType = null;
 nonNumericTests = ['I','i']
 for(var i = 0; i < nonNumericTests; i++) {
    var tmp;
    if(tmp = delimiterStart.indexOf(nonNumericTests[i]) != -1) {
      nonNumericType = delimiterStart[tmp]; 
    }
 }

 var delims = [];
 //Get the delimiters
 for(var i = 1; i <= numResultsExpected; i++) {
  if(nonNumericType) {
    delims.push(delimiterStart.replace(nonNumericType,romanize(i)));      
    if(nonNumericType == 'i') {
      delims[i] = delims[i].toLowerCase();
    }  
  } else {
    delims.push(delimiterStart.replace('1',i));
  }
 }

  //Escape the delimiters & treat special marks like ":" or "." as equal footing, as well as " " and ""
  for(var i = 0; i < delims.length;i++) {
    delims[i] = delims[i]
                    .replace(/\.|\:|\(|\)|\-|\*|\#|\[|\]|\<|\>|\s/g,
                            '[.:\\(\\)\\-\\*#[\\]<>\\s]*');
  }

  var regExStr = '';
  for(var i = 0; i < numResultsExpected; i++) {
    regExStr += '(' + delims[i] + '[\\s\\S]+)'; //[\s\S]\+ is greedy go forward
  }

  var reg = new RegExp(regExStr);
  console.log('regEx for parsing GPT, reg: ', reg);

  var rslt = str.match(reg);
  console.log('rslt of regEx: ', rslt);
  
  if(rslt) {
    //Get rid of the 1st one in the array, since regex will return the entire string...
    rslt.shift();
  }

  if(rslt && rslt.length == numResultsExpected) {
    //Clean up the delimiters;
    for(var i = 0; i < numResultsExpected; i++) {
      rslt[i] = rslt[i].replace(new RegExp(delims[i]),'');
    }
    return trimArrOfStr(rslt);
  }

  //TODO: at this point 
  //      It may be worth considering something like this.... .replace(/^(\:|\.| \-)/,"").trim() //Get rid of the "3" or "Two" at the start

  //Still here? something went wrong... we will have to try our other tricks...
  rslt = str.split('\n\n');
  if(rslt.length == numResultsExpected) {
    return trimArrOfStr(rslt);
  }
  
  //Still here, getting unlucky...
  rslt = str.split('\n');
  if(rslt.length == numResultsExpected) {
    return trimArrOfStr(rslt);
  }

  //Very unlucky
  console.log('Error, cannot parse GPT into expected number of results: ', str, ' expected ' + numResultsExpected);
  brokenSendArray = [];
  for(var i = 0; i < numResultsExpected; i++) {
    brokenSendArray.push(str);    
  }
  return brokenSendArray;

}


function escapeHtml(unsafe)
{
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
 }

 function countWords(str) {
  const re = /[\s\t\r\n]+/g;
  return ((str || '').match(re) || []).length;
}

getCounts = function(part) {
  for(var i = 0; i < part.length; i++) {
    console.log(countWords(part[i]));
    if(countWords(part[i]) > 250) {
      console.log(part[i]);
      debugger;
    }
  }
}

function chunkStory(story) {
  var chunks = [];

  if(!story) {
    alert("error, empty story passed into chunkStory");
  }

  if(audioEngine == 'playht') {
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
  
  } else {
    //We are using elevenlabs
    if(story.length <= 2680) {
      return [story];
    }else {
      //Subdivide into paragraphs
      var paragraphs = story.split('\n\n');
      var buffer = "";
      for(var i = 0; i < paragraphs.length; i++) {
        if(paragraphs[i].length > 2680) {
          //Subdivide into sentences
          var sentences = paragraphs[i].split('. ');
          for(var j = 0; j < sentences.length; j++) {
            //ASSUMPTION no single sentence is more than 2700 characters. if it is this will break...
            //Leavinh 20 chars for potential unicode issye
            if((buffer + sentences[j].length + 2).length <= 2680) {
               buffer += sentences[j] + '. ';
            }else {
              chunks.push(buffer);
              buffer = sentences[j];
              if(!sentences[i+1]) {
                chunks.push(buffer + '.');
              }
            }
          }
        }
        else {
          if(buffer + paragraphs[i].length + 2 <= 2680) {
            buffer += paragraphs[i] + '\n\n';
          } else {
            chunks.push(buffer);
            buffer = paragraphs[i]
            if(!paragraphs[i+1]) {
              chunks.push(buffer);
            }
          }
        }
      }
    }
  }
  

  return chunks;
}

function createVoiceAudio(chunkIndex) {
  if(userObj.voiceAudioOn) {
    var part = chunkStory(storyLogic.chunks[chunkIndex].text);

    audios["storyVoice" + (chunkIndex+1)].length = part.length;

    for(var j = 0; j < part.length; j++) {
      if(audioEngine == 'playht') {
        getSoundUrl(part[j], "Abram",{x:chunkIndex,j:j}).then(function(data){
          console.log('Callback from getSoundUrl of Story')
          console.log(data);
          console.log(data.position);
          handlePostStoryXHR(data.url,'part' + data.position.x, data.position.j)
        });
      } else {
        getElevenLabsTTS(part[j],{x:chunkIndex,j:j}).then(function(data) {
          console.log('Callback from getElevenLabsTTS of Story')
          console.log(data);
          console.log(data.position);
          handlePostStoryXHR(data.audioBuffer, 'part' + data.position.x,data.position.j )
        });
      }
    }
  }
}


function makeGPTInternal(prompt, maxTok, tempr = 0.7, frequenceyPenalty = 0.0,suffix,model =3) {

  return new Promise(function (resolve, reject) {



      var url;
      const xhr = new XMLHttpRequest();

      var data = {
        temperature: tempr,
        frequency_penalty: frequenceyPenalty,
        presence_penalty: 0
    };


      if(model ==3) {
        url = 'https://api.openai.com/v1/completions';
        model = 'text-davinci-003'
        xhr.open('POST', url);
        data["prompt"] = prompt;
        data["suffix"] = suffix;
        data["model"] = model
        var numPromptTok = mod.encode(prompt + suffix).length;
        data["max_tokens"] = (maxTok ? maxTok : 4096) - numPromptTok;
      }else {
        url = 'https://api.openai.com/v1/chat/completions';
        model = 'gpt-4'
        xhr.open('POST', url);
        data["messages"] =  [{
            "role":"user",
            "content": prompt
          }
        ]
        data["model"] = model
        if(maxTok){
          data["max_tokens"] = maxTok;        
        }
      }
      
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('Authorization', 'Bearer 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');

      xhr.responseType = 'json';
      console.log(data)

      xhr.onload = function() {
          if (xhr.status >= 200 && xhr.status < 300) {
              console.log(xhr.response)
              //It is either served as a gpt 3 or gpt 4...
              if(xhr.response.choices && xhr.response.choices[0] && xhr.response.choices[0].text) {
                //GPT 3
                resolve(xhr.response.choices[0].text); 
              } else {
                //GPT 4
                resolve(xhr.response.choices[0].message.content);
              }
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

let lastGPTRunAt = (new Date()).getTime();
async function makeGPT(prompt, maxTok, tempr = 0.7, frequenceyPenalty = 0.0,suffix,model = 3,callback) {
  for(var i = 0; i < 10; i++) {
    try {
      //Always wait at least 2 seconds from the last time a GPT query was run
      //This is due to some weirdness with the rate limiter... hoping this will help...
      var now = (new Date()).getTime();
      if((now - lastGPTRunAt) <= 2000) {
        await delay(2000);
      }
      lastGPTRunAt = (new Date()).getTime();

      var rslt = await makeGPTInternal(prompt, maxTok, tempr, frequenceyPenalty, suffix,model);
      if(callback) {
        callback(rslt);
      } else {
        return rslt;
      }
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
          1,
          0.00,
          undefined,
          4);

  var comment = data;
  console.log(comment);

  
  
  //var voiceStr = 'Perhaps ' + comment;

  //var soundUrl = await getSoundUrl(voiceStr);
  clearInterval(storyLogic.showLoadingTextForQAC);

  $('#architype-comment-voice').remove();
  $('#quick-architype-comment').html('<br />' + escapeHtml(comment)) 
  $('#go-to-name-creation').show();
  $('#try-another-architype').show();

  $('.char-desc-choice').hide();

  var opts = await makeGPT(
`Character architype:
${architype}
${comment}

Given the character architype above, write a JSON object in the form of
{
  "architype": "${architype.replaceAll('"','')}",
  "attribute": [...],
  "skill": [...],
  "useful_resource": [...]
}

That contains three unique attributes for the character (strings). Three unique skills (string). And three unique useful resources (strings).`,
    300,
    1,
    0.00,
    undefined,
    4)

  try {
    opts = JSON.parse(opts.trim());
    var selects = ['#char-attribute','#char-skill','#char-resource']
    for(el in selects) {
      var jsonAttribute;
      if(selects[el] == '#char-attribute') {
        jsonAttribute = 'attribute'
      } else if(selects[el] == '#char-skill') {
        jsonAttribute = 'skill'
      }else {
        jsonAttribute = 'useful_resource'
      }
      $(selects[el]).html(
`
<option value="">leave blank</option>
<option value="${opts[jsonAttribute][0]}">${opts[jsonAttribute][0]}</option>
<option value="${opts[jsonAttribute][1]}">${opts[jsonAttribute][1]}</option>
<option value="${opts[jsonAttribute][2]}">${opts[jsonAttribute][2]}</option>
`
      ) 

    }
    $('.char-desc-choice').show();

  } catch(e) {
    //Oh well we tried. console.log it to understand what happened
    $('.char-desc-choice').val("");
    console.log(e, "Err retrieving skills/attributes/resources", opts);
    $('.char-desc-choice').hide();    
  }

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
  var name = data;
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

      //TOOD change this misnomer...
      var traitsStr = "";
      if($('#char-gender').val()) {
        traitsStr = "Gender: " + $('#char-gender').val() + "\n";
      }
      if($('#char-attribute').val()) {
        traitsStr += "Attribute: " + $('#char-attribute').val() + "\n";
      }
      if($('#char-skill').val()) {
        traitsStr += "Skill: " + $('#char-skill').val() + "\n";
      }
      if($('#char-resource').val()) {
        traitsStr += "Resource: " + $('#char-resource').val() + "\n";
      }
      traitsStr = traitsStr.trim();

      $('#go-to-description-comment').prop('disabled',true);
      
     var architypeDescription = $('#quick-architype-comment').text();

        var data2 = (await makeGPT(
          $('#quick-architype-comment').text() + '\n\n' +
`${architypeDescription}

Write an awesome character sketch for the fictional character named ${storyLogic.currentCharacter}
Architype: ${characterArchetype}
${traitsStr}
(have fun with it; be creative!)
(Use proper nouns)
(Only one paragraph in length)
`,
        undefined,
        1,
        0.00,
        undefined,
        4
      ));
      
      $('#go-to-description-comment').prop('disabled',false);      
      clearInterval(interval);
      $('#describe-text-area').prop('readonly',false); 
      $('#describe-text-area').val(data2)      

}
 
var currentLoadStep;
function incrementLoadingBar() {
  currentLoadStep++;
  if((currentLoadStep/numLoadSteps)*100 >= 100) {
    currentLoadStep--;
    currentLoadStep += (numLoadSteps + currentLoadStep)/2;
  }
  $('.meter > span').css('width', Math.round((currentLoadStep/numLoadSteps)*100) + '%');
}


let bothCharactersTopOfPrompt;
let bothCharactersTopOfPromptWithoutPowers;

function audiosFinishedLoading(index) {

  if(!userObj.voiceAudioOn) {
    return true;
  }


  var arr = audios['storyVoice' + (index+1)];
  if(!arr.length) {
    return false;
  }
  for(var i = 0; i < arr.length; i++) {
    if(!arr[i]) {
      return false;
    }
  }

  return true;
}

function populateStoryPage(pageNum) {
  var idx = Math.round((pageNum - 11) * 10 ) - 1;
  var contentId = '#p' + pageNum.replace('.','-') + '-content';
  var imageTitle;
  

  if(idx == 0 || idx == 3) {
    imageTitle = storyLogic.currentCharacter;
  } else {
    imageTitle = storyLogic.opponent;
  }

  imageTitle += ' - AI Illustration';

  var storyHtmlText = 
  storyHtmlText = '<p class="story-text" id="story-text-' + (idx+1) + '">' +
                    storyLogic.chunks[idx].text;
                  '</p>';

  //We add the image parts before the flip because of some weird bug rendering an image after the page turns
  $(contentId).html('<center><b>' + storyLogic.title.trim() + '</b></center><br />' + 
                            storyHtmlText +
                            '<div id="story-div-' + (idx+1) + '"><img ' + (storyLogic.chunks[idx].image != '' ? 'src="' + storyLogic.chunks[idx].image + '"' : 'src="https://media.tenor.com/On7kvXhzml4AAAAj/loading-gif.gif"') + 
                                                                      ' class="story-img"></img>' +
                            '<center><span>' + imageTitle + '</span></center></div>' +
                            '<button class="continue-button" id=' + (pageNum != '11.4' ? '"go-to-story-part-' + (idx+2) + '"' : '"go-to-after-fight-page"') + 
                                      ' style="margin-bottom:5vh;margin-top:1vh;">Next Page</button>');

  $(contentId + ' button').on('click', handleClicks);

}

function setStoryImage(index) {
  var pg; //page
  if(index == 0) {
    pg = '#p11-1-content';
  } else if (index == 1) {
    pg = '#p11-2-content';    
  } else if (index ==2) {
    pg = '#p11-3-content';    
  } else if (index == 3) {
    pg = '#p11-4-content'
  }

  //The "min-height" trick seems to break the "height 0" bug... but we will see if the bug still occurs then we will have to try something else.
  $(pg + ' .story-img').prop('src',storyLogic.chunks[index].image).show().css('width','100%').css('min-height','10vh');
}

window.handlePostStoryXHR = async function(data,finishedFor,index) {

  if(finishedFor == 'Character') {
        incrementLoadingBar();
        storyLogic.chunks[0].image = data;
        setStoryImage(0);
        var jpegClob = await writePngToJpeg(data);
        saveImage(jpegClob, userObj.userId, storyLogic.currentCharacter,storyLogic.id,'Character1')
  } else if(finishedFor == 'Character2') {
        incrementLoadingBar();
        storyLogic.chunks[3].image = data;
        setStoryImage(3);
        var jpegClob = await writePngToJpeg(data);
        saveImage(jpegClob, userObj.userId, storyLogic.currentCharacter,storyLogic.id,'Character2')
  } else if(finishedFor == 'Opponent') {
        incrementLoadingBar();              
        storyLogic.chunks[1].image = data;
        setStoryImage(1);
        //TODO: save image to opponent... would require opponent's ID
  } else if(finishedFor == 'Opponent2') {
        incrementLoadingBar();              
        storyLogic.chunks[2].image = data;
        setStoryImage(2);
        //TODO: save image to opponent... would require opponent's ID        
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
    storyLogic.title = data.trim();      
    if(userObj.voiceAudioOn) {
      //get audio for the title 
      if(audioEngine == 'playht') {
        getPlayHTSoundUrl(storyLogic.title.replace(/"/g,''), "Abram").then(function(data){
          console.log('Callback from getSoundUrl of Title')
          console.log(data);
          handlePostStoryXHR(data,'titleAudio')
        })
      }else {
        getElevenLabsTTS(storyLogic.title.replace(/"/g,''), "Abram").then(function(data){
          console.log('Callback from getSoundUrl of Title')
          console.log(data);
          handlePostStoryXHR(data,'titleAudio')
        })
      }
    }
  } else if(finishedFor == 'gptPart3') {
    storyLogic.chunks[2].text = data;
    //For some reason GPT's quotes aren't breaking into new paragraphs. Fixing that here.

//Creative Writing Instructions: Based on the characters and story below, write several thrilling paragraphs on the epic showdown between ${storyLogic.char1} and ${storyLogic.char2}.
    makeGPT(
`#Award Wining Fan Fiction
Creative Writing Instructions: Based on the characters and story below, complete the showdown in which ${storyLogic.char1} defeats ${storyLogic.char2}.
---
${bothCharactersTopOfPrompt}

${storyLogic.chunks[0].text}

${storyLogic.chunks[1].text}

${storyLogic.chunks[2].text}
---
Creative Writing Instructions: Based on the characters and story above, complete the showdown in which ${storyLogic.char1} defeates ${storyLogic.char2}!
`, undefined,1,0.00, //Harvard Writing Exam: In 500 words (several paragaraphs), finish the story above.
undefined, 
4
      ).then(function(data) {handlePostStoryXHR(data.replace('TBD','').replace(/\n{3,}/g,'\n\n'),'gptPart4')})
      incrementLoadingBar();          

      makeGPT('The following is a passage from a book. Read the passage and then write a brief image prompt to be used as an illustration for ' + storyLogic.opponent + '.\n---\n' +
              bothCharactersTopOfPrompt + '\n' + storyLogic.chunks[0].text + '\n' + storyLogic.chunks[1].text + '\n' + storyLogic.chunks[2].text + 
              '\n---\n' + 
              'Above is a passage from a book. Read the passage and then write a brief image prompt to be used as an illustration.\n' +
              'Brief image prompt for ' + storyLogic.opponent + ':',
              undefined,
              0.50,
              0.00,
              undefined,
              4).then(function(data) {handlePostStoryXHR(data,'imagePromptForOpponent2')})      
      
      createVoiceAudio(2);


  }else if(finishedFor == 'gptPart4') {
    storyLogic.chunks[3].text = data;
    storyLogic.rawStoryText =
`${storyLogic.chunks[0].text}

${storyLogic.chunks[1].text}

${storyLogic.chunks[2].text}

${storyLogic.chunks[3].text}
`;
    
    makeGPT('Given the story below, specify the winner of the fight. It can be either ' + storyLogic.currentCharacter + ' or ' + storyLogic.opponent + ':\n---\n' + storyLogic.rawStoryText + '\n---\n' +
                     'Given the story above, specify the winner of the fight. Answer "A" or "B". Describe your reasoning. \nA) ' + storyLogic.currentCharacter + '\nB)' + storyLogic.opponent + ':\n\nThe winner is:\n',
                     undefined,
                     0.00,
                    0.00).then(function(data) {handlePostStoryXHR(data,'winner')});
                          
    makeGPT('The following is a passage from a book. Read the passage and then write a brief image prompt to be used as an illustration for ' + storyLogic.currentCharacter + '\n---\n' +
            bothCharactersTopOfPrompt + '\n' + storyLogic.rawStoryText +
            '\n---\n' +
            'Above is a passage from a book. Read the passage and then write a brief image prompt to be used as an illustration.\n' +
            'Brief image prompt for ' + storyLogic.currentCharacter + ':',
            undefined,
            0.50,
            0.00,
            undefined,
            4).then(function(data) {handlePostStoryXHR(data,'imagePromptForCharacter2')})

    //let getGPTPowerups = function() {
    makeGPT('Given the story above, come up with 3 awesome character developments and/or powerups that ' + storyLogic.currentCharacter + ' gained as a result of the showdown.' +
    bothCharactersTopOfPromptWithoutPowers + '\n' + storyLogic.rawStoryText +
      '\n---\n' +
      'Given the story below, come up with 3 awesome character developments and/or powerups that ' + storyLogic.currentCharacter + '  gained as a result of the showdown.\n1. ' + storyLogic.currentCharacter + ' now has ',
      undefined,
      .9,
      0,
      undefined,
      4).then(function(data) {handlePostStoryXHR(data,'powerups')})
    //}
        
    //For testing purposes... clicking that section will re=run the GPT.. so I can iterate on the prompts
    //$('#powerup-1 .powerup-description').on('click', getGPTPowerups);
    //getGPTPowerups();
    
    createVoiceAudio(3);            
  }
  else if (finishedFor == 'powerups') {
    storyLogic.rawPowerupsText =  '1. ' + storyLogic.currentCharacter + ' now has ' + data.trim();
    console.log('Results for powerups', storyLogic.rawPowerupsText);
    var powerups = gptOptionsToArray(storyLogic.rawPowerupsText,3) //powerups.replace('^[^1]+',''); //Get rid of any "intro" text I've seen like "John stands tall and proud" before it gives the powerups
    storyLogic.powerup1 = powerups[0]
    storyLogic.powerup2 = powerups[1]
    $('#powerup-1 .powerup-description').text(storyLogic.powerup1);
    $('#powerup-2 .powerup-description').text(storyLogic.powerup2);

    makeGPT('Come up with a name for the powerup below for ' + storyLogic.currentCharacter + ', in 3 words or less.\n---\n' +
    storyLogic.powerup1 + '\n---\n' +
    'Come up with a name for the powerup below for ' + storyLogic.currentCharacter + ', in 3 words or less:\n',
    undefined,
    .4,
    0.00).then(function(data) {handlePostStoryXHR(data,'powerupName1')})

    makeGPT('Come up with a name for the powerup below for ' + storyLogic.currentCharacter + ', in 3 words or less.\n---\n' +
    storyLogic.powerup2 + '\n---\n' +
    'Come up with a name for the powerup below for ' + storyLogic.currentCharacter + ', in 3 words or less:\n',
    undefined,
    .5,
    0.00).then(function(data) {handlePostStoryXHR(data,'powerupName2')});

  }
  else if(finishedFor == 'powerupName1') {
    storyLogic.powerupName1 = data.trim().replace(/[^A-Za-z \-]/g,'');
    $($('#p12-content .accordian-title')[0]).text(storyLogic.powerupName1);
  }
  else if(finishedFor == 'powerupName2') {
    storyLogic.powerupName2 = data.trim().replace(/[^A-Za-z \-]/g,'');
    $($('#p12-content .accordian-title')[1]).text(storyLogic.powerupName2);
  }
  else if(finishedFor == 'titleAudio') {
    incrementLoadingBar();
    audios['title'] = data;
    storyLogic['soundTitleUrl'] = data;
  } 
  else if(finishedFor == 'winner') {
    incrementLoadingBar();
    storyLogic.winnerParagraph = data.trim();
    storyLogic.winner = storyLogic.winnerParagraph.toUpperCase().match(/A|B/)[0];
    
    //TOOD: some error handling around this. If it didn't pick a winner we should figure out what happened.
    if(storyLogic.winner != 'A' && storyLogic.winner != 'B') {
      alert("ERROR - No winner determined as a result of the fight. Please code around this\n\n" + data.trim())
    }

    let resultsBlurb = "";

    if(userObj.justCompletedFirstBattle) {
      resultsBlurb = '<b>Congratulations</b><p>You survived your first fight!</p>';
    }

    if(storyLogic.winner == "B") {
      resultsBlurb += "<b>" + storyLogic.currentCharacter + " was defeated</b>";
    }
    else if(storyLogic.winner == "A") {
      resultsBlurb += "<b>" + storyLogic.currentCharacter + " was Victorious!</b>"
    }
    $('#battle-finished-top').html(resultsBlurb);

    //Remove the "A)" at the front
    storyLogic.winnerParagraph = storyLogic.winnerParagraph.trim().replace(/^[^\s]+ /,'');

    var newRating = getNewRatings(storyLogic.characterRating, storyLogic.opponentRating, storyLogic.winner == "A").char1NewRating;
    var ratingDifference = newRating - storyLogic.characterRating;
    if(ratingDifference > 0) {
      ratingDifference = "+" + ratingDifference; 
    }
    $('#show-new-rating').html(
      'New Rating ' + newRating + '<span id="rating-adjustment-points">' + ratingDifference + ' pts</span>');
    
    userObj.characters[storyLogic.currentCharacter].rating = newRating;
  } 
  else if(finishedFor == 'imagePromptForCharacter') {
    incrementLoadingBar();
    storyLogic.chunks[0].imagePrompt = data.trim();
    
    getStableDiffusion(storyLogic.chunks[0].imagePrompt).then(function(data) {handlePostStoryXHR(data,'Character')})
  } else if(finishedFor == 'imagePromptForCharacter2') {
    incrementLoadingBar();
    storyLogic.chunks[3].imagePrompt = data.trim();
    
    getStableDiffusion(storyLogic.chunks[3].imagePrompt).then(function(data) {handlePostStoryXHR(data,'Character2')})
  } else if(finishedFor == 'imagePromptForOpponent') {
    incrementLoadingBar();
    storyLogic.chunks[1].imagePrompt = data.trim();
    
    getStableDiffusion(storyLogic.chunks[1].imagePrompt).then(function(data) {handlePostStoryXHR(data,'Opponent')})
  } else if(finishedFor == 'imagePromptForOpponent2') {
    incrementLoadingBar();
    storyLogic.chunks[2].imagePrompt = data.trim();
    
    getStableDiffusion(storyLogic.chunks[2].imagePrompt).then(function(data) {handlePostStoryXHR(data,'Opponent2')})
  }
  

  if(storyLogic['soundTitleUrl'] || (!userObj.voiceAudioOn && storyLogic.title  ) ) {
    if(storyLogic.chunks[0].loadStatus == 'loading') {
      //Check to see if the audios is finished loading for it
      if(audiosFinishedLoading(0) && book.currentLocation == 10) {
          storyLogic.chunks[0].loadStatus = 'finished'
          storyLogic.chunks[0].text = escapeHtml(storyLogic.chunks[0].text).trim();
          populateStoryPage('11.1');
          storyLogic.runLoadingScreen = false;
      }
    } 
    
    if (storyLogic.chunks[1].loadStatus == 'loading') {
      if(audiosFinishedLoading(1)) {
        storyLogic.chunks[1].loadStatus = 'finished';
        populateStoryPage('11.2');
      }
      if(book.currentLocation == 10 && storyLogic.loadingScreenFor == 11.2) {
        storyLogic.runLoadingScreen = false;
      }
    }
    
    if (storyLogic.chunks[2].loadStatus == 'loading') {
      if(audiosFinishedLoading(2)) {
        storyLogic.chunks[2].loadStatus = 'finished';
        populateStoryPage('11.3');
      }
      if(book.currentLocation == 10 && storyLogic.loadingScreenFor == 11.3) {
        storyLogic.runLoadingScreen = false;
      }
    }
    
    if (storyLogic.chunks[3].loadStatus == 'loading') {
      if(audiosFinishedLoading(3)) {
        storyLogic.chunks[3].loadStatus = 'finished';
        storyLogic.soundUrls = [audios['storyVoice1'], audios['storyVoice2'], audios['storyVoice3'], audios['storyVoice4']]
        userObj.characters[storyLogic.currentCharacter].stories.push(storyLogic);
        if(!userObj.finishedIntro) {
          userObj.justCompletedFirstBattle = true;
        } else {
          userObj.justCompletedFirstBattle = false;
        }
        populateStoryPage('11.4');
        storyLogic.storyFinished = true;
      }
      if(book.currentLocation == 10 && storyLogic.loadingScreenFor == 11.4) {
        storyLogic.runLoadingScreen = false;
      }
    }
    
  }
}  

function showLoading(loadingFor) {

  storyLogic.runLoadingScreen = true;
  storyLogic.loadingScreenFor = loadingFor;

  //This is called each time we are sent to page 10... from a number of different pages that can go here....
  let interval = window.setInterval(function() {
    if(storyLogic.runLoadingScreen == false) {
      clearInterval(interval);
      goSpecificPage(storyLogic.loadingScreenFor);
      playStory(Math.round((storyLogic.loadingScreenFor - 11) * 10));
      storyLogic.runThroughLoadingImages = false;
    } else {
      storyLogic.runThroughLoadingImages = true;
    }
  },5000) 
}

async function writeStory(opponent, opponentDescription, isIntroStory,opponentRating,opponentPowerups) {
       currentLoadStep = 0;
       $('.meter > span').css('width', '0%');
       
      if(!userObj.characters[storyLogic.currentCharacter].stories) {
        userObj.characters[storyLogic.currentCharacter].stories =  [];
      }

      storyLogic.id =  Math.floor(Math.random() * 10000000000000);

      audios['storyVoice1'] = {};
      audios['storyVoice2'] = {};
      audios['storyVoice3'] = {};
      audios['storyVoice4'] = {};
      storyLogic.loadingScreenFor = 11.1;
  
      if(userObj.voiceAudioOn) {
        numLoadSteps = 26;      
      } else {
        numLoadSteps = 18;
      }

      storyLogic.storyFinished = false;
      showLoading('11.1');

      $('#loading-page').show();
      incrementLoadingBar();
      

      storyLogic.opponent = opponent;
      storyLogic.characterDescription = storyLogic.currentCharacter + ':\n' + userObj.characters[storyLogic.currentCharacter].description;


      
      if(isIntroStory) {
        switch(storyLogic.opponent) {
          case 'Merlin': storyLogic.opponentDescription = "Merlin is a revered sage in King Arthur's court, known for his mastery of alchemy and divination. He is cloaked in regal robes of purple and gold, with a crown of emerald upon his head, which symbolizes his deep connection to the mystical forces of the universe. His voice is deep and resonant, and his words have the power to touch the soul of all who hear him. However, Merlin is consumed by a singular obsession: the acquisition of knowledge of a spell that he believes could transform mundane objects into cheese wheels. Yes, you read that right - cheese wheels. He spends his days poring over ancient tomes and experimenting with alchemical formulas, always seeking to unlock the secrets of this elusive spell. His quest for knowledge sometimes causes him to take risks that others might find foolish, but he is undeterred in his pursuit of this goal. Even as the realm faces growing threats from all sides, Merlin remains focused on his mission, convinced that the ability to transform anything into delicious cheese is a magic worth mastering.";
                         storyLogic.opponentRating = 1600;
                break;
          case 'Staria Stormrider': storyLogic.opponentDescription = "Staria Stormrider: a former elite soldier turned bounty hunter in a post-apocalyptic world, is driven by her ambition to obtain the legendary \"Worldbreaker\" weapon. This elusive artifact, believed to harness the energy of collapsing stars, has the potential to level entire cities or even alter the planet's climate. With her cropped red hair, icy blue eyes, and scars from numerous battles, Storm strikes fear into her opponents. Obsessed with the Worldbreaker's unimaginable power, she infiltrated and betrayed a group of freedom fighters who were fighting against Warlod Khan's rule, solely for the purpose of learning the weapon's whereabouts. Her ambition must be stopped."
                         storyLogic.opponentRating = 1500;
               break;
          case 'Agent Steele': storyLogic.opponentDescription = "Agent Jasper Steele: a cunning and tormented detective in his late twenties, expertly balances on the razor's edge between law enforcement and the criminal underworld. Born into the powerful syndicate \"Tantalus\" and trained by his ruthless father, the notorious ringleader, Steele has been molded into a master manipulator, skilled in deception and sabotage. Tall and muscular, with piercing blue eyes and sharp features, Steele's outward appearance mirrors his sinister nature. As the organization's mole, he relentlessly protects Tantalus' interests by undermining investigations and masking their illicit activities."
                         storyLogic.opponentRating = 1400;
                 break;
        }
     } else {
        storyLogic.opponentDescription = opponent + ":\n" + opponentDescription;
        storyLogic.opponentRating = opponentRating;
     }

     
     /*This version of bothCharactersTopOfPromptWithoutPowers doesn't care abotu which one is the winner
       and it doesn't show the powerups */
      bothCharactersTopOfPromptWithoutPowers =  'Characters:\n' + 
                                                 storyLogic.characterDescription + 
                                                 '\n\n' + 
                                                storyLogic.opponentDescription + 
                                                '\n---\n';     

     var powerups = structuredClone(userObj.characters[storyLogic.currentCharacter].powerups);
     if(powerups) {
       if(powerups.length) {
         if(powerups.length == 1) {
           storyLogic.characterDescription += '\n\nFrom a previous showdown with ' + powerups[0].obtainedFrom + ', ' + storyLogic.currentCharacter + ' learned "' + powerups[0].name +'": ' + powerups[0].description; 
         } else {
           storyLogic.characterDescription += '\n\n' + storyLogic.currentCharacter + ' gained the following powerups from hard-fought showdowns in the past: \n"'
           for(var i = 0; i< powerups.length; i++) {
             storyLogic.characterDescription += i + '. "' + powerups[i].name +'": ' + powerups[i].description + '\n'; 
           }
         }
       }
     }

     if(opponentPowerups) {
      powerups = opponentPowerups;
      if(powerups.length) {
        if(powerups.length == 1) {
          storyLogic.opponentDescription += '\n\nFrom a previous showdown with ' + powerups[0].obtainedFrom + ', ' + storyLogic.opponent + ' learned "' + powerups[0].name +'": ' + powerups[0].description; 
        } else {
          storyLogic.opponentDescription += '\n\n' + storyLogic.opponent + ' gained the following powerups from hard-fought showdowns in the past: \n"'
          for(var i = 0; i< powerups.length; i++) {
            storyLogic.opponentDescription += (i+1) + '. "' + powerups[i].name +'": ' + powerups[i].description + '\n'; 
          }
        }
      }
    }      
    storyLogic.opponentDescription = storyLogic.opponentDescription.trim();     

    storyLogic.characterRating = userObj.characters[storyLogic.currentCharacter].rating;

     //We give 'advantage' to the character that the AI thinks is more likely to win the fight
     //The AI tends to favor which of the characters comes first. This is sort of like if it was given a cast of characters
     //It would assume, more or less, that the first character in the cast is the 'main' character

     var coinFlip = Math.random();
     if(coinFlip > .5) {
      storyLogic.char1 = storyLogic.currentCharacter;
      storyLogic.char2 = storyLogic.opponent; 
     } else {
      storyLogic.char1 = storyLogic.opponent;
      storyLogic.char2 =  storyLogic.currentCharacter;
     }


     bothCharactersTopOfPrompt = 'Characters:\n' + 
     (storyLogic.char1 == storyLogic.currentCharacter ? storyLogic.characterDescription : storyLogic.opponentDescription) + 
     '\n\n' + 
     (storyLogic.char2 == storyLogic.currentCharacter ? storyLogic.characterDescription : storyLogic.opponentDescription) + 
     '\n---\n';

     storyLogic.predictedWinnerParagraph = (await makeGPT(
`Given the two characters ${storyLogic.char2} and ${storyLogic.char1}, which would win if they went up against each other?
${bothCharactersTopOfPrompt}
Between the two characters described above, which would win if they went up against each other. Pick the likeliest one. Answer only as A or B. Explain your reasoning. A) ${storyLogic.char2}, or B) ${storyLogic.char1}:
`,
      undefined,
      0.1,
      0.00
    ));

    storyLogic.predictedWinner = storyLogic.predictedWinnerParagraph.toUpperCase().match(/A|B/)[0];
    if(storyLogic.predictedWinner != 'A' && storyLogic.predictedWinner != 'B') {
      storyLogic.predictedWinner = 'A';
    }

    if(storyLogic.predictedWinner == 'A') {
      var tmp = storyLogic.char1;
      //Char 2 is the predicted winner... 
      //So since "char 1" is the character who should win... these get flipped here
      storyLogic.char1 = storyLogic.char2;
      storyLogic.char2 = tmp;
    } else {

    }

    bothCharactersTopOfPrompt = 'Characters:\n' + 
                                (storyLogic.char1 == storyLogic.currentCharacter ? storyLogic.characterDescription : storyLogic.opponentDescription) + 
                                '\n\n' + 
                                (storyLogic.char2 == storyLogic.currentCharacter ? storyLogic.characterDescription : storyLogic.opponentDescription) + 
                                '\n---\n';

      storyLogic.backStory = (await makeGPT(
        'Creative Writing Prompt: Based on the character descriptions below, come up with a riveting/thematic backstory for the upcoming showdown between ' + storyLogic.char1 +' versus ' + storyLogic.char2 + '\n\n' +
        bothCharactersTopOfPromptWithoutPowers +
        'Creative Writing Prompt: Based on the character descriptions above, come up with a riveting/thematic backstory for the upcoming showdown between ' + storyLogic.char1 +' versus ' + storyLogic.char2 +' (explaining why the two characters are add odds with each other) (Only one paragraph in length)',
        undefined,
        1,
        0.00,
        undefined,
        4
      ));
      incrementLoadingBar();      
      
      //storyLogic.backStory = 'Backstory 1: ' + storyLogic.backStory.trim();
      //storyLogic.backStory = gptOptionsToArray(storyLogic.backStory,3)[1];//Choose the middle one arbitrarilly
      incrementLoadingBar();      
      
      storyLogic.backStory = storyLogic.backStory.trim();

      storyLogic.chunks = [{
        image: null,
        text: null, 
        audio: null,
        imagePrompt: null,
        loadStatus: 'loading',
        type: "intro"
      },{
        image: null,
        text: storyLogic.backStory,
        audio: null,
        imagePrompt: null,
        loadStatus: 'loading',
        type: "backstory"
      },{
        image: null,
        text: null,
        audio: null,
        imagePrompt: null,
        loadStatus: 'loading',
        type: "quoting"
      },{
        image: null,
        text: null,
        audio: null,
        imagePrompt: null,
        loadStatus: 'loading',
        type: "fight-end"
      }];
      

//Write Page 1 "Contrasting the characters"      
storyLogic.chunks[0].text = 
(await makeGPT(
`#Award Wining Fan Fiction
Write an epic fan fiction depicting the showdown between ${storyLogic.char1} and ${storyLogic.char2}
---
${bothCharactersTopOfPrompt}

Step 1. Come up with a scene (thematic to the characters) and describe it. Then contrast ${storyLogic.char1}'s and ${storyLogic.char2}'s appearance and moods.
`, undefined,.7,0.00,
`
Step 2. Backstory
${storyLogic.chunks[1].text}
Step 3. A line of dialog from each character (in the style of the two characters).
TBD
Step 4. Fast forward to the conflict. Describe the two character's attacks. Come up with something unexpected that elevates the tension.
TBD
Step 5. Play-by-play showdown. The two characters using their respective skills and resources. Leading up to a moment of crisis. The fight's pivotal moment and resolution.
TBD
The End`
)).replace('TBD','').replace(/\n{3,}/g,'\n\n')
incrementLoadingBar();

//Write Page 3 "The quoting"
makeGPT(
`#Award Wining Fan Fiction
Below is an epic fan fiction depicting the showdown between ${storyLogic.char1} and ${storyLogic.char2}
---
${bothCharactersTopOfPromptWithoutPowers}

${storyLogic.chunks[0].text}

${storyLogic.chunks[1].text}

Step 1: Write a few clever lines of dialog between ${storyLogic.char1} and ${storyLogic.char2} (in the style of the two characters)`, undefined,.7,0.00,
`
Step 2. Describe the two character's attacks. Come up with something unexpected that elevates the tension.
<Complete Step 2 Here>
Step 3. Play-by-play showdown. The two characters using their respective skills and resources. Leading up to a moment of crisis. The fight's pivotal moment and resolution.
<Complete Step 3 Here>
The End`
).then(function(data) {handlePostStoryXHR(data.replace('TBD','').replace('\n','\n\n').replace(/\n{3,}/g,'\n\n'),'gptPart3')})
  
makeGPT(
`Come up with a witty title for the story below:
---
${bothCharactersTopOfPrompt}
  
${storyLogic.chunks[0].text}

${storyLogic.chunks[1].text}
---
Come up with a witty title for the story above:
`,
           undefined,
          .9,
          0.00,
          undefined,
          ).then(function(data) {handlePostStoryXHR(data,'title')});

makeGPT('The following is a passage from a book. Read the passage and then write a brief image prompt to be used as an illustration for ' + storyLogic.currentCharacter + '.\n---\n' +
          bothCharactersTopOfPrompt + '\n' + storyLogic.chunks[0] + 
          '\n---\n' +
          'Above is a passage from a book. Read the passage and then write a brief image prompt to be used as an illustration.\n' +
        'Brief image prompt for ' + storyLogic.currentCharacter + ':',
          undefined,
          0.00,
          0.00,
          undefined,
          4).then(function(data) {handlePostStoryXHR(data,'imagePromptForCharacter')})

createVoiceAudio(0);


makeGPT('The following is a passage from a book. Read the passage and then write a brief image prompt to be used as an illustration for ' + storyLogic.opponent + '.\n---\n' +
bothCharactersTopOfPrompt + '\n' + storyLogic.chunks[0].text + '\n' + storyLogic.chunks[1].text +
'\n---\n' + 
'Above is a passage from a book. Read the passage and then write a brief image prompt to be used as an illustration.\n' +
'Brief image prompt for ' + storyLogic.opponent + ':',
undefined,
0.00,
0.00,
undefined,
4).then(function(data) {handlePostStoryXHR(data,'imagePromptForOpponent')})

createVoiceAudio(1);


}