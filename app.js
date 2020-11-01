var express =  require('express');
var mysql  = require('mysql');
var app = express();
var bodyParser = require('body-parser');
var bcrypt = require('bcrypt');
var { check, validationResult } = require('express-validator/check');
var session = require('express-session');
var mailer = require('express-mailer');
var today = new Date();
var request = require('request');
var isset = require('isset');
var qs = require('querystring');
var checksum_lib = require('./checksum/checksum.js');
var Nexmo = require('nexmo');
var https = require('https');
var nexmo = new Nexmo({
  apiKey: '022e9d62',
  apiSecret: 'co9vf5xn6c2gKxTz',
});
app.use(express.static('public'));
mailer.extend(app, {
  from: 'no-reply@galdermamiddleast.com',
  host: 'in-v3.mailjet.com', // hostname
  secureConnection: false, // use SSL
  port: 587, // port for secure SMTP
  transportMethod: 'SMTP', // default is SMTP. Accepts anything that nodemailer accepts
  auth: {
    user: '5cf69fab2a134d73fd33e9b1d25708b7',
    pass: 'db308f5ace974b5d4a2d009700aaf1f7'
  }
});


///////////
var createError = require('http-errors');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var indexRouter = require('./routes/index');
var crypto    = require('crypto');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use('/', indexRouter);

