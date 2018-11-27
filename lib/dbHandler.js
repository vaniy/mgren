
var mongoClient = require('mongodb').MongoClient;
// var mogoUrl = 'mongodb://localhost:27017/mgr_en';
var mogoUrl = 'mongodb://localhost:27017/mgr';
// var BSON = require('bson');
var viewHandler = require('./viewHandler');
var moment = require('moment');

var createUser = function (user, req, res) {
    mongoClient.connect(mogoUrl, function (err, db) {
        var cursor = db.collection('user').find({ "email": user.email }).toArray(function (err, doc) {
            if (err) {
                db.close();
            } else if (!doc || doc.length == 0) {
                user.level = 1;
                user.levelString = '一级经销商';
                user.addresses = [];
                user.discountType = 1;
                user.payInfo = {
                    payDay: '全款',
                    // paymentType: 0,
                    payMethod: '网银转账',
                    shippingChargeAmount: 0,
                    shippingCharge: '客户自提'
                    // payType: 0
                };
                user.totalConsume = 0;
                user.billInfos = [];
                user.status = 1;
                db.collection('user').insertOne(user,
                    function () {
                        res.cookie('user', { email: user.email, uid: user.uid }, { maxAge: 60 * 24 * 60 * 60 * 1000 })
                        res.send({ status: 'success', msg: '成功注册' })
                        db.close();
                    })

            } else {
                // var user = doc[0];
                res.send({ status: 'failed', msg: '账号已存在' })
                db.close();
            }
        });
    });
}

var getUserInfo = function (req, res, route, query = null) {
    mongoClient.connect(mogoUrl, function (err, db) {
        var cursor = db.collection('user').find(query ? query : { "email": req.cookies.user.email }).toArray(function (err, doc) {
            if (err) {
                db.close();
            } else if (!doc || doc.length == 0) {
                // res.cookie('user', { email: user.email, uid: user.uid }, { maxAge: 60 * 24 * 60 * 60 * 1000 })
                // res.cookies.remove();
                res.redirect('/login')
                // res.send({ status: 'failed', msg: '账号不存在' })
            } else {
                var user = doc[0];
                route && route(user);
                // res.send({ status: 'failed', msg: '账号已存在' })
                db.close();
            }
        });
    });
}

var login = function (req, res) {
    mongoClient.connect(mogoUrl, function (err, db) {
        var cursor = db.collection('user').find({ "email": req.body.email, "password": req.body.password }).toArray(function (err, doc) {
            if (err) {
                db.close();
            } else if (!doc || doc.length == 0) {
                res.send({ status: 'failed', msg: '账号不存在' })
            } else {
                var user = doc[0];
                res.cookie('user', { email: user.email, uid: user.uid }, { maxAge: 60 * 24 * 60 * 60 * 1000 })
                res.send({ status: 'success' })
                db.close();
            }
        });
    });
}


var updateUser = function (user, req, res) {
    mongoClient.connect(mogoUrl, function (err, db) {
        db.collection('user').updateOne({ "uid": user.uid }, {
            $set: user,
            $currentDate: { "lastModified": true }
        }, function () {
            res.send({ status: 'success' })
            db.close();
        });
    })
}

var getProduct = function (req, res, route) {
    mongoClient.connect(mogoUrl, function (err, db) {
        db.collection('product').find({ "pid": req.query.pid }).toArray(function (err, doc) {
            if (err) {
                res.redirect('/');
                db.close();
            }
            else if (!doc || doc.length === 0) {
                res.redirect('/');
                db.close();
            }
            else {
                let product = Object.assign({}, doc[0]);
                let totalAmoumt = 0;
                if (product.property && product.property.length > 0) {
                    totalAmoumt += parseInt(product.property[0].amount)
                }
                let parts = product.parts.map((cld) => {
                    return { "partsId": cld }
                });
                if (parts && parts.length > 0) {
                    db.collection('parts').find({ $or: parts }).toArray(function (err, doc) {
                        if (doc && doc.length > 0) {
                            product.parts = doc;
                            product.parts.forEach(function (d, x) {
                                if (d.property && d.property.length > 0) {
                                    totalAmoumt += d.property[0].amount
                                }
                            })
                            product.totalAmoumt = totalAmoumt;
                            route && route(product);
                        }
                        else {
                            product.parts = [];
                            product.totalAmoumt = totalAmoumt;
                            route && route(product);
                        }
                        db.close();
                    })
                }
                else {
                    product.parts = [];
                    product.totalAmoumt = totalAmoumt;
                    route && route(product);
                    db.close();
                }
            }
        })
    })
}

var getListPage = function (req, res, route) {
    mongoClient.connect(mogoUrl, function (err, db) {
        db.collection('product').find().toArray(function (err, doc) {
            if (err) {
                res.redirect('/');
                db.close();
            }
            else if (!doc || doc.length === 0) {
                res.redirect('/');
                db.close();
            }
            else {
                let products = Object.assign([], doc);
                let store = [];
                products.forEach(function (child, index) {
                    if (child.store && child.store.storeId) {
                        if (store.length > 0) {
                            let hasOne = false;
                            store.forEach(function (cd, ix) {
                                if (cd.storeId == child.store.storeId) {
                                    hasOne = true;
                                    cd.products.push(child)
                                }
                            })
                            if (!hasOne) {
                                store.push({
                                    storeId: child.store.storeId,
                                    storeName: child.store.storeName,
                                    products: [
                                        child
                                    ]
                                })
                            }
                        }
                        else {
                            store.push({
                                storeId: child.store.storeId,
                                storeName: child.store.storeName,
                                products: [
                                    child
                                ]
                            })
                        }
                    }
                });

                route && route(store)
                // res.send(viewHandler.buildListView(store))
            }
        })
    })
}

var getList = function (req, res) {
    mongoClient.connect(mogoUrl, function (err, db) {
        db.collection('product').find().toArray(function (err, doc) {
            if (err) {
                res.send({ status: 'failed' })
                db.close();
            }
            else if (!doc || doc.length === 0) {
                res.send({ status: 'failed' })
                db.close();
            }
            else {
                let products = Object.assign([], doc);
                let store = [];
                products.forEach(function (child, index) {
                    if (child.store && child.store.storeId != undefined) {
                        if (store.length > 0) {
                            let hasOne = false;
                            store.forEach(function (cd, ix) {
                                if (cd.storeId == child.store.storeId) {
                                    hasOne = true;
                                    cd.products.push(child)
                                }
                            })
                            if (!hasOne) {
                                store.push({
                                    storeId: child.store.storeId,
                                    storeName: child.store.storeName,
                                    products: [
                                        child
                                    ]
                                })
                            }
                        }
                        else {
                            store.push({
                                storeId: child.store.storeId,
                                storeName: child.store.storeName,
                                products: [
                                    child
                                ]
                            })
                        }
                    }
                });
                db.collection('category').find().sort({ storeId: 1 }).toArray(function (err, doc) {
                    let ss = doc;
                    let out = [];
                    ss.forEach(function (child, index) {
                        let has = false;
                        store.forEach(function (cld, idx) {
                            if (!has) {
                                if (child.storeId == cld.storeId) {
                                    out.push({
                                        storeId: child.storeId,
                                        storeName: child.storeName,
                                        products: cld.products
                                    });
                                    has = true;
                                }
                                else {
                                    out.push({
                                        storeId: child.storeId,
                                        storeName: child.storeName,
                                        products: []
                                    });
                                    has = true;
                                }
                            }
                        })
                    })
                    res.send(viewHandler.buildListView(out));
                    db.close();
                })
            }
        })
    })
}

var getPromotions = function (req, res) {
    mongoClient.connect(mogoUrl, function (err, db) {
        db.collection('product').find({ onSale: 1 }).limit(6).toArray(function (err, doc) {
            if (err) {
                // res.send({ status: 'failed' })
                res.send(viewHandler.buildPromotionsListView([]))
                db.close();
            }
            else if (!doc || doc.length === 0) {
                res.send(viewHandler.buildPromotionsListView([]))
                // res.send({ status: 'failed' })
                db.close();
            }
            else {
                let products = Object.assign([], doc);

                res.send(viewHandler.buildPromotionsListView(products))
            }
        })
    })
}

var getShoppingCart = function (req, res, route, query = null) {
    mongoClient.connect(mogoUrl, function (err, db) {
        db.collection('cart').find(query ? query : { email: req.cookies.user.email }).toArray(function (err, doc) {
            if (err) {
                res.redirect('/');
                db.close();
            }
            else if (!doc || doc.length === 0) {
                res.redirect('/');
                db.close();
            }
            else {
                route && route(doc)
            }
        })
    })
}

var addToCart = function (req, res) {
    mongoClient.connect(mogoUrl, function (err, db) {
        db.collection('product').find({ "pid": req.query.pid }).toArray(function (err, doc) {
            if (err) {
                res.send({ status: 'failed', msg: '加入失败' });
                db.close();
            }
            else if (!doc || doc.length === 0) {
                res.send({ status: 'failed', msg: '加入失败' });
                db.close();
            }
            else {
                let product = Object.assign({}, doc[0]);
                let totalAmoumt = 0;
                let rp = req.query.parts;
                let parts = [];
                let outputParts = [];
                if (rp && rp !== '') {
                    parts = rp.split(',');
                }
                if (product.property && product.property.length > 0) {
                    product.property.forEach((cd, ix) => {
                        if (cd.name == req.query.property && parseInt(cd.amount)) {
                            totalAmoumt += parseInt(cd.amount);
                        }
                    })
                }
                if (product.parts && product.parts.length > 0 && parts.length > 0 && product.parts.length == parts.length) {
                    let dbParts = product.parts.map((cld) => {
                        return { "partsId": cld }
                    });
                    if (dbParts && dbParts.length > 0) {
                        db.collection('parts').find({ $or: dbParts }).toArray(function (err, doc) {
                            if (doc && doc.length > 0) {
                                product.parts = doc;
                                product.parts.forEach((child, index) => {
                                    if (child.property && child.property.length > 0) {
                                        child.property.forEach((cld, idx) => {
                                            if (cld.name == parts[index]) {
                                                totalAmoumt += parseInt(cld.amount);
                                                outputParts.push({ ...cld, partName: child.name })
                                            }
                                        })
                                    }
                                });
                            }

                            let cartInfo = {
                                cid: `cid_${new Date().getTime()}`,
                                email: req.cookies.user.email,
                                uid: req.cookies.user.uid,
                                weight: req.query.weight,
                                product,
                                parts: outputParts,
                                size: req.query.property,
                                totalAmoumt: totalAmoumt * parseInt(req.query.qty),
                                qty: parseInt(req.query.qty)
                            }

                            db.collection('cart').insertOne(cartInfo, function () {
                                res.send({ status: 'success', msg: '添加成功' });
                                db.close();
                            })
                        })
                    }
                }
                else {
                    let cartInfo = {
                        cid: `cid_${new Date().getTime()}`,
                        email: req.cookies.user.email,
                        uid: req.cookies.user.uid,
                        product,
                        parts: outputParts,
                        size: req.query.property,
                        totalAmoumt: totalAmoumt * parseInt(req.query.qty),
                        qty: parseInt(req.query.qty)
                    }

                    db.collection('cart').insertOne(cartInfo, function () {
                        res.send({ status: 'success', msg: '添加成功' });
                        db.close();
                    })
                }
            }
        })
    })
}

var createOrder = function (req, res) {
    let cids = req.query.cid.split(',').map((child) => {
        return {
            cid: child
        }
    });
    mongoClient.connect(mogoUrl, function (err, db) {
        db.collection('cart').find({ $or: cids }).toArray(function (err, doc) {
            if (doc && doc.length > 0) {
                let carts = doc;
                let oid = `oid_${new Date().getTime()}`;
                db.collection('order').insertOne({
                    carts: carts,
                    email: req.cookies.user.email,
                    inDate: new Date(),
                    oid: oid,
                    status: 0,//待确认
                    deliverStatusInfo: { delivers: [{ status: '提交订单', time: new Date() }], company: {} },
                    trackingInfo: {},
                    billInfo: {},
                }, function () {
                    res.send({ status: 'success', oid: oid })
                    db.collection('cart').remove({ $or: cids })
                    db.close();
                })
            }
            else {
                res.send({ status: 'failed', msg: 'failed' })
                db.close();
            }
        })
    })
}

var getOrderPage = function (req, res, route) {
    mongoClient.connect(mogoUrl, function (err, db) {
        db.collection('order').find({ "email": req.cookies.user.email, oid: req.query.oid }).toArray(function (err, doc) {
            if (err) {
                res.redirect('/')
                db.close();
            }
            else if (!doc || doc.length === 0) {
                res.redirect('/')
                db.close();
            }
            else {
                route && route(doc[0])
            }
        })
    })
}

var getUserOrder = function (req, res, route) {
    let query = { "email": req.cookies.user.email };
    if (req.query.status != undefined) {
        query.status = parseInt(req.query.status)
    }
    mongoClient.connect(mogoUrl, function (err, db) {
        db.collection('order').find(query).toArray(function (err, doc) {
            if (err) {
                res.render('myOrder', { orders: [], status: req.query.status })
                db.close();
            }
            else if (!doc || doc.length === 0) {
                res.render('myOrder', { orders: [], status: req.query.status })
                db.close();
            }
            else {
                route && route(doc);
                db.close();
            }
        })
    })
}

