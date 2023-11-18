var battle = {};
var allUsers;

//Chooses a random character not owned by the current player
//For "simplicity" we will pull ALL characters from the database... but this will get replaced eventually
async function getOpponents(getType) {  
   
   if(getType == 'random') {
    //Assumption: the user has already chosen their character
    battle.opponents = await getOpponentsFromCloud(userObj.characters[storyLogic.currentCharacter].character_uuid);
    
   } else if (getType == 'initial') {
/*
    //Grab the three from the computer....
    Not yet implemented as the initial are currently hardcoded elsewhere
*/
  }

   

    //Now populate page 9 (choose opponent page)
    populateChooseOpponentScreen();   
}

function populateChooseOpponentScreen() {

  for(var i = 0; i < battle.opponents.length; i++) {
    $($('#p9-content .w3-block')[i]).find('span').text(battle.opponents[i].name);
    var powerupsText = "";
    var description = battle.opponents[i].description;
    if(battle.opponents[i].powerups && battle.opponents[i].powerups.length) {
      description += '\n\nPowerups:\n';
      for(var j = 0; j < battle.opponents[i].powerups.length; j++) {
        description += battle.opponents[i].powerups[j].name + ': ' + battle.opponents[i].powerups[j].description + '\n';
      }
    }
    description = description.trim();

    $('#opponent-choose-' + (i+1)).find('.opponent-description').text(description);
    $('#opponent-choose-' + (i+1)).find('.continue-button').data("character-name",battle.opponents[i].name);
    $('#opponent-choose-' + (i+1)).find('.continue-button').data("rating",battle.opponents[i].rating);

    var imageLocation = battle.opponents[i].imageLocation;
    if(!imageLocation) {
      imageLocation = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460__340.png";
    }
    
    $($('#p9-content .w3-block img')[i]).prop("src",imageLocation);

  }
}

function populateChooseYourCharacter() {
  $('#choose-your-character').html("");
  for(char in userObj.characters) {
    $('#choose-your-character').append('<div class="choose-char" data-char="' + char + '">' + char + '</div>')
/*//TODO:
<div style="
  display: flex;
"><img src="https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460__340.png" style="height: 5vh;display: inline-block;padding: 0;margin: 0;"><span class="choose-char" data-char="Sauran" style="line-height: 4vh;font-size: 4vh;display: contents;padding: 0;margin: 0;hover: {}">&nbsp;&nbsp;Sauran</span></div>
*/

  }

  $('.choose-char').on('click', function() {
    //Completely reset storyLogic... as if we don't do this... references to it will persist from other characters and other stories
    storyLogic = {};
    storyLogic.currentCharacter = $(this).data('char');
    getOpponents('random');    

    $('#choose-your-character').hide();
    if(!isMobile) {
      $('#back-page-btn').show();
    }
    goSpecificPage(9);
  });

  if(userObj.creditsRemaining > 0) {
    $('#not-enough-credits').show();
  } else {
    $('#choose-your-character').show();
  }


}

window.addEventListener('load',function() {
  $('#battle').on('click', function() {
    appLocation = 'Battle';
    //Reset battle
    battle = {};
    populateChooseYourCharacter();


    //Return false so this doesn't get hidden by page 0's handler
    return false;
  })
});