///////////
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 60000 }
}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.raw());
app.use(bodyParser.text());
app.use(function(req, res, next) {
    if (req.headers.origin) {
        res.header('Access-Control-Allow-Origin', '*')
        res.header('Access-Control-Allow-Headers', 'X-Requested-With,Content-Type,Authorization')
        res.header('Access-Control-Allow-Methods', 'GET,PUT,PATCH,POST,DELETE')
        if (req.method === 'OPTIONS') return res.send(200)
    }
    next()
});
var multer  = require('multer');
var storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'public/images');
    },
    filename: (req, file, cb) => {
      console.log(file);
      var filetype = '';
      if(file.mimetype === 'image/gif') {
        filetype = 'gif';
      }
      if(file.mimetype === 'image/png') {
        filetype = 'png';
      }
      if(file.mimetype === 'image/jpeg') {
        filetype = 'jpg';
      }
      cb(null, 'image-' + Date.now() + '.' + filetype);
    }
});
var upload = multer({storage: storage});
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
//********Database Parameter************//
var connection =mysql.createConnection({
    //properties
    host : 'localhost',
    user : 'root',
    password : '',
    database : 'restaurant'
});
//********Database Parameter************//
//********Database Connection************//
connection.connect(function(error){
    if(!!error){
        console.log('error');
    } else {
        console.log('connected');
    }
});
//********Database Connection************//
app.post('/login', function(req, res){
	var ranstr = Math.random().toString(36).replace('0.', '') ;
	var email= req.body.email;
	var password = req.body.password;
	connection.query('SELECT * FROM r_users WHERE email = ?',[email], function (error, results, fields)
	{
		console.log(results);
		if (error) 
		{
			res.send({
				"code":400,
				"failed":"error ocurred"
			})
		}else
		{
			if(results.length >0)
			{
				bcrypt.compare(password, results[0].password, function (err, result) 
				{
					//console.log(result);
					connection.query('update r_users set login_token =? WHERE email = ?',[ranstr,email], function (error, result, fields)
					{
						var sess = req.session;  //initialize session variable
						req.session.userId = results[0].id; //set user id
						req.session.email = results[0].email;//set user name
						ssn = req.session;
					});
					//console.log(result);
					if(result == true){
						connection.query('SELECT * FROM r_users WHERE email = ?',[email], function (error, resu, fields)
						{
							if (error) 
							{
								res.send({
									"code":400,
									"failed":"error ocurred"
								})
							}else
							{
								console.log(resu);
								if(resu[0].usertype == '1')
								{
									res.send({
										"status":'1',
										"message":"login sucessful",
										"data":resu[0],
										"excelbaseurl":'http://localhost:8082/',
										"usertype":'1',
									});
								}else if(resu[0].usertype == '2'){
									res.send({
										"status":'1',
										"message":"login sucessful",
										"data":resu[0],
										"excelbaseurl":'http://localhost:8082/',
										"usertype":'2',
									});
								}
							}
						});
					}
					else{
						res.send({
							"status":'0',
							"message":"Email or password does not match"
						});
					}
				});
			}
			else{
				res.send({
					"status":'0',
					"message":"Email does not exits"
				});
			}
		}
	});
});
app.post('/sendotp' ,function(req, res){
	
	//var otps 	= Math.floor(1000 + Math.random() * 9000);
	var ranstr = Math.random().toString(36).replace('0.', '') ;
	var otps 	= '123456';
	var mobile 	= req.param('mobile');
	//var to 	= '91'+ mobile;
	console.log(mobile);
	var to 		=  mobile;
	var text 	= otps;
	var from 	= 'Restaurant App';
	var upevent={
			"mobile":req.param('mobile'),
			"otp":otps,
			"login_token":ranstr,
		}
	var otp ={
		"otp":otps,
		"login_token":ranstr,
	}
	var sql ="select * from r_users where mobile='"+mobile+"' ";
	connection.query(sql,function(error, result , fields){
		if(!!error){
			res.send({
				  "message":"Something Went wrong!",
				  "status":error,
				  "ss":1,
				});
		} else {
			var numRows = result.length;
			if(numRows > 0)
			{
				res.send({
				  "message":"This number is already registered with us, please log in",
				  "status":'2',
				});
			}else{
				var sql ="select * from r_user_otp where mobile='"+mobile+"'";
				connection.query(sql,function (error, result, fields) {
					if(!!error){
						res.send({
							  "message":"Something Went wrong!",
							  "status":error,
								"ss":2,
							});
					} else {
						var numRows = result.length;
						if(numRows > 0)
						{
							connection.query('update r_user_otp SET ? where mobile = ?',[otp,mobile],function (error, result, fields) {
								if(!!error){
									res.send({
										  "message":"Something Went wrong!",
											"status":error,
											"ss":3,
										});
								} else {
									var numRows = result.affectedRows;
									if(numRows > 0)
									{
										var options = { method: 'GET',
										url: 'https://global.datagenit.com/API/sms-api.php',
										qs:
										   { 
											auth: 'D!~2802boIYC3WMFn',
											senderid: 'ARTIFY',
											msisdn: to,
											message: text
										  },
										  strictSSL: false,
										  rejectUnauthorized: false,
										  headers:
										   {	'cache-control': 'no-cache' } 
										};
										request(options, function (error, response, body) {
										  if (error) throw new Error(error);

											//console.log(body);
											res.send({
												  "message":"Otp Send Successfully",
												  "status":'1',
												});
										});
									}
								}
							});
						}else{
							connection.query('insert into r_user_otp SET ?',[upevent],function (error, result, fields) {
								if(!!error){
									res.send({
										  "message":"Something Went wrong!",
										  "status":error,
											"ss":4,
										});
								} else {
									var numRows = result.affectedRows;
									if(numRows > 0)
									{
										var options = { method: 'GET',
										url: 'https://global.datagenit.com/API/sms-api.php',
										qs:
										   { 
											auth: 'D!~2802boIYC3WMFn',
											senderid: 'ARTIFY',
											msisdn: to,
											message: text
										  },
										  strictSSL: false,
										  rejectUnauthorized: false,
										  headers:
										   {	'cache-control': 'no-cache' } 
										};
										request(options, function (error, response, body) {
										  if (error) throw new Error(error);

											//console.log(body);
											res.send({
												  "message":"Otp Send Successfully",
												  "status":'1',
												});
										});
									}
								}
							});
						}
					}
				});	
			}
		}
	});
	
});
app.post('/checkotp' ,function(req, res){
	//console.log(req);
	//var auth =  req.param('auth');
	//console.log(auth);
	var mobile =  req.param('mobile');
	var otp = req.param('otp');
	var sql ="select * from r_user_otp where mobile ='"+mobile+"' and otp='"+otp+"'";
    connection.query(sql ,function(error, result , fields){
        if(!!error){
            console.log('error in query ');
			res.send({
				  "status":'2',
				  "message":"Error in Query"
				});
        } else {
			numRows = result.length;
			if(numRows > 0)
			{
				res.send({
				  "message":"Otp Varified",
				  "status":'1',
				  "data":result,
				});
			}else{
				res.send({
				  "message":"Otp not varified Please try again!!!!",
				  "status":'2',
				});
			}
		} 
    });
});
app.get('/menucard' ,function(req, res){
	
	var jwttoken = req.headers.authorization;
	var TokenArray = jwttoken.split(" ");
	var token = TokenArray[1];
	verifyuser(token).then(data => {
		if(data[0] == 1){
			var restaurant_id =  req.param('restaurant_id');
			var sql ="select id,name from r_category where rest_id='"+restaurant_id+"'";
			connection.query(sql ,function(error, catresult , fields){
				if(!!error){
					console.log('error in query ');
					res.send({
						  "status":'2',
						  "message":"Error in Query"
						});
				} else {
					getData(catresult,restaurant_id).then(data => {
						console.log('promise return ', data);
						res.send({
						  "status":1,
						  "message":"Menu Data list",
						  "data":data
						});
					})
					.catch(function(error){
						res.send({
						  "status":2,
						  "message":"No data Found !!!",
						});
					})
					
				}
			});
		}else{
			res.send({
			  "status":5,
			  "message":"Not Valid User!!!",
			});
		}
		
	})
	.catch(function(error){
		res.send({
		  "status":5,
		  "message":"Not Valid User!!!",
		});
	})
});
const getData =  async function(catresult,restaurant_id) {
	var promiseArray = [];
	if(catresult[0])
	{
		catresult.forEach(function(value, index, arr){
			var catid = value.id;
			var sqla="select * from r_menu where cat_id='"+catid+"' and restaurant_id ='"+restaurant_id+"'";
			promiseArray.push(
				 new Promise((resolve, reject) =>
					connection.query(sqla, function (error, menudata, fields) {
						if (error) {
							resolve( index );
						}else{
							alldata = {catname:value.name,catid:value.id,item:menudata};
							resolve(alldata);
						}
					})
				)
			);
		});
	}
	return await  Promise.all(promiseArray);
}
app.get('/restaurant_detail' ,function(req, res){
	var jwttoken = req.headers.authorization;
	var TokenArray = jwttoken.split(" ");
	var token = TokenArray[1];
	verifyuser(token).then(data => {
		//console.log(data[0]);
		if(data[0] == 1){
			var restaurant_id =  req.param('restaurant_id');
			var sql ="select * from  r_users where restaurant_id ='"+restaurant_id+"'";
			connection.query(sql ,function(error, userinfo , fields){
				if(!!error){
					console.log('error in query ');
					res.send({
						  "status":'2',
						  "message":"Error in Query"
						});
				} else {
					numRows = userinfo.length;
					if(numRows > 0)
					{
						res.send({
						  "message":"Restaurant Detail",
						  "status":'1',
						  "data":userinfo,
						});
					}else{
						res.send({
						  "message":"No detail found !!!!",
						  "status":'2',
						  "data":userinfo,
						});
					}
				} 
			});
		}else{
			res.send({
			  "status":5,
			  "message":"Not Valid User!!!",
			});
		}
		
	})
	.catch(function(error){
		res.send({
		  "status":5,
		  "message":"Not Valid User!!!",
		});
	})
});
app.post('/qrcode' ,function(req, res){
	var restid= req.body.restid;
	var tabid= req.body.tabid;
	var qr = require('qr-image');
	var newtext ="restaurantcode="+restid+"&tableid"+tabid;
	//console.log(newtext);
	var code = qr.image(newtext, { type: 'png', ec_level: 'H', size: 10, margin: 0 });
    res.setHeader('Content-type', 'image/png');
    var dat = JSON.stringify(code.pipe(res));
	res.send({
			  "message":"qr code image",
			  "status":'1',
			  "data":dat,
			});
});
app.get('/qr/:text', function(req,res){
	var qr = require('qr-image');
    var code = qr.image(req.params.text, { type: 'png', ec_level: 'H', size: 10, margin: 0 });
    res.setHeader('Content-type', 'image/png');
	console.log(code);
	code.pipe(res);
	//res.render('index', { title: 'QR Page', qr: code });
});
//********All User Detail************//
//////*************************Category***************/////////////////
app.post('/category' ,function(req, res){
	var totalrecord= req.body.totalrecord;
	var pagevalue= req.body.pagevalue;
	var restid= req.body.restid;
	var pagecount = pagevalue *10;
	var endcount = totalrecord;
	connection.query("select count(*) as rows from r_category where is_deleted='0' and rest_id='"+restid+"'",function(error, results , fields){
	if(!!error){
		res.send({
			  "message":"Something Went wrong!",
			  "status":error,
			});
		} else {
			var sql="select * from r_category where is_deleted='0' and rest_id='"+restid+"'  LIMIT "+pagecount+","+endcount+"";
			connection.query(sql,function(error, result , fields){
				if(!!error){
					res.send({
						  "message":"Something Went wrong!",
						  "status":error,
						});
				} else {
					var countrecord =results[0].rows;
					if(countrecord < 10){
						res.send({
						  "message":"Category Listing!",
						  "status":'1',
						  "data":result,
						  "record":'',
						});
					}else{
						res.send({
						  "message":"Category Listing!",
						  "status":'1',
						  "data":result,
						  "record":countrecord,
						});
					}
				} 
			});
		}
	});
});
app.post('/categoryid' ,function(req, res){
	var id= req.param('id');
	console.log(id);
    connection.query("select * from r_category where id = ?" ,[id] ,function(error, result , fields){
        if(!!error){
            console.log('error in query ');
			res.send({
				  "code":400,
				  "message":"Error in Query"
				});
        } else {
			numRows = result.length;
			if(numRows > 0)
			{
				res.send({
				  "code":200,
				  "message":"Category Detail",
				  "status":1,
				  "data":result
				});
			}else{
				res.send({
				  "code":200,
				  "message":"Category Detail",
				  "status":2,
				  "data":result
				});
			}
			console.log(result);
        } 
    });
});
app.post('/createcategory', function(req, res){ 
	var category={
			"name":req.body.name,
			"rest_id":req.body.rest_id,
			"status":1,
			"created_date":today,
			"modified_date":today
		}
		connection.query('INSERT INTO r_category SET ?',category, function (error, result, fields) {
		if (error) {
			res.send({
			  "code":400,
			  "failed":error
			})
		}else{
			numRows = result.affectedRows;
			if(numRows > 0)
			{
				res.send({
				  "status":1,
				  "message":"Category added sucessfully"
				});	
			}else{
				res.send({
				  "status":2,
				  "message":"Category not added sucessfully"
				});
			}
			
		}
	});
});
app.post('/updatecategory', function(req, res){ 
	var category={
			"name":req.body.name,
			"restid":req.body.restid,
			"modified_date":today
		}
		var id = req.body.id;
		connection.query('Update r_category  SET ? where id =?',[category,id], function (error, result, fields) {
		if (error) {
			res.send({
			  "status":3,
			  "failed":"Something went wrong!!"
			})
		}else{
			numRows = result.affectedRows;
			if(numRows > 0)
			{
				res.send({
				  "status":1,
				  "message":"Category updated sucessfully"
				});	
			}else{
				res.send({
				  "status":2,
				  "message":"Category not updated sucessfully"
				});
			}
			
		}
	});
});
app.post('/deletecategory', function(req, res){ 
		
		var id = req.body.id;
		connection.query("Update r_category  SET 	is_deleted='1' where id =?",[id], function (error, result, fields) {
		if (error) {
			res.send({
			  "status":3,
			  "failed":"Something went wrong!!"
			})
		}else{
			numRows = result.affectedRows;
			if(numRows > 0)
			{
				connection.query("select * from r_category where is_deleted = ?",0,function(error, result , fields){
					if(!!error){
						res.send({
							  "message":"Something Went wrong!",
							  "status":'3',
							  "data":result
							});
					} else {
						if(!!error){
							res.send({
								  "message":"Something Went wrong!",
								  "status":'3',
								  "data":result
								});
						} else {
							res.send({
								  "message":"Category List updated Sucessfully",
								  "status":'1',
								  "data":result
								});
						} 
					} 
				});
			}else{
				res.send({
				  "status":2,
				  "message":"Category not deleted sucessfully"
				});
			}
			
		}
	});
});
//////*************************Category***************/////////////////
//********All User List************//
app.post('/alldata' ,function(req, res){
	var restid= req.body.restid;
	connection.query("select * from r_users where usertype = 2 and restaurant_id='"+restid+"' ",function(error, result , fields){
        if(!!error){
            res.send({
				  "message":"Something Went wrong!",
				  "status":error,
				});
        } else {
            res.send({
				  "message":"User List",
				  "status":'1',
				  "data":result
				});
        } 
    });
});
//********All User List************//
//********All User Detail************//
app.post('/alldatabyuser' ,function(req, res){
	var id= req.body.id;
    connection.query("select * from r_users where id = ?" ,[id] ,function(error, result , fields){
        if(!!error){
            console.log('error in query ');
			res.send({
				  "code":400,
				  "message":"Error in Query"
				});
        } else {
			numRows = result.length;
			if(numRows > 0)
			{
				res.send({
				  "code":200,
				  "message":"User Detail",
				  "status":1,
				  "data":result
				});
			}else{
				res.send({
				  "code":200,
				  "message":"User Detail",
				  "status":2,
				  "data":result
				});
			}
			//console.log(result);
        } 
    });
});
//********All User Detail************//
app.post('/product' ,function(req, res){
    var totalrecord = req.body.totalrecord;
    var sortby = req.body.sortby;
    var typevalue = req.body.gettype;
    var addedby= req.body.addedby;
	var pagevalue= req.body.pagevalue;
	var pagecount = pagevalue *10;
	var endcount = totalrecord;
	//console.log(totalrecord);
	var sql ="SELECT m.*,c.name as catname FROM r_menu as m JOIN r_category as c ON c.id=m.cat_id where m.is_deleted='0' and m.created_by='"+addedby+"' ORDER BY "+sortby+" ASC LIMIT "+pagecount+","+endcount+"";
	
	
	connection.query(sql,function(error, result , fields){
        if(!!error){
            res.send({
				  "message":"Something Went wrong!",
				  "status":error,
				});
        } else {
			var Numrows =result.length;
			if(Numrows > 0){
				var sql ="SELECT count(*) as rows FROM  r_menu as p JOIN r_category as c ON p.cat_id= c.id where p.is_deleted='0' and created_by='"+addedby+"'";
				connection.query(sql,function(error, results , fields){
					if(!!error){
						res.send({
							  "message":"Something Went wrong!",
							  "status":'3',
							});
					} else {
						var countrecord =results[0].rows;
						if(countrecord < 1){
							res.send({
							  "message":"Product Listing!",
							  "status":'1',
							  "data":result,
							  "record":'',
							});
						}else{
							res.send({
							  "message":"Product Detail!",
							  "status":'1',
							  "data":result,
							  "record":countrecord,
							});
						}
						
					}
				});
			}else{
				res.send({
				  "message":"No data found",
				  "status":'2',
				  "data":result
				});
			}
        } 
    });
});
app.post('/productsearch' ,function(req, res){
	var search= req.body.value;
	var sortby= req.body.sortby;
	var typevalue= req.body.gettype;
	var addedby= req.body.addedby;
	var totalrecord = req.body.totalrecord;
    var pagevalue= req.body.pagevalue;
	var pagecount = pagevalue *10;
	var endcount = totalrecord;
	//console.log(totalrecord);
	//var sql ="SELECT * FROM r_menu as p where (p.name LIKE '%"+search+"%' OR p.chemical_name LIKE '%"+search+"%' or p.company_name LIKE '%"+search+"%' or p.rack_no LIKE '%"+search+"%' or p.batch_no LIKE '%"+search+"%' or p.barcode LIKE '%"+search+"%') and added_by='"+addedby+"'and cat_id='"+typevalue+"' ORDER BY "+sortby+" ASC LIMIT "+pagecount+","+endcount+"";
	
	var sql ="SELECT m.*,c.name as catname FROM r_menu as m JOIN r_category as c ON c.id=m.cat_id where (m.restaurant_id LIKE '%"+search+"%' OR m.name LIKE '%"+search+"%' OR m.cost LIKE '%"+search+"%' OR c.name LIKE '%"+search+"%') and m.created_by='"+addedby+"' ORDER BY "+sortby+" ASC LIMIT "+pagecount+","+endcount+"";
	
	connection.query(sql,function(error, result , fields){
        
		if(!!error){
            console.log('error in query ');
			res.send({
				  "code":400,
				  "message":error
				});
        } else {
			numRows = result.length;
			var sql ="SELECT count(*) as rows FROM r_menu as m JOIN r_category as c ON m.cat_id= c.id where (m.restaurant_id LIKE '%"+search+"%' OR m.name LIKE '%"+search+"%' OR m.cost LIKE '%"+search+"%' OR c.name LIKE '%"+search+"%') and created_by='"+addedby+"'";
			connection.query(sql,function(error, results , fields){
				if(!!error){
					res.send({
						  "message":"Something Went wrong!",
						  "status":error,
						});
				} else {
					var countrecord =results[0].rows;
					if(countrecord < 10){
						res.send({
						  "message":"Product Listing!",
						  "status":'1',
						  "data":result,
						  "record":'',
						});
					}else{
						res.send({
						  "message":"Product Detail!",
						  "status":'1',
						  "data":result,
						  "record":countrecord,
						});
					}
					
				}
			});
			//console.log(result);
        } 
    });
});
app.post('/productid' ,function(req, res){
	var id= req.body.id;
    connection.query("select * from r_menu where id = ?" ,[id] ,function(error, result , fields){
        if(!!error){
            console.log('error in query ');
			res.send({
				  "code":400,
				  "message":"Error in Query"
				});
        } else {
			numRows = result.length;
			if(numRows > 0)
			{
				res.send({
				  "code":200,
				  "message":"Product Detail",
				  "status":1,
				  "data":result
				});
			}else{
				res.send({
				  "code":200,
				  "message":"Product Detail",
				  "status":2,
				  "data":result
				});
			}
			console.log(result);
        } 
    });
});
app.post('/createorder',function(req, res, next){ 
	var jwttoken = req.headers.authorization;
	var TokenArray = jwttoken.split(" ");
	var token = TokenArray[1];
	console.log(req.body.restaurant_id);
	connection.query("select * from r_user_otp where login_token='"+token+"'", function (error, result, fields) {
		if (error) {
			res.send({
			  "code":400,
			  "failed":error
			})
		}else{
			numRows = result.length;
			if(numRows > 0)
			{
				var user = result[0].id;
				var items = req.body.items;
				//console.log(items);
				//var user = req.body.user;
				//var item_name = req.param('item_name');
				var restaurant_id = req.body.restaurant_id;
				var totalamount = req.body.totalamount;
				var table_id = req.body.table_id;
				var orderdeatail ={
					"restaurant_id":restaurant_id,
					"table_id":table_id,
					"cust_name":user,
					"status":1,
					"total_amount":totalamount,
					//"created_date":today,
					//"modified_date":today,
				}
				connection.query('INSERT INTO r_orderdetail SET ?',orderdeatail, function (error, result, fields) {
					if (error) {
						res.send({
						  "code":400,
						  "failed":error
						})
					}else{
						numRows = result.affectedRows;
						if(numRows > 0)
						{
							var order_id =result.insertId;
							putorder(items,order_id).then(data => {
								console.log('promise return ', data);
									res.send({
									  "status":1,
									  "message":"order place sucessfully",
									});
								})
								.catch(function(error){
									res.send({
									  "status":2,
									  "message":"No data Found !!!",
									});
								})
							
						}else{
							res.send({
							  "status":2,
							  "message":"Product not added sucessfully"
							});
						}
						
					}
				});
				
			}else{
				res.send({
				  "status":5,
				  "message":"Not valid user"
				});
			}
			
		}
	});
});
const putorder =  async function(items,order_id) {
	var promiseArray = [];
	if(items[0])
	{
		items.forEach(function(value, index, arr){
			var orderitem ={
						"order_id":order_id,
						"item_name":value.itemid,
						//"price":value.price,
						"quantity":value.quantity,
					}
					console.log(orderitem);
			promiseArray.push(
				 new Promise((resolve, reject) =>
					connection.query('INSERT INTO r_orderitem SET ?',orderitem, function (error, result, fields) {
						if (error) {
							resolve( index );
						}else{
							console.log(result);
							resolve(result);
						}
					})
				)
			);
		});
	}
	return await  Promise.all(promiseArray);
}
app.post('/updateorder',function(req, res, next){ 
	var jwttoken = req.headers.authorization;
	var TokenArray = jwttoken.split(" ");
	var token = TokenArray[1];
	connection.query("select * from r_user_otp where login_token='"+token+"'", function (error, result, fields) {
		if (error) {
			res.send({
			  "code":400,
			  "failed":error
			})
		}else{
			numRows = result.length;
			if(numRows > 0)
			{
	
			var order_id = req.body.order_id;
			var newamount = req.body.newamount;
			var items = req.body.items;
			changeorder(items,order_id,newamount).then(data => {
				console.log('promise return ', data);
					res.send({
					  "status":1,
					  "message":"Order Updated sucessfully",
					});
				})
				.catch(function(error){
					res.send({
					  "status":5,
					  "message":"No data Found !!!",
					});
				})
		}else{
				res.send({
				  "status":5,
				  "message":"Not valid user"
				});
			}
			
		}
	});
});
const changeorder =  async function(items,order_id,newamount) {
	var promiseArray = [];
	if(items[0])
	{
		items.forEach(function(value, index, arr){
			var itemid = value.itemid;
			var quantity = value.quantity;
			var sql = "select * from r_orderdetail where id='"+order_id+"'";
			connection.query(sql, function (error, result, fields) {
				if (error) {
					res.send({
					  "code":400,
					  "failed":error
					})
				}else{
					numRows = result.length;
					if(numRows > 0)
					{
						var oldamount =result[0].total_amount;
						var amount = parseInt(newamount)+parseInt(oldamount);
						var sql = "update r_orderdetail set total_amount='"+amount+"' where id='"+order_id+"'";
						connection.query(sql, function (error, result, fields) {
							if (error) {
								res.send({
								  "code":400,
								  "failed":error
								})
							}else{
								numRows = result.affectedRows;
								if(numRows > 0)
								{
									var sql = "select * from r_orderitem where order_id='"+order_id+"' and item_name='"+itemid+"'";
									connection.query(sql, function (error, result, fields) {
										if (error) {
											res.send({
											  "code":400,
											  "failed":error
											})
										}else{
											numRows = result.length;
											if(numRows > 0)
											{
												var getres = result[0].quantity;
												var quan = parseInt(getres)+parseInt(quantity); 
												var sql = "update r_orderitem set quantity='"+quan+"' where order_id='"+order_id+"' and item_name='"+itemid+"'";
												promiseArray.push(
													 new Promise((resolve, reject) =>
														connection.query(sql, function (error, result, fields) {
															if (error) {
																resolve( index );
															}else{
																resolve( result );
															}
														})
													)
												);
											}else{
												var orderitem ={
													"order_id":order_id,
													"item_name":itemid,
													"quantity":quantity,
												} 
												promiseArray.push(
													 new Promise((resolve, reject) =>
														connection.query('INSERT INTO r_orderitem SET ?',orderitem, function (error, result, fields) {
															if (error) {
																resolve( index );
															}else{
																resolve( result );
															}
														})
													)
												);
											}
										}
									});
								}
							}
						});
					}
				}
			});
			
		});
	}
	return await  Promise.all(promiseArray);
}
app.post('/getorderdetail' ,function(req, res){
	var jwttoken = req.headers.authorization;
	var TokenArray = jwttoken.split(" ");
	var token = TokenArray[1];
	verifyuser(token).then(data => {
		if(data[0] == 1){
			var restaurant_id = req.param('restaurant_id');
			var table_id = req.param('table_id');
			var sql ="select * from r_orderdetail where restaurant_id='"+restaurant_id+"' and table_id='"+table_id+"' ORDER BY Id DESC LIMIT 0,1";
			connection.query(sql,function(error, result , fields){
				if(!!error){
					res.send({
						  "message":"Something Went wrong!",
						  "status":'2',
						});
				} else {
					var numRows = result.length;
					if(numRows > 0)
					{
						var lastid = result[0].id;
						var fulldeatil = [];
						var sql ="select o.*,m.* from r_orderitem o JOIN r_menu as m ON m.id= o.item_name where order_id='"+lastid+"' ";
						connection.query(sql,function(error, results , fields){
							if(!!error){
								res.send({
									  "message":"Something Went wrong!",
									  "status":'2',
									});
							} else {
								fulldeatil.push({orderdetail:result[0],productdetail:results});
								res.send({
								  "message":"Order Detail List",
								  "status":'1',
								  "data":fulldeatil
								});
							}
						});
					} else{
						var fulldeatil = [];
						res.send({
							  "message":"Order Detail List",
							  "status":'2',
							  "data":fulldeatil
							});
					}
					
				} 
			});
		}else{
			res.send({
			  "status":5,
			  "message":"Not Valid User!!!",
			});
		}
		
	})
	.catch(function(error){
		res.send({
		  "status":5,
		  "message":"Not Valid User!!!",
		});
	})
});
app.post('/genratebill' ,function(req, res){
	
	var jwttoken = req.headers.authorization;
	var TokenArray = jwttoken.split(" ");
	var token = TokenArray[1];
	verifyuser(token).then(data => {
		if(data[0] == 1){
			var restaurant_id = req.param('restaurant_id');
			var table_id = req.param('table_id');
			var sql ="select * from r_orderdetail where restaurant_id='"+restaurant_id+"' and table_id='"+table_id+"' ORDER BY Id DESC LIMIT 0,1";
			connection.query(sql,function(error, result , fields){
				if(!!error){
					res.send({
						  "message":"Something Went wrong!",
						  "status":'2',
						});
				} else {
					//console.log(result);
					var totalamount = result[0].total_amount;
					var billno = result[0].restaurant_id+result[0].id;
					console.log(totalamount);
					var taxamount =(totalamount*5)/100;
					var newamount = parseInt(totalamount) + parseInt(taxamount);
					var service =(newamount*10)/100;
					var serviceamount = parseInt(newamount) + parseInt(service);
					var discount =(serviceamount*5)/100;
					var payamount =parseInt(serviceamount) - parseInt(discount);
					res.send({
					  "message":"Order Bill Detail",
					  "status":'1',
					  "Totalamount":totalamount,
					  "tax":taxamount,
					  "service_charge":service,
					  "Discount":discount,
					  "Payamount":payamount,
					  "Billnumber":billno
					  
					});
					
				} 
			});
		}else{
			res.send({
			  "status":5,
			  "message":"Not Valid User!!!",
			});
		}
		
	})
	.catch(function(error){
		res.send({
		  "status":5,
		  "message":"Not Valid User!!!",
		});
	})
	
});
app.get('/restdata' ,function(req, res){
	var sql="select * from r_users where usertype ='2' ";
	connection.query(sql,function(error, result , fields){
		if(!!error){
			res.send({
				  "message":"Something Went wrong!",
				  "status":error,
				});
		} else {
			var numRows = result.length;
			if(numRows > 0)
			{
				res.send({
				  "message":"restdata Listing!",
				  "status":'1',
				  "data":result,
				});
			}else{
				res.send({
				  "message":"no list Listing!",
				  "status":'2',
				  "data":result,
				});
			}
		} 
	});
});
app.post('/createmenu',upload.single('image'),function(req, res, next){ 
	
	var product={
		"cat_id":req.body.cat_id,
		"name":req.body.name,
		"restaurant_id":req.body.restaurant_id,
		"cost":req.body.cost,
		"tags":req.body.tags,
		"description":req.body.description,
		"In_stock":req.body.in_stock,
		"Is_veg":req.body.is_veg,
		"created_by":req.body.addedby,
		"updated_by":req.body.addedby,
		"created_date":today,
		"updated_date":today
	}
	
	
		connection.query('INSERT INTO r_menu SET ?',product, function (error, result, fields) {
		if (error) {
			res.send({
			  "code":400,
			  "failed":error
			})
		}else{
			numRows = result.affectedRows;
			if(numRows > 0)
			{
				res.send({
				  "status":1,
				  "message":"Product added sucessfully"
				});	
			}else{
				res.send({
				  "status":2,
				  "message":"Product not added sucessfully"
				});
			}
			
		}
	});
});
app.post('/updatemenu',upload.single('image'),function(req, res, next){ 
	var product={
		"cat_id":req.body.cat_id,
		"name":req.body.name,
		"restaurant_id":req.body.restaurant_id,
		"cost":req.body.cost,
		"tags":req.body.tags,
		"description":req.body.description,
		"In_stock":req.body.in_stock,
		"Is_veg":req.body.is_veg,
		"created_by":req.body.addedby,
		"updated_by":req.body.addedby,
		"created_date":today,
		"updated_date":today
	}
	
		var id = req.body.id;
		connection.query('Update r_menu SET ? where id =?',[product,id], function (error, result, fields) {
		if (error) {
			res.send({
			  "status":3,
			  "failed":error
			})
		}else{
			numRows = result.affectedRows;
			if(numRows > 0)
			{
				res.send({
				  "status":1,
				  "message":"Product updated sucessfully"
				});	
			}else{
				res.send({
				  "status":2,
				  "message":"Product not updated sucessfully"
				});
			}
			
		}
	});
});
app.post('/getreport' ,function(req, res){
	var totalrecord= req.body.totalrecord;
	//var start= req.body.startdate;
	//var end= req.body.enddate;
	var status= req.body.status;
	var pagevalue= req.body.pagevalue;
	var pagecount = pagevalue *10;
	var endcount = totalrecord;
	var rest_id = req.body.rest_id;
	var sql ="SELECT d.*,t.name,uo.mobile as custno from r_orderdetail as d JOIN r_table as t ON t.id= d.table_id JOIN r_user_otp as uo ON uo.id= d.cust_name where d.status='"+status+"' and d.restaurant_id='"+rest_id+"' GROUP BY `id` ORDER BY Id DESC LIMIT "+pagecount+","+endcount+" " ;
	connection.query(sql,function(error, result , fields){
        if(!!error){
            res.send({
				  "message":"Something Went wrong!",
				  "status":error,
				 });
        } else {
			var Numrows =result.length;
			if(Numrows > 0){
				var sql1 ="SELECT count(*) as rows FROM  r_orderdetail where status='"+status+"'";
				connection.query(sql1,function(error, results , fields){
					if(!!error){
						res.send({
							  "message":"Something Went wrong!",
							  "status":error,
							});
					} else {
						var countrecord =results[0].rows;
						if(countrecord < 10){
							res.send({
							  "message":"Product Detail!",
							  "status":'1',
							  "data":result,
							  "record":'',
							});
						}else{
							res.send({
							  "message":"Product Detail!",
							  "status":'1',
							  "data":result,
							  "record":countrecord,
							});
						}
						
					}
				});
			}else{
				res.send({
				  "message":"No data found",
				  "status":'2',
				  "data":result,
				  "record":'',
				});
			}
		} 
    });
});
app.get('/userout',function(req,res){ 
  req.session.destroy(function(err) {
    if(err) {
      console.log(err);
    } else {
		res.send({
		  "message":"User Logout",
		  "status":1,
		});
    }
  });
});
app.post('/updatestatus',function(req, res, next){ 
	var status = req.body.status;
	var restaurant_id= req.body.restid;
	var table_id= req.body.tableid;
	var id = req.body.id;
	console.log(status);
	console.log(restaurant_id);
	console.log(table_id);
	connection.query("Update r_orderdetail SET status='"+status+"' where table_id ='"+table_id+"' and restaurant_id ='"+restaurant_id+"' and id='"+id+"'",function (error, result, fields) {
		if (error) {
			res.send({
			  "status":3,
			  "failed":error
			})
		}else{
			numRows = result.affectedRows;
			if(numRows > 0)
			{
				res.send({
				  "status":1,
				  "message":"Status updated sucessfully"
				});	
			}else{
				res.send({
				  "status":2,
				  "message":"Status not updated sucessfully"
				});
			}
			
		}
	});
});
app.post('/table' ,function(req, res){
	var restid= req.body.restid;
	var totalrecord= req.body.totalrecord;
	var pagevalue= req.body.pagevalue;
	var pagecount = pagevalue *10;
	var endcount = totalrecord;
	connection.query("select count(*) as rows from r_table",function(error, results , fields){
	if(!!error){
		res.send({
			  "message":"Something Went wrong!",
			  "status":'3',
			});
		} else {
			var sql="select * from r_table where restaurant_id='"+restid+"' LIMIT "+pagecount+","+endcount+"";
			connection.query(sql,function(error, result , fields){
				if(!!error){
					res.send({
						  "message":"Something Went wrong!",
						  "status":error,
						});
				} else {
					var countrecord =results[0].rows;
					if(countrecord < 10){
						res.send({
						  "message":"table Listing!",
						  "status":'1',
						  "data":result,
						  "record":'',
						});
					}else{
						res.send({
						  "message":"table Listing!",
						  "status":'1',
						  "data":result,
						  "record":countrecord,
						});
					}
				} 
			});
		}
	});
});
app.post('/tableid' ,function(req, res){
	var id= req.param('id');
	console.log(id);
    connection.query("select * from r_table where id = ?" ,[id] ,function(error, result , fields){
        if(!!error){
            console.log('error in query ');
			res.send({
				  "code":400,
				  "message":"Error in Query"
				});
        } else {
			numRows = result.length;
			if(numRows > 0)
			{
				res.send({
				  "code":200,
				  "message":"table Detail",
				  "status":1,
				  "data":result
				});
			}else{
				res.send({
				  "code":200,
				  "message":"table Detail",
				  "status":2,
				  "data":result
				});
			}
			console.log(result);
        } 
    });
});
app.post('/createtable', function(req, res){ 
	var category={
			"name":req.body.name,
			"restaurant_id":req.body.restid,
			"status":1,
			"created_date":today,
		}
		connection.query('INSERT INTO r_table SET ?',category, function (error, result, fields) {
		if (error) {
			res.send({
			  "code":400,
			  "failed":error
			})
		}else{
			numRows = result.affectedRows;
			if(numRows > 0)
			{
				res.send({
				  "status":1,
				  "message":"table added sucessfully"
				});	
			}else{
				res.send({
				  "status":2,
				  "message":"table not added sucessfully"
				});
			}
			
		}
	});
});
app.post('/updatetable', function(req, res){ 
	var category={
			"name":req.body.name,
			"restaurant_id":req.body.restid,
		}
		var id = req.body.id;
		connection.query('Update r_table  SET ? where id =?',[category,id], function (error, result, fields) {
		if (error) {
			res.send({
			  "status":3,
			  "failed":"Something went wrong!!"
			})
		}else{
			numRows = result.affectedRows;
			if(numRows > 0)
			{
				res.send({
				  "status":1,
				  "message":"table updated sucessfully"
				});	
			}else{
				res.send({
				  "status":2,
				  "message":"table not updated sucessfully"
				});
			}
			
		}
	});
});
app.post('/iteminfo', function(req, res){ 
	var id = req.body.id;
	var sql ="select oi.*,m.name from r_orderitem oi JOIN r_menu as m ON m.id= oi.item_name where oi.order_id='"+id+"'";
	connection.query(sql, function (error, result, fields) {
		if (error) {
			res.send({
			  "status":3,
			  "failed":"Something went wrong!!"
			})
		}else{
			numRows = result.length;
			if(numRows > 0)
			{
				res.send({
				  "status":1,
				  "message":"Item Info",
				  "data":result,
				});	
			}else{
				res.send({
				  "status":2,
				  "message":"table not updated sucessfully"
				});
			}
			
		}
	});
});
app.post('/edituser' ,upload.single('image'),function(req, res){ 
	if(req.file ==undefined){
		var category={
			"name":req.body.name,
			"restaurant_id":req.body.restaurant_id,
			"mobile":req.body.mobile,
			"email":req.body.email,
			"contactperson":req.body.contactperson,
			"address":req.body.address,
			"location":req.body.location,
			"locality":req.body.locality,
			"pin":req.body.pin,
		}
	} else {
		var category={
			"name":req.body.name,
			"restaurant_id":req.body.restaurant_id,
			"mobile":req.body.mobile,
			"email":req.body.email,
			"contactperson":req.body.contactperson,
			"address":req.body.address,
			"location":req.body.location,
			"locality":req.body.locality,
			"pin":req.body.pin,
			"logo":req.file.filename,
			"logo_path":req.file.path,
		}
	}
		console.log(category);
		var id = req.body.id;
		connection.query('Update r_users  SET ? where id =?',[category,id], function (error, result, fields) {
		if (error) {
			res.send({
			  "status":3,
			  "failed":"Something went wrong!!"
			})
		}else{
			numRows = result.affectedRows;
			if(numRows > 0)
			{
				res.send({
				  "status":1,
				  "message":"table updated sucessfully"
				});	
			}else{
				res.send({
				  "status":2,
				  "message":"table not updated sucessfully"
				});
			}
			
		}
	});
});
app.post('/updatestock', function(req, res){ 
	var id = req.body.id;
	var val = req.body.val;
	var sql ="update r_menu set In_stock='"+val+"' where id='"+id+"'";
	connection.query(sql, function (error, result, fields) {
		if (error) {
			res.send({
			  "status":error,
			  "failed":"Something went wrong!!"
			})
		}else{
			res.send({
			  "status":1,
			  "message":"Item Info",
			});	
		}
	});
});
app.post('/updatecook', function(req, res){ 
	var id = req.body.con;
	var val = req.body.val;
	var oid = req.body.oid;
	var sql ="update r_orderitem set status='"+val+"' where id='"+id+"'";
	connection.query(sql, function (error, result, fields) {
		if (error) {
			res.send({
			  "status":error,
			  "failed":"Something went wrong!!"
			})
		}else{
			var sql ="select oi.*,m.name from r_orderitem oi JOIN r_menu as m ON m.id= oi.item_name where oi.order_id='"+oid+"'";
			connection.query(sql, function (error, result, fields) {
				if (error) {
					res.send({
					  "status":3,
					  "failed":"Something went wrong!!"
					})
				}else{
					numRows = result.length;
					if(numRows > 0)
					{
						res.send({
						  "status":1,
						  "message":"Item Info",
						  "data":result,
						});	
					}else{
						res.send({
						  "status":2,
						  "message":"table not updated sucessfully"
						});
					}
					
				}
			});
		}
	});
});
app.post('/detail', function(req, res){ 
		
		var userid = req.body.userid;
		var restid = req.body.restid;
		var day = req.body.d;
		var sql ="select Count(id) as count from r_orderdetail where restaurant_id='"+restid+"' and created_date='"+day+"'";
		connection.query(sql, function (error, total, fields) {
			if (error) {
				res.send({
				  "status":3,
				  "failed":"Something went wrong!!"
				})
			}else{
				var total=total[0].count;
				var sql ="SELECT sum(total_amount) as acount FROM r_orderdetail where restaurant_id='"+restid+"' and created_date='"+day+"'";
				connection.query(sql, function (error, available, fields) {
				if(!!error){
					res.send({
						  "message":"Something Went wrong!",
						  "status":'3',
						});
				} else {
					console.log(available);
					var available=available[0].acount;
					connection.query("select sum(total_amount) as tprice from  r_orderdetail where restaurant_id='"+restid+"'",function(error, price , fields){
						if(!!error){
							res.send({
								  "message":"Something Went wrong!",
								  "status":'3',
								});
						} else {
							var tprice=price[0].tprice;
							res.send({
							  "message":"Dashboard updated sucessfully",
							  "status":'1',
							  "total":total,
							  "available":available,
							  "price":tprice,
							});
						}
					});
				} 
			});	
		}
	});
});
const verifyuser =  async function(token) {
	var promiseArray = [];
	if(token != '')
	{
		promiseArray.push(
			 new Promise((resolve, reject) =>
				connection.query("select * from r_user_otp where login_token='"+token+"'", function (error, resultss, fields) {
					if (error) {
						resolve( index );
					}else{
						if(resultss.length > 0){
							resolve('1');
							console.log(resultss);
						}else{
							resolve('0');
							//console.log(result);
						}
						
					}
				})
			)
		);
	}
	return await  Promise.all(promiseArray);
}
app.post('/managerDetail' ,function(req, res){
	var rest_id= req.body.id;
    connection.query("select * from r_manager where rest_id='"+rest_id+"'"  ,function(error, result , fields){
        if(!!error){
            console.log('error in query ');
			res.send({
				  "code":400,
				  "message":"Error in Query"
				});
        } else {
			numRows = result.length;
			if(numRows > 0)
			{
				res.send({
				  "code":200,
				  "message":"User Detail",
				  "status":1,
				  "data":result
				});
			}else{
				res.send({
				  "code":200,
				  "message":"User Detail",
				  "status":2,
				  "data":result
				});
			}
			//console.log(result);
        } 
    });
});
app.post('/editmanager' ,upload.single('image'),function(req, res){ 
	if(req.file ==undefined){
		var category={
			"name":req.body.name,
			"mobile":req.body.mobile,
			"email":req.body.email,
			"address":req.body.address,
		}
	} else {
		var category={
			"name":req.body.name,
			"mobile":req.body.mobile,
			"email":req.body.email,
			"address":req.body.address,
			"logo":req.file.filename,
			"logo_path":req.file.path,
		}
	}
		console.log(category);
		var id = req.body.id;
		console.log(id);
		connection.query('Update r_manager  SET ? where id =?',[category,id], function (error, result, fields) {
		if (error) {
			res.send({
			  "status":3,
			  "failed":"Something went wrong!!"
			})
		}else{
			numRows = result.affectedRows;
			if(numRows > 0)
			{
				res.send({
				  "status":1,
				  "message":"table updated sucessfully"
				});	
			}else{
				res.send({
				  "status":2,
				  "message":"table not updated sucessfully"
				});
			}
			
		}
	});
});