var addAddress = function (req, res) {
    mongoClient.connect(mogoUrl, function (err, db) {
        var cursor = db.collection('user').find({ "email": req.cookies.user.email }).toArray(function (err, doc) {
            if (err) {
                db.close();
            } else if (!doc || doc.length == 0) {
                res.send({ status: 'failed', msg: '账号不存在' })
            } else {
                var user = doc[0];
                user.addresses.unshift({
                    province: req.body.addressInfo && req.body.addressInfo.province ? req.body.addressInfo.province : '',
                    city: req.body.addressInfo && req.body.addressInfo.city ? req.body.addressInfo.city : '',
                    area: req.body.addressInfo && req.body.addressInfo.area ? req.body.addressInfo.area : '',
                    address: req.body.address,
                    zipCode: req.body.zipCode,
                    name: req.body.name,
                    phone: req.body.phone,
                    tel: req.body.tel
                });
                user.addresses = user.addresses.map((child, index) => {
                    return {
                        ...child,
                        index
                    }
                })

                db.collection('user').updateOne({ "email": req.cookies.user.email }, {
                    $set: { addresses: user.addresses },
                    $currentDate: { "lastModified": true }
                }, function () {
                    res.send({ status: 'success' })
                    db.close();
                });
                // res.send({ status: 'failed', msg: '账号已存在' })
                db.close();
            }
        });
    });
}

var addBill = function (req, res) {
    mongoClient.connect(mogoUrl, function (err, db) {
        var cursor = db.collection('user').find({ "email": req.cookies.user.email }).toArray(function (err, doc) {
            if (err) {
                db.close();
            } else if (!doc || doc.length == 0) {
                res.send({ status: 'failed', msg: '账号不存在' })
            } else {
                var user = doc[0];
                user.billInfos.unshift({
                    companyName: req.body.companyName,
                    invoiceTaxNumber: req.body.invoiceTaxNumber,
                    companyOpenAddress: req.body.companyOpenAddress,
                    companyPhone: req.body.companyPhone,
                    companyOpenBank: req.body.companyOpenBank,
                    companyBankAccount: req.body.companyBankAccount,
                    name: req.body.name,
                    phone: req.body.phone,
                    address: req.body.address,
                });
                user.billInfos = user.billInfos.map((child, index) => {
                    return {
                        ...child,
                        index
                    }
                })

                db.collection('user').updateOne({ "email": req.cookies.user.email }, {
                    $set: { billInfos: user.billInfos },
                    $currentDate: { "lastModified": true }
                }, function () {
                    res.send({ status: 'success' })
                    db.close();
                });
                // res.send({ status: 'failed', msg: '账号已存在' })
                db.close();
            }
        });
    });
}

var confirmOrder = function (req, res, user = null) {
    mongoClient.connect(mogoUrl, function (err, db) {
        var cursor = db.collection('order').find({ "oid": req.body.oid, "email": req.cookies.user.email }).toArray(function (err, doc) {
            if (err) {
                db.close();
            } else if (!doc || doc.length == 0) {
                res.send({ status: 'failed', msg: '订单不存在' })
                db.close();
            } else {
                if (doc[0].status != 0) {
                    res.send({ status: 'failed', msg: '订单已提交' });
                    db.close();
                    return;
                }
                var order = doc[0];
                let trackingInfo = {};
                let billInfo = {};
                let totalAmoumt = 0;
                let addressIndex = parseInt(req.body.addressIndex);
                let billIndex = parseInt(req.body.billIndex);
                let deliverTimeIndex = req.body.deliverTimeIndex;
                let deliverTypeIndex = req.body.deliverTypeIndex;
                let discount = user.discountType || 1;
                if (user && user.addresses && user.addresses.length > 0 && user.addresses.length >= addressIndex) {
                    trackingInfo = user.addresses[addressIndex];
                    trackingInfo.payInfo = user.payInfo ? user.payInfo : {};
                    trackingInfo.deliverTimeIndex = parseInt(deliverTimeIndex);
                    trackingInfo.deliverTypeIndex = parseInt(deliverTypeIndex);
                    if (order.carts && order.carts.length > 0) {
                        order.carts.forEach((child) => {
                            totalAmoumt += parseInt(child.totalAmoumt)
                        })
                    }
                    totalAmoumt = totalAmoumt * parseFloat(discount);
                    // if(deliverTimeIndex == 0){
                    //     trackingInfo.deliverTime = '不限送货时间'
                    // }
                    // else if(deliverTimeIndex == 1){
                    //     trackingInfo.deliverTime = '工作日送货：周一至周五'
                    // }
                    // else if(deliverTimeIndex == 2){
                    //     trackingInfo.deliverTime = '双休日、节假日：周六至周日'
                    // }

                    // if(deliverTypeIndex == 0){
                    //     trackingInfo.deliverType = '自提';
                    // }
                    // else if(deliverTypeIndex == 1){
                    //     trackingInfo.deliverType = '卖方配送';
                    // }
                }
                if (user && user.billInfos && user.billInfos.length > 0 && user.billInfos.length >= billIndex) {
                    billInfo = user.billInfos[billIndex];
                }
                db.collection('order').updateOne({ "oid": req.body.oid, "email": req.cookies.user.email }, {
                    $set: { status: 1, trackingInfo, billInfo, totalAmoumt, discount },
                    $currentDate: { "lastModified": true }
                }, function () {
                    res.send({ status: 'success' })
                    db.close();
                });
                // res.send({ status: 'failed', msg: '账号已存在' })
                // db.close();
            }
        });
    });
}

var createItem = function (req, res, product) {
    mongoClient.connect(mogoUrl, function (err, db) {
        var cursor = db.collection('product').find({ "pid": product.pid }).toArray(function (err, doc) {
            if (err) {
                db.close();
            } else if (!doc || doc.length == 0) {
                let parts = [];
                let property = [];
                if (product.parids && product.parids.length > 0) {
                    parts = product.parids.split(',')
                }
                if (product.propertys && product.propertys.length > 0) {
                    let tmp = product.propertys.split(',');
                    property = tmp.map((child, index) => {
                        let a = child.split('-');
                        return {
                            "name": a[0],
                            "amount": parseInt(a[1]),
                            "qty": parseInt(a[2]),
                            "weight": a[3],
                            "promotionText": a[4],
                            "isHot": a[4] && a[4].trim() && a[4].trim() != '' ? 1 : 0
                        }
                    })
                }
                let a = {
                    "pid": product.pid,
                    "priority": 1,
                    "title": product.title,
                    "onSale": property.filter((x) => { return x.isHot == 1 }).length > 0,
                    // "identifier": product.identifier,
                    "selectionAddress": product.selectionAddress,
                    "applicationAddress": product.applicationAddress,
                    "installAddress": product.installAddress,
                    // "size": product.size,
                    "produtType": product.produtType,
                    "weight": product.weight,
                    "productSEO": product.productSEO,
                    "productDesc": product.productDesc,
                    "store": {
                        "storeId": product.storeId ? parseInt(product.storeId) : -1,
                        "storeName": product.storeName.trim()
                    },
                    "promotion": {
                        "promotionText": product.promotion.trim()
                    },
                    "onSale": parseInt(product.onSale),
                    "imgs": product.imgs,
                    "property": property,
                    "parts": parts,
                    "description": product.description,
                    "structure": product.structure,
                    "configure": product.configure,
                    "help": product.help,
                    "updateTime": moment().format('YYYY-MM-DD')
                }


                db.collection('product').insertOne(a, function () {
                    res.send({ status: 'success' })
                    db.close();
                })
                // res.send({ status: 'failed', msg: '账号不存在' })
            } else {
                // var user = doc[0];
                res.send({ status: 'failed', msg: '商品已存在' })
                db.close();
            }
        });
    });
}

var createCase = function (req, res, product) {
    mongoClient.connect(mogoUrl, function (err, db) {
        var cursor = db.collection('case').find({ "caseId": product.caseId }).toArray(function (err, doc) {
            if (err) {
                db.close();
            } else if (!doc || doc.length == 0) {
                // var a = product;
                // let parts = [];
                // let products = [];
                // if (product.parids && product.parids.length > 0) {
                //     parts = product.parids.split(',')
                // }
                if (product.products && product.products.length > 0) {
                    let tmp = product.products.split(',');
                    let s = tmp.map((child, index) => {
                        return {
                            pid: child
                        }
                    })
                    db.collection('product').find({ $or: s }).toArray(function (err, doc) {
                        if (doc && doc.length > 0) {
                            db.collection('case').insertOne({ ...product, products: doc }, function () {
                                res.send({ status: 'success' })
                                db.close();
                            })
                        }
                        else {
                            db.collection('case').insertOne({ ...product, products: [] }, function () {
                                res.send({ status: 'success' })
                                db.close();
                            })
                        }
                    })
                }
                else {
                    db.collection('case').insertOne({ ...product, products: [] }, function () {
                        res.send({ status: 'success' })
                        db.close();
                    })
                }
                // res.send({ status: 'failed', msg: '账号不存在' })
            } else {
                // var user = doc[0];
                res.send({ status: 'failed', msg: '商品已存在' })
                db.close();
            }
        });
    });
}

var createVideo = function (req, res, product) {
    mongoClient.connect(mogoUrl, function (err, db) {
        var cursor = db.collection('video').find({ "video": product.vid }).toArray(function (err, doc) {
            if (err) {
                db.close();
            } else if (!doc || doc.length == 0) {
                // var a = product;
                // let parts = [];
                // let products = [];
                // if (product.parids && product.parids.length > 0) {
                //     parts = product.parids.split(',')
                // }
                db.collection('video').insertOne({ ...product }, function () {
                    res.send({ status: 'success', msg: '上传成功' })
                    db.close();
                })

                // res.send({ status: 'failed', msg: '账号不存在' })
            } else {
                // var user = doc[0];
                res.send({ status: 'failed', msg: '视频已存在' })
                db.close();
            }
        });
    });
}

var createTraining = function (req, res, product) {
    mongoClient.connect(mogoUrl, function (err, db) {
        var cursor = db.collection('training').find({ "ttid": product.ttid }).toArray(function (err, doc) {
            if (err) {
                db.close();
            } else if (!doc || doc.length == 0) {
                // var a = product;
                // let parts = [];
                // let products = [];
                // if (product.parids && product.parids.length > 0) {
                //     parts = product.parids.split(',')
                // }
                db.collection('training').insertOne({ ...product }, function () {
                    res.send({ status: 'success', msg: '创建成功' })
                    db.close();
                })

                // res.send({ status: 'failed', msg: '账号不存在' })
            } else {
                // var user = doc[0];
                res.send({ status: 'failed', msg: '培训已存在' })
                db.close();
            }
        });
    });
}

var createCategory = function (req, res) {
    mongoClient.connect(mogoUrl, function (err, db) {
        var cursor = db.collection('category').find({ "storeId": req.body.storeId }).toArray(function (err, doc) {
            if (err) {
                db.close();
            } else if (!doc || doc.length == 0) {
                let a = {
                    categoryId: req.body.categoryId,
                    storeId: parseInt(req.body.storeId),
                    storeName: req.body.storeName.trim()
                }


                db.collection('category').insertOne(a, function () {
                    res.send({ status: 'success', msg: '创建成功' })
                    db.close();
                })
                // res.send({ status: 'failed', msg: '账号不存在' })
            } else {
                // var user = doc[0];
                res.send({ status: 'failed', msg: '分类已存在' })
                db.close();
            }
        });
    });
}

var createCaseStore = function (req, res) {
    mongoClient.connect(mogoUrl, function (err, db) {
        var cursor = db.collection('caseCategory').find({ "storeId": req.body.storeId }).toArray(function (err, doc) {
            if (err) {
                db.close();
            } else if (!doc || doc.length == 0) {
                let a = {
                    categoryId: req.body.categoryId,
                    storeId: parseInt(req.body.storeId),
                    storeName: req.body.storeName.trim()
                }

                db.collection('caseCategory').insertOne(a, function () {
                    res.send({ status: 'success', msg: '创建成功' })
                    db.close();
                })
                // res.send({ status: 'failed', msg: '账号不存在' })
            } else {
                // var user = doc[0];
                res.send({ status: 'failed', msg: '分类已存在' })
                db.close();
            }
        });
    });
}


var createParts = function (req, res) {
    mongoClient.connect(mogoUrl, function (err, db) {
        let property = [];
        if (req.body.propertys && req.body.propertys.length > 0) {
            property = req.body.propertys.map((child, index) => {
                return {
                    "name": child.name,
                    "amount": parseInt(child.amount),
                    "qty": parseInt(child.qty)
                }
            })
        }
        let parts = {
            partsId: 'psId_' + new Date().getTime(),
            priority: parseInt(req.body.priority.trim()),
            pName: req.body.pName.trim(),
            property: property,
            name: req.body.name.trim()
        };
        db.collection('parts').insertOne(parts, function () {
            res.send({ status: 'success', msg: '创建成功' })
            db.close();
        })
        // var cursor = db.collection('parts').find({ "storeId": req.body.storeId }).toArray(function (err, doc) {
        //     if (err) {
        //         db.close();
        //     } else if (!doc || doc.length == 0) {
        //         let a = {
        //             categoryId: req.body.categoryId,
        //             storeId: parseInt(req.body.storeId),
        //             storeName: req.body.storeName
        //         }


        //         // res.send({ status: 'failed', msg: '账号不存在' })
        //     } else {
        //         // var user = doc[0];
        //         res.send({ status: 'failed', msg: '分类已存在' })
        //         db.close();
        //     }
        // });
    });
}

