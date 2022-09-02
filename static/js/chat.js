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
var contactsArea;
var chatArea;
var full_data;
var currentChat;


// ------------------------------- chat socket ----------------------------------
chatSock.onopen = function(e){
    sockAction(0, 'full_data');
}
chatSock.onmessage = function (e) {
    response = JSON.parse(e.data)
    full_data = response.data;
    contactsArea = document.querySelector('.contacts');
    chatArea = document.querySelector('.chat-messages');
    chatArea.innerHTML = '';
    console.log(full_data);
    fillContacts(full_data);
}
// ------------------------------- room socket ----------------------------------
roomSock.onopen = function(e){
    sockAction(1, 'list');
}
roomSock.onmessage = function (e) {
    var response = JSON.parse(e.data);
    // console.log(response);
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
        // console.log(messages);
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
        
        case 'full_data':
            sockets[sockIndex].send(JSON.stringify({
                action: "full_data",
                request_id: new Date().getTime(),
            }))
            break;

    }  
}

function fillContacts(data){
    console.log(contactsArea)
    Object.keys(data).forEach(function(index){
        var connection_status = data[index].profile.is_online === true ? 'online':'offline';
        contactsArea.innerHTML += 
            `<a href="#" onclick="ChangeChat(this.id)" id="c-${index}" class="list-group-item list-group-item-action border-0">
                <div class="badge bg-success float-right">2</div>
                <div class="d-flex align-items-start">
                    <img src="${data[index].profile.picture}" class="rounded-circle mr-1" alt="William Harris" width="40" height="40">
                    <div class="flex-grow-1 ml-3">
                        ${data[index].profile.saved_name}
                        <div class="small"><span class="fas fa-circle chat-${connection_status}"></span> ${connection_status}</div>
                    </div>
                </div>
            </a>`;
    })
}

function fillMessages(data){
    console.log(data);
    var messages = data.messages;

    Object.keys(messages).forEach(function(index){
        console.log(messages[index])       
        sender = messages[index].sender === user ? 'you':messages[index].sender
        if(messages[index].sender === user){
            var sender = 'you';
            var align = 'right';
        }else{
            var sender = messages[index].sender;
            var align = 'left';
        }
        chatArea.innerHTML += 
        `<div id="${messages[index].id} "class="chat-message-${align} pb-4">
            <div>
                <img src="${data.profile.picture}" class="rounded-circle mr-1" alt="Chris Wood" width="40" height="40">
                <div class="text-muted small text-nowrap mt-2">2:33 am</div>
            </div>
            <div class="flex-shrink-1 bg-light rounded py-2 px-3 mr-3">
                <div class="font-weight-bold mb-1">${sender}</div>
                ${messages[index].content}
            </div>
        </div>`;
    })
   
}

function ChangeChat(id){
    console.log(id);
    chatArea.innerHTML = '';
    var filteredData = full_data[id.split('-')[1]];
    document.getElementById('cName').innerText = filteredData.profile.saved_name;
    document.getElementById('cPicture').src = filteredData.profile.picture;

    fillMessages(filteredData);
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