app.post('/subscribe', (req, res) => {
	var webpush = require('web-push');
	const vapidKeys = {
		"publicKey":"BCDA7nM1s2dEfnBrM7LxUe0XigZZs_YRhx3CnreOdHMwDK0qFg4bN9xFKFbyP9ubiHTacryKVik2JLIcc75fW9I",
		"privateKey":"nxCvOwrmbANIhskWxyX8QmZyM_ahyfThW5-HQTBs-iA"
	};
	webpush.setVapidDetails(
		'mailto:akhil.kaliyar1992@gmail.com',
		vapidKeys.publicKey,
		vapidKeys.privateKey
	);
	//var subscription = 'asnkjb';
	var subscription = {
	  endpoint: 'http://ec2-13-233-172-180.ap-south-1.compute.amazonaws.com',
	  keys: {
		p256dh: 'BCDA7nM1s2dEfnBrM7LxUe0XigZZs_YRhx3CnreOdHMwDK0qFg4bN9xFKFbyP9ubiHTacryKVik2JLIcc75fW9I',
		auth: 'nxCvOwrmbANIhskWxyX8QmZyM_ahyfThW5-HQTBs-iA'
	 }
	};
	res.status(201).json({});
	var payload = JSON.stringify({ title: 'test' });

	console.log(subscription);

	  webpush.sendNotification(subscription, payload).catch(error => {
		console.error(error.stack);
	  });
});
app.post('/contactus', function(req, res){ 
	var data={
			"name":req.body.name,
			"restname":req.body.restaurantName,
			"message ":req.body.message,
			"mobile":req.body.mobile,
			"pin":req.body.pin,
			"created_date":today,
		}
		connection.query('INSERT INTO r_contactus SET ?',data, function (error, result, fields) {
		if (error) {
			res.send({
			  "code":400,
			  "failed":error
			})
		}else{
			numRows = result.affectedRows;
			if(numRows > 0)
			{
				res.send({
				  "status":1,
				  "message":"Contactus form added sucessfully"
				});	
			}else{
				res.send({
				  "status":2,
				  "message":"Contactus form not added sucessfully"
				});
			}
			
		}
	});
});