var createCustomQuestion = function (req, res, question) {
    mongoClient.connect(mogoUrl, function (err, db) {
        // let uid = req.cookies.user;
        // let question = question;
        let questions = [];
        questions.push({
            isUser: true,
            customQuestion: question.customQuestion,
            inDate: question.inDate,
            imgs: question.imgs,
            questionDes: question.questionDes,
            oid: question.oid,
            qualityAssurance: parseInt(question.qualityAssurance)
        })
        db.collection('question').insertOne({
            uid: req.cookies.user.uid,
            email: req.cookies.user.email,
            qid: question.qid,
            questions,
            status: 0,//待回复
            customQuestion: question.customQuestion,
            questionDes: question.questionDes,
            oid: question.oid,
            qualityAssurance: parseInt(question.qualityAssurance),
            inDate: question.inDate,
        }, function () {
            res.send({ status: 'success', msg: '创建成功' })
            db.close();
        })
    })
}

var createService = function (req, res, common, collection) {
    mongoClient.connect(mogoUrl, function (err, db) {
        // let uid = req.cookies.user;
        // let question = question;
        let questions = [];
        questions.push({
            isUser: true,
            inDate: common.inDate,
            img: common.img,
            description: common.description,
            title: common.title
            // oid: question.oid,
            // qualityAssurance: parseInt(question.qualityAssurance)
        })
        db.collection(collection).insertOne({
            uid: req.cookies.user.uid,
            email: req.cookies.user.email,
            qid: common.qid,
            title: common.title,
            description: common.description,
            questions,
            status: 0,//待回复
            inDate: common.inDate,
        }, function () {
            res.send({ status: 'success', msg: '创建成功' })
            db.close();
        })
    })
}

var createIntegrator = function (req, res, integrator) {
    mongoClient.connect(mogoUrl, function (err, db) {
        db.collection('integrator').insertOne(integrator, function () {
            res.send({ status: 'success', msg: '创建成功' })
            db.close();
        })
    })
}

var getAllCategory = function (req, res, route) {
    mongoClient.connect(mogoUrl, function (err, db) {
        var cursor = db.collection('category').find().sort({ storeId: 1 }).toArray(function (err, doc) {
            if (err) {
                route && route([])
                db.close();
            } else if (!doc || doc.length == 0) {
                // res.send({ status: 'success', store: [] })
                route && route([])
                db.close();
            } else {
                // var user = doc[0];
                // res.send({ status: 'success', store: doc })
                route && route(doc)
                db.close();
            }
        });
    });
}

var getAllCaseCategory = function (req, res, route) {
    mongoClient.connect(mogoUrl, function (err, db) {
        var cursor = db.collection('caseCategory').find().toArray(function (err, doc) {
            if (err) {
                route && route([])
                db.close();
            } else if (!doc || doc.length == 0) {
                // res.send({ status: 'success', store: [] })
                route && route([])
                db.close();
            } else {
                // var user = doc[0];
                // res.send({ status: 'success', store: doc })
                route && route(doc)
                db.close();
            }
        });
    });
}

var getCategory = function (req, res, route) {
    mongoClient.connect(mogoUrl, function (err, db) {
        db.collection('category').find({ categoryId: req.query.categoryId.trim() }).sort({ storeId: 1 }).toArray(function (err, doc) {
            if (err) {
                route && route({})
                db.close();
            } else if (!doc || doc.length == 0) {
                // res.send({ status: 'success', store: [] })
                route && route({})
                db.close();
            } else {
                // var user = doc[0];
                // res.send({ status: 'success', store: doc })
                route && route(doc[0])
                db.close();
            }
        });
    });
}

var getIntegrator = function (req, res, route, query = null) {
    mongoClient.connect(mogoUrl, function (err, db) {
        db.collection('integrator').find(query ? query : { iid: req.query.iid.trim() }).toArray(function (err, doc) {
            if (err) {
                route && route([])
                db.close();
            } else if (!doc || doc.length == 0) {
                // res.send({ status: 'success', store: [] })
                route && route([])
                db.close();
            } else {
                // var user = doc[0];
                // res.send({ status: 'success', store: doc })
                route && route(doc)
                db.close();
            }
        });
    });
}

var getCaseCategory = function (req, res, route) {
    mongoClient.connect(mogoUrl, function (err, db) {
        db.collection('caseCategory').find({ categoryId: req.query.categoryId.trim() }).toArray(function (err, doc) {
            if (err) {
                route && route({})
                db.close();
            } else if (!doc || doc.length == 0) {
                // res.send({ status: 'success', store: [] })
                route && route({})
                db.close();
            } else {
                // var user = doc[0];
                // res.send({ status: 'success', store: doc })
                route && route(doc[0])
                db.close();
            }
        });
    });
}


var getAllParts = function (req, res, route) {
    mongoClient.connect(mogoUrl, function (err, db) {
        var cursor = db.collection('parts').find().sort({ priority: 1 }).toArray(function (err, doc) {
            if (err) {
                route && route([])
                db.close();
            } else if (!doc || doc.length == 0) {
                // res.send({ status: 'success', store: [] })
                route && route([])
                db.close();
            } else {
                // var user = doc[0];
                // res.send({ status: 'success', store: doc })
                route && route(doc)
                db.close();
            }
        });
    });
}

var getParts = function (req, res, route) {
    mongoClient.connect(mogoUrl, function (err, db) {
        var cursor = db.collection('parts').find({ partsId: req.query.partsId }).toArray(function (err, doc) {
            if (err) {
                route && route({})
                db.close();
            } else if (!doc || doc.length == 0) {
                // res.send({ status: 'success', store: [] })
                route && route({})
                db.close();
            } else {
                // var user = doc[0];
                // res.send({ status: 'success', store: doc })
                route && route(doc[0])
                db.close();
            }
        });
    });
}

var getAllProduct = function (req, res, route) {
    mongoClient.connect(mogoUrl, function (err, db) {
        var cursor = db.collection('product').find().toArray(function (err, doc) {
            if (err) {
                route && route([])
                db.close();
            } else if (!doc || doc.length == 0) {
                // res.send({ status: 'success', store: [] })
                route && route([])
                db.close();
            } else {
                // var user = doc[0];
                // res.send({ status: 'success', store: doc })
                route && route(doc)
                db.close();
            }
        });
    });
}

var getCase = function (req, res, route, query = null) {
    mongoClient.connect(mogoUrl, function (err, db) {
        var cursor = db.collection('case').find(query ? query : {}).toArray(function (err, doc) {
            if (err) {
                route && route([])
                db.close();
            } else if (!doc || doc.length == 0) {
                // res.send({ status: 'success', store: [] })
                route && route([])
                db.close();
            } else {
                // var user = doc[0];
                // res.send({ status: 'success', store: doc })
                route && route(doc)
                db.close();
            }
        });
    });
}

var getVideo = function (req, res, route, query = null) {
    mongoClient.connect(mogoUrl, function (err, db) {
        var cursor = db.collection('video').find(query ? query : {}).toArray(function (err, doc) {
            if (err) {
                route && route([])
                db.close();
            } else if (!doc || doc.length == 0) {
                // res.send({ status: 'success', store: [] })
                route && route([])
                db.close();
            } else {
                // var user = doc[0];
                // res.send({ status: 'success', store: doc })
                route && route(doc)
                db.close();
            }
        });
    });
}

var getTraining = function (req, res, route, query = null) {
    mongoClient.connect(mogoUrl, function (err, db) {
        var cursor = db.collection('training').find(query ? query : {}).toArray(function (err, doc) {
            if (err) {
                route && route([])
                db.close();
            } else if (!doc || doc.length == 0) {
                // res.send({ status: 'success', store: [] })
                route && route([])
                db.close();
            } else {
                // var user = doc[0];
                // res.send({ status: 'success', store: doc })
                route && route(doc)
                db.close();
            }
        });
    });
}

var getAllOrders = function (req, res, route) {
    mongoClient.connect(mogoUrl, function (err, db) {
        db.collection('order').find().toArray(function (err, doc) {
            if (err) {
                route && route([]);
                db.close();
            }
            else if (!doc || doc.length === 0) {
                route && route([]);
                db.close();
            }
            else {
                route && route(doc);
                db.close();
            }
        })
    })
}

var getOrder = function (req, res, route) {
    mongoClient.connect(mogoUrl, function (err, db) {
        db.collection('order').find({ oid: req.query.oid.trim() }).toArray(function (err, doc) {
            if (err) {
                route && route({});
                db.close();
            }
            else if (!doc || doc.length === 0) {
                route && route({});
                db.close();
            }
            else {
                route && route(doc[0]);
                db.close();
            }
        })
    })
}

var getHomePage = function (req, res, route) {
    mongoClient.connect(mogoUrl, function (err, db) {
        db.collection('home').find().toArray(function (err, doc) {
            if (err) {
                route && route({});
                db.close();
            }
            else if (!doc || doc.length === 0) {
                route && route({});
                db.close();
            }
            else {
                route && route(doc[0]);
                db.close();
            }
        })
    })
}

var getWebsite = function (req, res, route, collection, query = null) {
    mongoClient.connect(mogoUrl, function (err, db) {
        db.collection(collection).find(query ? query : {}).toArray(function (err, doc) {
            if (err) {
                route && route({});
                db.close();
            }
            else if (!doc || doc.length === 0) {
                route && route({});
                db.close();
            }
            else {
                route && route(doc[0]);
                db.close();
            }
        })
    })
}

var getSoftwares = function (req, res, route) {
    mongoClient.connect(mogoUrl, function (err, db) {
        db.collection('softwares').find().toArray(function (err, doc) {
            if (err) {
                route && route([]);
                db.close();
            }
            else if (!doc || doc.length === 0) {
                route && route([]);
                db.close();
            }
            else {
                route && route(doc);
                db.close();
            }
        })
    })
}

var deleteOrde = function (req, res, route) {
    mongoClient.connect(mogoUrl, function (err, db) {
        db.collection('order').remove({ oid: req.query.oid.trim() }, function () {
            route && route();
            db.close();
        })
    })
}

var deleteManage = function (req, res, route, collectionName, query) {
    mongoClient.connect(mogoUrl, function (err, db) {
        db.collection(collectionName).remove(query, function () {
            route && route();
            db.close();
        })
    })
}

var getAllUser = function (req, res, route) {
    mongoClient.connect(mogoUrl, function (err, db) {
        var cursor = db.collection('user').find().toArray(function (err, doc) {
            if (err) {
                route && route([])
                db.close();
            } else if (!doc || doc.length == 0) {
                // res.send({ status: 'success', store: [] })
                route && route([])
                db.close();
            } else {
                // var user = doc[0];
                // res.send({ status: 'success', store: doc })
                route && route(doc)
                db.close();
            }
        });
    });
}

var getUserCustomQuestions = function (req, res, isAll = false, route, query = null) {
    mongoClient.connect(mogoUrl, function (err, db) {
        db.collection('question').find(query ? query : (isAll ? {} : { uid: req.cookies.user.uid })).toArray(function (err, doc) {
            if (err) {
                route && route([]);
                db.close();
            }
            else if (!doc || doc.length === 0) {
                route && route([]);
                db.close();
            }
            else {
                route && route(doc);
                db.close();
            }
        })
    })
}

var getUserServiceQuestion = function (req, res, route, collection, query = null) {
    mongoClient.connect(mogoUrl, function (err, db) {
        db.collection(collection).find(query ? query : { uid: req.cookies.user.uid }).toArray(function (err, doc) {
            if (err) {
                route && route([]);
                db.close();
            }
            else if (!doc || doc.length === 0) {
                route && route([]);
                db.close();
            }
            else {
                route && route(doc);
                db.close();
            }
        })
    })
}

var getRole = function (req, res, route) {
    mongoClient.connect(mogoUrl, function (err, db) {
        db.collection('role').find().toArray(function (err, doc) {
            if (err) {
                route && route({});
                db.close();
            } else if (!doc || doc.length == 0) {
                route && route({});
                db.close();
            } else {
                route && route(doc[0]);
                db.close();
            }
        });
    });
}

