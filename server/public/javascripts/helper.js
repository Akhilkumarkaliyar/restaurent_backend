console.log("helpers file loaded");

var paymentTypeEnum = {
    checkout: "CHECKOUT",
    merchantHosted:"MERCHANTHOSTED",
    seamlessbasic:"SEAMLESSBASIC",
}

var cashFreeSDKEventEnums = {
    paymentRequest: "PAYMENT_REQUEST",
    paymentResponse:"PAYMENT_RESPONSE",
}

var paymentOptions = {
    card: "card",
    nb: "nb",
    wallets: "wallet",
    upi: "upi"
}

function cFO(formArr){
    var formObj = {}
    formArr.forEach(element => {
        formObj[element.name] = element.value
    });
    return formObj;
}

function createFormObject(form){
    formArr = form.find('.mainForm :input').serializeArray();
    return cFO(formArr);
}




function addFormElements(additionalFields, form){
    Object.keys(additionalFields).forEach(function (key) { 
        input = $("<input type=\"text\" id=\"" + key + "\" name=\"" + key + "\" value=\""+ additionalFields[key] + "\" style='display:none' />");
        form.append(input);
     })

}

function generateDataBody(formObj, paymentType){
    console.log("formObj:",formObj);
    console.log({formObj, paymentType});
    return JSON.stringify({formObj, paymentType});
}

function ajaxCall(method, url, data){
    return $.ajax({
        type: method,
        url,
        data,
        cache: false,
        contentType: "application/json",
    });
}

function generateRandomOrderId(){
    return Math.floor(Math.random()*20000)
}

$(document).ready(()=>{
    $('[name="orderId"]').prop('value',generateRandomOrderId());
})