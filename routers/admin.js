let router = require('express').Router();
let User = require('../models/User');
let Category = require('../models/Category');
let Content = require('../models/Content');

//权限校验
router.use((req, res, next) => {
    // console.log(req.userInfo.isAdmin);
    if (!req.userInfo.isAdmin) {
        res.send('非管理员没有权限访问该页面');
        return
    }
    next();
});


//管理首页
router.get('/', (req, res) => {
    res.render('admin/index');
});
//用户列表
router.get('/user', (req, res) => {
    // console.log(req.query);

    //分页
    let page = Number(req.query.page || 1);
    let limit = 15;
    let skip = 0;
    let pages = 0;
    flag = 'user';

    User.countDocuments().then((count) => {
        pages = Math.ceil(count / limit);
        page = Math.min(page, pages);
        page = Math.max(page, 1);
        skip = (page - 1) * limit;
        User.find().limit(limit).skip(skip).then((users) => {
            res.render('admin/user_index', {
                userInfo: req.userInfo,
                users,
                count,
                pages,
                limit,
                page,
                flag
            });
        })
    });
});


//标签首页
router.get('/category', (req, res) => {

    let page = Number(req.query.page || 1);
    let limit = 15;
    let skip = 0;
    let pages = 0;
    let flag = 'category';

    Category.countDocuments().then((count) => {
        pages = Math.ceil(count / limit);
        page = Math.min(page, pages);
        page = Math.max(1, page);
        skip = (page - 1) * limit;

        Category.find().sort({ _id: -1 }).limit(limit).skip(skip).then((categories) => {
            res.render('admin/category_index', {
                userInfo: req.userInfo,
                categories,
                count,
                pages,
                limit,
                page,
                flag
            });
        });
    });
});
//添加标签
router.get('/category/add', (req, res) => {
    res.render('admin/category_add', {
        userInfo: req.userInfo
    });
});
router.post('/category/add', (req, res) => {
    let name = req.body.name || '';
    if (name == '') {
        res.render('admin/error', {
            userInfo: req.userInfo,
            msg: '分类名称不能为空'
        });
        return;
    }

    Category.findOne({ name }).then((categoryName) => {
        if (categoryName) {
            res.render('admin/error', {
                userInfo: req.userInfo,
                msg: '该分类已经存在'
            });
            return Promise.reject();
        } else {
            return new Category({ name }).save();
        }
    }).then((newCategory) => {
        if (newCategory) {
            res.render('admin/success', {
                userInfo: req.userInfo,
                msg: '分类添加成功',
                url: '/admin/category'
            });
        }
    }).catch(() => { });
});
//修改标签
router.get('/category/edit', (req, res) => {
    let _id = req.query.id;
    if (_id) {
        Category.findOne({ _id }).then((category) => {
            if (!category) {
                res.render('admin/error', {
                    userInfo: req.userInfo,
                    msg: '分类名称不存在'
                });
            } else {
                res.render('admin/category_edit', {
                    userInfo: req.userInfo,
                    category
                });
            }
        });
    }
    
});
router.post('/category/edit', (req, res) => {
    let _id = req.query.id;
    let name = req.body.name || '';
    if (_id) {
        Category.findOne({ _id }).then((category) => {
            if (!category) {
                res.render('admin/error', {
                    userInfo: req.userInfo,
                    msg: '标签不存在'
                });
                return Promise.reject();
            } else {
                //用户没有做任何修改
                if (name == category.name) {
                    res.render('admin/success', {
                        userInfo: req.userInfo,
                        msg: '标签修改成功',
                        url: '/admin.category'
                    });
                    return Promise.reject();
                } else {
                    //要修改的标签名是否已经存在于数据库
                    return Category.findOne({ _id: { $ne: _id }, name });
                }
            }
        }).then((sameCategory) => {
            if (sameCategory) {
                res.render('admin/error', {
                    userInfo: req.userInfo,
                    msg: '数据库中存在同名标签'
                });
    
                return Promise.reject();
            } else {
                return Category.update({ _id }, { name });
            }
        }).then(() => {
            res.render('admin/success', {
                userInfo: req.userInfo,
                msg: '标签修改成功',
                usl: '/admin/category'
            });
        }).catch(() => { });
    }
    
});
//删除标签
router.get('/category/delete', (req, res) => {
    let _id = req.query.id ;

    if (_id) {
        Category.remove({ _id }).then((delCategory) => {
            res.render('admin/success', {
                userInfo: req.userInfo,
                msg: '删除分类成功',
                url: '/admin/category'
            });
        });
    }
    
});



