'use strict';

/* Services */

// Simple value service.
angular.module('myApp.services', []).
  value('version', '0.1');

// phonegap ready service - listens to deviceready
myApp.factory('phonegapReady', function() {
    return function (fn) {
        var queue = [];
        var impl = function () {
        queue.push(Array.prototype.slice.call(arguments));
    };
              
    document.addEventListener('deviceready', function () {
        queue.forEach(function (args) {
            fn.apply(this, args);
        });
        impl = fn;
    }, false);
              
    return function () {
        return impl.apply(this, arguments);
        };
    };
});

myApp.factory('geolocation', function ($rootScope, phonegapReady) {
  return {
    getCurrentPosition: function (onSuccess, onError, options) {
        navigator.geolocation.getCurrentPosition(function () {
               var that = this,
               args = arguments;

               if (onSuccess) {
                   $rootScope.$apply(function () {
                        onSuccess.apply(that, args);
                   });
                   }
               }, function () {
                    var that = this,
                    args = arguments;

                   if (onError) {
                        $rootScope.$apply(function () {
                            onError.apply(that, args);
                        });
                   }
               },
            options);
        }
    };
});

myApp.factory('accelerometer', function ($rootScope, phonegapReady) {
    return {
        getCurrentAcceleration: phonegapReady(function (onSuccess, onError) {
            navigator.accelerometer.getCurrentAcceleration(function () {
                var that = this,
                    args = arguments;

                if (onSuccess) {
                    $rootScope.$apply(function () {
                        onSuccess.apply(that, args);
                    });
                }
            }, function () {
                var that = this,
                args = arguments;

                if (onError) {
                    $rootScope.$apply(function () {
                        onError.apply(that, args);
                    });
                }
            });
        })
    };
});

myApp.factory('notification', function ($rootScope, phonegapReady) {
    return {
        alert: phonegapReady(function (message, alertCallback, title, buttonName) {
            navigator.notification.alert(message, function () {
                var that = this,
                    args = arguments;

                $rootScope.$apply(function () {
                    alertCallback.apply(that, args);
                });
            }, title, buttonName);
        }),
        confirm: phonegapReady(function (message, confirmCallback, title, buttonLabels) {
            navigator.notification.confirm(message, function () {
                var that = this,
                    args = arguments;

                $rootScope.$apply(function () {
                    confirmCallback.apply(that, args);
                });
            }, title, buttonLabels);
        }),
        beep: function (times) {
            navigator.notification.beep(times);
        },
        vibrate: function (milliseconds) {
            navigator.notification.vibrate(milliseconds);
        }
    };
});

myApp.factory('navSvc', function($navigate) {
    return {
        slidePage: function (path,type) {
            $navigate.go(path,type);
        },
        back: function () {
            $navigate.back();
        }
    }
});

myApp.factory('compass', function ($rootScope, phonegapReady) {
    return {
        getCurrentHeading: phonegapReady(function (onSuccess, onError) {
            navigator.compass.getCurrentHeading(function () {
                var that = this,
                    args = arguments;

                if (onSuccess) {
                    $rootScope.$apply(function () {
                        onSuccess.apply(that, args);
                    });
                }
            }, function () {
                var that = this,
                    args = arguments;

                if (onError) {
                    $rootScope.$apply(function () {
                        onError.apply(that, args);
                    });
                }
            });
        })
    };
});

myApp.factory('contacts', function ($rootScope, phonegapReady) {
    return {
        findContacts: phonegapReady(function (onSuccess, onError) {
            var options = new ContactFindOptions();
            options.filter="";
            options.multiple=true;
            var fields = ["displayName", "name"];
            navigator.contacts.find(fields, function(r){console.log("Success" +r.length);var that = this,
                args = arguments;
                if (onSuccess) {
                    $rootScope.$apply(function () {
                        onSuccess.apply(that, args);
                    });
                }
            }, function () {
                var that = this,
                    args = arguments;

                if (onError) {
                    $rootScope.$apply(function () {
                        onError.apply(that, args);
                    });
                }
            }, options)
        })
    }
});

myApp.factory('db', function () {
    return {
      getInstance: function(){
          return $.indexedDB("cahierdevie");
      }
    };
});