var updateRole = function (req, res) {
    mongoClient.connect(mogoUrl, function (err, db) {
        db.collection('role').find().toArray(function (err, doc) {
            if (err) {
                res.send({ status: 'failed', mgs: 'try again later' })
                db.close();
            } else if (!doc || doc.length == 0) {
                db.collection('role').insertOne({
                    payMethod: req.body.payMethod.trim(),
                    payDay: req.body.payDay.trim(),
                    shippingCharge: req.body.shippingCharge.trim(),
                    shippingChargeAmount: req.body.shippingChargeAmount && parseInt(req.body.shippingChargeAmount) ? parseInt(req.body.shippingChargeAmount) : 0
                }, function () {
                    res.send({ status: 'success' })
                    db.close();
                })
                db.close();
            } else {
                db.collection('role').updateOne({}, {
                    $set: {
                        payMethod: req.body.payMethod.trim(),
                        payDay: req.body.payDay.trim(),
                        shippingCharge: req.body.shippingCharge.trim(),
                        shippingChargeAmount: req.body.shippingChargeAmount && parseInt(req.body.shippingChargeAmount) ? parseInt(req.body.shippingChargeAmount) : 0
                    },
                    $currentDate: { "lastModified": true }
                });
                res.send({ status: 'success' })
                db.close();
            }
        });
    });
}

var updateUserMg = function (req, res) {
    mongoClient.connect(mogoUrl, function (err, db) {
        db.collection('user').find({ uid: req.body.uid.trim() }).toArray(function (err, doc) {
            if (err) {
                res.send({ status: 'failed', mgs: 'try again later' })
                db.close();
            } else if (!doc || doc.length == 0) {
                res.send({ status: 'failed', mgs: 'try again later' })
                db.close();
            } else {
                let user = doc[0];
                let level = 1;
                if (req.body.levelString.trim() == '一级经销商') {
                    level = 1;
                }
                if (req.body.levelString.trim() == '二级经销商') {
                    level = 2;
                }
                if (req.body.levelString.trim() == '三级经销商') {
                    level = 3;
                }
                db.collection('user').updateOne({ uid: req.body.uid.trim() }, {
                    $set: {
                        discountType: req.body.discountType && parseFloat(req.body.discountType) ? parseFloat(req.body.discountType) : user.discountType,
                        payInfo: {
                            level: level,
                            levelString: req.body.levelString.trim(),
                            payMethod: req.body.payMethod.trim(),
                            payDay: req.body.payDay.trim(),
                            shippingCharge: req.body.shippingCharge.trim(),
                            shippingChargeAmount: req.body.shippingChargeAmount && parseInt(req.body.shippingChargeAmount) ? parseInt(req.body.shippingChargeAmount) : 0
                        }
                    },
                    $currentDate: { "lastModified": true }
                });
                res.send({ status: 'success' })
                db.close();
            }
        });
    });
}

var updateParts = function (req, res) {
    mongoClient.connect(mogoUrl, function (err, db) {
        db.collection('parts').find({ partsId: req.query.partsId }).toArray(function (err, doc) {
            if (err) {
                res.send({ status: 'failed', mgs: 'try again later' })
                db.close();
            } else if (!doc || doc.length == 0) {
                res.send({ status: 'failed', mgs: 'try again later' })
                db.close();
            } else {
                let property = [];
                if (req.body.propertys && req.body.propertys.length > 0) {
                    property = req.body.propertys.map((child, index) => {
                        return {
                            "name": child.name,
                            "amount": parseInt(child.amount),
                            "qty": parseInt(child.qty)
                        }
                    })
                }
                let parts = {
                    // partsId: 'psId_' + new Date().getTime(),
                    priority: parseInt(req.body.priority.trim()),
                    pName: req.body.pName.trim(),
                    property: property,
                    name: req.body.name.trim()
                };
                db.collection('parts').updateOne({ partsId: req.query.partsId }, {
                    $set: {
                        ...parts
                    },
                    $currentDate: { "lastModified": true }
                });
                res.send({ status: 'success', msg: '修改成功' })
                db.close();
            }
        });
    });
}

var submitTraining = function (req, res) {
    mongoClient.connect(mogoUrl, function (err, db) {
        db.collection('userTraining').find({ ttid: req.body.ttid.trim(), uid: req.cookies.user.uid }).toArray(function (err, doc) {
            if (err) {
                res.send({ status: 'failed', mgs: 'try again later' })
                db.close();
            } else if (!doc || doc.length == 0) {
                getTraining(req, res, (trainings) => {
                    db.collection('userTraining').insertOne({
                        uid: req.cookies.user.uid,
                        training: trainings[0],
                        updateTime: moment().format('YYYY-MM-DD'),
                        email: req.cookies.user.email,
                        status: 0,
                        ...req.body
                    }, function () {
                        res.send({ status: 'success', msg: '提交成功' })
                        db.close();
                    })
                }, { ttid: req.body.ttid.trim() })
                // res.send({ status: 'failed', mgs: 'try again later' })
                // db.close();
            } else {
                res.send({ status: 'failed', msg: '已经提交过，请勿重新提交' })
                db.close();
            }
        });
    });
}

var getUserTraining = function (req, res, route, query = null) {
    mongoClient.connect(mogoUrl, function (err, db) {
        var cursor = db.collection('userTraining').find(query ? query : {}).toArray(function (err, doc) {
            if (err) {
                route && route([])
                db.close();
            } else if (!doc || doc.length == 0) {
                // res.send({ status: 'success', store: [] })
                route && route([])
                db.close();
            } else {
                // var user = doc[0];
                // res.send({ status: 'success', store: doc })
                route && route(doc)
                db.close();
            }
        });
    });
}

var updateCategory = function (req, res) {
    mongoClient.connect(mogoUrl, function (err, db) {
        db.collection('category').find({ categoryId: req.query.categoryId.trim() }).toArray(function (err, doc) {
            if (err) {
                res.send({ status: 'failed', msg: 'try again later' })
                db.close();
            } else if (!doc || doc.length == 0) {
                res.send({ status: 'failed', msg: 'try again later' })
                db.close();
            } else {
                let a = {
                    storeId: parseInt(req.body.storeId),
                    storeName: req.body.storeName.trim()
                }
                db.collection('category').updateOne({ categoryId: req.query.categoryId.trim() }, {
                    $set: {
                        ...a
                    },
                    $currentDate: { "lastModified": true }
                });
                res.send({ status: 'success', msg: '修改成功' })
                db.close();
            }
        });
    });
}

var updateCaseStore = function (req, res) {
    mongoClient.connect(mogoUrl, function (err, db) {
        db.collection('caseCategory').find({ categoryId: req.query.categoryId.trim() }).toArray(function (err, doc) {
            if (err) {
                res.send({ status: 'failed', msg: 'try again later' })
                db.close();
            } else if (!doc || doc.length == 0) {
                res.send({ status: 'failed', msg: 'try again later' })
                db.close();
            } else {
                let a = {
                    storeId: parseInt(req.body.storeId),
                    storeName: req.body.storeName.trim()
                }
                db.collection('caseCategory').updateOne({ categoryId: req.query.categoryId.trim() }, {
                    $set: {
                        ...a
                    },
                    $currentDate: { "lastModified": true }
                });
                res.send({ status: 'success', msg: '修改成功' })
                db.close();
            }
        });
    });
}
var updateCase = function (req, res, product) {
    mongoClient.connect(mogoUrl, function (err, db) {
        var cursor = db.collection('case').find({ "caseId": product.caseId }).toArray(function (err, doc) {
            if (err) {
                db.close();
            } else if (!doc || doc.length == 0) {
                res.send({ status: 'failed', msg: '案例不存在' })
                // res.send({ status: 'failed', msg: '账号不存在' })
            } else {
                let c = doc[0];
                if (product.products && product.products.length > 0) {
                    let tmp = product.products.split(',');
                    let s = tmp.map((child, index) => {
                        return {
                            pid: child
                        }
                    })
                    db.collection('product').find({ $or: s }).toArray(function (err, doc) {
                        if (doc && doc.length > 0) {
                            db.collection('case').updateOne({ caseId: product.caseId.trim() }, {
                                $set: {
                                    ...product,
                                    imgs: !c.imgs || product.imgs.length > c.imgs.length ? product.imgs : c.imgs,
                                    "background": product.background != "<p>&nbsp;</p>" ? product.background : c.description,
                                    "solution": product.solution != "<p>&nbsp;</p>" ? product.solution : c.solution,
                                    products: doc
                                },
                                $currentDate: { "lastModified": true }
                            }, function (err, doc) {
                                var a = err;
                                res.send({ status: 'success' })
                                db.close();
                            });
                        }
                        else {
                            db.collection('case').updateOne({ caseId: product.caseId.trim() }, {
                                $set: {
                                    ...product,
                                    imgs: !c.imgs || product.imgs.length > c.imgs.length ? product.imgs : c.imgs,
                                    "background": product.background != "<p>&nbsp;</p>" ? product.background : c.description,
                                    "solution": product.solution != "<p>&nbsp;</p>" ? product.solution : c.solution,
                                    products: []
                                },
                                $currentDate: { "lastModified": true }
                            }, function () {
                                res.send({ status: 'success' })
                                db.close();
                            });
                        }
                    })
                }
                else {
                    db.collection('case').updateOne({ caseId: product.caseId.trim() }, {
                        $set: {
                            ...product,
                            imgs: !c.imgs || product.imgs.length > c.imgs.length ? product.imgs : c.imgs,
                            "background": product.background != "<p>&nbsp;</p>" ? product.background : c.description,
                            "solution": product.solution != "<p>&nbsp;</p>" ? product.solution : c.solution,
                            products: []
                        },
                        $currentDate: { "lastModified": true }
                    }, function () {
                        res.send({ status: 'success' })
                        db.close();
                    });
                }
                // db.close();
            }
        });
    });
}

var updateVideos = function (req, res, product) {
    mongoClient.connect(mogoUrl, function (err, db) {
        db.collection('video').find({ "vid": product.vid.trim() }).toArray(function (err, doc) {
            if (err) {
                db.close();
            } else if (!doc || doc.length == 0) {
                res.send({ status: 'failed', msg: '视频不存在' })
                // res.send({ status: 'failed', msg: '账号不存在' })
            } else {
                // let c = doc[0];
                db.collection('video').updateOne({ vid: product.vid.trim() }, {
                    $set: {
                        title: product.title,
                        videoType: product.videoType
                    },
                    $currentDate: { "lastModified": true }
                }, function () {
                    res.send({ status: 'success', msg: "修改成功" })
                    db.close();
                });
                // db.close();
            }
        });
    });
}

var updateTraining = function (req, res, product) {
    mongoClient.connect(mogoUrl, function (err, db) {
        db.collection('training').find({ "ttid": req.query.ttid.trim() }).toArray(function (err, doc) {
            if (err) {
                db.close();
            } else if (!doc || doc.length == 0) {
                res.send({ status: 'failed', msg: '培训不存在' })
                // res.send({ status: 'failed', msg: '账号不存在' })
            } else {
                // let c = doc[0];
                db.collection('training').updateOne({ ttid: req.query.ttid.trim() }, {
                    $set: {
                        ...product
                    },
                    $currentDate: { "lastModified": true }
                }, function () {
                    res.send({ status: 'success', msg: "修改成功" })
                    db.close();
                });
                // db.close();
            }
        });
    });
}

var updateUserTraining = function (req, res) {
    mongoClient.connect(mogoUrl, function (err, db) {
        db.collection('userTraining').find({ "ttid": req.query.ttid.trim(), "uid": req.query.uid.trim() }).toArray(function (err, doc) {
            if (err) {
                res.redirect('/management/trainingServiceMgrM');
                db.close();
            } else if (!doc || doc.length == 0) {
                // res.send({ status: 'failed', msg: '培训不存在' })
                // res.send({ status: 'failed', msg: '账号不存在' })
                res.redirect('/management/trainingServiceMgrM');
                db.close();
            } else {
                // let c = doc[0];
                db.collection('userTraining').updateOne({ ttid: req.query.ttid.trim(), "uid": req.query.uid.trim() }, {
                    $set: {
                        status: parseInt(req.query.status)
                    },
                    $currentDate: { "lastModified": true }
                }, function () {
                    res.redirect('/management/trainingServiceMgrM');
                    db.close();
                });
                // db.close();
            }
        });
    });
}

