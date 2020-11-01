console.log("script called");
const submitBtn = $('#submitBtn');
var checkoutForm = $('#checkoutForm');
submitBtn.click((event)=>{
    event.preventDefault();
    submitBtn.attr("disabled", true);
    const formObj = createFormObject(checkoutForm);
    console.log("form object",formObj);
    

    //make first ajax call

    /*$.ajax({
        type: "POST",
        url:"/calculateSecretKey",
        cache: false,
        data: formObj,
    }).*/

    ajaxCall("POST","/calculateSecretKey",generateDataBody(formObj, paymentTypeEnum.checkout)).then(function(data){
        console.log("call worked");
        console.log(data);
        return addFormElements(data.additionalFields, checkoutForm);
    }).then(() => {
         $('#payBtn').click();
     }).catch(function(err){
        console.log("error caught");
        console.log(err);
    })
});

/*
function createFormObject(formArr){
    var formObj = {}
    formArr.forEach(element => {
        formObj[element.name] = element.value
    });
    return formObj
}

function addFormElements(additionalFields){
    Object.keys(additionalFields).forEach(function (key) { 
        input = $("<input type=\"text\" id=\"" + key + "\" name=\"" + key + "\" value=\""+ additionalFields[key] + "\" style='display:none' />");
        $('#form1').append(input);
     })

}
*/