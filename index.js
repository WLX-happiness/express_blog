const express = require('express');
const swig = require('swig');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const csrf = require('csurf');
const Cookies = require('cookies');
const User = require('./models/User');
let config = require('./config');
const winston = require('winston')
const expressWinston = require('express-winston')

//创建express实例
let app = express();

//定义模板引擎
app.engine('html', swig.renderFile);
app.set('views', './views');
app.set('view engine', 'html');
swig.setDefaults({ cache: false });

//设置body-parser
app.use(bodyParser.urlencoded({ extended: true }));


//设置cookies
app.use((req, res, next) => {
    req.cookies = new Cookies(req, res);

    // if (req.csrfToken) {
    //     req.cookies.set('userInfo', req.csrfToken());
    // }

    req.userInfo = {};
    //解析用户登录的cookies信息
    if (req.cookies.get('userInfo')) {
        try {
            req.userInfo = JSON.parse(req.cookies.get('userInfo'));
            //检测登录用户是否是管理员
            User.findById(req.userInfo._id).then((userInfo) => {
                req.userInfo.isAdmin = Boolean(userInfo.isAdmin);
                next();
            }).catch(() => {
                next();
            });
        } catch (e) {
            next();
        }
    } else {
        next();
    }
});


//XSRF攻击
let csrfProtection = csrf({ cookie: true });
// app.use(csrfProtection);



//静态文件托管
app.use('/public', express.static(`${__dirname}/public`));

// 正常请求的日志
app.use(expressWinston.logger({
    transports: [
        new (winston.transports.Console)({
            json: true,
            colorize: true
        }),
        new winston.transports.File({
            filename: 'logs/success.log'
        })
    ]
}));

//路由管理
app.use('/api', require('./routers/api'));
app.use('/admin', require('./routers/admin'));
app.use('/', require('./routers/main'));

// 错误请求的日志
app.use(expressWinston.errorLogger({
    transports: [
        new winston.transports.Console({
            json: true,
            colorize: true
        }),
        new winston.transports.File({
            filename: 'logs/error.log'
        })
    ]
}));

//创建管理员
if (!config.is_create_admin) {
    new User({
        username: config.admin_name,
        password: config.admin_pass,
        isAdmin: true
    }).save().then((admin) => {
        config.is_create_admin = true;
        console.log('创建管理员成功')
        // console.log(config.is_create_admin);
    }, () => {
        console.log('创建管理员失败')
    });
}


//连接数据库
mongoose.connect(`${config.mongon.uri}${config.db_name}`, (err) => {
    if (err) {
        console.log("数据库连接失败");
    } else {
        console.log('数据库连接成功！');

        //监听
        app.listen(8080, (err) => {
            console.log(`app is running at port: ${config.port}`);
        });
    }
});

