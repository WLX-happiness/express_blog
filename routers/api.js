let router = require('express').Router();
let User = require('../models/User.js');
let Content = require('../models/Content');
let crypto = require('../libs/crypto');
let config = require('../config');

let xss = require("xss");


//统一返回格式
let reponseData;
router.use((req, res, next) => {
    reponseData = {
        code: 0,//0表示成功
        msg: ''//默认为空
    };
    next();
});

//用户注册接口
router.post('/user/register', (req, res, next) => {
    // console.log(req.body);
    let username = xss(req.body.username);
    let password = xss(req.body.password);
    let repassword = xss(req.body.repassword);

    const reg = /^[^<>"'$\|?~*&@(){}]*$/;

    //用户名不能为空
    if (username === '') {
        reponseData.code = 1;
        reponseData.msg = '用户名不能为空';
        res.json(reponseData);
        return;
    }
    //用户名不能包含特殊字符
    if (!reg.test(username)) {
        reponseData.code = 1;
        reponseData.msg = '用户名不能包含特殊字符';
        res.json(reponseData);
        return;
    }
    //密码不能为空
    if (password === '') {
        reponseData.code = 2;
        reponseData.msg = '密码不能为空';
        res.json(reponseData);
        return;
    }
    //两次密码不一致
    if (password !== repassword) {
        reponseData.code = 3;
        reponseData.msg = '两次密码不一致';
        res.json(reponseData);
        return;
    }
    //用户名已经被占用
    User.findOne({ username }).then((userInfo) => {
        console.log(userInfo);
        if (userInfo) {
            reponseData.code = 4;
            reponseData.msg = '该用户名已经被注册';
            return
        } else {
            //加密
            password = crypto.md5(`${config.prefix}${password}`);
            //保存用户信息到数据库中
            let user = new User({ username, password });
            // console.log(user.save());
            return user.save();
        }
    }).then((saveUserInfo) => {
        //注册成功
        if (saveUserInfo) {
            reponseData.msg = '注册成功';
        }
        res.json(reponseData);
        console.log('用户注册保存成功');
    });

});

//用户登录接口
router.post('/user/login', (req, res) => {
    let username = xss(req.body.username);
    let password = xss(req.body.password);

    //用户名或密码不能为空
    if (!username || !password) {
        reponseData.code = 1;
        reponseData.msg = '用户名或密码不能为空';
        res.json(reponseData);
        return
    }
    //加密
    password = crypto.md5(`${config.prefix}${password}`);
    //用户名或密码不正确
    User.findOne({ username, password }).then((userInfo) => {
        if (!userInfo) {
            reponseData.code = 2;
            reponseData.msg = '用户名或密码不正确';
            res.json(reponseData);
        } else {
            //登录成功
            console.log('登录成功' + userInfo);
            reponseData.msg = '登录成功';
            reponseData.userInfo = {
                _id: userInfo._id,
                username: userInfo.username
            };
            //设置cookie
            req.cookies.set('userInfo', JSON.stringify({
                _id: userInfo._id,
                username: userInfo.username
            }));
            res.json(reponseData);
        }
    });
});

//登出接口
router.post('/user/loginOut', (req, res, next) => {
    req.cookies.set('userInfo', null);
    res.json(reponseData);
});

//评论接口

router.post('/comment', (req, res, next) => {
    const _id = req.body.commentId;
    const data = {
        userName: req.userInfo.username,
        postTime: new Date(),
        comment: xss(req.body.commentContent)
    };

    if (_id) {
        Content.findOne({ _id }).then((content) => {
            if (!data.comment) {
                return;
            }
            content.comment.push(data);
            return content.save();
        }).then((newContent) => {
            reponseData.msg = "评论成功";
            res.json({
                reponseData,
                commentList: newContent.comment
            });
        }).catch(() => { });
    }
});

//获取评论接口，用于每次进入文章详情展现
router.get('/comment', (req, res, next) => {
    const _id = req.query.commentId;
    if (_id) {
        Content.findOne({ _id }).then((content) => {
            reponseData.msg = "获取成功";
            res.json({ reponseData, commentList: content.comment });
        })
    }
    
});

module.exports = router;