$(document).ready(function () {
    function ColorPicker(canvas) {
        var _self = this;
        _self.canvas = canvas;
        _self.ctx = _self.canvas.getContext('2d');
        _self.thickness = 0.8;
        _self.colorMapSteps = 255;
        _self.touchedElement == null;

        //initially red
        _self.currentHue = 0;
        _self.currentSaturation = 100;
        _self.currentLightness = 100;

        Object.defineProperty(_self, 'radius', {
            get: function () {
                return (_self.size / 2) * (_self.thickness);
            }
        });

        Object.defineProperty(_self, 'center', {
            get: function () {
                return {
                    x: _self.size / 2,
                    y: _self.size / 2
                };
            }
        })

        Object.defineProperty(_self, 'selectedAngle', {
            get: function () {
                return _self.currentHue * (Math.PI / 180);
            },
            set: function (value) {
                _self.currentHue = value * (180 / Math.PI);
            }
        });

        Object.defineProperty(_self, 'selectedDistanceFromCenter', {
            get: function () {
                return (_self.currentSaturation/ 100) * _self.radius;
            },
            set: function (value) {
                _self.currentSaturation = (value / _self.radius) * 100;
            }
        });

        _self.init = function () {
            _self.setupBindings();
            _self.resizeCanvas();
            _self.draw();
        };

        _self.renderHueCircle = function (ctx) {
            var toRad = (2 * Math.PI) / _self.colorMapSteps;
            var lineWidth = Math.ceil(((2 * Math.PI) * _self.radius) / _self.colorMapSteps);

            for (var i = 0; i < _self.colorMapSteps; i++) {
                var rad = i * toRad;
                var gradient = ctx.createLinearGradient(_self.center.x, _self.center.y, _self.center.x + _self.radius * Math.cos(rad), _self.center.y + _self.radius * Math.sin(rad));
                gradient.addColorStop(0, 'hsl(' + (i / _self.colorMapSteps) * 360 + ', 0%, ' + _self.currentLightness + '%)');
                gradient.addColorStop(1, 'hsl(' + (i / _self.colorMapSteps) * 360 + ', 100%, 50%)');
                ctx.strokeStyle = gradient;
                ctx.beginPath();
                ctx.moveTo(_self.center.x, _self.center.y);
                ctx.lineTo(_self.center.x + _self.radius * Math.cos(rad), _self.center.y + _self.radius * Math.sin(rad));
                ctx.lineWidth = lineWidth;
                ctx.stroke();
            }
        };

        _self.renderCircleSelector = function (ctx) {
            var colorMapRadius = _self.size / 2;
            var colorMapThickness = ((1 - _self.thickness) * colorMapRadius) / 2;

            var p = {
                x: _self.center.x + Math.cos(_self.selectedAngle) * _self.selectedDistanceFromCenter,
                y: _self.center.y + Math.sin(_self.selectedAngle) * _self.selectedDistanceFromCenter
            };

            ctx.strokeStyle = 'rgb(0, 0, 0)';
            ctx.lineWidth = '2';
            ctx.beginPath();
            ctx.arc(p.x, p.y, colorMapThickness, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.stroke();
        };

        _self.draw = function () {
            _self.ctx.clearRect(0, 0, _self.canvas.width, _self.canvas.height);
            _self.renderHueCircle(_self.ctx);
            _self.renderCircleSelector(_self.ctx);
        }

        _self.handleTouchBegin = function (p) {
            //check what was touched
            //if it was the ring, the distance from the center is 
            //between the inner and outer radius of the circle
            var touchDistanceFromCenter = MathHelper.euclidicDistance(p, _self.center);

            if (touchDistanceFromCenter <= _self.radius) {
                _self.touchedElement = 'circle';
                _self.handleTouchMove(p);
            }
        }

        _self.handleTouchEnd = function (p) {
            _self.touchedElement = null;
        }

        _self.handleTouchMove = function (p) {
            if (_self.touchedElement == 'circle') {
                _self.selectedAngle = Math.atan2(p.y - _self.center.x, p.x - _self.center.y);

                var distanceFromCenter = MathHelper.euclidicDistance(_self.center, p);
                if(distanceFromCenter <= _self.radius){
                    _self.selectedDistanceFromCenter =  distanceFromCenter;
                }
            }

            _self.draw();
        };

        _self.resizeCanvas = function () {
            _self.canvas.width = _self.canvas.offsetWidth;
            _self.canvas.height = _self.canvas.offsetHeight;
            _self.size = _self.canvas.width > _self.canvas.height ? _self.canvas.height : _self.canvas.width;

            _self.draw();
        };

        _self.setupBindings = function () {

            window.addEventListener('resize', _self.resizeCanvas, false);

            canvas.addEventListener('touchmove', function (event) {
                //disable scroll
                event.preventDefault();

                var firstTouch = event.targetTouches[0];

                var p = {
                    x: firstTouch.pageX,
                    y: firstTouch.pageY
                };
                _self.handleTouchMove(p);
            }, false);

            canvas.addEventListener('mousemove', function (event) {
                var p = {
                    x: event.offsetX || event.clientX - _self.offsetLeft,
                    y: event.offsetY || event.clientY - _self.offsetTop
                };
                _self.handleTouchMove(p);
            }, false);

            canvas.addEventListener('touchstart', function (event) {
                //disable scroll
                event.preventDefault();

                if (event.targetTouches.length == 1) {
                    var firstTouch = event.targetTouches[0];

                    var p = {
                        x: firstTouch.pageX,
                        y: firstTouch.pageY
                    };
                    _self.handleTouchBegin(p);
                }
            }, false);

            canvas.addEventListener('mousedown', function (event) {
                var p = {
                    x: event.offsetX || event.clientX - _self.offsetLeft,
                    y: event.offsetY || event.clientY - _self.offsetTop
                };

                _self.handleTouchBegin(p);
            }, false);

            canvas.addEventListener('mouseup', _self.handleTouchEnd, false);
            canvas.addEventListener('touchend', function (event) {
                if (event.targetTouches.length == 0) {
                    _self.handleTouchEnd();
                }
            }, false);

        };

        _self.setColor = function (r, g, b) {
            var hsl = MathHelper.rgbToHsl(r, g, b);
            _self.currentHue = hsl[0];
            _self.currentSaturation = hsl[1];
            _self.currentLightness = hsl[2];

            _self.draw();
        }

        _self.setLightness = function(newValue){
            _self.currentLightness = newValue;
        };

        _self.getColor = function () {
            var rgb = MathHelper.hslToRgb(_self.currentHue, _self.currentSaturation, _self.currentLightness);
            return '#' + rgb[0].toString(16) + rgb[1].toString(16) + rgb[2].toString(16);
        }

        _self.init();
    }

    new ColorPicker(document.querySelector('.colorpicker'));
});