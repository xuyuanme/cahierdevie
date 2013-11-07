'use strict';

/* Directives */
angular.module('myApp.directives', [])
    .directive('appVersion', ['version', function (version) {
        return function (scope, elm, attrs) {
            elm.text(version);
        }
    }])
    .directive('timepicker', ['$compile', function ($compile) {
        return {
            restrict: 'A',
            scope: {
                model: '=ngModel'
            },
            replace: false,
            require: 'ngModel',
            link: function (scope, elm, attr, ngModel) {
                var first = true;
                elm.scroller({
                    preset: 'time',
                    theme: 'default',
                    mode: 'scroller',
                    lang: 'fr',
                    display: 'bottom',
                    animate: 'none'
                });


                elm.change(function (e) {
                    ngModel.$setViewValue(e.target.value);
                    if (first) {
                        first = false;
                        return;
                    }
                    scope.$apply(function () {
                        scope.model = e.target.value;
                    });
                });

                elm.scroller('setValue', scope.model, true);

                scope.$on('destroy', function () {
                    elm.scroller('destroy');
                });
            }
        };
    }])
    .directive('datepicker', ['$compile', function ($compile) {
        return {
            restrict: 'A',
            scope: {
                model: '=ngModel'
            },
            replace: false,
            require: 'ngModel',
            link: function (scope, elm, attr, ngModel) {
                var first = true;
                elm.scroller({
                    preset: 'date',
                    theme: 'default',
                    mode: 'scroller',
                    lang: 'fr',
                    display: 'bottom',
                    animate: 'none'
                });

                elm.change(function (e) {
                    ngModel.$setViewValue(elm.scroller('getDate'));
                    if (first) {
                        first = false;
                        return;
                    }
                    scope.$apply(function () {
                        scope.model = elm.scroller('getDate');
                    });
                });
                if (scope.model) {
                    elm.scroller('setValue', scope.model.toLocaleDateString('fr-FR'), true);
                }
                else {
                    first = false;
                }
                scope.$on('destroy', function () {
                    elm.scroller('destroy');
                });
            }
        };
    }])
.directive('datemodelpicker', ['$compile', '$timeout', function ($compile, $timeout) {
    return {
        restrict: 'E',
        scope: {
            model: '=ngModel'
        },
        replace: true,
        transclude: true,
        template: '<div ng-click="show();$event.stopPropagation();"><input type="text" style="width: 0;height: 0;margin-left: -9999px;position: absolute;" /><span ng-transclude></span></div>',
        require: 'ngModel',
        link: function (scope, elm, attr, ngModel) {
            var first = true;
            var scroller = elm.find('input');
            scroller.scroller({
                preset: 'date',
                theme: 'default',
                mode: 'scroller',
                lang: 'fr',
                display: 'bottom',
                animate: 'none'
            });
            scope.show = function (e) {
                scroller.scroller('show');
                //scroller.scroller('hide');
                setTimeout(function () {
                    scroller.scroller('show');

                }, 150);
            }

            scroller.change(function (e) {
                if (first) {
                    first = false;
                    return;
                }
                scope.$apply(function () {
                    scope.$root[attr.ngModel] = scroller.scroller('getDate');
                    $timeout(function () {
                        scroller.scroller('hide');
                    });
                });
            });

            scroller.scroller('setValue', scope.model, true);

            scope.$on('destroy', function () {
                scroller.scroller('destroy');
            });
        }
    };
}])
    .directive('scroll', [function () {
        return {
            restrict: 'A',
            replace: false,
            link: function (scope, elm, attr) {
                var timer = null;
                var valid = true;
                var DELTA = 10;
                var TIMEOUT = 800;

                setTimeout(function () {
                    var myScroll = new iScroll(document.getElementById(elm[0].id), {
                        scrollbars: true,
                        mouseWheel: true,
                        interactiveScrollbars: true,
                        onBeforeScrollStart: function (e) {
                            valid = true;
                            var target = e.target;
                            while (target.nodeType != 1) target = target.parentNode;
                            if (target.tagName.toLowerCase() != 'select' && target.tagName.toLowerCase() != 'input' && target.tagName.toLowerCase() != 'textarea') {
                                e.preventDefault();
                            }
                            else if (target.tagName.toLowerCase() == 'textarea') {
                                setTimeout((function (input) {
                                    return function () {
                                        if (valid) {
                                            input.focus();
                                        }
                                    }
                                })(target), 250);
                                e.preventDefault();
                            }
                        },
                        onBeforeScrollMove: function (e) {
                            valid = false;
                        }/*,
                        onScrollEnd: function (e) {
                            //if (!timer) return;
                            if (this.distY < DELTA && this.distY > -DELTA){// && (new Date().getTime() - timer) < TIMEOUT) {
                                valid = true;
                            }
                            //timer = null;
                        }*/
                    });
                    elm.data('scroll', myScroll);
                    myScroll.hasVerticalScroll = true;
                    function refresh() {
                        myScroll.refresh();
                    }
                    scope.$on('refresh-scroll', refresh);
                    scope.$on('destroy', function () {
                        myScroll.destroy();
                    });
                }, 500);
            }
        };
    }])
    .directive('focusscroll', [function () {
        return {
            restrict: 'A',
            scope: false,
            replace: false,
            require: 'ngModel',
            link: function (scope, elm, attr, ngModel) {
                elm.bind("focus", function (e) {
                    var btnDone = "<button class='topcoat-button-bar__button full valid'><i class='topcoat-icon checkmark-icon'></i></button>";
                    var btnCancel = "<button class='topcoat-button-bar__button full btn-cancel cancel'><i class='topcoat-icon error-icon'></i></button>";
                    var tmpl = "<div id='zonearea'><div class='modal'></div><div class='saisiearea'><div class='textarea'><textarea id='saisiearea' rows='6' cols='36' placeholder=\"" + attr.placeholder + "\"/></div><div class='action'>" + btnDone + btnCancel + "</div></div></div>";
                    var input = $(tmpl);
                    input.on('click', '.valid', function (e) {
                        ngModel.$setViewValue(document.getElementById('saisiearea').value);
                        scope.$apply(function () {
                            elm.val(document.getElementById('saisiearea').value);
                        });
                        document.body.removeChild(document.getElementById('zonearea'));
                    });
                    input.on('click', '.cancel', function (e) {
                        document.body.removeChild(document.getElementById('zonearea'));
                    });
                    document.body.appendChild(input[0]);
                    var value = scope.$eval(attr.ngModel);
                    if (value) {
                        document.getElementById('saisiearea').value = value;
                    }
                });
            }
        };
    }]);
