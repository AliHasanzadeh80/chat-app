// ------------------------------- socket declarations----------------------------------
var ws_schema = window.location.protocol === "http:" ? "ws://" : "wss://";
ws_schema = "ws://";
var chatSock = new WebSocket(ws_schema + window.location.host + '/ws/');
var roomSock = new WebSocket(ws_schema + window.location.host + '/ws/room/');
var msgSock = new WebSocket(ws_schema + window.location.host + '/ws/message/');

// ------------------------------- global variables ----------------------------------
const sockets = [chatSock, roomSock, msgSock];
const invalidPhone = document.getElementById('invalidPhone');
var contactsArea, chatArea, full_data, currentChat, lastSeen;


// ------------------------------- chat socket ----------------------------------
chatSock.onopen = function(e){
    // sockAction(0, 'full_data');
}
chatSock.onmessage = function (e) {
    var response = JSON.parse(e.data);
    // console.log(response);
    if(response.action === "full_data"){
        full_data = response.data;
        contactsArea = document.querySelector('.contacts');
        chatArea = document.querySelector('.chat-messages');
        chatArea.innerHTML = '';
        
        Object.keys(full_data).forEach(function(index){
            fillContacts(full_data[index], index);
        })
    }
    else if(response.action === "update_last_seen"){
        update_last_seen(response.data);
    }
}
// ------------------------------- room socket ----------------------------------
roomSock.onopen = function(e){
    // sockAction(1, 'list');
    // roomSock.send(JSON.stringify({'a':'A'}))
}
roomSock.onmessage = function (e) {
    var response = JSON.parse(e.data);
    console.log(response);
    // if(response.action === "new_chat"){
    //     if(response.response_status == 400){
    //         invalidPhone.innerText = response.data.message;
    //     }else{
    //         var index = Object.keys(response.data)[0];
    //         fillContacts(response.data[index], parseInt(index));
    //         index = parseInt(index);
    //         full_data = {
    //             ...full_data,
    //             index: response.data[index]
    //         }
    //         console.log('new full data:', full_data);
    //     }
    // }
}
// ------------------------------- message socket ----------------------------------
msgSock.onopen = function(e){
    // sockAction(2, 'list');
}
msgSock.onmessage = function (e) {
    
    var response = JSON.parse(e.data)
    console.log(response)
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

function fillContacts(data, id){
    var connection_status = data.profile.is_online === true ? 'online':'offline';
        contactsArea.innerHTML += 
            `<a href="#" onclick="ChangeChat(this.id)" id="pv-${id}" class="list-group-item list-group-item-action border-0">
                <div class="badge bg-success float-right">2</div>
                <div class="d-flex align-items-start">
                    <img src="${data.profile.picture}" class="rounded-circle mr-1" alt="William Harris" width="40" height="40">
                    <div class="flex-grow-1 ml-3">
                        ${data.profile.saved_name}
                        <div class="small"><span class="fas fa-circle chat-${connection_status}"></span><span> ${connection_status}</span></div>
                    </div>
                </div>
            </a>`;
}

function fillMessage(message, sender, align, picture){
        chatArea.innerHTML += 
        `<div id="${message.id} "class="chat-message-${align} pb-4">
            <div>
                <img src="${picture}" class="rounded-circle mr-1" alt="Chris Wood" width="40" height="40">
                <div class="text-muted small text-nowrap mt-2">2:33 am</div>
            </div>
            <div class="flex-shrink-1 bg-light rounded py-2 px-3 mr-3">
                <div class="font-weight-bold mb-1">${sender}</div>
                ${message.content}
            </div>
        </div>`;
}

function ChangeChat(id){
    chatArea.innerHTML = '';
    currentChat = id.split('-')[1];
    var filteredData = full_data[currentChat];
    lastSeen = document.getElementById('last-seen');

    document.getElementById('cName').innerText = filteredData.profile.saved_name;
    document.getElementById('cPicture').src = filteredData.profile.picture;
    if(filteredData.profile.is_online){
        lastSeen.innerText = 'online';
    }else{
        lastSeen.innerText = `last seen: ${filteredData.profile.last_seen}`;
    }

    var messages = filteredData.messages;
    Object.keys(messages).forEach(function(index){     
        if(messages[index].sender === user){
            var sender = 'you';
            var align = 'right';
        }else{
            var sender = messages[index].sender;
            var align = 'left';
        }
        
        fillMessage(messages[index], sender, align, filteredData.profile.picture);
       
    })
}

function update_last_seen(response){
    full_data[response.id].profile.is_online = response.is_online;
    full_data[response.id].profile.last_seen = response.last_seen;
    
    var statusElem = document.getElementById(`pv-${response.id}`).getElementsByClassName('small')[0];
    var statusElemColor = statusElem.getElementsByTagName('span')[0];
    var statusElemText = statusElem.getElementsByTagName('span')[1];
        
    if(response.is_online === true){
        statusElemText.innerText = ' online';
        statusElemColor.classList.remove('chat-offline');
        statusElemColor.classList.add('chat-online');      
    }else{
        statusElemText.innerText = ' offline';
        statusElemColor.classList.add('chat-offline');
        statusElemColor.classList.remove('chat-online');       
    }

    if(currentChat == response.id){
        var status = response.is_online === true ? 'online':`last seen: ${response.last_seen}`;
        lastSeen.innerText = status;
    }

    // console.log('new full data:', full_data);
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