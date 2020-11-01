const express = require('express');
const parser = require('body-parser');
const ip = require('ip');
const config = require('./config.json');
const helpers = require('./helpers/signatureCreation');
const enums = require('./helpers/enums');

const checkout = require('./checkout');
const merchantHosted = require('./merchantHosted');
const seamlessBasic = require('./seamlessBasic');
const seamlessPro = require('./seamlessPro')


//const notifyUrl = "http://" + ipAdr + ":" + port + "/notify";
//const notifyUrl = "https://webhook.site/e39bbfdd-6b34-421e-8379-1a2dc9a13238"
const notifyUrl = "";
const path = require('path');


const app = express();

app.locals.ipAdr = ip.address();
app.locals.port = 3000;
//const returnUrlCheckOut = "http://" + app.locals.ipAdr + ":" + app.locals.port + "/result";


app.set('views' , path.join(__dirname,'views'));
app.set('view engine','ejs');
app.set('view options', {layout: 'layout.ejs'});

//app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static('public'));
app.use(parser.urlencoded({extended: false}));
app.use(parser.json());

app.use('/checkout',checkout);
app.use('/merchantHosted',merchantHosted);
app.use('/seamlessBasic',seamlessBasic);
app.use('/seamlessPro',seamlessPro);

/*
app.get('/index/index' , (req, res, next)=>{
    console.log("index get hit");
    res.render('index',{
        appId: config.appId, 
        secretKey: config.secretKey, 
        postUrl: config.paths[config.enviornment].cashfreePayUrl});
});
*/


app.post('/calculateSecretKey', (req, res, next)=>{
    const {paymentType} = req.body;
    var {formObj} = req.body;
    const secretKey = config.secretKey;

    switch(paymentType){
        case enums.paymentTypeEnum.checkout: {
            const returnUrl = "http://" + app.locals.ipAdr + ":" + app.locals.port + "/checkout/result";
            formObj.returnUrl = returnUrl;
            formObj.notifyUrl = "";
            formObj.appId = config.appId;
            const signature = helpers.signatureRequest1(formObj, secretKey);
            additionalFields = {
                returnUrl,
                notifyUrl,
                signature,
                appId: config.appId,
            };
            return res.status(200).send({
                status:"success",
                additionalFields,
            });
        }
        case enums.paymentTypeEnum.merchantHosted: {
            var { formObj } = req.body;
            formObj.appId = config.appId;
            formObj.returnUrl = "";
            formObj.notifyUrl = notifyUrl;
            formObj.paymentToken = helpers.signatureRequest2(formObj, config.secretKey);
            return res.status(200).send({
                status: "success",
                paymentData: formObj,
            });
        }
        case enums.paymentTypeEnum.seamlessbasic: {
            //for now assume mode to be popup
            //TODO: add support for redirect
            var { formObj } = req.body;
            var additionalFields = {}; 
            formObj.appId = config.appId;
            additionalFields.paymentToken = helpers.signatureRequest3(formObj, config.secretKey);
            additionalFields.notifyUrl = notifyUrl;
            additionalFields.appId = config.appId;
            additionalFields.orderCurrency = "INR";
            return res.status(200).send({
                status: "success",
                additionalFields
            });
        }

        default: {
            console.log("incorrect payment option recieved");
            console.log("paymentOption:", paymentType);
            return res.status(200).send({
                status:"error",
                message:"incorrect payment type sent"
            });
        }
    }
});

/*app.post('/result', (req,res,next)=>{
    //will have to make generic/payment type based
    console.log("result hit");
    console.log(req.body);
    const signature = req.body.signature;
    const derivedSignature = helpers.signatureResponse1(req.body, config.secretKey);
    if(derivedSignature === signature){
        console.log("works");
    }
    else{
        console.log("signature gotten: ", signature);
        console.log("signature derived: ", derivedSignature);
    }
    return res.status(200).send({
        body: req.body
    });
});*/



//below will not be hit as server is not on https://
app.post('/notify', (req, res, next)=>{
    console.log("notify hit");
    console.log(req.body);
    return res.status(200).send({
        status: "success",
    })
});

app.get('/',(req, res, next)=>{
    console.log("landing page hit");
    /*return res.send({
        status: "success",
        message: "work in progress"
    })*/
    return res.status(200).render("index");
});

app.use((err, req , res , next)=>{
    console.log("error caught");
    console.log(err);
    res.status(500).send({
        status:"fail",
        err: err.message,
    });
})

app.listen('3000', ()=>{
    console.log("server running");
    console.log("config is", config);
})

