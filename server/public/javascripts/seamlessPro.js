const cardForm = createCardForm();
const nbForm = createNbForm();
const upiForm = createUpiForm();
const walletForm = createWalletForm();

$(document).ready(function(){
    displayFormElement(paymentOptions.card);
    $('.paymentRadioInput').change(function(event){
        displayFormElement(event.target.id);    
    });
});