var updateItem = function (req, res, product) {
    mongoClient.connect(mogoUrl, function (err, db) {
        db.collection('product').find({ "pid": product.pid.trim() }).toArray(function (err, doc) {
            if (err) {
                res.send({ status: 'failed', msg: '服务出错稍后再试' })
                db.close();
            } else if (!doc || doc.length == 0) {
                res.send({ status: 'failed', msg: '商品不存在' })
                db.close();
            } else {
                let pd = doc[0];
                let parts = [];
                let property = [];
                if (product.parids && product.parids.length > 0) {
                    parts = product.parids.split(',')
                }
                if (product.propertys && product.propertys.length > 0) {
                    let tmp = product.propertys.split(',');
                    property = tmp.map((child, index) => {
                        let a = child.split('-');
                        return {
                            "name": a[0],
                            "amount": parseInt(a[1]),
                            "qty": parseInt(a[2]),
                            "weight": a[3],
                            "promotionText": a[4],
                            "isHot": a[4] && a[4].trim() && a[4].trim() != '' ? 1 : 0
                        }
                    })
                }
                let a = {
                    // "pid": product.pid,
                    // "priority": 1,
                    "title": product.title,
                    // "identifier": product.identifier,
                    // "size": product.size,
                    "weight": product.weight,
                    "onSale": property.filter((x) => { return x.isHot == 1 }).length > 0,
                    "store": {
                        "storeId": product.storeId ? parseInt(product.storeId) : -1,
                        "storeName": product.storeName.trim()
                    },
                    "promotion": {
                        "promotionText": product.promotion.trim()
                    },
                    "produtType": product.produtType,
                    "productSEO": product.productSEO,
                    "productDesc": product.productDesc,
                    "selectionAddress": product.selectionAddress,
                    "applicationAddress": product.applicationAddress,
                    "installAddress": product.installAddress,
                    "onSale": parseInt(product.onSale),
                    "imgs": product.imgs && product.imgs.length > pd.imgs.length ? product.imgs : pd.imgs,
                    "property": property,
                    "parts": parts,
                    "description": product.description != "<p>&nbsp;</p>" ? product.description : pd.description,
                    "structure": product.structure != "<p>&nbsp;</p>" ? product.structure : pd.structure,
                    "configure": product.configure != "<p>&nbsp;</p>" ? product.configure : pd.configure,
                    "help": product.help != "<p>&nbsp;</p>" ? product.help : pd.help,
                    "updateTime": moment().format('YYYY-MM-DD')
                }
                db.collection('product').updateOne({ "pid": product.pid.trim() }, {
                    $set: a,
                    $currentDate: { "lastModified": true }
                });
                // var user = doc[0];
                res.send({ status: 'success', msg: '修改成功' })
                db.close();
            }
        });
    });
}

var updateOrder = function (req, res) {
    mongoClient.connect(mogoUrl, function (err, db) {
        db.collection('order').find({ "oid": req.query.oid.trim() }).toArray(function (err, doc) {
            if (err) {
                res.send({ status: 'failed', msg: '服务出错稍后再试' })
                db.close();
            } else if (!doc || doc.length == 0) {
                res.send({ status: 'failed', msg: '订单不存在' })
                db.close();
            } else {
                let od = doc[0];
                let trackingInfo = Object.assign({}, od.trackingInfo);
                trackingInfo.payInfo.shippingChargeAmount = parseFloat(req.body.shippingChargeAmount);
                trackingInfo.payInfo.shippingCharge = req.body.shippingCharge;
                db.collection('order').updateOne({ "oid": req.query.oid.trim() }, {
                    $set: {
                        totalAmoumt: parseFloat(req.body.totalAmoumt),
                        trackingInfo,
                        status: parseInt(req.body.status)
                    },
                    $currentDate: { "lastModified": true }
                });
                // var user = doc[0];
                res.send({ status: 'success', msg: '修改成功' })
                db.close();
            }
        });
    });
}

var updateQuestion = function (req, res, collection = 'question') {
    mongoClient.connect(mogoUrl, function (err, db) {
        db.collection(collection).find({ "qid": req.query.qid.trim() }).toArray(function (err, doc) {
            if (err) {
                res.send({ status: 'failed', msg: '服务出错稍后再试' })
                db.close();
            } else if (!doc || doc.length == 0) {
                res.send({ status: 'failed', msg: '售后不存在' })
                db.close();
            } else {
                let q = doc[0];
                let questions = Object.assign([], q.questions);
                questions.push({
                    isUser: false,
                    response: req.body.response,
                    outDate: new Date()
                })
                // let trackingInfo = Object.assign({}, od.trackingInfo);
                // trackingInfo.payInfo.shippingChargeAmount = parseFloat(req.body.shippingChargeAmount);
                // trackingInfo.payInfo.shippingCharge = req.body.shippingCharge;
                db.collection(collection).updateOne({ "qid": req.query.qid.trim() }, {
                    $set: {
                        questions: questions,
                        status: parseInt(req.body.status),
                        outDate: new Date()
                    },
                    $currentDate: { "lastModified": true }
                });
                // var user = doc[0];
                res.send({ status: 'success', msg: '修改成功' })
                db.close();
            }
        });
    });
}

var updateCustomQuestion = function (req, res, question) {
    mongoClient.connect(mogoUrl, function (err, db) {
        db.collection('question').find({ "qid": req.query.qid.trim() }).toArray(function (err, doc) {
            if (err) {
                res.send({ status: 'failed', msg: '服务出错稍后再试' })
                db.close();
            } else if (!doc || doc.length == 0) {
                res.send({ status: 'failed', msg: '售后不存在' })
                db.close();
            } else {
                let q = doc[0];
                let questions = Object.assign([], q.questions);
                questions.push({
                    isUser: true,
                    customQuestion: q.customQuestion,
                    inDate: question.inDate,
                    imgs: question.imgs,
                    questionDes: question.questionDes,
                    oid: q.oid,
                    qualityAssurance: parseInt(q.qualityAssurance)
                })
                // let trackingInfo = Object.assign({}, od.trackingInfo);
                // trackingInfo.payInfo.shippingChargeAmount = parseFloat(req.body.shippingChargeAmount);
                // trackingInfo.payInfo.shippingCharge = req.body.shippingCharge;
                db.collection('question').updateOne({ "qid": req.query.qid.trim() }, {
                    $set: {
                        questions: questions,
                        status: 0,
                        // outDate: new Date()
                    },
                    $currentDate: { "lastModified": true }
                });
                // var user = doc[0];
                res.send({ status: 'success', msg: '修改成功' })
                db.close();
            }
        });
    });
}

var updateService = function (req, res, question, collection) {
    mongoClient.connect(mogoUrl, function (err, db) {
        db.collection(collection).find({ "qid": req.query.qid.trim() }).toArray(function (err, doc) {
            if (err) {
                res.send({ status: 'failed', msg: '服务出错稍后再试' })
                db.close();
            } else if (!doc || doc.length == 0) {
                res.send({ status: 'failed', msg: '询价不存在' })
                db.close();
            } else {
                let q = doc[0];
                let questions = Object.assign([], q.questions);
                questions.push({
                    isUser: true,
                    title: q.title,
                    inDate: question.inDate,
                    img: question.img,
                    description: question.description,
                })
                db.collection(collection).updateOne({ "qid": req.query.qid.trim() }, {
                    $set: {
                        questions: questions,
                        status: 0,
                        // outDate: new Date()
                    },
                    $currentDate: { "lastModified": true }
                });
                // var user = doc[0];
                res.send({ status: 'success', msg: '修改成功' })
                db.close();
            }
        });
    });
}

var updateIntegrator = function (req, res, integrator) {
    mongoClient.connect(mogoUrl, function (err, db) {
        db.collection('integrator').find({ "iid": req.query.iid ? req.query.iid.trim() : integrator.iid.trim() }).toArray(function (err, doc) {
            if (err) {
                res.send({ status: 'failed', msg: '服务出错稍后再试' })
                db.close();
            } else if (!doc || doc.length == 0) {
                res.send({ status: 'failed', msg: '售后不存在' })
                db.close();
            } else {
                // let q = doc[0];
                db.collection('integrator').updateOne({ "iid": req.query.iid ? req.query.iid.trim() : integrator.iid.trim() }, {
                    $set: integrator,
                    $currentDate: { "lastModified": true }
                });
                // var user = doc[0];
                res.send({ status: 'success', msg: '修改成功' })
                db.close();
            }
        });
    });
}

var updateWebsite = function (req, res, collection, query) {
    mongoClient.connect(mogoUrl, function (err, db) {
        db.collection(collection).find(query).toArray(function (err, doc) {
            if (err) {
                res.send({ status: 'failed', msg: '服务出错稍后再试' })
                db.close();
            } else if (!doc || doc.length == 0) {
                // res.send({ status: 'failed', msg: '售后不存在' })
                db.collection(collection).insertOne({
                    "id": query.id,
                    ...req.body
                }, function () {
                    res.send({ status: 'success', msg: '修改成功' })
                    db.close();
                })
                // db.close();
            } else {
                // let q = doc[0];
                db.collection(collection).updateOne(query, {
                    $set: { ...req.body },
                    $currentDate: { "lastModified": true }
                });
                // var user = doc[0];
                res.send({ status: 'success', msg: '修改成功' })
                db.close();
            }
        })
        // db.collection('integrator').find({ "iid": req.query.iid ? req.query.iid.trim() : integrator.iid.trim() }).toArray(function (err, doc) {
        //     if (err) {
        //         res.send({ status: 'failed', msg: '服务出错稍后再试' })
        //         db.close();
        //     } else if (!doc || doc.length == 0) {
        //         res.send({ status: 'failed', msg: '售后不存在' })
        //         db.close();
        //     } else {
        //         // let q = doc[0];
        //         db.collection('integrator').updateOne({ "iid": req.query.iid ? req.query.iid.trim() : integrator.iid.trim() }, {
        //             $set: integrator,
        //             $currentDate: { "lastModified": true }
        //         });
        //         // var user = doc[0];
        //         res.send({ status: 'success', msg: '修改成功' })
        //         db.close();
        //     }
        // });
    });
}


var searchPartsApi = function (req, res) {
    mongoClient.connect(mogoUrl, function (err, db) {
        db.collection('parts').find(req.query.pName == '' ? {} : { "pName": { $regex: req.query.pName.trim(), $options: "$i" } }).toArray(function (err, doc) {
            if (err) {
                res.send({ status: 'failed', msg: '服务出错稍后再试' })
                db.close();
            } else if (!doc || doc.length == 0) {
                res.send({ status: 'failed', msg: '售后不存在' })
                db.close();
            } else {
                res.send({ status: 'success', data: viewHandler.buildPartsView(doc) })
                db.close();
            }
        });
    });
    // { $regex: child.trim(), $options: "$i" }
}

var search = function (req, res) {
    mongoClient.connect(mogoUrl, function (err, db) {
        db.collection('product').find({ $or: [{ "title": { $regex: req.query.keywords, $options: 'i' } }, { "productDesc": { $regex: req.query.keywords, $options: 'i' } }] }).toArray(function (err, doc) {
            if (err) {
                res.send({ status: 'failed', msg: '' })
                db.close();
            } else if (!doc || doc.length == 0) {
                res.send({ status: 'failed', msg: '' })
                db.close();
            } else {
                res.send({ status: 'success', msg: doc[0].pid })
                db.close();
            }
        });
    });
    // { $regex: child.trim(), $options: "$i" }
}

var updateQty = function (req, res, cart) {
    mongoClient.connect(mogoUrl, function (err, db) {
        var qty = parseInt(req.query.qty.trim()) || cart.qty;
        var totalAmoumt = (cart.totalAmoumt / cart.qty) * qty;
        db.collection('cart').updateOne({ "cid": req.query.cid.trim() }, {
            $set: {
                qty,
                totalAmoumt
            },
            $currentDate: { "lastModified": true }
        }, function () {
            res.send({ status: 'success' })
            db.close();
        });
        // res.send({ status: 'failed', msg: '账号已存在' })
        // db.close();
    });
}

var updateHomePage = function (req, res, home) {
    mongoClient.connect(mogoUrl, function (err, db) {
        // var qty = parseInt(req.query.qty.trim()) || cart.qty;
        // var totalAmoumt = (cart.totalAmoumt / cart.qty) * qty;'
        let propertys = [];
        let imgs = [];
        if (home.propertys && home.propertys.length > 0) {
            propertys = home.propertys.split(',').map((child, index) => {
                let a = child.split('-');
                return {
                    name: a.length >= 1 ? a[0] : '',
                    link: a.length >= 2 ? a[1] : ''
                }
            })
        }
        if (home.imgs && home.imgs.length > 0) {
            imgs = home.imgs.split(',').map((child) => {
                return (
                    parseInt(child))
            })
        }
        db.collection('home').find().toArray(function (err, doc) {
            if (err) {
                res.send({ status: 'failed', msg: '服务出错稍后再试' })
                db.close();
            } else if (!doc || doc.length == 0) {
                db.collection('home').insertOne({
                    "id": 1,
                    "homeImgCount": parseInt(home.homeImgCount),
                    imgs: imgs,
                    propertys
                }, function () {
                    res.send({ status: 'success', msg: 'success' })
                    db.close();
                })
                // db.close();
            } else {
                let temp = Object.assign({}, doc[0]);
                let oimgs = [];
                if (temp.imgs && temp.imgs.length > 0) {
                    oimgs = unique4(temp.imgs.concat(imgs));
                }
                else {
                    oimgs = imgs;
                }
                db.collection('home').updateOne({ "id": 1 }, {
                    $set: {
                        // "homeImgCount": parseInt(home.homeImgCount),
                        propertys,
                        imgs: oimgs,
                    },
                    $currentDate: { "lastModified": true }
                }, function () {
                    res.send({ status: 'success', msg: 'success' })
                    db.close();
                });
                // res.send({ status: 'success', data: viewHandler.buildPartsView(doc) })
                // db.close();
            }
        });
        // res.send({ status: 'failed', msg: '账号已存在' })
        // db.close();
    });
}

