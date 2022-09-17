// ------------------------------- socket declarations----------------------------------
var ws_schema = window.location.protocol === "http:" ? "ws://" : "wss://";
var chatSock = new WebSocket(ws_schema + window.location.host + '/ws/');
var roomSock = new WebSocket(ws_schema + window.location.host + '/ws/room/');
var msgSock = new WebSocket(ws_schema + window.location.host + '/ws/message/');

const sockets = [chatSock, roomSock, msgSock];
const invalidPhone = document.getElementById('invalidPhone');
const smPic = "images\\sm.png";
var contactsArea, chatArea, full_data, currentChat, lastSeen, inputMessage;

// ------------------------------- chat socket ----------------------------------
chatSock.onopen = function(e){
    sockAction(0, 'full_data');
}
chatSock.onmessage = function (e) {
    var response = JSON.parse(e.data);
    console.log(response);
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
        update_last_seen(response);
    }
}
// ------------------------------- room socket ----------------------------------
roomSock.onopen = function(e){

}
roomSock.onmessage = function (e) {
    var response = JSON.parse(e.data);
    console.log(response);
    if(response.action === "new_chat"){
        if(response.response_status == 400){
            invalidPhone.innerText = response.data.message;
        }
    }
    else if(response.action === "update_contact"){
        console.log('another action!')
    }
    else{
        var index = Object.keys(response)[0];
        fillContacts(response[index], index);
        full_data[parseInt(index)] = response[index];
        console.log('new full data:', full_data);
    }
}
// ------------------------------- message socket ----------------------------------
msgSock.onopen = function(e){
   
}
msgSock.onmessage = function (e) {   
    var response = JSON.parse(e.data);
    console.log(response)
    var action = response.action;
    switch(action){
        case 'create':
            var createdDraft = response.data;
            createdDraft.sender = user;
            full_data[currentChat].messages.push(createdDraft);
            break;

        case 'new_message':
            var new_message = response.data;  
            var messageID = new_message.id;  
            if(!response.request_id){
                console.log(currentChat, new_message.roomID);               
                if(new_message.sender !== user){
                    if(currentChat == new_message.roomID){
                        sockAction(2, 'patch', messageID, {seen: true});
                    }else{
                        full_data[new_message.roomID].unread_count += 1;
                        unreadUpdate(`pv-${new_message.roomID}`, false, full_data[new_message.roomID].unread_count);
                    }
                }               
                full_data[new_message.roomID].messages.push(new_message);
                if(currentChat == new_message.roomID){
                    var [sender, align] = getAlign(new_message.sender);
                    console.log('new msg:', new_message)
                    fillMessage(new_message, sender, align, new_message.senderPic);
                }
                console.log(full_data);
            }else{
                sockAction(2, 'patch', messageID, {status: "delivered"});
            }
            break;
    }
}


