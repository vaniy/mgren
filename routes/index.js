var express = require('express');
var router = express.Router();
var mongoClient = require('mongodb').MongoClient;
var mogoUrl = 'mongodb://localhost:27017/nichetest';
var BSON = require('bson');
var dbHandler = require('../lib/dbHandler');
var socketHandler = require('../lib/chat_server');
var roleConf = require('../config/roleConfig');
var formidable = require('formidable'),
    fs = require('fs'),
    TITLE = 'formidable',
    AVATAR_UPLOAD_FOLDER = '/avatar/';


router.get('/index', function (req, res) {
    dbHandler.getHomePage(req, res, (home) => {
        dbHandler.getAllCaseCategory(req, res, (store) => {
            let q = [];
            if (store && store.length > 0) {
                q = store.map((child, index) => {
                    return {
                        storeId: child.storeId + ''
                    }
                })
            }
            dbHandler.getCase(req, res, (cases) => {
                res.render('index', { title: '', home, cases });
            }, { $or: q })
        })
    })
});

router.get('/', function (req, res) {
    dbHandler.getHomePage(req, res, (home) => {
        dbHandler.getAllCaseCategory(req, res, (store) => {
            let q = [];
            if (store && store.length > 0) {
                q = store.map((child, index) => {
                    return {
                        storeId: child.storeId + ''
                    }
                })
            }
            dbHandler.getCase(req, res, (cases) => {
                res.render('index', { title: '', home, cases });
            }, { $or: q })
        })
    })
});

router.get('/download', function (req, res) {
    dbHandler.getListPage(req, res, (stores) => {
        res.render('download', { title: '', stores });
    })
});

router.get('/downloadDetail', function (req, res) {
    dbHandler.getSoftwares(req, res, (software)=>{
        res.render('downloadDetail', { title: '', softwares: software && software.length > 0 ? software[0].propertys : []});
    })
});

router.get('/support', function (req, res) {
    dbHandler.getWebsite(req, res, (support) => {
        res.render('support', { title: '', support });
    }, 'support')
});

router.get('/about', function (req, res) {
    dbHandler.getWebsite(req, res, (about) => {
        res.render('about', { title: '', about });
    }, 'about')
});

router.get('/contact', function (req, res) {
    dbHandler.getWebsite(req, res, (contact) => {
        res.render('contact', { title: '', contact });
    }, 'contract')
});

router.get('/guide', function (req, res) {
    let title = '购物流程';
    let currentType = 1;
    if (req.query.type) {
        switch (req.query.type) {
            case '1':
                title = '购物流程';
                currentType = 1;
                break;
            case '2':
                title = '会员账户';
                currentType = 2;
                break;
            case '3':
                title = '产品挑选';
                currentType = 3;
                break;
            case '4':
                title = '下单说明';
                currentType = 4;
                break;
            case '5':
                title = '订单修改';
                currentType = 5;
                break;
        }
    }
    dbHandler.getWebsite(req, res, (guide) => {
        res.render('guide', { title: title, guide, currentType });
    }, 'guide', req.query.type ? { id: parseInt(req.query.type) } : {})
});

router.get('/case', function (req, res) {
    dbHandler.getAllCaseCategory(req, res, (store) => {
        dbHandler.getCase(req, res, (casee) => {
            let cstoreId = req.query.storeId ? req.query.storeId : (store && store.length > 0 ? store[0].storeId + '' : '');
            let storeName = '';
            store.forEach(function (child) {
                if (cstoreId == child.storeId) {
                    storeName = child.storeName
                }
            })
            res.render('case', { title: '', store, casee: casee, cstoreId, storeName: storeName });
        }, { storeId: req.query.storeId ? req.query.storeId : (store && store.length > 0 ? store[0].storeId + '' : '') })
    })
});

router.get('/caseDetail', function (req, res) {
    if (req.query.caseId && req.query.caseId.trim() != '') {
        dbHandler.getAllCaseCategory(req, res, (store) => {
            dbHandler.getCase(req, res, (casees) => {
                let cstoreId = req.query.storeId ? req.query.storeId : (store && store.length > 0 ? store[0].storeId + '' : '');
                let storeName = '';
                store.forEach(function (child) {
                    if (cstoreId == child.storeId) {
                        storeName = child.storeName
                    }
                })
                res.render('caseDetail', { title: '', store, casee: casees[0], cstoreId, storeName: storeName });
            }, { caseId: req.query.caseId.trim() })
        })
    }
    else {
        res.redirect('/case')
    }
});

router.get('/cart', function (req, res) {
    if (req.cookies && req.cookies.user) {
        dbHandler.getShoppingCart(req, res, (data) => {
            res.render('cart', { title: '', carts: data });
        })
    }
    else {
        res.redirect('/login')
    }
});