var updateSoftwares = function (req, res, softwares) {
    mongoClient.connect(mogoUrl, function (err, db) {
        // var qty = parseInt(req.query.qty.trim()) || cart.qty;
        // var totalAmoumt = (cart.totalAmoumt / cart.qty) * qty;'
        let propertys = [];
        if (softwares.propertys && softwares.propertys.length > 0) {
            propertys = softwares.propertys.split(',').map((child, index) => {
                let a = child.split('-');
                return {
                    name: a.length >= 1 ? a[0] : '',
                    content: a.length >= 2 ? a[1] : '',
                    "updateTime": moment().format('YYYY-MM-DD')
                }
            })
        }
        db.collection('softwares').find().toArray(function (err, doc) {
            if (err) {
                res.send({ status: 'failed', msg: '服务出错稍后再试' })
                db.close();
            } else if (!doc || doc.length == 0) {
                db.collection('softwares').insertOne({
                    "id": 1,
                    propertys,
                }, function () {
                    res.send({ status: 'success', msg: 'success' })
                    db.close();
                })
                // db.close();
            } else {
                let g = Object.assign([], doc[0]);
                // let out = [];
                if (g.propertys && g.propertys.length > 0) {
                    propertys.forEach((child, index) => {
                        g.propertys.forEach((cld, idex) => {
                            if (child.name == cld.name && child.content == cld.content) {
                                child.updateTime = cld.updateTime;
                            }
                        })
                    })
                }
                db.collection('softwares').updateOne({ "id": 1 }, {
                    $set: {
                        // "homeImgCount": parseInt(home.homeImgCount),
                        propertys,
                    },
                    $currentDate: { "lastModified": true }
                }, function () {
                    res.send({ status: 'success', msg: 'success' })
                    db.close();
                });
                // res.send({ status: 'success', data: viewHandler.buildPartsView(doc) })
                // db.close();
            }
        });
        // res.send({ status: 'failed', msg: '账号已存在' })
        // db.close();
    });
}

var deleteCart = function (req, res) {
    mongoClient.connect(mogoUrl, function (err, db) {
        db.collection('cart').remove({ cid: req.query.cid.trim() }, function () {
            res.send({ status: 'success' })
            db.close();
        });
    });
}




var unique4 = function (arr) {
    var res = [];
    for (var i = 0; i < arr.length; i++) {
        if (res.indexOf(arr[i]) == -1) {
            res.push(arr[i]);
        }
    }
    return res;
}

var subscribeF = function (openId, preLevel, data, req, res) {
    mongoClient.connect(mogoUrl, function (err, db) {
        var cursor = db.collection('user').find({ "openId": openId }).toArray(function (err, doc) {
            if (err) {
                db.close();
            } else if (!doc || doc.length == 0) {
                var time = new Date().toLocaleDateString();
                var arr = time.split('/');
                var day = arr.length === 3 ? arr[2] + '-' + arr[0] + '-' + arr[1] : arr[0];
                if (preLevel && preLevel.length > 0) {
                    mongoClient.connect(mogoUrl, function (err, db) {
                        var cursor = db.collection('user').find({ "openId": preLevel }).toArray(function (err, doc) {
                            if (err) {
                                db.collection('user').insertOne({
                                    "userId": "uid" + data.openid,
                                    "openId": data.openid,
                                    "preLevel": preLevel || "",
                                    "name": data.nickname,
                                    'avator': data.headimgurl,
                                    "createTime": day,
                                    "city": data.province
                                }, function () {
                                    db.close();
                                })
                            } else if (!doc || doc.length == 0) {
                                db.collection('user').insertOne({
                                    "userId": "uid" + data.openid,
                                    "openId": data.openid,
                                    "preLevel": preLevel || "",
                                    "name": data.nickname,
                                    'avator': data.headimgurl,
                                    "createTime": day,
                                    "city": data.province
                                }, function () {
                                    db.close();
                                })

                            } else {
                                db.collection('user').insertOne({
                                    "userId": "uid" + data.openid,
                                    "openId": data.openid,
                                    "preLevel": preLevel || "",
                                    "preName": doc[0].name,
                                    "name": data.nickname,
                                    'avator': data.headimgurl,
                                    "createTime": day,
                                    "city": data.province
                                }, function () {
                                    db.close();
                                })
                                // db.close();
                            }
                        });
                    });
                }
            }
        });
    });
}

var checkUserExists = function (openId, data, req, res, callBack) {
    mongoClient.connect(mogoUrl, function (err, db) {
        var cursor = db.collection('user').find({ "openId": openId }).toArray(function (err, doc) {
            if (err) {
                db.close();
            } else if (!doc || doc.length == 0) {
                callBack(data, req, res);
                db.close();

            } else {
                var user = doc[0];
                if (user.name) {
                    req.session.user.name = user.name;
                    callBack(null, req, res);
                } else {
                    console.log('datadata', data)
                    req.session.user.name = data.nickname;
                    db.collection('user').updateOne({ "openId": openId }, {
                        $set: {
                            "name": data.nickname,
                            'avator': data.headimgurl,
                            "city": data.province
                        },
                        $currentDate: { "lastModified": true }
                    });
                    if (data.subscribe) {
                        res.redirect('/' + req.query.url);
                    } else {
                        res.redirect('/order');
                    }
                }
                db.close();
            }
        });
    });
}

// var createUser = function (data, preLevel, req, res) {
//     var time = new Date().toLocaleDateString();
//     var arr = time.split('/');
//     var day = arr.length === 3 ? arr[2] + '-' + arr[0] + '-' + arr[1] : arr[0];
//     req.session.user.name = data.name;
//     if (preLevel && preLevel.length > 0) {
//         mongoClient.connect(mogoUrl, function (err, db) {
//             var cursor = db.collection('user').find({ "openId": preLevel }).toArray(function (err, doc) {
//                 if (err) {
//                     db.collection('user').insertOne({
//                         "userId": "uid" + data.openid,
//                         "openId": data.openid,
//                         "preLevel": preLevel || "",
//                         "name": data.nickname,
//                         'avator': data.headimgurl,
//                         "createTime": day,
//                         // "phone": "",
//                         // "idCard": "",
//                         // "photo": [

//                         // ],
//                         // "initialWeight": "77",
//                         // "waist": "23",
//                         // "hipline": "33",
//                         // "arm": "44",
//                         "city": data.province
//                     }, function () {
//                         db.close();
//                         if (data.subscribe) {
//                             res.redirect('/' + req.query.url);
//                         } else {
//                             res.redirect('/order');
//                         }
//                     })
//                 } else if (!doc || doc.length == 0) {
//                     db.collection('user').insertOne({
//                         "userId": "uid" + data.openid,
//                         "openId": data.openid,
//                         "preLevel": preLevel || "",
//                         "name": data.nickname,
//                         'avator': data.headimgurl,
//                         "createTime": day,
//                         // "phone": "",
//                         // "idCard": "",
//                         // "photo": [

//                         // ],
//                         // "initialWeight": "77",
//                         // "waist": "23",
//                         // "hipline": "33",
//                         // "arm": "44",
//                         "city": data.province
//                     }, function () {
//                         db.close();
//                         if (data.subscribe) {
//                             res.redirect('/' + req.query.url);
//                         } else {
//                             res.redirect('/order');
//                         }
//                     })
//                     // db.close();

//                 } else {
//                     console.log('data', data)
//                     db.collection('user').insertOne({
//                         "userId": "uid" + data.openid,
//                         "openId": data.openid,
//                         "preLevel": preLevel || "",
//                         "preName": doc[0].name,
//                         "name": data.nickname,
//                         'avator': data.headimgurl,
//                         "createTime": day,
//                         // "phone": "",
//                         // "idCard": "",
//                         // "photo": [

//                         // ],
//                         // "initialWeight": "77",
//                         // "waist": "23",
//                         // "hipline": "33",
//                         // "arm": "44",
//                         "city": data.province
//                     }, function () {
//                         db.close();
//                         if (data.subscribe) {
//                             res.redirect('/' + req.query.url);
//                         } else {
//                             res.redirect('/order');
//                         }
//                     })
//                     // db.close();
//                 }
//             });
//         });
//     } else {
//         mongoClient.connect(mogoUrl, function (err, db) {
//             console.log('data', data)
//             db.collection('user').insertOne({
//                 "userId": "uid" + data.openid,
//                 "openId": data.openid,
//                 "preLevel": preLevel || "",
//                 "name": data.nickname,
//                 'avator': data.headimgurl,
//                 "createTime": day,
//                 // "phone": "",
//                 // "idCard": "",
//                 // "photo": [

//                 // ],
//                 // "initialWeight": "77",
//                 // "waist": "23",
//                 // "hipline": "33",
//                 // "arm": "44",
//                 "city": data.province
//             }, function () {
//                 db.close();
//                 if (data.subscribe) {
//                     res.redirect('/' + req.query.url);
//                 } else {
//                     res.redirect('/order');
//                 }
//             })
//             // db.close();
//         });
//     }
// }

// var getUserInfo = function (req, res, isAll = false) {
//     if (isAll) {
//         mongoClient.connect(mogoUrl, function (err, db) {
//             var cursor = db.collection('user').find().toArray(function (err, doc) {
//                 if (err) {
//                     res.send({ status: 'failed' });
//                     db.close();
//                 } else if (!doc || doc.length == 0) {
//                     res.send('<div></div>');
//                     db.close();

//                 } else {
//                     var persons = [];
//                     var users = doc;
//                     doc.map((child, index) => {
//                         persons.push({
//                             person: child.openId
//                         })
//                     })
//                     db.collection('benfits').find({ $or: persons }).toArray(function (err, doc) {
//                         if (err) {
//                             var html = viewHandler.buildAllUserView(users);
//                             res.send(html);
//                             db.close();
//                         }
//                         else if (!doc || doc.length === 0) {
//                             var html = viewHandler.buildAllUserView(users);
//                             res.send(html);
//                             db.close();
//                         }
//                         else {
//                             var html = viewHandler.buildAllUserView(users, doc);
//                             res.send(html);
//                             db.close();
//                         }
//                     });
//                 }
//             });
//         });
//     } else {
//         mongoClient.connect(mogoUrl, function (err, db) {
//             var cursor = db.collection('user').find({ "openId": req.query.openId }).toArray(function (err, doc) {
//                 if (err) {
//                     res.send({ status: 'failed' });
//                     db.close();
//                 } else if (!doc || doc.length == 0) {
//                     res.send({ status: 'failed' });
//                     db.close();

//                 } else {
//                     res.send({ status: 'success', data: doc[0] });
//                     db.close();
//                 }
//             });
//         });
//     }
// }

// var updateUser = function (req, res, openId) {
//     mongoClient.connect(mogoUrl, function (err, db) {
//         db.collection('user').updateOne({ "openId": openId }, {
//             $set: {
//                 phone: req.body.phone,
//                 name: req.body.name,
//                 idCard: req.body.idCard,
//                 initialWeight: parseFloat(req.body.initialWeight),
//                 waist: parseFloat(req.body.waist),
//                 arm: parseFloat(req.body.arm)
//             },
//             $currentDate: { "lastModified": true }
//         });
//         db.collection('clock').find({ "openId": openId }).toArray(function (err, doc) {
//             if (err) {
//                 res.send({ status: 'failed' });
//                 db.close();
//             } else if (!doc || doc.length == 0) {
//                 // res.send({ status: 'failed' });
//                 db.collection('clock').insertOne({
//                     "openId": openId,
//                     "initialWeight": parseFloat(req.body.initialWeight)
//                 });
//                 res.send({ status: 'success' });
//                 db.close();

//             } else {
//                 res.send({ status: 'success' });
//                 db.close();
//             }
//         });
//         // db.collection('clock').updateOne({ "openId": openId }, {
//         //     $set: {
//         //         initialWeight: parseFloat(req.body.initialWeight)
//         //     },
//         //     $currentDate: { "lastModified": true }
//         // });
//         // res.send({ status: 'success' })
//         // db.close();
//     })
// }

// var getOrder = function (req, res, getAll = false) {
//     mongoClient.connect(mogoUrl, function (err, db) {
//         if (getAll) {
//             var cursor = db.collection('order').find().sort({ createTime: -1 }).toArray(function (err, doc) {
//                 if (err) {
//                     res.send({ status: 'failed' });
//                     db.close();
//                 } else if (!doc || doc.length == 0) {
//                     res.send('<div></div>');
//                     db.close();

//                 } else {
//                     var html = viewHandler.buildAllOrderView(doc);
//                     res.send(html);
//                     db.close();
//                 }
//             });
//         } else {
//             var cursor = db.collection('order').find({ "openId": req.query.openId }).sort({ createTime: -1 }).toArray(function (err, doc) {
//                 if (err) {
//                     res.send({ status: 'failed' });
//                     db.close();
//                 } else if (!doc || doc.length == 0) {
//                     res.send({ status: 'failed' });
//                     db.close();

//                 } else {
//                     res.send({ status: 'success', data: doc });
//                     db.close();
//                 }
//             });
//         }
//     });
// }

