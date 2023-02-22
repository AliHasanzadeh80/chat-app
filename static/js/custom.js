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
}

function closeNav() {
  document.getElementById("mySidenav").style.width = "0";
  document.body.style.backgroundColor = "white";
}

