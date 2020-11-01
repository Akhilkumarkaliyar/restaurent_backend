var express = require('express');
var router = express.Router();
var config = require('./config.json');
var enums = require('./helpers/enums');
const formatData = require('./helpers/formatData');
var signatureVerification = require('./helpers/signatureCreation');

router.get('/index',(req, res, next)=>{
    return res.status(200).render('seamlessPro');
});

router.post('/pay',(req,res,next)=>{
    try{
        req.body = JSON.parse(JSON.stringify(req.body));
        next();
    }catch(err){
        console.log("err in formatting request body");
        console.log(err);
        return res.status(500).render("error");

    }
});

router.post('/pay',(req, res, next)=>{
    try{
        console.log("/pay hit")
        console.log("req.body:",req.body);
        var data = req.body;
        data.returnUrl = "http://" + req.app.locals.ipAdr + ":" + req.app.locals.port + "/seamlessPro/result";
        data.notifyUrl = "";
        data.appId = config.appId;
        //format data
        formatData.formatSeamlessPro(data.paymentOption, data);
        console.log("formatted data",data);
        data.signature = signatureVerification.signatureRequest1(data, config.secretKey);
        console.log("signature:",data.signature); 
    return res.status(200).render('paymentResultForm',{data, cashfreePayUrl: config.paths['test'].cashfreePayUrl});

    }catch(err){
        console.log("err caught at seamlessPro/pay");
        console.log(err);
        return res.status(500).send({
            status:"error",
            error: err.name,
            message: err.message,
        });
    }
});

router.post('/result',(req, res, next)=>{
    console.log("merchantHosted result hit");
    console.log(req.body);

    const txnTypes = enums.transactionStatusEnum;
    try{
    switch(req.body.txStatus){
        case txnTypes.cancelled: {
            //buisness logic if payment was cancelled
            return res.status(200).render('result',{data:{
                status: "failed",
                message: "transaction was cancelled by user",
            }});
        }
        case txnTypes.failed: {
            //buisness logic if payment failed
            const signature = req.body.signature;
            const derivedSignature = signatureVerification.signatureResponse1(req.body, config.secretKey);
            if(derivedSignature !== signature){
                throw {name:"signature missmatch", message:"there was a missmatch in signatures genereated and received"}
            }
            return res.status(200).render('result',{data:{
                status: "failed",
                message: "payment failure",
            }});
        }
        case txnTypes.success: {
            //buisness logic if payments succeed
            const signature = req.body.signature;
            const derivedSignature = signatureVerification.signatureResponse1(req.body, config.secretKey);
            if(derivedSignature !== signature){
                throw {name:"signature missmatch", message:"there was a missmatch in signatures genereated and received"}
            }
            return res.status(200).render('result',{data:{
                status: "success",
                message: "payment success",
            }});
        }
    }
    }
    catch(err){
        return res.status(500).render('result',{data:{
            status:"error",
            err: err,
            name: err.name,
            message: err.message,
        }});
    }

    const signature = req.body.signature;
    const derivedSignature = signatureVerification.signatureResponse1(req.body, config.secretKey);
    if(derivedSignature === signature){
        console.log("works");
        return res.status(200).send({
            status:req.body.txStatus,
        })
    }
    else{
        console.log("signature gotten: ", signature);
        console.log("signature derived: ", derivedSignature);
        return res.status(200).send({
            status: "error",
            message: "signature mismatch",
        })
    }
})
module.exports = router;