var getPreLevel = function (req, res) {
    mongoClient.connect(mogoUrl, function (err, db) {
        var cursor = db.collection('user').find({ "preLevel": req.query.openId }).toArray(function (err, doc) {
            if (err) {
                res.send({ status: 'failed' });
                db.close();
            } else if (!doc || doc.length == 0) {
                res.send({ status: 'success', data: { currentName: "", firstLevel: [], secondLevel: [], thirdLevel: [] } });
                db.close();

            } else {
                var firstLevel = doc;
                var seconds = [];
                var currentName = "";
                doc.map((child, index) => {
                    if (child.openId) {
                        seconds.push({ preLevel: child.openId });
                        currentName = child.preName;
                    }
                })
                db.collection('user').find({ $or: seconds }).toArray(function (err, doc) {
                    if (err) {
                        res.send({ status: 'failed' });
                        db.close();
                    } else if (!doc || doc.length == 0) {
                        res.send({ status: 'success', data: { currentName, firstLevel, secondLevel: [], thirdLevel: [] } });
                        db.close();

                    } else {
                        var secondLevel = doc;
                        var thirds = [];
                        doc.map((child, index) => {
                            if (child.openId) {
                                thirds.push({ preLevel: child.openId });
                            }
                        })
                        db.collection('user').find({ $or: thirds }).toArray(function (err, doc) {
                            if (err) {
                                res.send({ status: 'failed' });
                                db.close();
                            } else if (!doc || doc.length == 0) {
                                res.send({ status: 'success', data: { currentName, firstLevel, secondLevel, thirdLevel: [] } });
                                db.close();

                            } else {
                                res.send({ status: 'success', data: { currentName, firstLevel, secondLevel, thirdLevel: doc } });
                                db.close();
                            }
                        });
                        // res.send({ status: 'success', data: doc });
                        // db.close();
                    }
                });
                // res.send({ status: 'success', data: doc });
            }
        });
    });
}

var getBenfits = function (req, res, peronName = null) {
    if (peronName && peronName.length > 0) {
        mongoClient.connect(mogoUrl, function (err, db) {
            var cursor = db.collection('benfits').find({ "peronName": peronName }).sort({ time: -1 }).toArray(function (err, doc) {
                if (err) {
                    res.send({ status: 'failed' });
                    db.close();
                } else if (!doc || doc.length == 0) {
                    res.send(viewHandler.buildAllUserBenfitsView([{ peronName: peronName }]));
                    db.close();

                } else {
                    var data = doc;
                    res.send(viewHandler.buildAllUserBenfitsView(data));
                }
            });
        });
    }
    else {
        mongoClient.connect(mogoUrl, function (err, db) {
            var cursor = db.collection('benfits').find({ "person": req.query.openId }).toArray(function (err, doc) {
                if (err) {
                    res.send({ status: 'failed' });
                    db.close();
                } else if (!doc || doc.length == 0) {
                    res.send({ status: 'failed' });
                    db.close();

                } else {
                    var data = doc;
                    db.collection('user').find({ "openId": req.query.openId }).toArray(function (err, doc) {
                        if (err) {
                            res.send({ status: 'failed' });
                            db.close();
                        } else if (!doc || doc.length == 0) {
                            res.send({ status: 'failed' });
                            db.close();

                        } else {
                            var benfits = doc[0].myBenfits ? doc[0].myBenfits : 0;
                            db.collection('withDraw').find({ openId: req.query.openId }).toArray(function (err, doc) {
                                if (err) {
                                    // res.send({ status: 'failed' })
                                    res.send({ status: 'success', data: data, benfits: benfits });
                                    db.close();
                                } else if (!doc || doc.length === 0) {
                                    res.send({ status: 'failed' })
                                    res.send({ status: 'success', data: data, benfits: benfits });
                                    db.close();
                                } else {
                                    // res.send({ status: 'success', data: doc })
                                    res.send({ status: 'success', data: data, benfits: benfits, myWithDraw: doc });
                                    db.close();
                                }
                            })

                            // res.send({ status: 'success', data: data, benfits: doc[0].myBenfits ? doc[0].myBenfits : 0 });
                            // db.close();
                        }
                    });
                }
            });
        });
    }
}


var getUserClock = function (req, res, openId, persons, count) {
    mongoClient.connect(mogoUrl, function (err, db) {
        var cursor = db.collection('clock').find({ "openId": openId }).toArray(function (err, doc) {
            if (err) {
                res.send({ status: 'failed' });
                db.close();
            } else if (!doc || doc.length == 0) {
                res.send({ status: 'success', persons, count, data: {} });
                db.close();

            } else {
                res.send({ status: 'success', data: doc[0], persons, count });
                db.close();
            }
        });
    });
}

var getClockIndex = function (req, res, ranking = flase) {
    var time = new Date().toLocaleDateString();
    var arr = time.split('/');
    var day = arr.length === 3 ? arr[2] + '-' + arr[0] + '-' + arr[1] : arr[0];
    mongoClient.connect(mogoUrl, function (err, db) {
        var cursor = db.collection('clock').find({ "clockCount": { $gt: 0 }, "clockTime": day }).sort({ reduceWeight: -1 }).toArray(function (err, doc) {
            if (err) {
                res.send({ status: 'failed' });
                db.close();
            } else if (!doc || doc.length == 0) {
                // res.send({ status: 'success', count: 0, persons: [] });
                getUserClock(req, res, req.query.openId, [], 0);
                db.close();
            } else {
                var persons = [];
                doc.map((child, index) => {
                    if (child.avator) {
                        persons.push(child.avator);
                    }
                });
                getUserClock(req, res, req.query.openId, ranking ? doc : persons.splice(0, 19), doc.length);
                // res.send({ status: 'success', count: doc.length, persons });
                db.close();
            }
        });
    });
}