router.get('/account', function (req, res) {
    if (req.cookies && req.cookies.user) {
        dbHandler.getUserInfo(req, res, (user) => {
            res.render('account', { title: '', user });
        })
    }
    else {
        res.redirect('/login')
    }
});

router.get('/billInfo', function (req, res) {
    if (req.cookies && req.cookies.user) {
        dbHandler.getUserInfo(req, res, (user) => {
            res.render('billInfo', { title: '', user, billInfos: user.billInfos, oid: req.query.oid || '' });
        })
    }
    else {
        res.redirect('/login')
    }
});

router.get('/addressInfo', function (req, res) {
    if (req.cookies && req.cookies.user) {
        dbHandler.getUserInfo(req, res, (user) => {
            res.render('addressInfo', { title: '', user, addresses: user.addresses, oid: req.query.oid || '' });
        })
    }
    else {
        res.redirect('/login')
    }
});

router.get('/password', function (req, res) {
    if (req.cookies && req.cookies.user) {
        dbHandler.getUserInfo(req, res, (user) => {
            res.render('password', { title: '', user });
        })
    }
    else {
        res.redirect('/login')
    }
});

router.get('/accountInfo', function (req, res) {
    if (req.cookies && req.cookies.user) {
        dbHandler.getUserInfo(req, res, (user) => {
            res.render('accountInfo', { title: '', user });
        })
    }
    else {
        res.redirect('/login')
    }
});

router.get('/myOrder', function (req, res) {
    if (req.cookies && req.cookies.user) {
        dbHandler.getUserInfo(req, res, (user) => {
            dbHandler.getUserOrder(req, res, (orders) => {
                let statusType = '';
                if (orders && orders.length > 0) {
                    orders = orders.map((child) => {
                        let totalAmoumt = 0;
                        if (child.totalAmoumt) {
                            totalAmoumt = child.totalAmoumt;
                        }
                        else if (child.carts && child.carts.length > 0) {
                            child.carts.forEach((cld) => {
                                totalAmoumt += parseInt(cld.totalAmoumt)
                            });
                            let discount = user.discountType || 1;
                            totalAmoumt = totalAmoumt * parseInt(discount)
                        }
                        switch (child.status) {
                            case 0:
                                statusType = '待确认';
                                break;
                            case 1:
                                statusType = '待受理';
                                break;
                            case 2:
                                statusType = '待支付';
                                break;
                            case 3:
                                statusType = '待发货';
                                break;
                            case 4:
                                statusType = '待收货';
                                break;
                            case 5:
                                statusType = '待开票';
                                break;
                            case 6:
                                statusType = '已完成';
                                break;
                            case -1:
                                statusType = '已取消';
                                break;
                        }
                        return {
                            ...child,
                            totalAmoumt,
                            statusType
                        }
                    })
                }
                console.log('orders', orders)
                res.render('myOrder', { title: '', user, orders, status: req.query.status || '999' });
            })
        })
    }
    else {
        res.redirect('/login')
    }
});

router.get('/orderDetail', function (req, res) {
    if (req.cookies && req.cookies.user) {
        if (req.query.oid) {
            // dbHandler.getUserInfo(req, res, (user) => {
            dbHandler.getOrderPage(req, res, (order) => {
                let deliverTime = '';
                let deliverType = '';
                if (order.trackingInfo.deliverTimeIndex == 0) {
                    deliverTime = '不限送货时间';
                }
                else if (order.trackingInfo.deliverTimeIndex == 1) {
                    deliverTime = '工作日送货：周一至周五';
                }
                else if (order.trackingInfo.deliverTimeIndex == 2) {
                    deliverTime = '双休日，节假日：周六至周日';
                }

                if (order.trackingInfo.payInfo && order.trackingInfo.payInfo.shippingCharge) {
                    deliverType = order.trackingInfo.payInfo.shippingCharge
                }
                // if (order.trackingInfo.deliverTypeIndex == 0) {
                //     deliverType = '自提';
                // }
                // else if (order.trackingInfo.deliverTypeIndex == 1) {
                //     deliverType = '自提';
                // }
                res.render('orderDetail', { order, deliverTime, deliverType })
            })
            // })
        }
        else {
            res.redirect('/myOrder')
        }
    }
    else {
        res.redirect('/login')
    }
})


router.get('/createOrder', function (req, res) {
    if (req.cookies && req.cookies.user) {
        // dbHandler.getUserInfo(req, res, (user) => {
        //     res.render('createOrder', { title: '', user });

        // })
        if (req.query.oid) {
            dbHandler.getOrderPage(req, res, (order) => {
                if (order.status == 0) {
                    res.redirect('/confirmOrder?oid=' + order.oid)
                }
                else {
                    res.render('createOrder', { title: '', order });
                }
            })
        }
        else {
            res.redirect('/')
        }
    }
    else {
        res.redirect('/login')
    }
});



