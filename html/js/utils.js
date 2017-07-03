/*
	Utils
	adam hinshaw
*/
 
var Utils = {};

//------------------------------------------------------------------------------------------------------

Utils.hexToRGBA = function(hex, a) {
	var rgb = Utils.hexToRgb(hex);
	var alpha = (a == undefined) ? 1.0 : a;
	return "rgba("+rgb.r+","+rgb.g+","+rgb.b+","+alpha+")";
}

Utils.randomHex = function() {
	return '#'+ Math.floor(Math.random()*16777215).toString(16); // 
};

Utils.rgbToHex = function(r, g, b) {
    return "#" + Utils.componentToHex(r) + Utils.componentToHex(g) + Utils.componentToHex(b);
};

Utils.rgbColToHex = function(rgb) {
    return "#" + Utils.componentToHex(rgb.r) + Utils.componentToHex(rgb.g) + Utils.componentToHex(rgb.b);
};

Utils.componentToHex = function(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
};

Utils.hexToRgb = function(hex) {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
  	var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function(m, r, g, b) {
        return r + r + g + g + b + b;
    });

    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
};

Utils.lerpHex  = function(colA, colB, amt) {	
	
	if(colA == null) colA = "FFFFFF"
	if(colB == null) colB = "FFFFFF"
	
	return Utils.rgbColToHex( Utils.lerpRGB( Utils.hexToRgb(colA), Utils.hexToRgb(colB), amt ) );
}

Utils.lerpRGB = function(colA, colB, amt, toHex) {
	
	if(colA == null) colA = {r:0,g:0,b:0};
	if(colB == null) colB = {r:0,g:0,b:0};
	
	var rgb = 	{	
					r: parseInt( colA.r + (colB.r-colA.r) * amt ), 
					g: parseInt( colA.g + (colB.g-colA.g) * amt ), 
					b: parseInt( colA.b + (colB.b-colA.b) * amt )
				};
				
	if(toHex === true) {
		return Utils.rgbColToHex(rgb);
	}else{
		return rgb;
	}
};

//------------------------------------------------------------------------------------------------------
Utils.stepProcessArray = function(items, process) {
	// timed processing using timeout.
	// from http://stackoverflow.com/questions/5050265/javascript-node-js-is-array-foreach-asynchronous/5050317#5050317

    var todo = items.concat();

    setTimeout(function() {
        process(todo.shift());
        if(todo.length > 0) {
            setTimeout(arguments.callee, 10);
        }else{
			// TODO: could use a finished callback here
		}
    }, 10);
}

//------------------------------------------------------------------------------------------------------

Utils.getURLParameter = function(name, def_value) {
	// if null return def_value
	var val = decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20'));
	
  	if (val == null || val == "" || val == undefined) return def_value; // no value
	
	if(typeof def_value  === "boolean") {		
		return (val.toLowerCase() == "true" || val == "1");
	}
	
	if(typeof def_value  === "number") {
		val = parseFloat(val);
		if(isNaN(val)) return def_value;
	}
	
	return val;
};

//------------------------------------------------------------------------------------------------------

Utils.show = function(el) {
	if(typeof el == 'string') el = $(el);
	el.css('visibility', 'visible');
}

Utils.hide = function(el) {
	if(typeof el == 'string') el = $(el);
	// log("hide", jdom_ele.selector);
	el.css('visibility', 'hidden');
}

Utils.isHidden = function(el) {
	if(typeof el == 'string') el = $(el);
	return el.css('visibility') == 'hidden';
}

//------------------------------------------------------------------------------------------------------

Utils.sbool = function(b) {
	return (b ? "1" : "0");
}

Utils.limit = function(num, start, end) {
	if(num == null) return start;
	if(num < start) return start;
	if(num > end) return end;
	return num;
} 

Utils.pad = function(input, places, pad_char) { // front pad a string
	
	if(places == undefined) places = 2;
	if(pad_char == undefined) pad_char = '0';
	
	var output = input+""; // String
	
	while(output.length < places) {
		output = pad_char + output;
	}
	
	return output;
}

//------------------------------------------------------------------------------------------------------

Utils.timeNow = function() {
	var now = new Date();
	var hrs = now.getHours();
	var mins = now.getMinutes();
	var secs = now.getSeconds();
	return Utils.pad(hrs) + ":" + Utils.pad(mins) + ":" + Utils.pad(secs);
};

Utils.getElapsedMilliseconds = function() {
	return (new Date()).getTime() - Utils._app_start_time;
}

Utils.getElapsedSeconds = function() {
	return Utils.getElapsedMilliseconds() / 1000;
}

Utils.getUpTimeStr = function() {
	return "up:"+Utils.secondsToHMS( Utils.getElapsedSeconds() );
};

Utils.secondsToHMS = function(totalSeconds) {
	var hours   = Math.floor(totalSeconds / 3600);
	var minutes = Math.floor((totalSeconds - (hours * 3600)) / 60);
	var seconds = Math.round(totalSeconds - (hours * 3600) - (minutes * 60));
	return ('0'+hours).slice(-2) +":" + ('0'+minutes).slice(-2) + ":" + ('0'+seconds).slice(-2); 
};

Utils.shortDateString = function(d) {
	if(Utils.__short_month_labels == null) Utils.__short_month_labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]; 
	if(Utils.__short_day_labels == null) Utils.__short_day_labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]; 
	return  Utils.__short_day_labels[d.getDay()] + " " + (Utils.__short_month_labels[d.getMonth()]) + " " + Utils.getGetOrdinal(d.getDate()) + ", " + d.getHours() + ":" + Utils.pad(d.getMinutes()) + ":" + Utils.pad(d.getSeconds());
};