//内容首页
router.get('/content', (req, res) => {
    let flag = 'content';
    let page = Number(req.query.page || 1);
    let limit = 8;
    let skip = 0;
    let pages = 0;

    Content.countDocuments().then((count) => {
        pages = Math.ceil(count / limit);
        page = Math.max(1, page);
        page = Math.min(page, pages);
        skip = (page - 1) * limit;

        Content.find().sort({ _id: -1 }).limit(limit).skip(skip).populate(['category', 'user']).then((contents) => {
            res.render('admin/content_index', {
                userInfo: req.userInfo,
                contents,
                count,
                page,
                pages,
                limit,
                flag
            });
        });
    });
});
//文章添加
router.get('/content/add', (req, res) => {
    Category.find().then((categories) => {
        res.render('admin/content_add', {
            userInfo: req.userInfo,
            categories
        })
    });
});
router.post('/content/add', (req, res) => {
    const category = req.body.category;
    const title = req.body.title;
    const description = req.body.description;
    const content = req.body.content;
    const user = req.userInfo._id.toString();

    // console.log(user);

    if (req.body.category == '') {
        res.render('admin/error', {
            userInfo: req.userInfo,
            msg: '文章所属栏目不能为空'
        });
    }
    if (req.body.title == '') {
        res.render('admin/error', {
            userInfo: req.userInfo,
            msg: '文章标题不能为空'
        });
    }

    new Content({ category, title, description, content, user }).save().then((data) => {
        // console.log(data);
        res.render('admin/success', {
            userInfo: req.userInfo,
            msg: '文章保存成功',
            url: '/admin/content'
        })
    }).catch((e) => {
        // console.log(e);
    });
});
//文章修改
router.get('/content/edit', (req, res) => {
    let _id = req.query.id;
    let categoryList = null;

    if (_id) {
        Category.find().then((categories) => {
            categoryList = categories;
            return Content.findOne({ _id }).populate('category');
        }).then((content) => {
            if (!content) {
                render('admin/error', {
                    userInfo: req.userInfo,
                    msg: '该文章不存在'
                })
            } else {
                res.render('admin/content_edit', {
                    userInfo: req.userInfo,
                    content,
                    categoryList
                })
            }
        }).catch(() => { });
    }
});
router.post('/content/edit', (req, res) => {
    let _id = req.query.id;
    const category = req.body.category;
    const title = req.body.title;
    const description = req.body.description;
    const content = req.body.content;

    if (req.body.category == '') {
        res.render('admin/error', {
            userInfo: req.userInfo,
            msg: '文章所属栏目不能为空'
        });
    }
    if (req.body.title == '') {
        res.render('admin/error', {
            userInfo: req.userInfo,
            msg: '文章标题不能为空'
        });
    }

    if (_id) {
        Content.update({ _id }, { category, title, description, content }).then((data) => {
            console.log(data);
            console.log('this is data');
    
            res.render('admin/success', {
                userInfo: req.userInfo,
                msg: '保存成功',
                url: `/admin/content/edit?id=${_id}`
            })
        });
    }
});
//文章删除
router.get('/content/delete', (req, res) => {
    let _id = req.query.id;
    if (_id) {
        Content.remove({ _id }).then((delContent) => {
            res.render('admin/success', {
                userInfo: req.userInfo,
                msg: '删除文章成功',
                url: '/admin/content'
            });
        });
    }
    
});
module.exports = router;