myApp.factory('EnfantService', function ($q, db, $timeout, CahierService) {
    var current, enfants = [];
    var enfantChangeCb = [];
    
    return {
        list: function (idEnfant) {
            var defered = $q.defer();
            enfants = [];
            db.getInstance().objectStore("enfants").each(function (data) {
                if (!data.value.photo) {
                    data.value.photo = 'res/user.png';
                }
                enfants.push(data.value);
            }).done(function (data) {
                $timeout(function () {
                    defered.resolve(enfants);
                });
            }).fail(function () {
                defered.reject(null);
            });
            return defered.promise;
        },
        next: function () {
            var i= 0, l= enfants.length;
            for(;i<l;i++){
                if(enfants[i].id == current.id){
                    this.setCurrent(enfants[ i < l-1 ? i + 1 : 0]);
                    break;
                }
            }
            
        },
        prev: function () {
            var i= 0, l= enfants.length;
            for(;i<l;i++){
                if(enfants[i].id == current.id){
                    this.setCurrent(enfants[ i > 0 ? i - 1 : l - 1]);
                    break;
                }
            }
        },
        get: function (id) {
            var defered = $q.defer();
            db.getInstance().objectStore("enfants").get(id).done(function (data) {
                $timeout(function () {
                    defered.resolve(data);
                });
            }).fail(function () {
                defered.reject(null);
            });
            return defered.promise;
        },
        save: function (enfant) {
            var defered = $q.defer();
            return db.getInstance().objectStore("enfants").put(enfant).done(function () {
                $timeout(function () {
                    defered.resolve(true);
                });
            }).fail(function (e, l, f) {
                alert(e.stack + " \n file : " + f + " \n ligne :" + l);
            });
            return defered.promise;
        },
        remove: function(enfant) {
            var defered = $q.defer();
            CahierService.removeAll(enfant.id).then(function(){
                db.getInstance().objectStore("enfants").delete(enfant.id).done(function() {
                    $timeout(function() {
                        defered.resolve(true);
                    });
                }).fail(function(e, l, f) {
                    alert(e.stack + " \n file : " + f + " \n ligne :" + l);
                });
            });
            return defered.promise;
        },
        getCurrent: function () {
            return current;
        },
        setCurrent: function (_enfant) {
            current = _enfant;
            var i=0, l = enfantChangeCb.length;
            for(;i<l; i++){
                enfantChangeCb[i].call(this, current);
            }
        },
        onChange: function (callback) {
            enfantChangeCb.push(callback);
        },
        removeOnChange: function(callback){
            var i=0, l = enfantChangeCb.length;
            for(;i<l; i++){
                if(callback == enfantChangeCb[i]){
                    enfantChangeCb.splice(i, 1);
                }
            }
        }
    };
});

