/**
*   author: Lumia Bolt Wang 春岩
*   version: v1.0.0
*   time: 2015/07/22
*   readme: 
*       * 本项目依赖 jQuery.ajax
*       * 默认认为当前页面载入了 jQuery.js
*/
(function (root, factory) {
    if (typeof exports === 'object') {
        module.exports = factory();  
    } else if (typeof define === 'function' && define.amd) {
        define(factory);
    } else {
        root.AuthZ = factory();
    }
})(this, function() {
    // module
    return {
        // 初始化
        config: function (hostUrl, isFullUrl, dataType) {
            hostUrl = hostUrl? hostUrl: '';
            this._hostUrl = isFullUrl? hostUrl: hostUrl + this._hostUrl;
            this._dataType = dataType? dataType: 'json';
            this._status = -1;
            this.init();
            return this;
        },
        _hostUrl: '/sso/httpApi/getAuthZ.json',
        _isFullUrl: false,
        _dataType: 'json',
        init: function (callback) {
            var that = this;
            if (!callback) {
                callback = function () {
                }
            }
            if (this._status == -1) {
                this._status = 0;
                $.ajax({
                    url:  that._hostUrl + '',
                    type: 'get',
                    dataType: that._dataType
                })
                .done(function(data) {
                    if (data.success) {
                        that._status = 1;
                        that._init(data.data);
                        callback(null, that);
                        that._call_waiters(null, that);
                    } else {
                        callback(data.msg, null, data);
                        that._call_waiters(data.msg, null, data);
                    }
                })
                .fail(function() {
                    var err = "请求 AuthZ 失败，请检查 url 配置";
                    callback(err);
                    that._call_waiters(err);
                })
                .always(function() {
                    // console.log("complete");
                });
            } else if (this._status == 0) {
                this._waiting_callback.push(callback);
            } else if (this._status == 1) {
                callback(null, that);
            }
        },
        _waiting_callback: [],
        _call_waiters: function (err, obj, data) {
            for (var i = 0; i < this._waiting_callback.length; i++) {
                this._waiting_callback[i](err, obj, data);
            };
            this._waiting_callback = [];
        },
        _database: '',
        _init: function (data) {
            this.displayName = data.displayName;
            this.iid = data.iid;
            this.userId = data.userId;
            this.userName = data.userName;
            this.userPhone = data.userPhone;
            this.headImg = data.headImg;
            this.shopCode = data.shopCode;
            // this.siteId = data.siteId;
            // this.siteDomain = data.siteDomain;
            this.menus = data.menus;
            this.roles = JSON.parse(data.roles || null);
            this.roleCodes = this._getCodes(this.roles);
            this.roleNames = this._getNames(this.roles);
            this.resources = JSON.parse(data.resources || null);
            this.resCodes = this._getCodes(this.resources);
            this.resNames = this._getNames(this.resources);
            this.shopCodes = data.shopCodes;
        },
        _getCodes: function (r) {
            var arr = [];
            for (var i = r.length - 1; i >= 0; i--) {
                arr.push(r[i].code);
            };
            return arr;
        },
        _getNames: function (r) {
            var arr = [];
            for (var i = r.length - 1; i >= 0; i--) {
                arr.push(r[i].name);
            };
            return arr;
        },
        _status: 0,
        displayName: '',
        iid: '',
        userId: '',
        userName: '',
        userPhone: '',
        headImg: '',
        shopCode: '',
        siteId: '',
        siteDomain: '',
        menus: '',
        roles: '',
        roleCodes: '',
        roleNames: '',
        shopCodes: '',
        resources: '',
        resCodes: '',
        resNames: '',
        // 即将被弃用
        hasAccess: function (role) {
            return this.roleCodes.indexOf(role) == -1? false: true;
        },
        // 即将被弃用
        anyAccess: function () {
            var boo = false;
            for (var i = arguments.length - 1; i >= 0; i--) {
                boo = boo || this.hasAccess(arguments[i]);
            };
            return boo;
        },
        // 即将被弃用
        allAccess: function () {
            var boo = true;
            for (var i = arguments.length - 1; i >= 0; i--) {
                boo = boo && this.hasAccess(arguments[i]);
            };
            return boo;
        },
        hasRoleAccess: function (role) {
            return this.roleCodes.indexOf(role) == -1? false: true;
        },
        anyRoleAccess: function () {
            var boo = false;
            for (var i = arguments.length - 1; i >= 0; i--) {
                boo = boo || this.hasRoleAccess(arguments[i]);
            };
            return boo;
        },
        allRoleAccess: function () {
            var boo = true;
            for (var i = arguments.length - 1; i >= 0; i--) {
                boo = boo && this.hasRoleAccess(arguments[i]);
            };
            return boo;
        },
        hasResAccess: function (res) {
            return this.resCodes.indexOf(res) == -1? false: true;
        },
        anyResAccess: function () {
            var boo = false;
            for (var i = arguments.length - 1; i >= 0; i--) {
                boo = boo || this.hasResAccess(arguments[i]);
            };
            return boo;
        },
        allResAccess: function () {
            var boo = true;
            for (var i = arguments.length - 1; i >= 0; i--) {
                boo = boo && this.hasResAccess(arguments[i]);
            };
            return boo;
        },
        getRootDomain: function () {
            if (this.menus) {
                var menus = JSON.parse(this.menus || null);
                if (!menus || !menus[0] || !menus[0].link) {
                    return false;
                } else {
                    var a = $('<a>').attr('href', menus[0].link);
                    return a[0].host;
                }
            }
        },
        getRootDomainAsync: function () {
            var d = $.Deferred();
            var top = window.top || window.parent || window;
            top.postMessage({
                me: window.name,
                action: 'AuthZ.getRootDomain'
            }, '*');
            var callback = function(e) {
                if (!e.data) {

                } else if (e.data.action == 'AuthZ.returnRootDomain') {
                    if (e.data.data && e.data.data.domain) {
                        d.resolve(e.data.data.domain);
                        window.removeEventListener("message", callback);
                    }
                }
            }
            window.addEventListener && window.addEventListener("message", callback);
            window.attachEvent && window.attachEvent('message',callback);
            return d;
        }
    };
});

(function () {
    // console.log('getRootDomain Listener OK');
    function listener(e) {
        if (!e.data) {

        } else if (e.data.action == 'AuthZ.getRootDomain') {
            if (e.data.me) {
                window.frames[e.data.me].postMessage({
                    action: 'AuthZ.returnRootDomain',
                    data: {
                        domain: window.location.hostname
                    }
                }, '*');
            } else {
                for (var i = window.frames.length - 1; i >= 0; i--) {
                    window.frames[i].postMessage({
                        action: 'AuthZ.returnRootDomain',
                        data: {
                            domain: window.location.hostname
                        }
                    }, '*');
                };
            }
        }
    }
    window.addEventListener && window.addEventListener("message", listener);
    window.attachEvent && window.attachEvent("message", listener);
})();

