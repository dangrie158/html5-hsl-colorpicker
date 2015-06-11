$(document).ready(function () {
    var COLORCHOOSER_DEBOUNCE_INTERVAL = 50;

    var webSocketEndpoint = 'ws://' + window.location.hostname + ':8080';
    var ws = new WebSocket(webSocketEndpoint, 'chat');

    var initialColor = 'FF00FF';

    var toPaddedHex = function (d) {
        return ("0" + (Number(d).toString(16))).slice(-2).toUpperCase()
    }

    var arrToHexByteHexString = function (array) {
        var result = '';
        array.forEach(function (entry) {
            result += toPaddedHex(entry);
        });
        return result;
    }

    var colorPicker = new ColorPicker($('.colorpicker'));
    var r = parseInt(initialColor.substr(0, 2), 16);
    var g = parseInt(initialColor.substr(2, 2), 16);
    var b = parseInt(initialColor.substr(4, 2), 16);
    colorPicker.setColor(r, g, b);

    /*
     * send or reconnect  if the connection got closed
     */
    var wsSend = function(payload){
        if(ws.readyState != ws.OPEN){
           ws = new WebSocket(webSocketEndpoint, 'chat'); 
        }else{
            ws.send(payload);
        }
    };

    /*
     * WebSocket Event Handlers
     */
    ws.onclose = function(){
        //instant reconnect
        ws = new WebSocket(webSocketEndpoint, 'chat');
    };

    ws.onmessage = function(message){
        //Only possible message should be the status
        var data = JSON.parse(message.data);
        $('[name=spot1]').prop('checked', data.spot1);
        $('[name=spot2]').prop('checked', data.spot2);
        $('[name=ambient]').prop('checked', data.ambient);
        $('[name=floor]').prop('checked', data.floor);
        $('[name=brightness]').prop('value', data.brightness);

        var r = parseInt(data.color.substr(0, 2), 16);
        var g = parseInt(data.color.substr(2, 2), 16);
        var b = parseInt(data.color.substr(4, 2), 16);
        colorPicker.setColor(r, g, b);
    }

    ws.onopen = function(){
        ws.send('FUNCTION:getstate');
    }

    /*
     * Color Picker callback and debounce
     */
    var timeoutCallback = null;
    var lastChosenColor = null;
    colorPicker.onColorChange(function (newColor) {
        if (!timeoutCallback) {
            wsSend('COLOR:' + arrToHexByteHexString(newColor));
            timeoutCallback = setTimeout(function () {
                timeoutCallback = null;
                if (lastChosenColor) {
                    wsSend('COLOR:' + arrToHexByteHexString(newColor));
                    lastChosenColor = null;
                }
            }, COLORCHOOSER_DEBOUNCE_INTERVAL)
        } else {
            lastChosenColor = newColor;
        }
    });

    /*
     * Switch Management
     */
    $(':checkbox').click(function (element) {
        var which = element.target.name;
        var newState = element.target.checked;
        wsSend('SWITCH:' + which + ':' + newState);
    });

    /*
     * Button Management
     */
    $(':button').click(function (element) {
        var which = element.target.name;
        wsSend('FUNCTION:' + which);
    });

    /*
     * Slider Management
     */
     var lastBrightnessChosen = null;
    $('#brightness').on("change input", function (element) {
        var level = element.target.value;
        
        if (!timeoutCallback) {
            wsSend('BRIGHTNESS:' + level);
            timeoutCallback = setTimeout(function () {
                timeoutCallback = null;
                if (lastBrightnessChosen) {
                    wsSend('BRIGHTNESS:' + level);
                    lastBrightnessChosen = null;
                }
            }, COLORCHOOSER_DEBOUNCE_INTERVAL)
        } else {
            lastBrightnessChosen = level;
        }
    });
});