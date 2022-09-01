$(function(){
    $(".heading-compose").click(function() {
      $(".side-two").css({
        "left": "0"
      });
    });

    $(".newMessage-back").click(function() {
      $(".side-two").css({
        "left": "-100%"
      });
    });
})

function checkBX(){
  if(document.getElementById('custom-or-another').checked){
    var inputName = document.getElementById('inputName').value = '';
      document.getElementById("inputName").disabled = true;
  }else{
      document.getElementById("inputName").disabled = false;
  }
}

function clearAddContactMsg(){
  document.getElementById('invalidPhone').innerText='';
}

function openNav() {
  document.getElementById("mySidenav").style.width = "200px";
  // document.getElementById("main").style.marginLeft = "200px";
  // document.body.style.backgroundColor = "rgba(0,0,0,0.4)";
}

/* Set the width of the side navigation to 0 and the left margin of the page content to 0, and the background color of body to white */
function closeNav() {
  document.getElementById("mySidenav").style.width = "0";
  // document.getElementById("main").style.marginLeft = "0";
  document.body.style.backgroundColor = "white";
}