router.get('/video', function (req, res) {
    dbHandler.getVideo(req, res, (videos) => {
        let results = [];
        let t = [];
        videos.forEach((child, index) => {
            if (t.indexOf(child.videoType) == -1) {
                t.push(child.videoType);
                results.push({ title: child.videoType, videos: [] })
            }
        });
        results.forEach((child, index) => {
            videos.forEach((cld, idx) => {
                if (child.title == cld.videoType) {
                    child.videos.push(cld)
                }
            })
        })
        res.render('video', { title: '', results });
    })
});

router.get('/integrator', function (req, res) {
    let query = {};
    if (req.query.province && req.query.province.trim() != '全部') {
        query = {
            province: req.query.province.trim()
        }
    }
    if (req.query.isNational) {
        if (req.query.province && req.query.province.trim() != null) {
            query = {
                integratorNationCity: req.query.province.trim()
            }
        }
    }
    dbHandler.getIntegrator(req, res, (integrators) => {
        let provinces = ['全部'];
        let outputs = Object.assign([], integrators);
        if (outputs && outputs.length > 0) {
            if (req.query.isNational) {
                outputs = outputs.filter((x) => { return x.integratorNationCity && x.integratorNationCity.trim() != '' })
                outputs.forEach((child, index) => {
                    provinces.push(child.integratorNationCity);
                })
            }
            else {
                outputs.forEach((child, index) => {
                    provinces.push(child.province);
                })
            }
        }
        res.render('integrator', { title: '', integrators: outputs, provinces, currentProvince: req.query.province || '全部', isNational: req.query.isNational || 0 });
    }, query)
});

router.get('/productlist', function (req, res) {
    dbHandler.getListPage(req, res, (store) => {
        res.render('productlist', { title: '', store: req.query.storeId != undefined ? store.filter((x) => { return x.storeId == req.query.storeId }) : store });
    })
});

router.get('/productDetail', function (req, res) {
    if (req.query.pid) {
        dbHandler.getProduct(req, res, (data) => {
            res.render('productDetail', { title: '', product: data });
        })
    }
    else {
        res.redirect('/')
    }
});

router.get('/login', function (req, res) {
    res.render('login', { title: '' });
});

router.get('/register', function (req, res) {
    res.render('register', { title: '' });
});

router.get('/confirmOrder', function (req, res) {
    if (req.cookies && req.cookies.user) {
        if (req.query.oid) {
            dbHandler.getUserInfo(req, res, (user) => {
                dbHandler.getOrderPage(req, res, (orders) => {
                    let totalMount = 0;
                    if (orders.carts && orders.carts.length > 0) {
                        orders.carts.forEach((child) => {
                            if (child.totalAmoumt) {
                                totalMount += parseInt(child.totalAmoumt);
                            }
                        })
                    }
                    let discouont = 1;
                    if (user && user.discountType) {
                        discouont = user.discountType;
                    }
                    res.render('confirmOrder', { title: '', orders, user, totalMount, discouont, addresses: user.addresses, billInfos: user.billInfos });
                })
            })
        }
        else {
            res.redirect('/')
        }
    }
    else {
        res.redirect('/login')
    }
})

router.get('/customService', function (req, res) {
    if (req.cookies && req.cookies.user) {
        if (req.query.oid && req.query.oid.trim() != '') {
            dbHandler.getOrder(req, res, (order) => {
                res.render('customService', { title: '', order, customQuestions: roleConf.customQuestions });
            })
        }
        else {
            res.redirect('/myOrder')
        }
    }
    else {
        res.redirect('/login')
    }
});

router.get('/customServiceList', function (req, res) {
    if (req.cookies && req.cookies.user) {
        dbHandler.getUserCustomQuestions(req, res, false, (questions) => {
            res.render('customServiceList', { title: '', questions });
        })
        // dbHandler.getUserInfo(req, res, (user) => {
        // })
    }
    else {
        res.redirect('/login')
    }
});

router.get('/customServiceContact', function (req, res) {
    if (req.cookies && req.cookies.user) {
        dbHandler.getUserCustomQuestions(req, res, false, (questions) => {
            dbHandler.getUserInfo(req, res, (user) => {
                res.render('customServiceContact', { title: '', question: questions[0], user });
            }, { uid: questions[0].uid })
        }, { qid: req.query.qid })
        // dbHandler.getUserInfo(req, res, (user) => {
        // })
    }
    else {
        res.redirect('/login')
    }
});

module.exports = router;