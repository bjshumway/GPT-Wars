window.addEventListener('load',function() {

  //Initialize the coin amount
  $('#front-page-coin').text(userObj.creditsRemaining);

  $('#store').on('click', function() {
    appLocation = 'Store';
    //Reset battle

    //Return false so this doesn't get hidden by page 0's handler
    return false;
  })

  $('.coin').css("line-height", $('.coin-img').height()+"px");
  


});

window.store = {}

store.spendCredits = function(creditsAmount) {
  userObj.creditsRemaining -= creditsAmount;
  $('.coin').text(userObj.creditsRemaining);
}

window.addEventListener('resize', function() {
  $('.coin').css("height", $('.coin-img').height()+"px");
  $('.coin').css("line-height", $('.coin-img').height()+"px");  
})