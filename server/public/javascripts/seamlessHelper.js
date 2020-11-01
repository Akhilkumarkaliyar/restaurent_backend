function createTableRow(data){
    return $('<tr>').prop({
        id:data.id,
        class: data.class?data.class:'',
    })
}
function createTableCell(data){
    return $('<td>').prop({
        id:data.id,
        class: data.class?data.class:'',
    })
}
function createInputElement(data){
    return $('<input>').prop({
        id:data.id,
        class: data.class?data.class:'',
        type:data.type,
        name:data.name,
        placeholder: data.placeholder?data.placeholder:"",
        value: data.value?data.value:"",
    });
}

function createCardForm(){
    var formTable =  $('<table/>').prop(
        {
            id: 'cardForm'
        }
    );
    var crdNoRow = createTableRow({id:'cardNumberRow'});
    var cardNumber = createInputElement({
        id:"cardNumber",
        type:"text",
        name:"number",
        placeholder:"card number...",
        value:"4444333322221111"
    });
    var cvvRow = createTableRow({id:'CVVRow'});
    var CVV = createInputElement({
        id:"cvv",
        type:"text",
        name:"cvv",
        placeholder:"CVV...",
        value:"123",
    });
    
    var expiryDateRow = createTableRow({id:'expiryDateRow'});
    var monthCell = createTableCell({id:'monthCell'});
    var monthInput = createInputElement({
        id:"expiryMonth",
        type:"text",
        name:"expiryMonth",
        placeholder:"mm",
        value:"04",
    });
    monthInput.attr('maxlength','2');
    var yearInput = createInputElement({
        id:"expiryYear",
        type:"text",
        name:"expiryYear",
        placeholder:"yyyy",
        value:"2023"
    });
    yearInput.attr('maxlength','4');
    var yearCell = createTableCell({id:'yearCell'});
    var nameRow = createTableRow({id:'nameRow'});
    var nameInput = createInputElement({
        id:"holderName",
        type:"text",
        name:"holder",
        placeholder:"name...",
        value: "a",
    });

    formTable.append(crdNoRow.append(crdNoRow.append(cardNumber)));
    formTable.append(nameRow.append(nameInput));
    formTable.append(cvvRow.append(CVV));
    formTable.append(expiryDateRow.append(monthCell.append(monthInput), yearCell.append(yearInput)));
    
    console.log("create card form");
    console.log(formTable);
    console.log(formTable.html());
    return formTable;
}

function createNbForm(){
    var formTable =  $('<table/>').prop(
        {
            id: 'nbForm'
        }
    );
    var nbRow = createTableRow({id:'nbRow'});
    var code = createInputElement({
        id:"bankCode",
        type:"text",
        name:"code",
        placeholder:"bankcode",
        value:"3333",
    });
    formTable.append(nbRow.append(code));
    return formTable

}

function createUpiForm(){
    var formTable =  $('<table/>').prop(
        {
            id: 'upiForm'
        }
    );
    var vpaRow = createTableRow({id:'vpaRow'});
    var vpa = createInputElement({
        id:"vpa",
        type:"text",
        name:"vpa",
        placeholder:"virtual payment address",
    });
    formTable.append(vpaRow.append(vpa));
    return formTable;
}

function createWalletForm(){
    var formTable =  $('<table/>').prop(
        {
            id: 'walletForm'
        }
    );
    var walletRow = createTableRow({id:'vpaRow'});
    var code = createInputElement({
        id:"code",
        type:"text",
        name:"code",
        placeholder:"wallet code",
        value: "4001",
    });
    formTable.append(walletRow.append(code));
    return formTable;
}

function displayFormElement(radioBtnId){
    switch(radioBtnId){
        case paymentOptions.card: {
            console.log("to display card form");
            $('.dynamicContentForm').html(cardForm);
            break;
        }
        case paymentOptions.nb:{
            console.log("to display nb form");
            $('.dynamicContentForm').html(nbForm);
            break;
        }
        case paymentOptions.wallets: {
            console.log("to display wallet form");
            $('.dynamicContentForm').html(walletForm);
            break;
        }
        case paymentOptions.upi:{
            console.log("to display upi form");
            $('.dynamicContentForm').html(upiForm);
            break;
        }
        default:{
            console.log("incorrect payment option selected");
        }
    }
}