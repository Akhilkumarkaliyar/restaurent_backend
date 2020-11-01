console.log("seamlessBasic.js loaded");


function initConfig(){
    var config = {};
    //config.layout = {view: "popup", width: "650"};
    config.layou={};
    config.checkout = "transparent";
    config.mode = "TEST"; //use PROD when you go live
    return CashFree.init(config);;
}
//test function to access the form
function accessSeamlessBasicForm(){
    return $('#seamlessBasic');
}

//function to enable form, could move to helper.js to make function accessible to all
function accessform(){
    $('#seamlessBasic').find('input').prop('readonly', false);
    $('#payBtn').prop({'disabled':false, 'class':''});
}


function displayResult(status,message){
    $('#resultDiv').html(status);
    if(message){
        $('#resultDiv').append('</br>');
        $('#resultDiv').append(message);
        $('#resultDiv').append('</br>')
    }
    /*
    $('#seamlessBasic').find('input').prop('readonly',false);
    $('#payBtn').prop({'disabled':false, class:''});
    */
    $('#resultDiv').append($('<button/>',{
        text: "refresh",
        id: "refreshBtn",
        click: function(){
            location.reload(true);
        }
    }))
    
}

function handleResponse(data){
    ajaxCall("POST","/seamlessBasic/result",data).then(function(data){
        if(data.status!=="success"){
            throw {name: "handle response error", message:data.message}
        }
        displayResult(data.status);
    }).catch(function(err){
        console.log("handle response error");
        console.log(err);
        displayResult("error",err.message);
    });
}

function handleCfResponse(data){
    switch(data.name){
        case cashFreeSDKEventEnums.paymentResponse: {
            handleResponse(JSON.stringify(data.response));
        }
        default: {
            console.log("unrecognized event");
            console.log("data:",data);
        }
    }
}



const cardForm = createCardForm();
const nbForm = createNbForm();
const upiForm = createUpiForm();
const walletForm = createWalletForm();
$(document).ready(()=>{
    var seamlessBasicForm = $('#seamlessBasic');
    let paymentAllowed = true;
    
    displayFormElement(paymentOptions.card);
    $('.paymentRadioInput').change(function(event){
        displayFormElement(event.target.id);    
    });

    //initialize cfr config here
    const cfrInitResponse = initConfig();
    if(cfrInitResponse.status!="OK"){
        console.log("cfr sdk failed to initialise");
        paymentAllowed=false;
    }


    seamlessBasicForm.on('submit',function(event){
        event.preventDefault();

        //disable input fields and bttns
        seamlessBasicForm.find('input').prop('readonly',true);
        seamlessBasicForm.find('#payBtn').prop({'disabled':true, 'class':'btnDisabled'});
        $('input[name="paymentOption"]').prop('disapled',true);

        //check if payment allowed
        if(!paymentAllowed){
            alert('payments not allowed,cfr sdk failed to initialise');
        }
        
        //get form obj
        let formObj = createFormObject(seamlessBasicForm);
        //CashFree.initPopup();      
        ajaxCall("POST","/calculateSecretKey", generateDataBody(formObj, paymentTypeEnum.seamlessbasic)).then(function(data){
            console.log("ajax call made");
            console.log("calculateSecretKey response");
            console.log(data);
            if(data.status!="success"){
                throw {name: "merchant server error", message: data.message}
            }
            Object.keys(data.additionalFields).forEach((key)=>{
                formObj[key]=data.additionalFields[key];
            });

            //add switch for based on Payment types
            /*switch(){

            }*/
            switch($('input[name="paymentOption"]:checked').val()){
                case paymentOptions.card: {
                    formObj.card = cFO(seamlessBasicForm.find('#cardForm').find('input').serializeArray());
                    formObj.paymentOption="card";
                    break;
                }
                case paymentOptions.nb: {
                    formObj.nb = cFO(seamlessBasicForm.find('#nbForm').find('input').serializeArray());
                    formObj.paymentOption="nb";
                    break;
                }
                case paymentOptions.wallets:{
                    formObj.wallet = cFO(seamlessBasicForm.find('#walletForm').find('input').serializeArray());
                    formObj.paymentOption = "wallet";
                    break;
                }
                case paymentOptions.upi: {
                    formObj.upi = cFO(seamlessBasicForm.find('#upiForm').find('input').serializeArray());
                    formObj.paymentOption = "upi";
                    break;
                }

                default: {
                    console.log("checked value not supported");
                    throw {name: "unsupported payment option", message: "selected payment option is not supported" }
                }
            }
            console.log("final formObj:",formObj);
            CashFree.initPopup() 
            CashFree.paySeamless(formObj, (data)=>{
                console.log("cfr paySeamless cb");
                console.log("cb:",data);
                handleCfResponse(data);

            });
        }).catch(function(err){
            console.log("err caught:",err);
            displayResult("error:"+err.name, err.message);
        });


    });



});