myApp.factory('CahierService', function ($q, db, $timeout, $http) {
    
    var cahierChangeCb = [];
    var ip = "192.168.1.18:1480";
    var url = "http://" + ip + '/send-cahier/';
    var urlPicture = "http://" + ip + '/send-picture-cahier/';
    var myFolderApp = "CahierDeVie";
    var d = new Date();
    var current = null;
    
    function genKey(id, date){
        return id + "_" + date.getFullYear() + (date.getMonth() < 9 || date.getMonth() > 11  ? '0' : '') +  (date.getMonth() + 1) + date.getDate();
    }
    
    return {
        "new": function (idEnfant, date) {
            return {
                id: genKey(idEnfant, date),
                idEnfant: idEnfant,
                date: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
                events: []
            }
        },
        list: function (idEnfant) {
            var defered = $q.defer();
            var cahiers = [];
            db.getInstance().objectStore("cahier").index("idEnfant").each(function (elem) {
                if (idEnfant == elem.value.idEnfant) {
                    cahiers.push(elem.value);
                }
            }, idEnfant).done(function () {
                $timeout(function () {
                    defered.resolve(cahiers);
                });
            }).fail(function () {
                defered.reject(arguments);
            });
            return defered.promise;
        },
        removeAll: function(idEnfant){
            var defered = $q.defer();
            db.getInstance().objectStore("cahier").index("idEnfant").each(function (elem) {
                // Suppression des images des évènements
                if(elem.value.events && elem.value.events.length){
                    var i=0, l = elem.value.events.length;
                    for(;i<l;i++){
                        deleteEvent(elem.value.events[i]);
                    }
                }
                elem.delete();
            }, idEnfant).done(function () {
                $timeout(function () {
                    defered.resolve(true);
                });
            }).fail(function () {
                defered.reject(arguments);
            });
            return defered.promise;
        },
        get: function (idEnfant, date) {
            var defered = $q.defer();
            var cahiers = [];
            var key = genKey(idEnfant, date);
            db.getInstance().objectStore("cahier").get(key).done(function (data) {
                $timeout(function () {
                    defered.resolve(data);
                });
            }).fail(function () {
                defered.reject(null);
            });
            return defered.promise;
        },
        save: function (cahier) {
            var defered = $q.defer();
            return db.getInstance().objectStore("cahier").put(cahier).done(function () {
                $timeout(function () {
                    defered.resolve(true);
                });
            }).fail(function (e, l, f) {
                alert(e.stack + " \n file : " + f + " \n ligne :" + l);
            });
            return defered.promise;
        },
        getCurrent: function () {
            return current;
        },
        setCurrent: function (_event) {
            current = _event;
            var i=0, l = cahierChangeCb.length;
            for(;i<l; i++){
                cahierChangeCb[i].call(this, current);
            }
        },
        onChange: function (callback) {
            cahierChangeCb.push(callback);
        },
        send: function (email) {
            if (!current) {
                alert("Pas de cahier");
                return;
            }
            defered = $q.defer();
            /*$http({
                method: 'POST',
                url: url + current.id,
                data: {
                    email: email,
                    cachier: current
                }
            }).
              success(function (data, status, headers, config) {
                  // this callback will be called asynchronously
                  // when the response is available
                  defered.resolve(true);
              }).
              error(function (data, status, headers, config) {
                  // called asynchronously if an error occurs
                  // or server returns response with an error status.
                  defered.reject(data);
              });*/
            window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
            window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fileSys) {
                fileSys.root.getDirectory(myFolderApp,
                            { create: true, exclusive: false },
                            function (directoryRoot) {
                                directoryRoot.getFile(current.id + ".json", { create: true }, function (fileEntry) {
                                    fileEntry.createWriter(function (writer) {
                                        writer.onwrite = function (evt) {
                                            //setTimeout(function () {
                                            sendCahier(fileEntry.fullPath);
                                            //}, 150);
                                        };
                                        cahier = angular.copy(current);
                                        pictures = [];
                                        cahier.email = email;
                                        cahier.nbPictures = 0;
                                        var i = 0, l = cahier.events.length;
                                        for(;i<l;i++){
                                            cahier.nbPictures += cahier.events[i].pictures.length;
                                            pictures = pictures.concat(cahier.events[i].pictures);
                                        }
                                        writer.write(JSON.stringify(cahier));
                                        //writer.abort();
                                    }, function (error) {
                                        alert("create writer " + error.code);
                                    });
                                }, function (error) {
                                    alert("createfile " + error.code);
                                });
                            }, function (error) {
                                alert("get folder " + error.code);
                            });
            }, function (error) {
                alert("sys " + error.code);
            });

            return defered.promise;
        }
    };
    var defered = $q.defer();
    var cahier;
    var pictures = [];
    function sendCahier(filePath) {
        alert(filePath);
        var options = new FileUploadOptions();
        options.chunkedMode = false;
        options.fileKey = "file";
        options.fileName = filePath.substr(filePath.lastIndexOf('/') + 1);
        options.mimeType = "text/json";

        var params = new Object();
        params.email = cahier.email;
        options.params = params;
        var ft = new FileTransfer();
        ft.upload(filePath, encodeURI(url + cahier.id), function (r) {
            /*console.log("Code = " + r.responseCode);
            console.log("Response = " + r.response);
            console.log("Sent = " + r.bytesSent);*/
            defered.notify(10);
            sendPicture();

        }, function (error) {
            try {
                if (error.code == FileTransferError.FILE_NOT_FOUND_ERR) {
                    alert("FILE_NOT_FOUND_ERR");
                }
                if (error.code == FileTransferError.INVALID_URL_ERR) {
                    alert("INVALID_URL_ERR");
                    alert(url + current.id);
                }
                if (error.code == FileTransferError.CONNECTION_ERR) {
                    alert("CONNECTION_ERR");
                }
            } catch (e) { }
            defered.reject(error);
        }, options);
    }

    function sendPicture() {
        if (pictures.length == 0) {
            defered.resolve(r);
            return;
        }
        
        //defered.notify(pictures.length * 100 / cahier.nbPictures);
        picture = pictures.shift();
        alert(picture);
        var options = new FileUploadOptions();
        options.chunkedMode = false;
        options.fileKey = "file";
        options.fileName = picture.substr(picture.lastIndexOf('/') + 1);
        options.mimeType = "image/jpeg";

        var ft = new FileTransfer();
        ft.upload(picture, encodeURI(urlPicture + cahier.id), function (r) {
            sendPicture();
        }, function (error) {
            try {
                if (error.code == FileTransferError.FILE_NOT_FOUND_ERR) {
                    alert("FILE_NOT_FOUND_ERR");
                }
                if (error.code == FileTransferError.INVALID_URL_ERR) {
                    alert("INVALID_URL_ERR");
                    alert(url + current.id);
                }
                if (error.code == FileTransferError.CONNECTION_ERR) {
                    alert("CONNECTION_ERR");
                }
            } catch (e) { }
            defered.reject(error);
        }, options);
    }
    
    function deleteEvent(event){
        // Suppression des images des évènements
        if(event.pictures && event.pictures.length){
             var i=0, l = event.pictures.length;
             for(;i<l;i++){
                  deletePic(event.pictures[i]);
             }
        }
    }
    
    function deletePic(file) {
        window.resolveLocalFileSystemURI(file, deleteOnSuccess, resOnError);
    }

    function deleteOnSuccess(entry) {
        //new file name
        entry.remove(function (entry) {
            console.log("Removal succeeded");
        }, resOnError);
    }
    
    function resOnError(error) {
        alert(error.code);
    }

    function win(r) {
        console.log("Code = " + r.responseCode);
        console.log("Response = " + r.response);
        console.log("Sent = " + r.bytesSent);
    }
});

myApp.factory('EventService', function ($q, db) {
    var d = new Date();
    var current = null;
    return {
        getCurrent: function () {
            return current;
        },
        setCurrent: function (_event) {
            current = _event;
        }
    };
});