app.post('/regtrial', function(req, res){ 
	var name = req.body.name;
	var strFirstThree = name.substring(0,3);
	var regid  = strFirstThree + '1234';
	var saltRounds = 10; 
	bcrypt.hash(req.body.password, saltRounds, function (err,hash) {
		var data={
				"restaurant_id":regid,
				"name":name,
				"email":req.body.email,
				"contactperson":req.body.contactperson,
				"mobile":req.body.mobile,
				"location":req.body.location,
				"locality":req.body.locality,
				"password":hash,
				"usertype":2,
				"is_trial":1,
				"status":1,
				"is_deleted":0,
				"pin":req.body.pin,
				"created_date":today,
				"created_by":1,
				"modified_by":1,
				"modified_date":today,
			}
			connection.query('INSERT INTO r_users SET ?',data, function (error, result, fields) {
			if (error) {
				res.send({
				  "code":400,
				  "failed":error
				})
			}else{
				numRows = result.affectedRows;
				if(numRows > 0)
				{
					res.send({
					  "status":1,
					  "message":"Registration form added sucessfully"
					});	
				}else{
					res.send({
					  "status":2,
					  "message":"Registration form not added sucessfully"
					});
				}
				
			}
		});
	});
});
app.post('/deleteproduct', function(req, res){ 
		
		var id = req.body.id;
		connection.query("Update r_menu  SET 	is_deleted='1' where id =?",[id], function (error, result, fields) {
		if (error) {
			res.send({
			  "status":3,
			  "failed":"Something went wrong!!"
			})
		}else{
			numRows = result.affectedRows;
			if(numRows > 0)
			{
				connection.query("select * from r_menu where is_deleted = ?",0,function(error, result , fields){
					if(!!error){
						res.send({
							  "message":"Something Went wrong!",
							  "status":'3',
							  "data":result
							});
					} else {
						if(!!error){
							res.send({
								  "message":"Something Went wrong!",
								  "status":'3',
								  "data":result
								});
						} else {
							res.send({
								  "message":"Menu List updated Sucessfully",
								  "status":'1',
								  "data":result
								});
						} 
					} 
				});
			}else{
				res.send({
				  "status":2,
				  "message":"Menu not deleted sucessfully"
				});
			}
			
		}
	});
});
app.post('/request',function(req, res, next){
	
	var jwttoken = req.headers.authorization;
	var rest_id = req.body.rest_id;
	var tab_id = req.body.tab_id;
	var TokenArray = jwttoken.split(" ");
	var token = TokenArray[1];
	var sql = "select * from r_user_otp where login_token='"+token+"'";
	connection.query(sql, function (error, results, fields) {
		if (error) {
			resolve( index );
		}else{
			var rl = results.length;
			if(rl > 0){
				var uid = results[0].id;
				var mob = results[0].mobile;
				console.log(results);
				var odid = Math.floor(100000 + Math.random() * 900000);
				var sa = {
					"userid" : uid,
					"orderId" : odid,
					"orderAmount" : req.body.orderAmount,
					"orderCurrency" : 'INR',
					"orderNote" : 'Testdemo',
					'customerName' : 'akhil',
					"customerEmail" : 'test@gmail.com',
					"customerPhone" : mob,
					"txStatus" : 'pending',
					"rest_id" : rest_id,
					"tab_id" : tab_id,
				}
				var postData = {
					"appId" : '15169a9bd87588a162d08da2896151',
					"orderId" : odid,
					"orderAmount" : req.body.orderAmount,
					"orderCurrency" : 'INR',
					"orderNote" : 'Testdemo',
					'customerName' : 'akhil',
					"customerEmail" : 'ak@yopmail.com',
					"customerPhone" : '7065968496',
					"returnUrl" : 'http://app.enjoydine.com:8082/response',
					"notifyUrl" : 'http://app.enjoydine.com:8082/response'
				},
				mode = "TEST",
				secretKey = "810fe633714b3462c7d4844e63dacd6741bb6ec1",
				sortedkeys = Object.keys(postData),
				url="",
				signatureData = "";
				sortedkeys.sort();
				for (var i = 0; i < sortedkeys.length; i++) {
					k = sortedkeys[i];
					signatureData += k + postData[k];
				}
				var signature = crypto.createHmac('sha256',secretKey).update(signatureData).digest('base64');
				postData['signature'] = signature;
				if (mode == "PROD") {
				  url = "https://www.cashfree.com/checkout/post/submit";
				} else {
				  url = "https://test.cashfree.com/billpay/checkout/post/submit";
				}
				connection.query('insert into r_payment SET ?',[sa],function (error, result, fields) {
					if(!!error){
						res.send({
							  "message":"Something Went wrong!",
							  "status":'3',
							  "data":error
							});
					} else {
						res.send({
						  "message":"Signature generated Sucessfully",
						  "status":'1',
						  "data":postData
						}); 
					} 
				});	
			}else{
				res.send({
				  "status":5,
				  "message":"Not Valid User!!!",
				});
			}
		}
	})
	
});

