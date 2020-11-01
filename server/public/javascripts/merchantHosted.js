console.log("merchanthosted.js loaded");
const config = {
    layout: {view: "popup", width: "650"},
    mode: "TEST",
}
var merchantHostedForm = $('#merchantHostedForm');
var response = CashFree.init(config);
if (response.status == "OK") {
    cfInitialized = true;
} else {
    console.log("error in initialising cashfree sdk");
    console.log(response.message);
}

function displayResult(status,message){
    $('#resultDiv').html(status);
    if(message){
        $('#resultDiv').append('</br>');
        $('#resultDiv').append(message);
    }
    merchantHostedForm.trigger("reset");
    $('#merchantHostedForm :input').prop('readonly',false);
    $('#payBtn').prop('disabled',false);
    
}

var handleResponse = function(data){
    ajaxCall("POST","/merchantHosted/result",data).then(function(data){
        console.log("result verified data received");
        console.log("data:",data);
        if(data.status!=="success"){
            throw {name: "handle response error", message:data.message}
        }
        displayResult(data.status);

    }).catch(function(err){
        console.log("error caught in handling server response");
        console.log("err:",err);
        displayResult("failure",err.message);
    });
}

var callback = function(event){
    //sample callback to see what response is received
    console.log("call back passed to sdk called");
    console.log("event:",event);

    switch(event.name){
        case(cashFreeSDKEventEnums.paymentRequest): {
            console.log("payment request enum hit");
            console.log("event:",event);
            //do error reporting here
            //.....
            //unfreeze form
            displayResult(event.status,event.message);
            break;
        }
        case(cashFreeSDKEventEnums.paymentResponse): {
            //capture response and send to server
            console.log("payment response enum hit");
            console.log("event:",event);
            const {response} = event;
            handleResponse(JSON.stringify(response));
            break;
        }
        default:{
            console.log("other event caught");
            console.log("event:",event);
        }
    }
}


merchantHostedForm.on('submit', (event)=>{
    //add check for validity of fields
    event.preventDefault();
    if(!cfInitialized){
        console.log("cashfree sdk not initialised, cannot make payments");
        return;
    }
    $('#merchantHostedForm :input').prop('readonly',true);
    $('#payBtn').prop('disabled',true);

    const formObj = createFormObject(merchantHostedForm);
    console.log("formObject:",formObj);

    // /merchantHosted/generateSecret -> old url
    ajaxCall("POST", "/calculateSecretKey", generateDataBody(formObj, paymentTypeEnum.merchantHosted)).then(function(data){
        console.log("merchantHosted, generate secret response received");
        console.log(data);

        if(data.status !== "success"){
            throw {name: "call to server error",message:"something went wrong fetching data", data}
        }

        //initialise cashfree payment object and callback
        const {paymentData} = data;
        CashFree.makePayment(paymentData, callback);

    }).catch(function(err){
        console.log("error");
        console.log(err.message);
        if(err.data){
            console.log(data);
        }
    });


    
});

