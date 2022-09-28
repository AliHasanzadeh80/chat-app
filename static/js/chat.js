// ------------------------------- socket declarations----------------------------------
var ws_schema = window.location.protocol === "http:" ? "ws://" : "wss://";
var chatSock = new WebSocket(ws_schema + window.location.host + '/ws/');
var roomSock = new WebSocket(ws_schema + window.location.host + '/ws/room/');
var msgSock = new WebSocket(ws_schema + window.location.host + '/ws/message/');

const sockets = [chatSock, roomSock, msgSock];
const invalidPhone = document.getElementById('invalidPhone');
const conStatus = document.getElementById('connection-status');
const smPic = "images\\sm.png";
var contactsArea, chatArea, full_data, currentChat, lastSeen, inputMessage, forwardModal, fwMessage;
var selectedContacts = [];

// ------------------------------- chat socket ----------------------------------
chatSock.onopen = function(e){
    update_connection_status(true);
    sockAction(0, 'full_data');
}
chatSock.onclose = function(e){
    update_connection_status(false);
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
                        sockAction(2, 'message_status', {
                            roomID: new_message.roomID,
                            messageID: messageID,
                            action: "message_status",
                        })
                    }else{
                        full_data[new_message.roomID].unread_count += 1;
                        unreadUpdate(`pv-${new_message.roomID}`, false, full_data[new_message.roomID].unread_count);
                    }
                }               
                full_data[new_message.roomID].messages.push(new_message);
                if(currentChat === new_message.roomID){
                    var [sender, align] = getAlign(new_message.sender);
                    fillMessage(new_message, sender, align, new_message.senderPic);
                }
                console.log(full_data);
            }else{
                sockAction(2, 'patch', messageID, {status: "delivered"});
            }
            break;

        case 'message_status':
            if(!response.request_id){
                var messages = full_data[response.data.roomID].messages;
                var index = Object.keys(messages).find(k => messages[k].id === response.data.messageID);

                full_data[response.data.roomID].messages[index].seen = true;

                if(response.data.roomID === currentChat){
                    document.getElementById(response.data.messageID).querySelector('.message-ticks').src = 'images/seen.png';
                }
                console.log('new full', full_data);
            }
            break;

        case 'delete_message':
            if(!response.request_id){
                var messages = full_data[response.data.roomID].messages;
                var index = Object.keys(messages).find(k => messages[k].id === response.data.messageID);
                delete full_data[response.data.roomID].messages[index];

                if(response.data.roomID === currentChat){
                    document.getElementById(response.data.messageID).remove();
                }else{
                    if(getUnreadCount(`pv-${response.data.roomID}`) > 0){
                        full_data[response.data.roomID].unread_count -- ;
                        unreadUpdate(`pv-${response.data.roomID}`, false, full_data[response.data.roomID].unread_count)
                    }                       
                }
            }
            break;
    }
}

