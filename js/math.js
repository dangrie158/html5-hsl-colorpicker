var MathHelper = {};
MathHelper.pointOnLine = function (p1, p2, x) {
    var slope = ((p2.y - p1.y) / (p2.x - p1.x));
    var yIntercept = p1.y - (slope * p1.x);
    return slope * x + yIntercept;
};

MathHelper.rotatePoint = function (point, pivot, angle) {
    var translatedPoint = {
        x: point.x,
        y: point.y
    };
    // translate point back to origin:
    translatedPoint.x -= pivot.x;
    translatedPoint.y -= pivot.y;

    // rotate translatedPoint
    var xnew = translatedPoint.x * Math.cos(angle) - translatedPoint.y * Math.sin(angle);
    var ynew = translatedPoint.x * Math.sin(angle) + translatedPoint.y * Math.cos(angle);

    // translate translatedPoint back:
    translatedPoint.x = xnew + pivot.x;
    translatedPoint.y = ynew + pivot.y;
    return translatedPoint;
};

MathHelper.clamp = function (value, min, max) {
    return value < min ? min : value > max ? max : value;
}

MathHelper.pointInTriangle = function (p1, p2, p3, p) {
    var sign = function (p1, p2, p3) {
        return (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y);
    }

    var b1 = sign(p, p1, p2) < 0;
    var b2 = sign(p, p2, p3) < 0;
    var b3 = sign(p, p3, p1) < 0;

    return (b1 == b2) && (b2 == b3);
}

MathHelper.euclidicDistance = function(p1, p2){
    return Math.sqrt(Math.pow(Math.abs(p1.x - p2.x), 2) + Math.pow(Math.abs(p1.y - p2.y), 2));
}