app.post('/response',function(req, res, next){

	var odid = req.body.orderId;
	var upt = {
	  "orderId" : odid,
	  "orderAmount" : req.body.orderAmount,
	  "referenceId" : req.body.referenceId,
	  "txStatus" : req.body.txStatus,
	  "paymentMode" : req.body.paymentMode,
	  "txTime" : req.body.txTime
	 }
	
	var postData = {
	  "orderId" : req.body.orderId,
	  "orderAmount" : req.body.orderAmount,
	  "referenceId" : req.body.referenceId,
	  "txStatus" : req.body.txStatus,
	  "paymentMode" : req.body.paymentMode,
	  "txMsg" : req.body.txMsg,
	  "txTime" : req.body.txTime
	 },
	secretKey = "810fe633714b3462c7d4844e63dacd6741bb6ec1",

	signatureData = "";
	for (var key in postData) {
		signatureData +=  postData[key];
	}
	var computedsignature = crypto.createHmac('sha256',secretKey).update(signatureData).digest('base64');
	postData['signature'] = req.body.signature;
	postData['computedsignature'] = computedsignature;
	connection.query('update r_payment SET ? where orderId = ?',[upt,odid],function (error, result, fields) {
		if(!!error){
			res.send({
				  "message":"Something Went wrong!",
				  "status":'3',
				  "data":error
				});
		} else {
			var sql = "select * from r_payment where orderId='"+odid+"'";
			connection.query(sql,function (error, result, fields) {
				if(!!error){
					res.send({
						  "message":"Something Went wrong!",
						  "status":'3',
						  "data":error
						});
				} else {
					var ooid = result[0].userid;
					var restid = result[0].rest_id;
					var tabid = result[0].tab_id;
					var sql = "update r_orderdetail SET status='3' where cust_name='"+ooid+"' and restaurant_id='"+restid+"' and table_id='"+tabid+"' ";
					connection.query(sql,function (error, result, fields) {
						if(!!error){
							res.send({
								  "message":"Something Went wrong!",
								  "status":'3',
								  "data":error
								});
						} else {
							res.render('response',{postData : JSON.stringify(postData)});
						} 
					});
				} 
			});
			res.render('response',{postData : JSON.stringify(postData)});
		} 
	});
	
});


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});
app.listen(8082);