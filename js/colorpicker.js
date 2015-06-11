function ColorPicker(canvas) {
    var _self = this;
    _self.canvas = canvas;
    _self.ctx = _self.canvas.get(0).getContext('2d');
    _self.thickness = 0.35;
    _self.colorMapSteps = 255;
    _self.touchedElement == null;

    //initially red
    _self.currentHue = 0;
    _self.currentSaturation = 100;
    _self.currentLightness = 50;

    Object.defineProperty(_self, 'circleRadius', {
        get: function () {
            return (_self.size / 2) * (1 - _self.thickness);
        }
    });

    Object.defineProperty(_self, 'triangleSize', {
        get: function () {
            return _self.circleRadius * 0.9;
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
            if (value < 0) {
                value += Math.PI * 2;
            }
            _self.currentHue = value * (180 / Math.PI);
        }
    });

    Object.defineProperty(_self, 'sLTriangleCoordinates', {
        get: function () {
            var center = _self.center;
            var thirdCircle = (Math.PI * 2) / 3;
            var quarterCircle = Math.PI / 2;

            var p1 = _self.getTrianglePoint(0);
            var p2 = _self.getTrianglePoint(thirdCircle);
            var p3 = _self.getTrianglePoint(thirdCircle * 2);

            var lDirLength = p2.y - p3.y;
            var sDirLength = (lDirLength / 2) * Math.sqrt(3);
            var lMoveDistance = (lDirLength / 100) * _self.currentLightness;
            var sMoveDistance = (sDirLength / 100) * _self.currentSaturation;

            var sL = {
                x: p2.x + sMoveDistance,
                y: p2.y - lMoveDistance
            };

            //sL is now in the right position for an upfacing triangle like in hue = 0, rotate it for the right position
            return MathHelper.rotatePoint(sL, _self.center, _self.selectedAngle);
        },
        set: function (sLCoordinates) {
            var thirdCircle = (Math.PI * 2) / 3;
            var quarterCircle = Math.PI / 2;

            var p1 = _self.getTrianglePoint(0);
            var p2 = _self.getTrianglePoint(thirdCircle);
            var p3 = _self.getTrianglePoint(thirdCircle * 2);

            //rotate the point first to its initial position
            var pointInTriangle = MathHelper.rotatePoint(sLCoordinates, _self.center, -_self.selectedAngle);

            var lDirLength = p2.y - p3.y;
            var sDirLength = (lDirLength / 2) * Math.sqrt(3);

            var sOffset = pointInTriangle.x - p2.x;

            var newSaturation = (sOffset / sDirLength) * 100;
            newSaturation = MathHelper.clamp(newSaturation, 0, 100);
            _self.currentSaturation = newSaturation;

            //project a ray from p1 to sLcoordinates and get the point at p2.x/p3.x
            //var projectedPoint = MathHelper.pointOnLine(pointInTriangle, p1, p2.x);

            //the offset is how much the saturation can vary from 50% in + and - direction
            var maxLightnessOffset = 50 - (newSaturation / 100) * 50;

            var lOffset = p2.y - pointInTriangle.y;
            var newLightness = (lOffset / lDirLength) * 100;
            newLightness = MathHelper.clamp(newLightness, 50 - maxLightnessOffset, 50 + maxLightnessOffset);
            _self.currentLightness = newLightness;
        }
    });

    _self.getTrianglePoint = function (angle) {
        return {
            x: _self.center.x + Math.cos(angle) * _self.triangleSize,
            y: _self.center.y + Math.sin(angle) * _self.triangleSize
        };
    };

    _self.init = function () {
        _self.setupBindings();
        _self.resizeCanvas();
        _self.resizeCanvas();
        window.requestAnimationFrame(_self.draw);
    };

    _self.renderHueCircle = function (ctx) {
        var radius = _self.size / 2;
        var toRad = (2 * Math.PI) / _self.colorMapSteps;
        var lineWidth = Math.ceil(((2 * Math.PI) * radius) / _self.colorMapSteps);

        for (var i = 0; i < _self.colorMapSteps; i++) {
            var rad = i * toRad;
            ctx.strokeStyle = 'hsl(' + (i / _self.colorMapSteps) * 360 + ', 100%, 50%)';
            ctx.beginPath();
            ctx.moveTo(_self.center.x, _self.center.y);
            ctx.lineTo(radius + radius * Math.cos(rad), radius + radius * Math.sin(rad));
            ctx.lineWidth = lineWidth;
            ctx.stroke();
        }

        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(radius, radius, radius * (1 - _self.thickness), 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.fill();
    };

    _self.renderSaturationLightnessTriangle = function (ctx) {
        var thirdCircle = (Math.PI * 2) / 3

        var p1 = _self.getTrianglePoint(_self.selectedAngle);

        var p2 = _self.getTrianglePoint(_self.selectedAngle + thirdCircle)

        var p3 = _self.getTrianglePoint(_self.selectedAngle + thirdCircle * 2);

        var fullSL = 'hsl(' + _self.currentHue + ', 100%, 100%)';
        var fullSnoL = 'hsl(' + _self.currentHue + ', 100%, 0%)';
        var noSfullL = 'hsl(' + _self.currentHue + ', 0%, 100%)';

        var bigger13 = {
            x: p1.x > p3.x ? p1.x : p3.x,
            y: p1.y > p3.y ? p1.y : p3.y
        };

        var sGradient = ctx.createLinearGradient(p3.x, p3.y, p1.x, p1.y);
        var lGradient = ctx.createLinearGradient(p2.x, p2.y, bigger13.x - (Math.abs(p1.x - p3.x) / 2), bigger13.y - (Math.abs(p1.y - p3.y) / 2));

        sGradient.addColorStop(0, 'hsl(' + _self.currentHue + ', 0%, 100%)');
        sGradient.addColorStop(1, 'hsl(' + _self.currentHue + ', 100%, 50%)');

        lGradient.addColorStop(0, 'hsl(0, 0%, 0%)');
        lGradient.addColorStop(1, 'hsl(0, 0%, 100%)');

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.lineTo(p3.x, p3.y);

        ctx.fillStyle = sGradient;
        ctx.fill();

        ctx.globalCompositeOperation = 'multiply';
        ctx.fillStyle = lGradient;
        ctx.fill();
        ctx.globalCompositeOperation = 'normal';
    }

    _self.renderCircleSelector = function (ctx) {
        var colorMapRadius = _self.size / 2;
        var colorMapThickness = (colorMapRadius - (colorMapRadius * (1 - _self.thickness)));
        var selectorSize = (colorMapThickness * 0.9);

        var p1 = {
            x: _self.center.x + Math.cos(_self.selectedAngle) * (colorMapRadius - colorMapThickness / 2),
            y: _self.center.y + Math.sin(_self.selectedAngle) * (colorMapRadius - colorMapThickness / 2)
        };

        var p2 = {
            x: _self.center.x + Math.cos(_self.selectedAngle + 0.2) * (colorMapRadius * 1.1),
            y: _self.center.y + Math.sin(_self.selectedAngle + 0.2) * (colorMapRadius * 1.1)
        };

        var p3 = {
            x: _self.center.x + Math.cos(_self.selectedAngle - 0.2) * (colorMapRadius * 1.1),
            y: _self.center.y + Math.sin(_self.selectedAngle - 0.2) * (colorMapRadius * 1.1)
        };

        ctx.fillStyle = 'white';
        ctx.lineWidth = '4';
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.lineTo(p3.x, p3.y);
        ctx.closePath();
        ctx.fill();
    };

    _self.renderTriangleSelector = function (ctx) {
        var colorMapRadius = _self.size / 2;
        var colorMapThickness = (colorMapRadius - (colorMapRadius * (1 - _self.thickness))) / 2;
        var selectorSize = colorMapThickness * 0.2;
        var coordinates = _self.sLTriangleCoordinates;

        ctx.strokeStyle = 'rgb(150, 150, 150)';
        ctx.fillStyle = 'hsl(' + _self.currentHue + ', ' + _self.currentSaturation + '%, ' + _self.currentLightness + '%);'
        ctx.lineWidth = '3';
        ctx.beginPath();
        ctx.arc(coordinates.x, coordinates.y, selectorSize, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.stroke();
        ctx.fill();
    };

    _self.draw = function () {
        _self.ctx.clearRect(0, 0, _self.canvas.width(), _self.canvas.height());
        _self.renderHueCircle(_self.ctx);
        _self.renderCircleSelector(_self.ctx);
        _self.renderSaturationLightnessTriangle(_self.ctx);
        _self.renderTriangleSelector(_self.ctx);
    }

    _self.notifyCallbacks = function () {
        var newColor = Graphics.hslToRgb(_self.currentHue / 360, _self.currentSaturation / 100, _self.currentLightness / 100);
        if (_self.onChangeCallback) {
            _self.onChangeCallback(newColor);
        }
    }

    _self.handleTouchBegin = function (p) {
        //check what was touched
        //if it was the ring, the distance from the center is 
        //between the inner and outer radius of the circle
        var touchDistanceFromCenter = MathHelper.euclidicDistance(_self.center, p);
        var innerCircleRadius = _self.size / 2 * (1 - _self.thickness);
        var outerCircleRadius = _self.size / 2;

        if (touchDistanceFromCenter >= innerCircleRadius && touchDistanceFromCenter <= outerCircleRadius) {
            _self.touchedElement = 'circle';
        }

        //if it was the triangle, the touch needs to be in it
        //the algorith used is from: 
        //http://stackoverflow.com/questions/2049582/how-to-determine-a-point-in-a-triangle

        var circleRadius = _self.center.x * (1 - _self.thickness);
        var triangleSize = circleRadius * 0.9;
        var quarterCircle = (Math.PI * 2) / 3

        var p1 = {
            x: _self.center.x + Math.cos(_self.selectedAngle) * triangleSize,
            y: _self.center.y + Math.sin(_self.selectedAngle) * triangleSize
        };

        var p2 = {
            x: _self.center.x + Math.cos(_self.selectedAngle + quarterCircle) * triangleSize,
            y: _self.center.y + Math.sin(_self.selectedAngle + quarterCircle) * triangleSize
        };

        var p3 = {
            x: _self.center.x + Math.cos(_self.selectedAngle + quarterCircle * 2) * triangleSize,
            y: _self.center.y + Math.sin(_self.selectedAngle + quarterCircle * 2) * triangleSize
        };

        if (MathHelper.pointInTriangle(p1, p2, p3, p)) {
            _self.touchedElement = 'triangle';
        }

        _self.handleTouchMove(p);
    }

    _self.handleTouchEnd = function (p) {
        _self.touchedElement = null;
    }

    _self.handleTouchMove = function (p) {
        if (_self.touchedElement == 'circle') {
            _self.selectedAngle = Math.atan2(p.y - _self.center.x, p.x - _self.center.y);
        }

        if (_self.touchedElement == 'triangle') {
            _self.sLTriangleCoordinates = p;
        }

        _self.notifyCallbacks();
        window.requestAnimationFrame(_self.draw);
    };

    _self.resizeCanvas = function () {
        _self.size = _self.canvas.width() > _self.canvas.height() ? _self.canvas.height() : _self.canvas.width()
        _self.canvas.get(0).width = _self.size;
        _self.canvas.get(0).height = _self.size;
        _self.notifyCallbacks();
        window.requestAnimationFrame(_self.draw);
    };

    _self.setupBindings = function () {

        window.addEventListener('resize', _self.resizeCanvas, false);

        _self.canvas.bind('move', function (event) {
            var p = {
                x: event.pageX - _self.canvas.offset().left,
                y: event.pageY - _self.canvas.offset().top
            };
            _self.handleTouchMove(p);
        });

        _self.canvas.bind('movestart', function (event) {
            var p = {
                x: event.pageX - _self.canvas.offset().left,
                y: event.pageY - _self.canvas.offset().top
            };
            _self.handleTouchBegin(p);
        });

        _self.canvas.bind('moveend', _self.handleTouchEnd);
    };

    _self.setColor = function (r, g, b) {
        var hsl = Graphics.rgbToHsl(r, g, b);
        _self.currentHue = hsl[0] * 360;
        _self.currentSaturation = hsl[1] * 100;
        _self.currentLightness = hsl[2] * 100;

        window.requestAnimationFrame(_self.draw);
    }

    _self.onColorChange = function (callback) {
        _self.onChangeCallback = callback;
    };

    _self.init();
}