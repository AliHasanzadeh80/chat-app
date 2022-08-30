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

chatSock.onopen = function(e){
    console.log('connected!');

    // msgSock.send(JSON.stringify({
    //     action: "list",
    //     request_id: new Date().getTime()
    // }))

    // roomSock.send(JSON.stringify({
    //     action: "retrieve",
    //     request_id: new Date().getTime(),
    //     pk: 3
    // }))

    // msgSock.send(JSON.stringify({
    //     action: "create",
    //     request_id: new Date().getTime(),
    //     data: {
    //         room: 2,
    //         sender: 11,
    //         content: "message1 in room2"
    //     }
    // }))
    
    // roomSock.send(JSON.stringify({
    //     action: "delete",
    //     request_id: new Date().getTime(),
    //     pk: 1
    // }))

    chatSock.send(JSON.stringify({
        action: "gp_send",
        request_id: new Date().getTime(),
        user_pk: 82,
        content: {'message': "send this to everyone!"}
    }))

}

chatSock.onmessage = function (e) {
    data = JSON.parse(e.data)
    console.log(data);
}

chatSock.onclose = function(e){
    console.log('socket closed!!');
}

function checkBX(){
    if(document.getElementById('custom-or-another').checked){
        document.getElementById("inputName").disabled = true;
    }else{
        document.getElementById("inputName").disabled = false;
    }
}

function contactForm(){
    var form = document.getElementById('add-contact');
    form.addEventListener('submit', function(e){
        e.preventDefault();
        var inputName = document.getElementById('inputName');
        var inputPhone = document.getElementById('inputPhone')
        inputs = {
            contact_name: inputName.value,
            phone: inputPhone.value
        }
        inputName.value = '';
        inputPhone.value = '';
    })
}

contactForm()