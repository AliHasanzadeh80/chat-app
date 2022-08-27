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