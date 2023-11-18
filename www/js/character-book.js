var charBook = {
  currentIndex: 0
}


//Populates the read view based off of the userObj and charBook.currentIndex
async function populateCharReadView() {
  var charName = Object.keys(userObj.characters)[charBook.currentIndex];
  var char = userObj.characters[charName];

  $('#char-read-view').show();
  $('#char-write-view').hide();
  $('#character-create-new').hide();
  $('#char-prof-pic').show();
  $('#delete-character').show();


  $('#char-read-name').text(charName).show();
  $('#char-read-arch').text(char.architype).show();

  var powerUpsStr = "<br /><b>Powerups:</b>\n";
  if(!char.powerups) {
    char.powerups = [];
  }
  for(var i = 0; i < char.powerups.length; i++) {
    powerUpsStr += '<b>' + char.powerups[i].name + ("</b> (learned from " + char.powerups[i].obtainedFrom + "): " + char.powerups[i].description + '\n');
  }
  if(char.powerups.length == 0) {
    powerUpsStr += 'None yet!'
  }
  powerUpsStr = powerUpsStr.trim();

  $('#char-read-desc').html(char.description + '\n' + powerUpsStr).show();
  var wins = 0;
  var losses = 0;
  var rating = char.rating;
  for(var i = 0; i < char.stories.length;i++) {
    if(char.stories[i].winner == 'A') {
      wins++;
    } else {
      losses++;
    }
  }
  $('#char-stats').text('Wins: ' + wins + ' - Losses: ' + losses + ' -  Rating: ' + rating).show();

  //TODO: eventually let users click on it browse which pic they want
  var imageLocation = "";
  try {
    var story = userObj.characters[charName].stories[0];
    imageLocation = 'https://gpt-wars-images.s3.amazonaws.com/' +
                           userObj.userId + '/' +
                           (charName.replaceAll(" ", "+")) + '/' +
                           story.id + '/' +
                           'Character1.jpeg';
  }catch(e) {
    imageLocation = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460__340.png";
  }

  $('#char-prof-pic').attr("src", imageLocation);

  $('#delete-character').data('charName', charName);


}

function populateCharWriteView() {
  $('.next-char').hide(); //Don't allow pagination to the next slot of this character isn't yet created

  $('#char-read-view').show();
  $('#char-read-name').text("Empty Slot").show().css("font-size","4vh");
  $('#char-stats').text("").hide();
  $('#char-read-arch').text("").hide();
  $('#char-read-desc').text("").hide();
  $('#character-create-new').show();
  $('#char-prof-pic').hide();
  $('#delete-character').hide();
}


//Assumption, we have already set currentIndex, so now we just need to go to the correct read/write page
function paginate() {
  $('.char-slot').text('Slot ' + (charBook.currentIndex+1) + '/9');
  if(Object.keys(userObj.characters)[charBook.currentIndex]) {
    populateCharReadView();
  } else {
    //No character exists for that yet
    populateCharWriteView();
  }

}

window.addEventListener('load', function() {

  $('#characters').on('click', function() {
    $('#char-book').show();
    $('#char-read-view').show();

    $('#back-page-btn').show();
    $('.next-char').show();
    $('.prev-char').hide();
    charBook.currentIndex = 0;
    appLocation = 'characters';
    $('.char-slot').text('Slot ' + (charBook.currentIndex+1) + '/9');

    populateCharReadView();
  })

  $('#back-page-btn').on("click", function() {
    if(book.currentLocation != 0) {
      //Exit, this is a back button for some other place
      return false;
    }
    if(appLocation != 'characters') {
      //Exit this handler... the back button was clicked somewhere else in the app
      return false;
    }

    $('#char-book').hide();
    $('#char-read-view').hide();
    $('#char-write-view').hide();
    $('#back-page-btn').hide();

  })  

  $('.next-char').on('click',function() {
    charBook.currentIndex++;

    if(charBook.currentIndex == 8) {
      $('.next-char').hide();
    } else {
      $('.next-char').show();
    }
    $('.prev-char').show();

    paginate()
  });

  $('.prev-char').on('click',function() {
    charBook.currentIndex--;
    $('.next-char').show();
    if(charBook.currentIndex == 0) {
      $('.prev-char').hide();
    } else {
      $('.prev-char').show();
    }
    paginate()    
  })

  $('#character-create-new').on('click', function() {
    $('#char-book').hide();
    charBook.currentIndex = 0;
    goSpecificPage(5);
    $('#teach-architype').html("Character Architype:");
  });


  $('#delete-character').on('click',function() {
    var rslt = confirm("Are you sure?");
    if(rslt) {
      var charName = $(this).data('charName');
      delete userObj.characters[charName];
      saveUser().then(function() {
        window.location.reload();
      });

    }
  })

  //TODO: NOTE: this code is deprecated and no longer used. Consider removing it at some point
  //Write the character to userObj, then save it
  //Assumption: we are always adding new characters, never editing existing (for now)
  //TODO: validation that the name doesn't already exist for this user
  $('#char-write-submit').on('click',function() {
    userObj.characters[$('#char-write-name').val()] = {
      architype: $('#char-write-arch').val(),
      description: $('#char-write-desc').val(),
      stories: []
    }
     saveUser();
    alert("Insert nice looking -user saved- message here");
    $('#back-page-btn').click();
  });
})