var updateClock = function (req, res, openId) {
    if (req.body.id === '01') {
        mongoClient.connect(mogoUrl, function (err, db) {
            var cursor = db.collection('user').find({ "openId": openId }).toArray(function (err, doc) {
                if (err) {
                    res.send({ status: 'failed' });
                    db.close();
                } else if (!doc || doc.length == 0) {
                    res.send({ status: 'failed' });
                    db.close();

                } else {
                    var user = doc[0];
                    var rrweight = parseFloat(req.body.weight) > 0 ? parseFloat(req.body.weight) : 0;
                    if (!user.initialWeight || !user.initialWeight > 0) {
                        user.initialWeight = rrweight;
                    }
                    db.collection('clock').find({ "openId": openId }).toArray(function (err, doc) {
                        if (err) {
                            res.send({ status: 'failed' });
                            db.close();
                        } else if (!doc || doc.length == 0) {
                            db.collection('clock').insertOne({
                                "openId": openId,
                                "name": user.name,
                                "clockId": "cid_" + openId,
                                "initialWeight": user.initialWeight,
                                "clockCount": 1,
                                "avator": user.avator,
                                "clockTime": req.body.day.replace(/\//g, '-'),
                                "preWeight": user.initialWeight,
                                "currentWeight": rrweight > 0 ? rrweight : user.initialWeight,
                                "reduceWeight": rrweight > 0 ? user.initialWeight - rrweight : 0,
                                "clock": [{
                                    "id": req.body.id,
                                    "day": req.body.day.replace(/\//g, '-'),
                                    "weight": rrweight > 0 ? rrweight : user.initialWeight,
                                    "reduceWeight": rrweight > 0 ? user.initialWeight - rrweight : 0,
                                    "breadfast": req.body.breadfast,
                                    "launch": req.body.launch,
                                    "dinner": req.body.dinner,
                                    "drink": req.body.drink,
                                    "sleep": req.body.sleep,
                                    "health": req.body.health && req.body.health.trim() === '是' ? true : false
                                }]
                            })
                            res.send({ status: 'success' });
                            db.close();

                        } else {
                            db.collection('clock').updateOne({ "openId": openId }, {
                                $set: {
                                    "openId": openId,
                                    "name": user.name,
                                    "clockId": "cid_" + openId,
                                    "initialWeight": user.initialWeight,
                                    "clockCount": 1,
                                    "avator": user.avator,
                                    "clockTime": req.body.day.replace(/\//g, '-'),
                                    "preWeight": user.initialWeight,
                                    "currentWeight": rrweight > 0 ? rrweight : user.initialWeight,
                                    "reduceWeight": rrweight > 0 ? user.initialWeight - rrweight : 0,
                                    "clock": [{
                                        "id": req.body.id,
                                        "day": req.body.day.replace(/\//g, '-'),
                                        "weight": rrweight > 0 ? rrweight : user.initialWeight,
                                        "reduceWeight": rrweight > 0 ? user.initialWeight - rrweight : 0,
                                        "breadfast": req.body.breadfast,
                                        "launch": req.body.launch,
                                        "dinner": req.body.dinner,
                                        "drink": req.body.drink,
                                        "sleep": req.body.sleep,
                                        "health": req.body.health && req.body.health.trim() === '是' ? true : false
                                    }]
                                }
                            });

                            res.send({ status: 'success' });
                            db.close();
                        }
                    });
                    // res.send({ status: 'success' });
                    // db.close();
                }
            });
        });
    } else {
        mongoClient.connect(mogoUrl, function (err, db) {
            var cursor = db.collection('clock').find({ "openId": openId }).toArray(function (err, doc) {
                if (err) {
                    res.send({ status: 'failed' });
                    db.close();
                } else if (!doc || doc.length == 0) {
                    res.send({ status: 'failed' });
                    db.close();

                } else {
                    var user = Object.assign({}, doc[0]);
                    user.clockTime = req.body.day.replace(/\//g, '-');
                    user.preWeight = user.currentWeight;
                    user.currentWeight = parseFloat(req.body.weight) > 0 ? parseFloat(req.body.weight) : user.currentWeight,
                        user.reduceWeight = user.preWeight - user.currentWeight;
                    user.clock.push({
                        "id": req.body.id,
                        "day": req.body.day.replace(/\//g, '-'),
                        "weight": parseFloat(req.body.weight) > 0 ? parseFloat(req.body.weight) : user.currentWeight,
                        "reduceWeight": user.preWeight - user.currentWeight,
                        "breadfast": req.body.breadfast,
                        "launch": req.body.launch,
                        "dinner": req.body.dinner,
                        "drink": req.body.drink,
                        "sleep": req.body.sleep,
                        "health": req.body.health && req.body.health.trim() === '是' ? true : false
                    })
                    user.clockCount = user.clock.length;
                    db.collection('clock').updateOne({ "openId": openId }, {
                        $set: user
                    });
                    // db.collection('clock').insertOne({
                    //     "openId": openId,
                    //     "name": user.name,
                    //     "clockId": "cid_" + openId,
                    //     "initialWeight": user.initialWeight,
                    //     "clockCount": 1,
                    //     "avator": user.avator,
                    //     "clockTime": req.body.day,
                    //     "preWeight": user.initialWeight,
                    //     "currentWeight": parseFloat(req.body.weight) > 0 ? parseFloat(req.body.weight) : user.initialWeight,
                    //     "reduceWeight": parseFloat(req.body.weight) > 0 ? user.initialWeight - parseFloat(req.body.weight) : 0,
                    //     "clock": [{
                    //         "id": req.body.id,
                    //         "day": req.body.day,
                    //         "weight": parseFloat(req.body.weight) > 0 ? parseFloat(req.body.weight) : user.initialWeight,
                    //         "reduceWeight": parseFloat(req.body.weight) > 0 ? user.initialWeight - parseFloat(req.body.weight) : 0,
                    //         "breadfast": req.body.breadfast,
                    //         "launch": req.body.launch,
                    //         "dinner": req.body.dinner,
                    //         "drink": req.body.drink,
                    //         "sleep": req.body.sleep,
                    //         "health": req.body.health && req.body.health.trim() === '是' ? true : false
                    //     }]
                    // })

                    res.send({ status: 'success' });
                    db.close();
                }
            });
        });
    }
    // mongoClient.connect(mogoUrl, function(err, db) {
    //     db.collection('clock').updateOne({ "openId": openId }, {
    //         $set: {
    //             initialWeight: parseFloat(req.body.initialWeight)
    //         },
    //         $currentDate: { "lastModified": true }
    //     });
    //     res.send({ status: 'success' })
    //     db.close();
    // })
}

//1为待发货，2为已发货;1未提现2提现 
// var createOrder = function (req, res, openId) {
//     var time = new Date().toLocaleDateString();
//     var arr = time.split('/');
//     var day = arr.length === 3 ? arr[2] + '-' + arr[0] + '-' + arr[1] : arr[0];
//     // var name = inputs[0].value;
//     // var phone = inputs[1].value;
//     // var address = inputs[2].value;
//     // var weight = inputs[3].value;
//     // var waist = inputs[4].value;
//     // var hipline = inputs[5].value;
//     // var arm = inputs[6].value;
//     mongoClient.connect(mogoUrl, function (err, db) {
//         db.collection('order').insertOne({
//             "openId": openId,
//             "name": req.body.name,
//             "phone": req.body.phone,
//             "address": req.body.address,
//             "orderId": "oid_" + openId + "_" + new Date().getTime(),
//             "createTime": new Date().toLocaleString(),
//             "cost": 4200,
//             "status": 1
//         });
//         db.collection('user').find({ openId: openId }).toArray(function (err, doc) {
//             if (err) {
//                 res.send({ status: 'success' });
//                 db.close();
//             } else if (!doc || doc.length === 0) {
//                 res.send({ status: 'success' })
//                 db.close();
//             } else {
//                 var customer = doc[0];
//                 if (customer.preLevel) {
//                     db.collection('user').find({ openId: customer.preLevel }).toArray(function (err, doc) {
//                         if (err) {
//                             res.send({ status: 'success' })
//                             db.close();
//                         } else if (!doc || doc.length === 0) {
//                             res.send({ status: 'success' })
//                             db.close();
//                         } else {
//                             var firstLevel = doc[0];
//                             db.collection('benfits').insertOne({
//                                 "customer": customer.openId,
//                                 "customerName": customer.name,
//                                 "customerLevel": "1",
//                                 "avator": customer.avator,
//                                 "person": firstLevel.openId,
//                                 "peronName": firstLevel.name,
//                                 "benfits": 4200 * 0.24,
//                                 "time": day,
//                                 "status": 1
//                             });
//                             db.collection('user').updateOne({ "openId": firstLevel.openId }, {
//                                 $set: {
//                                     myBenfits: firstLevel.myBenfits ? firstLevel.myBenfits + 4200 * 0.24 : 4200 * 0.24
//                                 }
//                             });
//                             if (firstLevel.preLevel) {
//                                 db.collection('user').find({ openId: firstLevel.preLevel }).toArray(function (err, doc) {
//                                     if (err) {
//                                         res.send({ status: 'success' })
//                                         db.close();
//                                     } else if (!doc || doc.length === 0) {
//                                         res.send({ status: 'success' })
//                                         db.close();
//                                     } else {
//                                         var secondLevel = doc[0];
//                                         db.collection('benfits').insertOne({
//                                             "customer": customer.openId,
//                                             "customerName": customer.name,
//                                             "customerLevel": "2",
//                                             "avator": customer.avator,
//                                             "person": secondLevel.openId,
//                                             "peronName": secondLevel.name,
//                                             "benfits": 4200 * 0.12,
//                                             "time": day,
//                                             "status": 1
//                                         });
//                                         db.collection('user').updateOne({ "openId": secondLevel.openId }, {
//                                             $set: {
//                                                 myBenfits: secondLevel.myBenfits ? secondLevel.myBenfits + 4200 * 0.12 : 4200 * 0.12
//                                             }
//                                         });
//                                         if (secondLevel.preLevel) {
//                                             db.collection('user').find({ openId: secondLevel.preLevel }).toArray(function (err, doc) {
//                                                 if (err) {
//                                                     res.send({ status: 'success' })
//                                                     db.close();
//                                                 } else if (!doc || doc.length === 0) {
//                                                     res.send({ status: 'success' })
//                                                     db.close();
//                                                 } else {
//                                                     var thirdLevel = doc[0];
//                                                     db.collection('benfits').insertOne({
//                                                         "customer": customer.openId,
//                                                         "customerName": customer.name,
//                                                         "customerLevel": "3",
//                                                         "avator": customer.avator,
//                                                         "person": thirdLevel.openId,
//                                                         "peronName": thirdLevel.name,
//                                                         "benfits": 4200 * 0.08,
//                                                         "time": day,
//                                                         "status": 1
//                                                     });
//                                                     db.collection('user').updateOne({ "openId": thirdLevel.openId }, {
//                                                         $set: {
//                                                             myBenfits: thirdLevel.myBenfits ? thirdLevel.myBenfits + 4200 * 0.08 : 4200 * 0.08
//                                                         }
//                                                     });
//                                                     res.send({ status: 'success' })
//                                                     db.close();
//                                                 }
//                                             })
//                                         }
//                                     }
//                                 })
//                             }
//                         }
//                     })
//                 } else {
//                     res.send({ status: 'success' })
//                 }
//             }
//         })

//         // db.collection('user').find({ openId: openId }).toArray(function(err, doc) {
//         //     if (err) {
//         //         res.send({ status: 'success' })
//         // db.close();
//         //     } else if (!doc || doc.length === 0) {
//         //         res.send({ status: 'success' })
//         // db.close();
//         //     } else {
//         //         var customer = doc[0];
//         //     }
//         // })
//     })

//     // {
//     //     "customer": "123456786",
//     //     "customerName": "ggg",
//     //     "customerLevel": "3",
//     //     "avator": "/images/portrait.png",
//     //     "person": "123456789",
//     //     "peronName": "aaa",
//     //     "benfits": 400,
//     //     "time": "2018-01-13",
//     //     "status": 1
//     // } {
//     //     "customer": "123456786",
//     //     "customerName": "ggg",
//     //     "customerLevel": "2",
//     //     "avator": "/images/portrait.png",
//     //     "person": "123456788",
//     //     "peronName": "eee",
//     //     "benfits": 600,
//     //     "time": "2018-01-13",
//     //     "status": 1
//     // } {
//     //     "customer": "123456786",
//     //     "customerName": "ggg",
//     //     "customerLevel": "1",
//     //     "avator": "/images/portrait.png",
//     //     "person": "123456787",
//     //     "peronName": "fff",
//     //     "benfits": 1200,
//     //     "time": "2018-01-13",
//     //     "status": 1
//     // }
// }

//1进行中，2成功，3失败
var withDraw = function (req, res, openId) {
    var time = new Date().toLocaleDateString();
    var arr = time.split('/');
    var day = arr.length === 3 ? arr[2] + '-' + arr[0] + '-' + arr[1] : arr[0];
    mongoClient.connect(mogoUrl, function (err, db) {
        db.collection('user').find({ openId: openId }).toArray(function (err, doc) {
            if (err) {
                res.send({ status: 'failed' })
                db.close();
            } else if (!doc || doc.length === 0) {
                res.send({ status: 'failed' })
                db.close();
            } else {
                var user = doc[0];
                if (!user.myBenfits || parseFloat(req.body.price) > user.myBenfits) {
                    res.send({ status: 'failed', msg: '账户余额不足' });
                    db.close();
                } else {
                    db.collection('withDraw').insertOne({
                        "openId": openId,
                        "withDrawId": "wid_" + openId + "_" + new Date().getTime(),
                        "name": req.body.name,
                        "card": req.body.card,
                        "bank": req.body.bank,
                        "price": parseFloat(req.body.price),
                        "time": day,
                        "status": 1
                    });
                    db.collection('user').updateOne({ "openId": openId }, {
                        $set: {
                            myBenfits: user.myBenfits - parseFloat(req.body.price)
                        }
                    });
                    res.send({ status: 'success' })
                    db.close();
                }
            }
        })
    })
}

var checkAdmin = function (req, res) {
    mongoClient.connect(mogoUrl, function (err, db) {
        db.collection('admin').find({ phoneNumber: req.body.phoneNumber }).toArray(function (err, doc) {
            if (err) {
                res.send({ status: 'failed' })
                db.close();
            } else if (!doc || doc.length === 0) {
                res.send({ status: 'failed' })
                db.close();
            } else {
                if (doc[0].password === req.body.password) {
                    req.session.admin = {};
                    req.session.admin.phoneNumber = req.body.phoneNumber
                    res.send({ status: 'success' })
                } else {
                    res.send({ status: 'failed' })
                }
                db.close();
            }
        })
    })
}

var getWithDraw = function (req, res, isAll = false) {
    mongoClient.connect(mogoUrl, function (err, db) {
        db.collection('withDraw').find(isAll ? {} : { openId: req.query.openId }).sort({ time: -1 }).toArray(function (err, doc) {
            if (err) {
                res.send({ status: 'failed' })
                db.close();
            } else if (!doc || doc.length === 0) {
                if (isAll) {
                    res.send('<div></div>');
                }
                else {
                    res.send({ status: 'failed' })
                }
                db.close();
            } else {
                if (isAll) {
                    var html = viewHandler.buildAllWithDrawView(doc);
                    res.send(html)
                }
                else {
                    res.send({ status: 'success', data: doc })
                }
                db.close();
            }
        })
    })
}

var updateWithDraw = function (req, res) {
    mongoClient.connect(mogoUrl, function (err, db) {
        db.collection('withDraw').updateOne({ "withDrawId": req.query.withDrawId }, {
            $set: {
                "status": parseInt(req.query.status),
            },
            $currentDate: { "lastModified": true }
        });
        res.send({ status: 'success' })
    })
}

// var updateOrder = function (req, res) {
//     mongoClient.connect(mogoUrl, function (err, db) {
//         db.collection('order').updateOne({ "orderId": req.query.orderId }, {
//             $set: {
//                 "status": parseInt(req.query.status),
//                 "logisticsId": req.query.logisticsId || ""
//             },
//             $currentDate: { "lastModified": true }
//         });
//         res.send({ status: 'success' })
//     })
// }

var getUserCount = function (req, res) {
    mongoClient.connect(mogoUrl, function (err, db) {
        db.collection('user').find().count(function (err, count) {
            if (err) {
                res.send({ status: 'failed' })
                db.close();
            } else if (!count) {
                var html = `<div class="box-body">
                <table class="table table-bordered table-hover">
                    <thead>
                    <tr>
                        <th class="col-md-2">用户总数</th>
                        <td>0</td>
                    </tr>
                    </thead>
                </table>
            </div>`
                res.send(html)
                db.close();
            } else {
                var html = `<div class="box-body">
                <table class="table table-bordered table-hover">
                    <thead>
                    <tr>
                        <th class="col-md-2">用户总数</th>
                        <td>${count}</td>
                    </tr>
                    </thead>
                </table>
            </div>`
                res.send(html)
                db.close();
            }
        })
    })
}

// module.exports.getUserClock = getUserClock;
module.exports.createUser = createUser;
module.exports.getUserInfo = getUserInfo;
// module.exports.checkUserExists = checkUserExists;
module.exports.updateUser = updateUser;
// module.exports.getOrder = getOrder;
// module.exports.getPreLevel = getPreLevel;
// module.exports.getBenfits = getBenfits;
// module.exports.getClockIndex = getClockIndex;
// module.exports.updateClock = updateClock;
// module.exports.createOrder = createOrder;
// module.exports.withDraw = withDraw;
// module.exports.getWithDraw = getWithDraw;
// module.exports.updateWithDraw = updateWithDraw;
// module.exports.updateOrder = updateOrder;
// module.exports.getUserCount = getUserCount;
// module.exports.subscribeF = subscribeF;

module.exports.getProduct = getProduct;
module.exports.getList = getList;
module.exports.getPromotions = getPromotions;
module.exports.getListPage = getListPage;
module.exports.addToCart = addToCart;
module.exports.getShoppingCart = getShoppingCart;
module.exports.createOrder = createOrder;
module.exports.getOrderPage = getOrderPage;
module.exports.login = login;
module.exports.getUserOrder = getUserOrder;
module.exports.addAddress = addAddress;
module.exports.addBill = addBill;
module.exports.confirmOrder = confirmOrder;
module.exports.createItem = createItem;
module.exports.createCategory = createCategory;
module.exports.getAllCategory = getAllCategory;
module.exports.createParts = createParts;
module.exports.getAllParts = getAllParts;
module.exports.getAllProduct = getAllProduct;
module.exports.getAllOrders = getAllOrders;
module.exports.getAllUser = getAllUser;
module.exports.updateRole = updateRole;
module.exports.getRole = getRole;
module.exports.getParts = getParts;
module.exports.updateUserMg = updateUserMg;
module.exports.updateParts = updateParts;
module.exports.getCategory = getCategory;
module.exports.updateCategory = updateCategory;
module.exports.updateItem = updateItem;
module.exports.getOrder = getOrder;
module.exports.deleteOrde = deleteOrde;
module.exports.updateOrder = updateOrder;
module.exports.createCustomQuestion = createCustomQuestion;
module.exports.getUserCustomQuestions = getUserCustomQuestions;
module.exports.updateQuestion = updateQuestion;
module.exports.updateCustomQuestion = updateCustomQuestion;
module.exports.updateCaseStore = updateCaseStore;
module.exports.createCaseStore = createCaseStore;
module.exports.getCaseCategory = getCaseCategory;
module.exports.getAllCaseCategory = getAllCaseCategory;
module.exports.getCase = getCase;
module.exports.createCase = createCase;
module.exports.updateCase = updateCase;
module.exports.createVideo = createVideo;
module.exports.getVideo = getVideo;
module.exports.updateVideos = updateVideos;
module.exports.deleteManage = deleteManage;
module.exports.searchPartsApi = searchPartsApi;
module.exports.updateQty = updateQty;
module.exports.deleteCart = deleteCart;
module.exports.getHomePage = getHomePage;
module.exports.updateHomePage = updateHomePage;
module.exports.createIntegrator = createIntegrator;
module.exports.updateIntegrator = updateIntegrator;
module.exports.getIntegrator = getIntegrator;
module.exports.updateWebsite = updateWebsite;
module.exports.getWebsite = getWebsite;
module.exports.getSoftwares = getSoftwares;
module.exports.updateSoftwares = updateSoftwares;
module.exports.search = search;
module.exports.createService = createService;
module.exports.getUserServiceQuestion = getUserServiceQuestion;
module.exports.updateService = updateService;
module.exports.createTraining = createTraining;
module.exports.updateTraining = updateTraining;
module.exports.getTraining = getTraining;
module.exports.submitTraining = submitTraining;
module.exports.getUserTraining = getUserTraining;
module.exports.updateUserTraining = updateUserTraining;
// module.exports.checkAdmin = checkAdmin;