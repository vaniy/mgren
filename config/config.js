module.exports = {
    wx_config: {
        aotu: {
            EncodingAESKey:'OYWlhtupSkI9zwS2QZFwK5cRMghZRxQnS7jCK2S4nLs',
            token: 'taduoke',
            appid: 'wx4c10b88f9a6c8bc8',
            secret: '24c86fbe8899ca57b59213147df4c120',
            cached: {},
            menu: {
                "button": [{
                    "type": "view",
                    "name": "减肥产品",
                    "url": "http://www.taduoke.com/order"
                }, {
                    "name": "会员平台",
                    "sub_button": [{
                        "type": "view",
                        "name": "打卡记录",
                        "url": "http://www.taduoke.com/clockIndex"
                    }, {
                        "type": "view",
                        "name": "个人中心",
                        "url": "http://www.taduoke.com/account"
                    }]
                }]
            }
        },
        tq: {
            "ipURL": "http://whois.pconline.com.cn/ipJson.jsp?json=true",
            "ipToCityNameURL": "http://apis.baidu.com/apistore/iplookupservice/iplookup?ip=",
            "ipToCityNameApiKey": "7328474baf90532437b4becdc5f65706",
            'cityUrl': 'http://apistore.baidu.com/microservice/cityinfo?cityname=',
            'weatherApikey': '7328474baf90532437b4becdc5f65706',
            'weatherUrl': 'http://apis.baidu.com/apistore/weatherservice/recentweathers?cityid='
        }
    }
};