function sockAction(...params){
    // num, action, pk, data
    var sockIndex = params[0];
    var action = params[1];
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

        case 'patch':
            sockets[sockIndex].send(JSON.stringify({
                action: "patch",
                request_id: new Date().getTime(),
                pk: params[2],
                data: params[3]
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

        case 'new_message':
            sockets[sockIndex].send(JSON.stringify({
                action: "new_message",
                request_id: new Date().getTime(),
                inputs: params[2]
            }))
            break;

        case 'update_contact':
            sockets[sockIndex].send(JSON.stringify({
                action: "update_contact",
                request_id: new Date().getTime(),
                inputs: params[2]
            }))
            break;
    }  
}

function fillContacts(data, id){
    // console.log('data:', data, 'id', id);
    var connection_status = data.profile.is_online === true ? 'online':'offline';
    // var unread_messages_count = data.unread_count > 0 ? data.unread_count:'';
    var CounterVisibility = data.unread_count === 0 ? "invisible":"visible";
    var ConStatusVisibility = data.belongs_to === 'pv' ? "visible":"invisible";
    var profPic = data.belongs_to === 'pv' ? data.profile.picture:smPic;
    
    contactsArea.innerHTML += 
        `<a href="#" onclick="ChangeChat(this.id)" id="pv-${id}" class="list-group-item list-group-item-action border-0">
            <div class="badge bg-success float-right ${CounterVisibility}">${data.unread_count}</div>
            <div class="d-flex align-items-start">
                <img src="${profPic}" class="rounded-circle mr-1" alt="William Harris" width="40" height="40">
                <div class="flex-grow-1 ml-3">
                    <div class="username">${data.profile.saved_name}</div>
                    <div class="small ${ConStatusVisibility}">
                        <span class="fas fa-circle chat-${connection_status}"></span>
                        <span id="con-${id}"> ${connection_status}</span>
                    </div>
                </div>
            </div>
        </a>`;
}

function fillMessage(message, sender, align, picture){
    if(message.status === "not delivered"){
        return;
    }
    else if(message.status === "draft"){
        if(message.sender == user){
            inputMessage.value = message.content;
        }
        return;
    }
    chatArea.innerHTML += 
    `<div id="${message.id} "class="chat-message-${align} pb-4">
        <div>
            <img src="${picture}" class="rounded-circle mr-1" alt="sender-pic" width="40" height="40">
            <div class="text-muted small text-nowrap mt-2">${message.delivered_time}</div>
        </div>
        <div class="flex-shrink-1 bg-light rounded py-2 px-3 mr-3">
            <div class="font-weight-bold mb-1">${sender}</div>
            ${message.content}
        </div>
    </div>`;
    chatArea.scrollTop = chatArea.scrollHeight;
}

function ChangeChat(id){
    chatArea.innerHTML = '';
    inputMessage = document.getElementById('input-msg');
    inputMessage.value = '';
    currentChat = id.split('-')[1];
    full_data[currentChat].unread_count = 0;
    lastSeen = document.getElementById('last-seen');
    var filteredData = full_data[currentChat];
    // var unread_counter = document.getElementById(id).querySelector('.badge');
    var messages = filteredData.messages;
    var sender, align;

    document.getElementById('cName').innerText = filteredData.profile.saved_name;

   if(filteredData.belongs_to === 'pv'){
        document.getElementById('cPicture').src = filteredData.profile.picture;
        if(filteredData.profile.is_online){
            lastSeen.innerText = 'online';
        }else{
            lastSeen.innerText = `last seen: ${filteredData.profile.last_seen}`;
        }
   }else{
        document.getElementById('cPicture').src = smPic;
        lastSeen.innerText = '';
   }

    Object.keys(messages).forEach(function(index){   
        [sender, align] = getAlign(messages[index].sender);
        
        fillMessage(messages[index], sender, align, messages[index].senderPic);
        
        // if(messages[index].sender != user && unread_counter !== ''){
        //     sockAction(2, 'patch', messages[index].id, {seen: true});
        //     unread_counter.classList.add('invisible');
        // } 
        if(messages[index].sender != user && messages[index].seen === false){
            sockAction(2, 'patch', messages[index].id, {seen: true});
            unreadUpdate(id, true, 0);
        }
    })
}

function getAlign(sender){
    if(sender === user){
        return ['you', 'right'];      
    }else{
        return [sender, 'left'];
    }
}

function getUnreadCount(id){
    return document.getElementById(id).querySelector('.badge').innerText;
}

function unreadUpdate(id, invisible, newValue){
    var unread_counter = document.getElementById(id).querySelector('.badge');
    unread_counter.innerText = newValue;
    console.log(newValue);
    if(invisible){
        unread_counter.classList.add('invisible');
    }else{
        unread_counter.classList.remove('invisible');
    }
}

function update_last_seen(response){
    var statusElem = document.getElementById(`pv-${response.id}`).getElementsByClassName('small')[0];
    var statusElemColor = statusElem.getElementsByTagName('span')[0];
    var statusElemText = statusElem.getElementsByTagName('span')[1];

    full_data[response.id].profile.is_online = response.is_online;
    full_data[response.id].profile.last_seen = response.last_seen;
        
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

}

function liveMsgInput(e){
    var input = inputMessage.value;
    var ch_messages = full_data[currentChat].messages;
    var draftMessage = Object.values(ch_messages.filter(msg => msg.status === "draft" && msg.sender == user));

    if(draftMessage.length === 0){
        var newDraft = {
            room: currentChat,
            sender: userID,
            content: input,
            status: "draft",
            seen: true,
        };
        sockAction(2, 'create', newDraft);
    }else{
        var ind = Object.keys(ch_messages).find(k => ch_messages[k] === draftMessage[0]);
        ch_messages[ind].content = input;
        if(input){
            sockAction(2, 'patch', draftMessage[0].id, {content: input});
        }else{
            delete ch_messages[ind];
            sockAction(2, 'delete', draftMessage[0].id);
        }
    }

}

function sendMessage(){
    var input = inputMessage.value;
    if(input){
        var ch_messages = full_data[currentChat].messages;
        var draftMessage = Object.values(ch_messages.filter(msg => msg.status === "draft" && msg.sender == user));

        if(draftMessage.length !== 0){
            var ind = Object.keys(ch_messages).find(k => ch_messages[k] === draftMessage[0]);
            delete ch_messages[ind];
            sockAction(2, 'delete', draftMessage[0].id);
        }

        var request = {
            'sender': user,
            'roomID': currentChat,
            'content': inputMessage.value
        };
        sockAction(2, 'new_message', request);
        inputMessage.value = '';
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

function contactInfo(){
    var filteredData = full_data[currentChat];
    var form = document.getElementById('contact-info').getElementsByClassName('form-group2');
    var saved_name = form[1].getElementsByTagName('input')[0];
    form[0].getElementsByTagName('img')[0].src = filteredData.profile.picture;
    if(filteredData.belongs_to !== 'sm'){
        saved_name.value = filteredData.profile.saved_name;
        saved_name.disabled = false;
    }else{
        saved_name.value = '';
        saved_name.disabled = true;
    }
    form[2].getElementsByTagName('input')[0].value = filteredData.profile.username;
    form[3].getElementsByTagName('input')[0].value = filteredData.profile.phone;
    form[4].getElementsByTagName('input')[0].value = filteredData.profile.date_joined;
    form[5].getElementsByTagName('textarea')[0].value = filteredData.profile.bio;
}

function saveContactInfo(){
    var newCName = document.getElementById('info-cName').value;
    if(newCName !== full_data[currentChat].profile.saved_name){
        console.log('true');
        sockAction(1, 'update_contact', {
            roomID: currentChat,
            newCName: newCName,
        })
        document.getElementById(`pv-${currentChat}`).querySelector('.username').innerText = newCName;
        document.getElementById('cName').innerText = newCName;
        full_data[currentChat].profile.saved_name = newCName;
    }else{
        console.log('false')
    }
}

contactForm()