Utils.getLongMonthName = function(d) {
	if(Utils.__month_labels == null) Utils.__month_labels = ["January", "Febuary", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]; 
	return Utils.__month_labels[d.getMonth()];
};

Utils.secondsTillMidnight  = function(d) {
    var midnight = new Date(d);
    midnight.setHours(24,0,0,0);
    return (midnight - d) / 1000; // .277777778
};

Utils.getGetOrdinal = function(n) {
    var s=["th","st","nd","rd"];
    var v=n%100;
    return n+(s[(v-20)%10]||s[v]||s[0]);
};

Utils.getSQLTimeStamp = function(dt) {
	return dt.getFullYear() + "-" + Utils.pad(dt.getMonth()+1) + "-" + Utils.pad(dt.getDate()) + " " + Utils.pad(dt.getHours()) + ":" + Utils.pad(dt.getMinutes()) + ":" +  Utils.pad(dt.getSeconds());
};

Utils.getTimeZoneOffset = function(full) {
	if(full === true) {
		return new Date().toString().match(/([A-Z]+[\+-][0-9]+.*)/)[1];
	}else{
		var offset = new Date().getTimezoneOffset();
		offset = ((offset<0? '+':'-')+ // Note the reversed sign!
	          	Utils.pad(parseInt(Math.abs(offset/60)))+
	          	Utils.pad(Math.abs(offset%60)))
				return offset;
	}
};

Utils.escapeUnicode = function(str) {
	console.log(str);
	return decodeURIComponent(escape(str)); // see http://stackoverflow.com/questions/7885096/how-do-i-decode-a-string-with-escaped-unicode
}

Utils.isMobile = {
    Android: function() {
        return navigator.userAgent.match(/Android/i);
    },
    BlackBerry: function() {
        return navigator.userAgent.match(/BlackBerry/i);
    },
    iOS: function() {
        return navigator.userAgent.match(/iPhone|iPad|iPod/i);
    },
	iPad: function() {
        return navigator.userAgent.match(/iPad/i);
    },
    Opera: function() {
        return navigator.userAgent.match(/Opera Mini/i);
    },
    Windows: function() {
        return navigator.userAgent.match(/IEMobile/i) || navigator.userAgent.match(/WPDesktop/i);
    },
    any: function() {
        return (Utils.isMobile.Android() || Utils.isMobile.BlackBerry() || Utils.isMobile.iOS() || Utils.isMobile.Opera() || Utils.isMobile.Windows());
    }
};

//------------------------------------------------------------------------------------------------------

Utils._app_start_time = (new Date()).getTime();

Utils.QueryObject = function() {
	this.refresh();
};

Utils.QueryObject.prototype.refresh = function() {	
	// clear and update to values in query string
	this.value_table = {}; 
	this.indexed_key_list = [];
	
	var queries_str = location.search;
	
	// walk queries & unserialize
	
	if(queries_str.length > 1) { // has at least a ?
		var queries = queries_str.split("&");
		
		for(var i = 0; i<queries.length; i++){
			var k_v = queries[i].split("=");
			var key = k_v[0];
			if(i == 0) key = key.substr(1); // remove "?"
			this.value_table[ key ] = k_v[1];
			this.indexed_key_list.push( key );
		}
	}
	
};

Utils.QueryObject.prototype.size = function() {
	return this.indexed_key_list.length;
};

Utils.QueryObject.prototype.setVar = function(name, value) {
	
	if(!this.exists(name)) { // a new value so set the index too
		this.indexed_key_list.push(name);
	}
	
	this.value_table[ name ] = value;
};

Utils.QueryObject.prototype.exists = function(name) {
	return this.value_table.hasOwnProperty(name);
};

Utils.QueryObject.prototype.getVar = function(name) {
	return this.value_table[ name ];
};

Utils.QueryObject.prototype.getVarAtIndex = function(index) {
	if(index < 0 || index >= this.size()) return undefined;
	return  this.value_table[ this.indexed_key_list[index] ];
};

Utils.QueryObject.prototype.serialize = function(encoded) {
	// return as a queries string "?var=value&var= valye
	var str = "?";
	for(var i = 0; i<this.indexed_key_list.length; i++) {
		var val = this.value_table[this.indexed_key_list[i]];
		if(typeof val == "boolean") val = Utils.sbool(val);
		str += (str.length>1 ? "&" : "") + this.indexed_key_list[i] + "=" + (val == undefined ? "" : val);
	}
	if(encoded === true) str = encodeURIComponent(str);
	return str;
};

Utils.QueryObject.prototype.reloadToPage = function() {
	// reload the page to the values in this
	location.replace(this.getAsURL());
};

Utils.QueryObject.prototype.getAsURL = function(encoded) {
	var origin = location.hasOwnProperty("origin") ? location.origin : location.protocol + "//" + location.host; // ie<11, construct origin out of other args
	return origin + location.pathname + this.serialize(encoded);
};

//------------------------------------------------------------------------------------------------------

Utils.getQueries = function() {
	return new Utils.QueryObject(); 	// unserialize the url query variables
}

//------------------------------------------------------------------------------------------------------

// rAF.js: https://gist.github.com/paulirish/1579671
(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] 
                                   || window[vendors[x]+'CancelRequestAnimationFrame'];
    }
 
    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
 
    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());