function update_connection_status(connected){
    if(connected){
        conStatus.innerText = 'connected';
        conStatus.classList.remove('text-danger');
        conStatus.classList.add('text-success');
    }else{
        conStatus.innerText = 'disconnected';
        conStatus.classList.remove('text-success');
        conStatus.classList.add('text-danger');
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

        case 'message_status':
            sockets[sockIndex].send(JSON.stringify({
                action: "message_status",
                request_id: new Date().getTime(),
                inputs: params[2]
            }))
            break;

        case 'delete_account':
            sockets[sockIndex].send(JSON.stringify({
                action: "delete_account",
                request_id: new Date().getTime(),
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

function searchContact(){
    var txtValue, wholeElem;
    var input = document.getElementById('search-contact');
    var filter = input.value.toUpperCase();
    var ul = document.querySelector('.contacts');
    var li = ul.getElementsByClassName('username');
    
    for (let i = 0; i < li.length; i++) {
        wholeElem = li[i].parentElement.parentElement.parentElement;
        txtValue = li[0].textContent || li[0].innerText;
        if(txtValue.toUpperCase().indexOf(filter) > -1){
            wholeElem.style.display = "";
        }else{
            wholeElem.style.display = "none";
        }
    }
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
    var messageTick = message.seen === true ? 'images/seen.png':`images/${message.status}.png`;
    var optionsVisibility, tickHTML;

    if(message.sender == user){
        deleteBtn = `<button class="dropdown-item" onclick="deleteMessage(${message.id})" type="button">delete</button>`;
        tickHTML = `<img src="${messageTick}" class="message-ticks">`;
    }else{
        deleteBtn = '';
        tickHTML = '';
    }
    
    chatArea.innerHTML += 
    `<div id="${message.id}"class="chat-message-${align} pb-4">
        <div>
            <img src="${picture}" class="rounded-circle mr-1" alt="sender-pic" width="40" height="40">
            <div class="text-muted small text-nowrap mt-2">${message.delivered_time}</div>

            <div class="dropdown">
            <i class="fa fa-ellipsis-h" aria-hidden="true" type="button" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"></i>
            <div class="dropdown-menu" aria-labelledby="dropdownMenuButton">
                ${deleteBtn}
                <button class="dropdown-item" onclick="openForward(${message.id})" data-toggle="modal" data-target="#Forward" type="button">forward</button>
            </div>
            
            </div>
        </div>
        <div class="flex-shrink-1 bg-light rounded py-2 px-3 mr-3">
            <div class="font-weight-bold mb-1">${sender}</div>
            <span class="msg-content" id="msg-${message.id}">${messageFormat(message.content)}</span>
            <br>
            ${tickHTML}
        </div>
        
    </div>`;
    chatArea.scrollTop = chatArea.scrollHeight;
}

function messageFormat(message){
    var maxLength = 30;

    if(message.length <= maxLength)
        return message;
    var reg = new RegExp(".{1," + maxLength + "}","g");
    var parts = message.match(reg);

    return parts.join('\n');
}

function deleteMessage(id){
    var messages = full_data[currentChat].messages;
    var index = Object.keys(messages).find(k => messages[k].id === id);

    document.getElementById(id).remove();
    delete full_data[currentChat].messages[index];

    sockAction(2, 'message_status', {
        roomID: currentChat,
        messageID: id,
        action: "delete_message",
    })

    sockAction(2, 'delete', id);
}

function openForward(messageID){
    fwMessage = document.getElementById(`msg-${messageID}`).innerText;
    console.log(fwMessage)
    forwardModal = document.getElementById('forward-contacts');
    forwardModal.innerHTML = '';
    
    Object.keys(full_data).forEach(function(index){
        forwardModal.innerHTML += `
            <a href="#" onclick="forwardActivate(this)" id="fw-${index}" class="list-group-item list-group-item-action border-0">
            <div class="badge bg-success float-right"></div>
            <div class="d-flex align-items-start">
                <img src="${full_data[index].profile.picture}" class="rounded-circle mr-1" alt="William Harris" width="40" height="40">
                <div class="flex-grow-1 ml-3">
                    <div class="username">${full_data[index].profile.saved_name}</div>
                    <div class="small">
                    </div>
                </div>
            </div>
        </a>`;
    })   
}

function forwardActivate(obj){
    var id = obj.id.split('-')[1];

    if(obj.classList.contains('active')){
      obj.classList.remove('active');
      selectedContacts.splice(selectedContacts.indexOf(id), 1);
    }else{
      obj.classList.add('active');
      selectedContacts.push(id);
    }
  }

function forwardMessage(obj){
    console.log(selectedContacts);
    selectedContacts.forEach(function(room, index){
        console.log('sending to room:', room)
        var request = {
            'sender': user,
            'roomID': room,
            'content': fwMessage,
        };
        sockAction(2, 'new_message', request);
    })    

    // document.getElementById('Forward').style.display = 'none';
    selectedContacts = [];
}


function ChangeChat(id){
    chatArea.innerHTML = '';
    inputMessage = document.getElementById('input-msg');
    document.querySelector('.flex-grow-0').classList.remove("invisible");
    document.querySelector('.ch-header').classList.remove("invisible");
    document.querySelector('.socials').innerHTML = '';
    document.getElementById('delete-chatBtn').style.display = 'none';
    inputMessage.value = '';
    currentChat = id.split('-')[1];
    full_data[currentChat].unread_count = 0;
    lastSeen = document.getElementById('last-seen');

    var profilePic = document.getElementById('cPicture');
    var filteredData = full_data[currentChat];
    var messages = filteredData.messages;
    var sender, align;

    profilePic.classList.remove("invisible");
    document.getElementById('cName').innerText = filteredData.profile.saved_name;

    if(filteredData.belongs_to === 'pv'){
        profilePic.src = filteredData.profile.picture;
        if(filteredData.profile.is_online){
            lastSeen.innerText = 'online';
        }else{
            lastSeen.innerText = `last seen: ${filteredData.profile.last_seen}`;
        }
    }else{
        profilePic.src = smPic;
        lastSeen.innerText = '';
    }

    Object.keys(messages).forEach(function(index){   
        [sender, align] = getAlign(messages[index].sender);
        
        fillMessage(messages[index], sender, align, messages[index].senderPic);
      
        if(messages[index].sender != user && messages[index].seen === false){
            sockAction(2, 'patch', messages[index].id, {seen: true});
            sockAction(2, 'message_status', {
                roomID: currentChat,
                messageID: messages[index].id,
                action: "message_status",
            })
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

function clearChat(){
    var messages = full_data[currentChat].messages;
    chatArea.innerHTML = '';
    Object.keys(messages).forEach(function(index){
        sockAction(2, 'delete', messages[index].id);
    })
    full_data[currentChat].messages = [];
    document.getElementById('clearChatClose').setAttribute("data-dismiss", "modal");
}

function deleteChat(){
    sockAction(1, 'delete', currentChat);
    location.reload();
}

function deleteAccount(){
    sockAction(0, 'delete_account')
    window.location.replace("account/register/");
}

contactForm()