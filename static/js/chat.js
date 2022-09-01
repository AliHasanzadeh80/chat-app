window.onload = function(){
    // document.querySelector('.col-xl-9').innerHTML = '';
}
// ------------------------------- socket declarations----------------------------------
try {
    var chatSock = new WebSocket('ws://' + window.location.host + '/ws/');
}
catch (e) {
    var chatSock = new WebSocket('wss://' + window.location.host + '/ws/');
}
try {
    var roomSock = new WebSocket('ws://' + window.location.host + '/ws/room/');
}
catch (e) {
    var roomSock = new WebSocket('wss://' + window.location.host + '/ws/room/');
}
try {
    var msgSock = new WebSocket('ws://' + window.location.host + '/ws/message/');
}
catch (e) {
    var msgSock = new WebSocket('wss://' + window.location.host + '/ws/message/');
}


// ------------------------------- global variables ----------------------------------
const sockets = [chatSock, roomSock, msgSock];
const invalidPhone = document.getElementById('invalidPhone');
var rooms;
var messages;


// ------------------------------- chat socket ----------------------------------
chatSock.onopen = function(e){
    console.log(' chat socket connected!');
    
}
chatSock.onmessage = function (e) {
    var data = JSON.parse(e.data)
    console.log(data);
}
// ------------------------------- room socket ----------------------------------
roomSock.onopen = function(e){
    sockAction(1, 'list');
}
roomSock.onmessage = function (e) {
    var response = JSON.parse(e.data);
    console.log(response);
    if(response.response_status == 400){
        invalidPhone.innerText = response.data.message;
    }
}
// ------------------------------- message socket ----------------------------------
msgSock.onopen = function(e){
    sockAction(2, 'list');
}
msgSock.onmessage = function (e) {
    var response = JSON.parse(e.data)
    if(response.action === "list"){
        messages = response.data;
        console.log(messages);
    }   
}


// ------------------------------- functions ----------------------------------
function sockAction(...params){
    // num, action, pk, data
    var sockIndex = params[0];
    var action = params[1];
    // console.log(params);
    switch(action){
        case 'list':
            sockets[sockIndex].send(JSON.stringify({
                    action: "list",
                    request_id: new Date().getTime(),
                }))
            break;

        case 'retrieve':
            sockets[sockIndex].send(JSON.stringify({
                action: "retrieve",
                request_id: new Date().getTime(),
                pk: params[2]
            }))
            break;

        case 'create':
            sockets[sockIndex].send(JSON.stringify({
                action: "create",
                request_id: new Date().getTime(),
                data: params[2]
            }))
            break;

        case 'delete':
            sockets[sockIndex].send(JSON.stringify({
                action: "delete",
                request_id: new Date().getTime(),
                pk: params[2]
            }))
            break;
        
        case 'new_chat':
            sockets[sockIndex].send(JSON.stringify({
                action: "new_chat",
                request_id: new Date().getTime(),
                inputs: params[2]
            }))
            break;
    }  
}

function contactForm(){
    var form = document.getElementById('add-contact');
    form.addEventListener('submit', function(e){
        e.preventDefault();
        var inputName = document.getElementById('inputName');
        var inputPhone = document.getElementById('inputPhone');
        inputs = {
            contact_name: inputName.value,
            phone: inputPhone.value,
            creator: user
        }      
        if(userPhone != inputs.phone){
            sockAction(1, 'new_chat', inputs);
        }else{
            invalidPhone.innerText = 'you can not add your own phone number!';
        }
        inputName.value = '';
        inputPhone.value = '';       
    })
}


contactForm()