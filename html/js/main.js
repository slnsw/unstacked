
var UnstackedApp = ( function () {
	
	"use strict";
	
	var uGet = Utils.getURLParameter;
	
	var remote = "http://unstacked.dxlab.sl.nsw.gov.au/";
	
	var USE_REMOTE = uGet("remote", true);
	
	var PUB_IMG_CACHE_PATH = (USE_REMOTE ? remote : "" ) + "cache/imgs/covers/";
	var NON_PUB_IMG_CACHE_PATH = (USE_REMOTE ? remote : "" ) + "cache/imgs/acms.sl.nsw.gov.au/";

	var SERVICE_PATH = (USE_REMOTE ? remote  : "" ) + "php/";
	var HISTORICAL_DATA_PATH = SERVICE_PATH + "get_data.php"; // "data/dump.json?b=2";
	var DATA_PATH = SERVICE_PATH + "get_views.php";
	
	var DataSources = {
		BOTH: 	{value:0, label:"Both"},
		UNPUB:	{value:1, label:"Non-published"}, 	//  (ACMS)
		PUB:		{value:2, label:"Published"} 			//  (Millenium)		
	 };
	 
	 var ImageDisplaySource = {
		 ALL: 				{value:0, label:"Show All"},
		 WITH_IMAGE: 		{value:1, label:"With Images"},
		 WITHOUT_IMAGE: 	{value:2, label:"Without Images"}
	 }
	
	 var DisplayTypes = {
		 INTERACTIVE:  {value:0, label:"Interactive"}, // Web Clickable
		 DISPLAY: 		{value:1, label:"Display"}, // For non interactive, display only (TODO)
		 FICHE: 			{value:2, label:"Fiche"} // special microfiche reader  mode
	 };
	
	var items = []; // SLO view objects
	var viewed_count = -1; // place finder 
	
	var statistics = { unpub_count:0, unpub_w_image:0, pub_count:0, pub_covers:{thumb:0,regular:0}}; // visible_slo:0,
	
	var LIVE_MODE = uGet("live_mode", true);
	var LIVE_REFRESH_INTERVAL = uGet("live_refresh_interval", 60) * 1000; // 1 min defaults
	var LIVE_START_OFFSET_MINS = uGet("live_start_offset_mins", 0); // minutes behind current time to request (10 mins default, set in php service code)

	var PLAYBACK_SPEED = uGet("playback_speed", 1/60);  // how many virtual seconds to move playback date every frame. realtime is 1/60 = .016666667
	var SHOW_LABELS = uGet("show_labels", true);
	
	var IMAGE_DISPLAY_MODE = uGet("img_display_src", ImageDisplaySource.ALL.value);
	
	//var SHOW_WITHOUT_IMAGE = uGet("show_without_image", true);
	//var SHOW_WITH_IMAGE = uGet("show_with_image", true);
	
	var SHOW_TIMELINE =  uGet("show_timeline", true) && !LIVE_MODE;
	
	var DATA_SOURCE = uGet("data_src", DataSources.BOTH.value);
	
	var DISPLAY_MODE = uGet("display_mode", DisplayTypes.INTERACTIVE.value);
	
	var ADD_ALL = uGet("add_all", false); // dev call & not working well at moment, will bring browser to its knees
	
	var GET_LARGE_IMAGES = uGet("get_large_imgs", false);
	
	var VISIBILE_LIMIT = uGet("visible_limit", 64) * (Utils.isMobile.any() ? .5 : 1);
	if( isMicroFicheMode() ) VISIBILE_LIMIT = 0; // No limit
	
	var GENERATED_SECONDS = uGet("generated_secs", true); // randomise the seconds data of the date stamps as they are all currently 0
	
	var HIDE_SCROLL =  uGet("hide_scroll", false);
	
	var DEV_UI_VISIBLE = uGet("dev_ui", false);

	var SHOW_MENU = uGet("menu", !isMicroFicheMode()); // (DISPLAY_MODE == DisplayTypes.INTERACTIVE.value) ); 
	var MENU_ON_TOP = uGet("menu_on_top", false);
	var AUTO_OPEN_MENU  = uGet("auto_open_menu", false)
	var menu_open = false;

	var SHOW_HOME = uGet("show_home", !isMicroFicheMode());
	var AUTO_CLOSE_HOME = uGet("auto_close_home", true);
	
	var ABS_DATE_MODE = uGet("abs_date_mode", false);
	var ABS_START_DATE = uGet("abs_start_date", "2016-03-22 08:59");
	var ABS_DATE_SPEED = Math.abs( uGet("abs_date_speed", 1) );
	
	var home_closer_timeout_id;
	var home_closer_time_interval = 12*1000; // milliseconds

	var SHOW_INSTRUCTION = uGet("show_instruction", !isMicroFicheMode());
	var AUTO_CLOSE_INSTRUCTION = uGet("auto_close_instructions", true);
	
	var instruction_closer_timeout_id;
	var instruction_closer_time_interval = 15*1000; // milliseconds
	
	var AUTO_REFRESH = uGet("auto_refresh", true);
	
	var extra_data_args = uGet("extra_data_args", "").split(",").join("&"); // Way to send more args to data service for testing, using comma as delimiter
	
	var AUDIO_FX = uGet("audiofx", false) && window['Tone'] != null; // if no Tone object, instantitation could have failed due to no AudioContext support
	
	if(AUDIO_FX) {
		
		var synth = new Tone.PolySynth(6, Tone.Synth).toMaster();
		
		var en =  { attack: 0.1,
				      release: 4,
				      releaseCurve: 'linear'
				    };
		var fe = {  baseFrequency: 200,
				      octaves: 2,
				      attack: 0,
				      decay: 0,
				      release: 1000
				    };
		synth.set({
				voice0: {
				    oscillator: {type: 'sawtooth'},
				    envelope:en,
				    filterEnvelope:fe 
				  },
				  voice1: {
				    oscillator: {type: 'sine'},
				    envelope:en,
				    filterEnvelope: fe
				  },
			"envelope" : {
				"attack" : 0.33,
				"decay" : 0.2,
				"release": 0.8,
				"sustain" : 0.5
			},
			"volume": -12
		});
		
		var panner = new Tone.Panner(0).toMaster();	
		synth.connect(panner);		
	}
	
	var OUTER_MARGIN = uGet("outer_margin", 10);
	
	var LIVE_DATE_OFFSET_MINS = 1; // the time we run replay (behind current time)
	
	var USE_MOMENT = uGet("use_moment", true); // use moment.js for date stuff
	
	var CLOCK_SHOW_SECS = uGet("clock_show_secs", false);
	
	var details_view_visible = false;
	var instruction_dialog_visible = false;
	
	var timeline = {
		start_date:null,
		end_date:null,
	 	playback_date:null,   // date of playback pos in timeline of data
		playback_seconds_step: PLAYBACK_SPEED,
		position: 0, // 0..1 norm position in playback
		canvas: null,
		position_canvas: null
	};
	
	var NON_PUB_NO_IMG_BG_COL = "#333333";
	var PINK_COL = "#e34476";
	
	var last_data_server_date_stamp;
	
	
	// PLAYBACK
	
	var ANIMATE = uGet("anim",  (isMicroFicheMode() ? 0 : 3) );  // Animation wall tech used: 
																					 // 0:None, 1:Freewall internal (jquery?), 2:CSS, 3:GSAP
	
	var DEBUG_LABELS = uGet("debug_labels", false);
	
	var DEBUG = uGet("debug", false);
	var TRACE = uGet("trace", false);
	var SHOW_STATUS = uGet("status", DEBUG);
	
	var WALL_MARGIN = uGet("wall_margin", 10);
	
	var START_OFFSET = uGet("start_offset", 0);
	
	var running = false;
	
	var lastTimeMsec; // anim timer var
	
	var wall;
	var wall_seed_width = uGet("wall_seed_width", 200);
	
	var stats = new Stats();
	stats.setMode( 0 );
	
	var active = { slo:null, card_div:null }; // clicked and viewing
	
	var active_data_ids = []; // ids data-id of the divs that are active loaded into dom and freewall, used to prune
	
	//var add_cue = { nodes:[], slos:[] }; // array of items to append to the freewall
	
	var svg_drawing;
	
	var control_panel;
	
	var mouse_pos = {x:0, y:0};
	
	var MS_PER_MINUTE = 60000;
	
	var images_to_load_counter = 0;
	var image_ids_loaded = [];
	
	var imageless_ids_loaded = [];
	
	var first_data_recieved = false;
	
	var cached_data_date = ""; // The date of the data, important to transposed cached data only
	
	function init() {
		trace("UnstackedAppinit");

		window.addEventListener(  'resize', 	onWindowResize, 	false );		
		window.addEventListener(  'orientationchange', onOrientationChange, false);		
		window.addEventListener(  'scroll', 	onWindowScroll, 	false );
		document.addEventListener( 'keyup',		onDocumentKeyUp, 	false );
		
		if( isMicroFicheMode() ) {
			document.addEventListener( 'mousemove', onDocumentMouseMove, false);			
			// TODO: read start mouse valuse from url args, sent in via shell call?
			// updateMousePos(load_event.clientX, load_event.clientY);		
			HIDE_SCROLL = true;	
		}
		
	
		if( ABS_DATE_MODE ) { // offset the last_data_server_date_stamp by 10 mins for the first data get
			var _d = getRunningDate(); // the abs date
			_d.setSeconds( _d.getSeconds() - (10 * 60) );
			last_data_server_date_stamp = Utils.getSQLTimeStamp( _d );
		}
		
		//
		timeline.start_date = timeline.end_date = timeline.playback_date = getRunningDate();
		
		updatePageStyle();
			
		// Setup freewall
		wall = new Freewall("#freewall");
		wall.reset({
			selector: '.card',
			animate: (ANIMATE == 1),
			cellW: wall_seed_width,
			cellH: 'auto',/*wall_seed_width, */
			gutterX: WALL_MARGIN,
			gutterY: WALL_MARGIN,
			onResize: function() {
				reflowGrid();
			},
			bottomToTop: false,
			delay: 0 /*,
			fixSize: isMicroFicheMode() ? 1 : null */
		});
		
		if(SHOW_MENU) {
			setupMenu(!MENU_ON_TOP); // appending to wall
		}
		
		// wall.fitZone(window.innerWidth, 30, window.innerHeight - 30); // testing smething out
		
		$(".tzone").text(getRunningDate().getZoneAbbreviation());
		 
		setStatusVisibility( SHOW_STATUS );
		
		$("#status").prepend( stats.domElement );
		
		QuickSettings.useExtStyleSheet();
		control_panel = QuickSettings.create( window.innerWidth-195, 45, "[ Controls ]" );

		if(!LIVE_MODE) {
				control_panel.addRange("Playback Speed", .0166, 10.0, PLAYBACK_SPEED, .0166, function(value) {
				PLAYBACK_SPEED = value;
				timeline.playback_seconds_step = PLAYBACK_SPEED;
			});
		}
		
		control_panel.addBoolean("Playing", running, function(value) {
			if(value) {
				start(true);
			}else{
				stop(true);
			}
		});
		
		control_panel.addRange("Visible Limit", 0, 255, VISIBILE_LIMIT, 1, function(value) {
			VISIBILE_LIMIT = value;
		});
		
		if(LIVE_MODE) {
			// add a date 
			control_panel.addDate("Current Data Date", getRunningDate(), function(value) {
				 trace("Date changed to " + value);
			});
			// could add a time too
			// .addTime("time", new Date())
		}
				
		control_panel.addDropDown("Data Source:", [DataSources.BOTH.label, DataSources.UNPUB.label, DataSources.PUB.label], function(value) { 
			trace("Show Source:", value.value);
						
			switch(value.value) {
				case DataSources.BOTH.label:	DATA_SOURCE = DataSources.BOTH.value;	break;
				case DataSources.UNPUB.label: DATA_SOURCE = DataSources.UNPUB.value; break;
				case DataSources.PUB.label: 	DATA_SOURCE = DataSources.PUB.value; 	break;
			}
			
			filterWall();			
		});
			
		control_panel.addDropDown("Image Filter:", [ImageDisplaySource.ALL.label, ImageDisplaySource.WITH_IMAGE.label, ImageDisplaySource.WITHOUT_IMAGE.label], function(value) { 
			trace("Show Images:", value.value);
						
			switch(value.value) {
				case ImageDisplaySource.ALL.label:				IMAGE_DISPLAY_MODE = ImageDisplaySource.ALL.value;					break;
				case ImageDisplaySource.WITH_IMAGE.label: 	IMAGE_DISPLAY_MODE = ImageDisplaySource.WITH_IMAGE.value; 		break;
				case ImageDisplaySource.WITHOUT_IMAGE.label: IMAGE_DISPLAY_MODE = ImageDisplaySource.WITHOUT_IMAGE.value;	break;
			}
			
			filterWall();			
		});
			
		// setup tracking on anchors		
		$("a").click( function() {
				trace("Click", $(this).attr('href'));
				trackEvent("external_link", "click", $(this).attr('href') );
			}); 
			
			
			
		if(LIVE_MODE) {
			timeline.start_date = getRunningDate();
			timeline.start_date.setSeconds(timeline.start_date.getSeconds() - LIVE_START_OFFSET_MINS * 60);
		}
		
		if(DEV_UI_VISIBLE == false || Utils.isMobile.any()) control_panel.toggleVisibility();
		
		if(SHOW_HOME) {
			showHome();
		}else if (SHOW_INSTRUCTION) {
			showInstruction();
		}
		
		fetchData();
		
	}
	
	function showHome() {
		// Hacking the details view to use as a home screen / modal dialog
		trace("showHome", AUTO_CLOSE_HOME);
		
		Utils.show( "#home-box" );
		
		if(AUTO_CLOSE_HOME) home_closer_timeout_id = setTimeout(autoCloseHome, home_closer_time_interval);
		
		var p = $("#details-labels > p:lt(3)").html("&nbsp;"); // fill paragraps 1..3 with something so white box fills up
		
		presentDetailsView( PINK_COL, false, 2);
		
		active.card_div = $('.u_menu_sel'); //  so it returns back to the menu place
	}
	
	function autoCloseHome() {
		trace('autoCloseHome');
		hideDetailsView(1, homeHidden);		
	}
	
	function homeHidden() {
		trace('homeHidden');
	   if (SHOW_INSTRUCTION) {
	  		showInstruction();
		}
	}
	
	function showInstruction() {
		trace("showInstruction", AUTO_CLOSE_INSTRUCTION);
		// Hacking the instructions view to use as a instruction modal dialog
		instruction_dialog_visible = true;
		
		$("#instruction-box").css({display:"block", visibility:"visible"});
		TweenMax.fromTo("#instruction-box", .5, {scale:.0}, {scale:1, ease:Power2.easeOut,});
		
		$("#u_overlay_bg").css({"opacity":0.0});
		Utils.show("#u_overlay_bg");
		
		if(AUTO_CLOSE_INSTRUCTION) instruction_closer_timeout_id = setTimeout(autoCloseInstructions, instruction_closer_time_interval);
		
		$("#u_overlay_bg, #instruction-box").click( function(e) { 
				closeInstruction(e.shiftKey ? 10 : 1);
				trackEvent("close_instruction", "click");
		} );
			
	}
	
	function closeInstruction(mod) {
		trace("closeInstruction", mod);
		instruction_dialog_visible = false;

		if(AUTO_CLOSE_INSTRUCTION) clearTimeout(instruction_closer_timeout_id);
	
		$("#u_overlay_bg, #instruction-box").unbind('click');
		
		$("#instruction-box").css({"display":"block"});
		TweenMax.to("#instruction-box", .33*mod, {scale:0, ease:Power2.easeOut, onComplete:instructionBuiltOff});
	
		Utils.hide("#u_overlay_bg");
	}
	
	function autoCloseInstructions() {
		trace('autoCloseInstructions');
		closeInstruction(1);
	}
	
	function instructionBuiltOff() {
		$("#instruction-box").css({"display":"none"});
	}
	
	function getRunningDate() {

		if(ABS_DATE_MODE) {
			var d = new SL_Tz_Date(ABS_START_DATE);
			d.setSeconds( d.getSeconds() + (Utils.getElapsedSeconds()*ABS_DATE_SPEED) ); // add how long the app has been running
			return d;			
		}else{
			return new SL_Tz_Date(); // return the current time in Sydney! AEST GMT +10hours
		}
		// TODO: possibly add or subtract an offset? to alow viewing different days, and at a different speed?
	}
	
	function formatDateToTimeStamp( d, show_12_hour, show_seconds, colon_wrapper ) {
		
		var hours = d.getHours();	
		var suffix = "";		
		if(show_12_hour) {
			suffix= hours >= 12 ? 'pm' : 'am';
			hours = hours % 12;
			hours = hours ? hours : 12; // the hour '0' should be '12'
		}
		
		var colon = ":";
		if(colon_wrapper != null && colon_wrapper.length) {
			colon = colon_wrapper.split("$").join(":");
		}
		
		var minutes = "0" + d.getMinutes();
		var seconds = "0" + d.getSeconds();
		return  hours + colon + minutes.substr(-2) + (show_seconds === true ? (':' + seconds.substr(-2)) : '') + suffix;
	}
	
	function formatDateToStamp( d ) {
		// e.g, 16 December 2016
		return d.getDate() + " " + Utils.getLongMonthName(d) + " " + d.getFullYear();
	}
	
	function trace() {
		if(TRACE) {
			// (...args)
			// args.unshift( '[' + formatDateToTimeStamp( new Date() ) + ']' );
			Array.prototype.unshift.apply(arguments, [ formatDateToTimeStamp( new Date() ) ])
			console.log.apply(null, arguments);
			//console.log(args);	
		}
	}
	
	function trackEvent(category, action, label, val) {
		if(window.ga) {
			trace("trackEvent", category, action, label, val);
			window.ga('send', 'event', category, action, label, val );	
			// 'send', 'event', [eventCategory], [eventAction], [eventLabel], [eventValue]
		}
	}
	
	function toggleMenu() {
		trace("toggleMenu", menu_open);
		
		var sel = "#u_menu_options, #u_menu_about, #u_menu_about .section_title";
		
		if(menu_open) { // Minimise it!
			$(sel).hide();
			// $('.u_menu_inner').css({"width":''});
			$('.u_menu_sel').removeClass('u_menu_max').addClass('u_menu_min');
			
			$('#u_menu_header_minimised').show();
			$("#u_menu_header_maximised").css({'display':'none'});
			
			toggleMenuSection(true, false, true);
		
		}else{ // Maximise it
			// $('.u_menu_inner').css({"width":"400px"});
			
			$('.u_menu_sel').removeClass('u_menu_min').addClass('u_menu_max');
			// $('.u_menu_sel').css({width:"asdasd"});
	
			$("#u_menu_header_maximised").css({'display':'block'});
			$("#u_menu_header_minimised").hide();

			$(sel).show();
			
		}
		
		trackEvent("menu", menu_open ? "close" : "open");
		
		menu_open = !menu_open;
		
		reflowGrid();		
	}
	
	function setupMenu( add_to_wall ) {
				
		$('#u_menu_header_minimised, #u_menu_header_maximised').click( toggleMenu );
		
		$('#u_menu_options .section_title').click( function () { toggleMenuSection(true, true); 	trackEvent("menu_section", "click", "settings"); } );
		$('#u_menu_about .section_title').click( function () { 	toggleMenuSection(false, true); 	trackEvent("menu_section", "click", "about");} );
		
		// setup settings widgets
		$('#u_menu_options .u_source_0').click( function() { menuClickAction("data_source", DataSources.BOTH.value,  this); });
		$('#u_menu_options .u_source_1').click( function() { menuClickAction("data_source", DataSources.UNPUB.value, this); });
		$('#u_menu_options .u_source_2').click( function() { menuClickAction("data_source", DataSources.PUB.value,   this); });
		
		$('#u_menu_options .u_imgs_0').click( function() { menuClickAction("img_source", IMAGE_DISPLAY_MODE != ImageDisplaySource.WITH_IMAGE.value, this); });
	
		// TODO: setup widget states based on init IMAGE_DISPLAY_MODE & DATE_SOURCE
			
		if(add_to_wall === true) {
			wall.prepend( $("#u_menu").removeAttr("id") ); // this will remove it from wher it is in dom and push into the wall
			// get rid of the id (and all styles associated with it, as freewall just used the .u_menu_sel any how)
	
			wall.fixPos({
	        	 top: 0,
				 left: 0, /* The column */
				 block: $('.u_menu_sel')
			});		
		}else{
			
			$("#u_menu").css({'max-width':405});
			$("#u_menu_header_minimised").css({'min-width':220});
			$("#u_menu").show();
		}
		
		if(AUTO_OPEN_MENU) setTimeout(function() {trace("auto menu toggle timeout");toggleMenu();}, 200);
		
	}
	
	function toggleMenuSection( show_settings, animate, dont_reflow ) {
		
		var settings_sels = '#u_menu_about .about_footer, #u_menu_about .about_content, #u_menu_options .section_title';
		var about_sels = '#u_menu_about .section_title, #u_menu_options .options_content';
		
		if(show_settings) {				
			$(settings_sels).hide();				
			$(about_sels).show();				
		}else{				
			$(settings_sels).show();				
			$(about_sels).hide();				
		}
		
		if(dont_reflow !== true) reflowGrid();	
		
	}	
	
	function menuClickAction( control_name, value, elem ) {
		trace( 'menuClickAction', control_name, value, elem );
		
		trackEvent("menu_click_action", control_name, value);
		
		if(control_name == 'img_source') {
			
			if(IMAGE_DISPLAY_MODE == value) return;
			
			IMAGE_DISPLAY_MODE = value ? 1 : 0;
			
			$(elem).children(".label").text( value ? "On" : "Off" );
			//	#u_menu_options > div.options_content > div.u_imgs_0.toggle_widget.row.u_menu_border_v_shadows.selected_row > div.widget > svg
			// #u_menu_options > div.options_content > div.u_imgs_0.toggle_widget.row.u_menu_border_v_shadows.selected_row > div.widget > svg > use
			
			// trace( $(elem).find(".widget > svg > use > .pink_x5F_selection") );	//  > .pink_x5F_selection"
				// .u_toggle_widget .widget .pink_x5F_selection
			// $(elem).find(".widget > svg > use").hide(); // css({visibility: (value ? 'visible' : 'hidden')});
			// $(elem).find(".widget > svg > use").hide(); 
			
			if(value) {
				$(elem).toggleClass('selected_row', true).toggleClass('clickable_row', false); 
				$(elem).addClass('u_menu_border_v_shadows');
			}else{
				$(elem).toggleClass('selected_row', false).toggleClass('clickable_row', true);
				$(elem).removeClass('u_menu_border_v_shadows');
			}
			
		}else{ // data_source
			
			if(DATA_SOURCE == value) return;
			
			DATA_SOURCE = value;
			$("#u_menu_options .options_content .u_menu_source_items .selected_row").addClass('clickable_row')
			.removeClass('selected_row').removeClass('u_menu_border_v_shadows'); // deactivate active one.
			
			$(".u_menu_source_items > .row").removeClass('u_menu_item_divider');
			
			$(elem).addClass('selected_row').addClass('u_menu_border_v_shadows').removeClass('clickable_row');
			// Hack to put in menu divider line
			if(value != 1) { // Not middle row selected
				//trace($(".u_menu_source_items > .clickable_row"));
				//if(value = 0) {
					// add divider to the second row
					$(".u_menu_source_items > .clickable_row").eq(0).addClass('u_menu_item_divider');					
					//}else { // 2?
					//$(".u_menu_source_items > .clickable_row").eq(0).addClass('u_menu_item_divider');		
					//}
			}
			// var sel = 'u_source_' + value;
		}
		
		filterWall();
		
	}
	
	function filterWall() {
		trace("filterWall", DATA_SOURCE, IMAGE_DISPLAY_MODE);
		
		var filters = "";
		
		switch(DATA_SOURCE) {
			case DataSources.BOTH.value:
			break;
			case DataSources.UNPUB.value:
			filters = ".u_unpub";
			break;
			case DataSources.PUB.value:
			filters = ".u_pub";
			break;				
		}
		
		switch(IMAGE_DISPLAY_MODE) {
			case ImageDisplaySource.ALL.value:
			break;
			case ImageDisplaySource.WITH_IMAGE.value:
			filters += ".u_has_img";
			break;
			case ImageDisplaySource.WITHOUT_IMAGE.value:
			filters += ".u_no_img";
			break;				
		}
				
		if(filters.length == 0) {
			wall.unFilter();
		}else{
			
			if(SHOW_MENU) filters += ",.u_menu_sel"; // always show the menu. , makes it an AND
			
			trace(filters);
			wall.filter(filters);
		}
	}
	
	function fetchData() {
		trace("fetchData");
		
		var data_url;
		
		if(LIVE_MODE) {
			data_url = DATA_PATH + "?";
			
			if(extra_data_args.length) data_url += "&" + extra_data_args;	 // this could contain hard coded since and now
			
			if(isMicroFicheMode()) data_url += "&fiche"
			
			if((first_data_recieved || ABS_DATE_MODE) && data_url.indexOf("since=") == -1) {
				data_url += "since=" + last_data_server_date_stamp;
			}else{
				if(LIVE_START_OFFSET_MINS > 0 && !ABS_DATE_MODE) data_url += "&pre_fetch_mins=" + LIVE_START_OFFSET_MINS;
			}
			
			if(ABS_DATE_MODE && data_url.indexOf("now=") == -1) data_url += "&now=" + Utils.getSQLTimeStamp( getRunningDate() );
				
		}else{
			data_url = HISTORICAL_DATA_PATH;
		}
		
		// load the data
		$.ajax({
		  dataType: "json",
		  url:  data_url,
		  success: dataLoaded,
		  error : dataLoadError
		});
		
	}
	
	function start(from_ui) {
		
		if(running) return;
		
		trace("START", from_ui == true);
		requestAnimationFrame(animate);		
		running = true;
		
		if(from_ui !== true) control_panel.setValue("Playing", running);
	}
	
	function stop(from_ui) {
		
		if(!running) return;
		
		trace("STOP", from_ui == true);
		running = false;
		
		if(from_ui !== true) control_panel.setValue("Playing", running);		
	}
	
	function animate(nowMsec) {
		stats.begin();	
				
		// measure time
		lastTimeMsec	= lastTimeMsec || nowMsec-(1000/60);
		var deltaMsec	= Math.min(200, nowMsec - lastTimeMsec);
		lastTimeMsec	= nowMsec;

		if(running) {
			update(deltaMsec/1000);
		}
		
		stats.end();
				
		requestAnimationFrame(animate);
	}
	
	function update(delta) {
		
		updateTimeline();
		
		// check for new views in time
		var views_loaded = items.length;
		
		var added = 0;
		var imageless_added = 0;
		var with_image_added = 0;
		
		for(var i = viewed_count+1; i<views_loaded; i++) {			
			var slo = items[i];
			
			if( slo.date.getTime() <= timeline.playback_date.getTime() ) {
				
				if( !isAnimating() ) {

					trace("Viewed", i, Utils.shortDateString(slo.date), Utils.shortDateString(timeline.playback_date), slo.date.getTime(), timeline.playback_date.getTime() );
			
					if(!LIVE_MODE) drawViewedMark(slo);
				
					addSLOToView( slo );

					if(slo.hasImage()) {
						with_image_added++; // TODO here we would tally how many images need loading, and decrement when they load, and once all are loaded call wall.fitWidth()
					}else{
						imageless_added++;
					}

					viewed_count = i; // offset in items we have tested from
					added++;
				
				}else{
					trace("Not adding new view as animating");					
				}
				
			}else{
				// trace(i, slo.date.getTime(), timeline.playback_date.getTime(), Utils.shortDateString(slo.date), Utils.shortDateString(timeline.playback_date));
				break;
			}
		}
		
		/*
			NOTE: this currently not happening
			TODO: check if this is worth it
			TODO: * add to the above cue inside addSLOToView
		*/
		
		/*var sz = add_cue.nodes.length;
			
		if(sz){			
			$("#freewall").prepend(add_cue.nodes);
			// TODO: * Do the specific initialisation per - slo that is appemdmg
			for(var i = 0; i<sz; i++) {
				var cue_slo = add_cue.slos.pop(); // this will clear array				
				add_cue.nodes.pop(); // remove the node too, clearing array
			}
		}
		*/
		
		if(imageless_added > 0 && with_image_added == 0) {
			if(imageless_ids_loaded.length > 0) showAllImagelessReady();
			reflowGrid();
		 }
	
		// Only remove images when there are no images loaded to not break the image loading cue
		if(VISIBILE_LIMIT > 0 && images_to_load_counter == 0) { 
			// we have to prune
			var c = active_data_ids.length;			
			var removed_ids = [];
			
			if(c > VISIBILE_LIMIT) {
				trace("over visible limit, about to remove", c-VISIBILE_LIMIT);
				for(var i = 0; i<c-VISIBILE_LIMIT; i++) {
					
					/*var id = active_data_ids[0];
					// TODO: Dont remove if id maps too active.slo!
					if(active.slo){
						if(active.slo.getDivID() == id) {
							console.warn("Can't cull " + id + " as its active" );
							continue;
						}
					}*/
						
					var id = active_data_ids.shift(); // remove from front
					trace(" About to remove:", id);
					removed_ids.push(id);
					
					 $("div[data-id=" + id + "]").remove();
					// TODO: instead of a remove like this, build it off (scale) and then call refresh when its gone.
				}
				
				// TODO remove all SLOS by id from items[]
				// * Possibly need to update the index too in the divs? the data-id="card_71" or find alt place / way to store active slo's (an object with index as keys?)
				
				// wall.refresh();
				reflowGrid()
			}
			
		}
		
		if(SHOW_MENU) {
			var dt = getRunningDate();
			
			// toggle the colon to every other second
			var visible_state = (dt.getSeconds() % 2 == 0) ? "hidden" : "visible"; // "visible"; //
			var colon_wrapper = '<span class="tcolon" style="visibility:' + visible_state + ';">$</span>'; //text-bottom  vertical-align:top;

			var t = formatDateToTimeStamp( dt, true, CLOCK_SHOW_SECS, colon_wrapper );
			var t2 = formatDateToStamp( dt, false, CLOCK_SHOW_SECS, colon_wrapper ) + ", ";
			
			// console.log($(".u_menu_sel .time_stamp").html(), t, ($(".u_menu_sel .time_stamp").html() == t) );
			
			//	if( $(".u_menu_sel .time_stamp").html() != t ) $(".u_menu_sel .time_stamp").html(t);
			//if( $(".u_menu_sel .time_stamp").text() == "" ) 
				$(".u_menu_sel .time_stamp").html(t);
			//if( $(".u_menu_sel .date").html() != t2 ) 
				$(".u_menu_sel .date").html(t2);
		}
		
		//if(DEBUG) updateWallTileDebugWidget();
		
		if(SHOW_STATUS) updateStatus();
		
	}
	
	function updateTimeline() {
		
		// Shift the time along
		
		if(LIVE_MODE) {
			
			timeline.playback_date.setTime( getRunningDate().getTime() - (LIVE_DATE_OFFSET_MINS * MS_PER_MINUTE) );
			timeline.end_date.setTime( timeline.playback_date.getTime() );
			timeline.position = 1.0; // always now
			
		}else {
			
			timeline.playback_date.setTime( timeline.playback_date.getTime() + (timeline.playback_seconds_step * 1000) )
			
			timeline.position = ((timeline.playback_date.getTime() - timeline.start_date.getTime()) / 1000) / timeline.duration_secs;

			if(timeline.position > 1.0) stop();

			$("#playback_date").text( Utils.shortDateString(timeline.playback_date) ); // + " : " + timeline.position);

			var p = (timeline.canvas.width * timeline.position);// + 10;

			$("#playback_date").css( {"left" : (p+10) + "px"} );

			$("#timeline_pos_canvas").css( {"left" : p + "px"} ); //, "top": "0px"
		}
	}
	
	
	/*
	var _tile_debug_canvas;
	
	function updateWallTileDebugWidget() {
		// Draw to a canvas a copy of the freewall state
		if(_tile_debug_canvas == null) { // create the canvas
			$("#unstacked").append("<canvas id='tile_debug_canvas' width='100px' height='200px' />")
			_tile_debug_canvas = $("#tile_debug_canvas")[0];
		}
		
		var ww = window.innerWidth;
		
		var norm_tile_rects = wall.getNormalisedState( ww );
		
		var scaler = .2;
		var mini_view_rect = {left:0, top:0, width:ww * scaler, height:window.innerHeight * scaler};
		var mini_canvas_rect = {left:0, top:0, width:mini_view_rect.width * 1.25, height:$("#unstacked")[0].getBoundingClientRect().height * scaler};
		
		_tile_debug_canvas.width = mini_canvas_rect.width;
		_tile_debug_canvas.height =  mini_canvas_rect.height;
			
		var context = _tile_debug_canvas.getContext('2d');
		context.fillStyle = "#cccccc";
		context.fillRect(0, 0, _tile_debug_canvas.width, _tile_debug_canvas.height);
		
		// draw rect of view area
		context.fillStyle = "#ffcccc";
		context.fillRect(mini_view_rect.left, mini_view_rect.top, mini_view_rect.width, mini_view_rect.height);

		var un_norm = mini_view_rect.width; // the un-normaliser
		
		// draw cols		
		var col_props = wall.getColumnCountProps();
		for(var i = 0; i<col_props.lefts.length; i++) {
			context.fillStyle = (i % 2 == 0) ? "#ccbbacc" : "#ccddcc"; 	// alternate draw pastel color coluns
			context.fillRect((col_props.lefts[i]/ww) * un_norm, 0, (col_props.widths[i]/ww) * un_norm, mini_canvas_rect.height);		
		}

		context.strokeStyle = "#000";	
		context.strokeRect(mini_view_rect.left, mini_view_rect.top, mini_view_rect.width, mini_view_rect.height);
		
		// console.log(col_props);
		
		// draw rects
		context.strokeStyle = "#ff0000";
		for(var i = 0; i<norm_tile_rects.length;i++) {
			
			context.strokeRect( mini_view_rect.left+(norm_tile_rects[i].left*un_norm), 
									  mini_view_rect.top+(norm_tile_rects[i].top*un_norm), 
									  (norm_tile_rects[i].width*un_norm),
				 					  (norm_tile_rects[i].height*un_norm)
									);
			
		}
		
		context.strokeRect(mini_view_rect.left, mini_view_rect.top, mini_view_rect.width, mini_view_rect.height);
	}*/
	
	//-----------------------------------------------------------
	
	function isMicroFicheMode() { 
		return (DISPLAY_MODE == DisplayTypes.FICHE.value); 
	}
	
	function ficheScrollUpdate() {
		// set the window scroll based on the  mouse x and y
		
		// view
		var vx = mouse_pos.x;
		var vy = mouse_pos.y;
		
		var vw = window.innerWidth;
		var vh = window.innerHeight;
		
		// trace(vx, vy, vw, vh);
		
		// content
 		// var bounds = $("#unstacked")[0].getBoundingClientRect();
		var cw = parseInt( $("#freewall").attr("data-wall-width") ); // normal width accessing was failing to width of window
		if(isNaN(cw)) cw = $("#unstacked").outerWidth();
		
		cw += (OUTER_MARGIN * 2) + (WALL_MARGIN * 2);	
			
		//var ch = $("#unstacked").outerHeight();
		//ch += OUTER_MARGIN * 2;
		
		var ch = $(document).height();
		
		//var body = document.body,  html = document.documentElement;
  	 	//var ch = Math.max( body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight );
		
		var dx = (vx / vw);
		var dy = (vy / vh);
		
		var cx = dx * (cw-vw);
		var cy = dy * (ch-vh);
		
		// trace( dx, dy, cx, cy, cw, ch );
		
		window.scrollTo(cx, cy);
	}
	
	//-----------------------------------------------------------
	
	function getViewsCountBetweenDates(b_date, a_date) {
		// how many views from 
		if(a_date == null) a_date = timeline.start_date;
		
		var views_loaded = items.length;
		
		var count = 0;
		
		for(var i = 0; i<views_loaded; i++) {
			if(items[i].date >= a_date) {
				if(items[i].date <= b_date){
					count++;
				}else{
					break;
				}
			}			
		}
		
		return count;
	}
	
	function timelineJumpToDateAt(pos) {		
		// pos == 0..1		
		timeline.playback_date.setTime( timeline.start_date.getTime() + (pos * timeline.duration_secs * 1000) );		
		timeline.position = ((timeline.playback_date.getTime() - timeline.start_date.getTime()) / 1000) / timeline.duration_secs;
		
		// artificialy set viewed_count so update() algorithm, does not load too any thing leading up to new date from this jump
		viewed_count = getViewsCountBetweenDates(timeline.playback_date, timeline.start_date);		
	}
		
	function updateStatus() {		
		var views_loaded = items.length;
		
		if(timeline.start_date != null) {	
			
			//var cols = wall.getColumnCountProps();
			
			// lefts:column_lefts, widths
			
			$("#status > p").text(
				Utils.getUpTimeStr() + ", running=" + running + ",  views{to:" + viewed_count + ", total:" + views_loaded +  ", visible:" + active_data_ids.length + ", items:" + items.length + "}"+ 
				//", cols=" + cols.count + " / " + $("#freewall").attr("data-total-col") + " - " + (window.innerWidth / wall_seed_width) + " {" + cols.lefts + " : " + cols.widths + "}" +
				", anim=" + ANIMATE + ", wall_anim=" + wall.isAnimating() + ", disp_mode=" + DISPLAY_MODE + ", pub/unpub=" + statistics.pub_count + "/" + statistics.unpub_count +
				 (LIVE_MODE ? "" : ", start=" + Utils.shortDateString(timeline.start_date) + " --> end=" + Utils.shortDateString(timeline.end_date) ) +  " now=" + Utils.shortDateString(timeline.playback_date) + (LIVE_MODE ? ", realtime=" + getRunningDate().toLocaleTimeString() : "") +  ", pos=" + timeline.position.toFixed(4) + 
			  	", data_src=" + DATA_SOURCE + ", cached_data_date=" + cached_data_date 
				// below image statts
				//", unpub_w_img=" + statistics.unpub_w_image + ":" + (statistics.unpub_w_image / statistics.unpub_count * 100).toFixed(2) + "%" +
				//", pub_covers: {thumb=" + statistics.pub_covers.thumb + ":" + (statistics.pub_covers.thumb / statistics.pub_count * 100).toFixed(2) + "%, regular=" + statistics.pub_covers.regular + ":" + (statistics.pub_covers.regular / statistics.pub_count * 100).toFixed(2) + "%}"
			);
		}
		
	}
	
	function toggleStatus() {		
		// hide stats and ui etc.
		SHOW_STATUS = !SHOW_STATUS;
		setStatusVisibility(SHOW_STATUS);		
	}
	
	function setStatusVisibility(state) {
		
		if(state) {
			updateStatus();
			$("#status").show(0);			
		}else{
			$("#status").hide(0);
		}
		
	}
	
	function toggleTimeline() {		
		SHOW_TIMELINE = !SHOW_TIMELINE;
		setTimelineVisibility(SHOW_TIMELINE);		
	}
	
	function toggleTextLabels() {
		SHOW_LABELS = !SHOW_LABELS;
		$(".card_text_label, #details-labels").css({"visibility": (SHOW_LABELS ? "visible" : "hidden") });
	}
	
	function setTimelineVisibility(state) {
		
		if(state && !LIVE_MODE) { // turn em on
			updateTimelineImage();
			$("#timeline").show(0);			
		}else{ // turn em off
			$("#timeline").hide(0);
		}
		
	}
	
	function updatePageStyle() {
		// set doc style based on 
		
		if($("head > #page-css").length == 0) {
			$("head").append('<style id="sd-page-css" type="text/css"></style>');
		}

		var style_src = "";

		if(ANIMATE == 2) { // use CSS transitions
			style_src += "\n#unstacked .card {" + 
				"transform:scale(0); " +
				"transition:transform .5s ease .33s, left .5s ease, top .5s ease; " + /*, width .5s ease, height .5s ease*/
			"}";
			
		}else if(ANIMATE == 3) { // use GSAP
			style_src += "\n#unstacked .card {" + 
				"transform:scale(0); " +
				/*"transition:width .3s ease, height .3s ease;" +*/ // also css tween the w & h so things are smoother?
			"}";
			
		}
		
		style_src += "\n#unstacked .free-wall { " +
							"margin: " + OUTER_MARGIN + "px; " +
		"}";
		
		/*if(isMicroFicheMode()) {
				//dev for now
			style_src += "\
				body { overflow:visible; }\
			}"
		}*/
				
		if(HIDE_SCROLL) {
			style_src += "\nbody { overflow:hidden; }";
		}
		
		$("head > #sd-page-css").html(style_src);
		
	}
	
	//------------------------------------------------------------------------------------------------
	
	function dataLoaded(data) {
	
		// load the stuff
	 	// items = [];
		// viewed_count = -1; 
		
		if( data.hasOwnProperty("now") ) {
			last_data_server_date_stamp = data["now"];
		}
		
		if( data.hasOwnProperty("trans") ) {
			// the transposed cached date, actual date we are showing
			cached_data_date = data["trans"];
		}
		
		if( data.hasOwnProperty("views") ) {
			
			var c = data.views.length;
			
			trace(c + " views", data);
			
			var n = 0; // used as the card index, modified if we dont add the card.
			
			for(var i = 0; i<c; i++, n++) {
				
				var slo = SLO.fromJson( data.views[i], n ); 
				
				var can_add = false;
				
				//if(DATA_SOURCE == DataSources.BOTH.value) {
					 can_add = true;
				/*}else{
					if(slo.isPublished()) {
						can_add = (DATA_SOURCE == DataSources.PUB.value);
					}else{
						can_add = (DATA_SOURCE == DataSources.UNPUB.value);
					}
				}*/
				
				// if(can_add && SHOW_WITHOUT_IMAGE == 0) can_add = slo.hasImage();
				
				if(can_add) {
					items.push(slo);
				
					if(slo.isPublished()) {
						statistics.pub_count++;
						if(slo.hasImage()) statistics.pub_covers.thumb++;
						if(slo.hasRegularImage()) statistics.pub_covers.regular++;					
					}else{
						statistics.unpub_count++;	
						if(slo.hasImage()) statistics.unpub_w_image++;
					}
				}else{
					n--;
				}
				
			}
			
			items.sort( function(a, b) {
				// ASC. oldest first
				if(a.date.getTime() > b.date.getTime() ) {
					return 1;
				}else if(a.date.getTime() < b.date.getTime() ){
					return -1;
				}
				return 0;
			});
			
			c = items.length;
			for(var i = 0; i<c; i++) {
				items[i].index = i;	// update indexes now its been sorted
			}

			if(!LIVE_MODE) {
				
				if(c) {
					timeline.start_date = new SL_Tz_Date(items[0].date);
					timeline.end_date   = new SL_Tz_Date(items[items.length-1].date);
					timeline.duration_secs = (timeline.end_date - timeline.start_date) / 1000;			
					timeline.playback_date = new SL_Tz_Date(timeline.start_date);
					timeline.position = 0;
				}
				
				updateTimelineImage();
			
				$("#timeline_labels").text(""); // + " : " + timeline.position);
			
				if(START_OFFSET > 0) timelineJumpToDateAt(START_OFFSET);
			
				setTimelineVisibility(SHOW_TIMELINE);
			}
			
			if(ADD_ALL) {	// special case, add all the slo at once
				trace("ADDING ALL!");
				for(var i = 0; i<c; i++) {
					addSLOToView(items[i]);
				}
			}else{
				
				var can_start = !first_data_recieved && !running;
				
				if(can_start) {
					
					start();			
						
					if(isMicroFicheMode()) AUTO_REFRESH = false;
					
				}
			}
			
			first_data_recieved = true;
			
			
		}else{
			console.error("Json missing 'views'");
		}
	
		if(LIVE_MODE && AUTO_REFRESH) {
			setTimeout(fetchData, (ABS_DATE_MODE ? LIVE_REFRESH_INTERVAL/ABS_DATE_SPEED : LIVE_REFRESH_INTERVAL) );
		}
		
	}
	
	function dataLoadError(jqXHR, textStatus, errorThrown) {
		console.error("dataLoadError", textStatus, errorThrown);
		
		if(LIVE_MODE && AUTO_REFRESH) { // Try again later
			setTimeout(fetchData, LIVE_REFRESH_INTERVAL);
		}
	}
	
	function getTileSeedWidth( slo ) {
		
		var sizer = Math.random();
		
		if(slo != null) {
			if(slo.isPublished()) {
				if(slo.hasRegularImage()) { 
					// weight it to not be biggest
					sizer = Math.min(.25, sizer); 
				}else if(slo.hasImage()){
					// assume a small thumb cover so keep it small
					sizer = Math.min(.25, sizer); 
				}else{
					sizer = 0.0;
				}
			}else if(slo.hasRegularImage()) { // weight it to be one of the top 2 sizes?
				sizer = Math.min(1.0, sizer+.5); 
			}
		} else {
			// return a max size?
			sizer = 1.0;
		}
		
		// trace("sizer:" + sizer, "w:"+ w, "pub:" + slo.isPublished(), "reg:" + slo.hasRegularImage(), "img:" + slo.hasImage());
		
		return (1 + 2 * sizer) * wall_seed_width; //  << 0
	}
	
	function addSLOToView( slo ) {
		
		// add a div to the wall representing the SLO
	
		var w = getTileSeedWidth( slo );
		
		var index = slo.index;
		
		var id = slo.getDivID(); // NOTE: this id is getting writen over by freewall once its first processed too custom fw thing (eg, "1-2"), so am using data-id instead.
		
		var line1 =  slo.title;
		var line2 = "";
		
		var hide_labels = !SHOW_LABELS || (!slo.isPublished() && !slo.hasImage() && !DEBUG_LABELS);
		
		var label_styles = (hide_labels ? "visibility:hidden;" : ""); // 
		
		if(slo.isPublished()) {
			// set the label bg to our color
			line1 = (slo.call_num.length ? slo.call_num : "");			
			if(line1.length == 0) line1 = (slo.dewey.length ? slo.dewey : "");
			
			label_styles += "background-color:" + (Dewey.getRGBA( slo.dewey_index, .8) ) + ";";
			
		}else{ // not published
			if(slo.hasImage()) {
				line2 = (slo.creator.length ? slo.creator : "");
				line2 += (slo.date_of_work.length ? (line2.length ? ", " : "") + slo.date_of_work : "");
				line2 += (slo.dig_no.length ? (line2.length ? ", " : "") + slo.dig_no : "");
			}else{
				// no image, so no details / date line as most should be in the title? (but not truncated authors).
				line1 = (slo.call_num.length ? slo.call_num : "");
				label_styles += "background-color:" + NON_PUB_NO_IMG_BG_COL + ";";
			}
		}
		
		if(line1.length < 1 && line2.length < 1 && hide_labels) label_styles += "display:none;"
		
		var label_html = "<div class='card_text_label' style='" + label_styles + "' >" + 
									"<p class='debug_label' style='display:" + (DEBUG_LABELS ? "block" : "none" ) + "'; >" + (index) + ": " + slo.getDateString() + "</p>" + 
									"<p class='title' >" + line1 + "</p>" +
									(line2.length ? ("<p class='date' >" + line2 + "</p>") : "") +
								"</div>";
		
		var type_class = slo.isPublished() ? "u_pub" : "u_unpub"
		
		if(slo.hasImage()) { //}&& SHOW_WITH_IMAGE) {
			
			var img_url = slo.getImageURL( (slo.hasRegularImage()) ? "img_r" : "img_t" );
			
			var  card_node = "<div data-id='" + id + "' class='card u_has_img " +type_class + "' style='width:" + w + "px; visibility:hidden;'>" +
							"<img src='" + img_url + "' class='unselectable undragable' width='100%'>" +
							label_html +
						"</div>";
			
			images_to_load_counter++;
			
			$("#freewall").prepend(card_node);
			
			var img_node =  $("div[data-id=" + id + "] > img");

			var load_response = function(evt) {
				// trace("img loaded",  evt.target.currentSrc, evt.type);
				if(evt.type == "error") {
					console.error("Image load fail", evt.target.currentSrc );
					// TODO: deal with this somehow, change evt.target card to an imageless one?
				}else{
					// trace("img loaded", evt.type);
				}
				
				images_to_load_counter--;
				image_ids_loaded.push(id);
				
				if(images_to_load_counter == 0) {
					allImagesLoaded();
				}
				
			}
			
			img_node.load( load_response ).error( load_response );

		}else { // if(SHOW_WITHOUT_IMAGE) { 
			// No image and we are set to show these.
								
			var cover_ratio = 1; // 4/3.8		
			w = Math.round(wall_seed_width * cover_ratio);
				
			var card_node = "<div data-id='" + id + "' class='card u_no_img " + type_class + "' style='width:" + w + "px; ' >" +
										label_html +
								"</div>";
						
			$("#freewall").prepend(card_node);
											
			//createCanvasCover(id, slo, w);
			createHtmlCover(id, slo, w);
			
			imageless_ids_loaded.push(id);
			
			// reflowGrid();
			
			/*}else{
			trace("Can't show, conditions too tight");
			return;*/
		}
		
		$("div[data-id=" + id + "]").click( coverClick );
		
		if(AUDIO_FX) {
			var notes = ["Ab","A","Bb","B","C","C#","D","Eb","E","F","F#","G"];			
			var i = slo.isPublished() ? slo.dewey_index : 11; 	// slo.dewey_index; == 0..10			
			var note = notes[i]; // unpub default
			var octave = [3,4,5][Math.floor(Math.random()*3)];
			var t = Math.random() + 0.5;
			// synth.triggerAttackRelease("C4", "8n"); //play a middle 'C' for the duration of an 8th note		
			panner.pan.value = Math.random() * 2 - 1;
			// panVol.volume.value = Math.random();
			trace(note+octave, t, panner.pan.value );
			// synth.triggerAttackRelease(note+octave, t );	// trigger "C4" and then 1 second later trigger the release
			//synth.triggerAttack(note+octave);
			synth.triggerAttackRelease([note+octave], t);
			// triggerAttack (notes[, time][, velocity])
			//synth.triggerRelease(t);
		}
		
		active_data_ids.push(id);
		// statistics.visible_slo++;
		
	}

	var card_on_gsap_props = { css:{transform:"scale(1)"}, delay:0.33}; //, ease:Bounce.easeOut};

	function allImagesLoaded() {
		trace("allImagesLoaded", images_to_load_counter, image_ids_loaded.length);
		// turn all images on at once
		var c = image_ids_loaded.length;
		while(--c > -1) {
			var id = image_ids_loaded.pop();
			//trace(c, id);
			var dv = $("div[data-id=" + id + "]");
			
			dv.css({visibility:"visible"});
			
			if(ANIMATE == 3) {
				// TweenMax.set(dv, {transformOrign:'50% 50%'});
				TweenMax.to( dv, .5,  card_on_gsap_props);
			}else if(ANIMATE != 0){
				dv.css({transform:"scale(1)"}); 
			}
		}
		
		if(imageless_ids_loaded.length > 0) showAllImagelessReady();
		
		reflowGrid();	
	}
	
	function showAllImagelessReady() {
		trace("showAllImagelessReady");	
		
		var c = imageless_ids_loaded.length;
		while(--c > -1) {
			var id = imageless_ids_loaded.pop();
			if(ANIMATE == 3) {
				TweenMax.to( $("div[data-id=" + id + "]"), .5, card_on_gsap_props );
			}else{
				$("div[data-id=" + id + "]").css({transform:"scale(1)"}); 
			}
		}
		
		// Delay to change the scale so it builds on
		/*setTimeout(function() {
			//trace("timeout to tranform image less: " + "cover_canvas_" + index);
			$("div[data-id=" + id + "]").css({transform:"scale(1)"});
		}, 100);*/
		
	}
	
	function fixMenuPos( wall_col_props ) {
		
		if(wall_col_props == null) wall_col_props = wall.getColumnCountProps();
		var column_count = wall_col_props.count;
		
		// TODO: if wall_col_props.last_width > CONST, we dont put an open menu in the -2 colum n
		
		//var l = Math.floor(window.innerWidth/wall_seed_width) - 1;
		//l = Math.max(0, l);
		
		var sub = menu_open ? 2 : 1; // if open we put it in second last column
		var c = Math.max(0, column_count-sub);
		
		// if menu open put 
		
		trace("menu fix to col ->", c, "/", column_count);
		wall.fixPos({
      	 top: 0,
			 left: sub, /* c The column 0 index */
			 block: $('.u_menu_sel')
		});
		
	}
	
	function reflowGrid( w ) {		
		
		var is_phone = Utils.isMobile.any(); // && !Utils.isMobile.iPad();
		
		if(w == null) {
			if(isMicroFicheMode()) {
				w = window.innerWidth * 4;
			}else{
				w = (is_phone ? window.width : window.innerWidth) - ((OUTER_MARGIN * 2) + (WALL_MARGIN * 2));
			}
		}
		// if fiche_mode we reflow to a big (overscan) dimension, otherwise the fit of the wall internally
		
		if(MENU_ON_TOP && menu_open && !is_phone) { 
			// shift the content in sympathy to the menus edge
			// console.log(window.innerWidth, $("#u_menu").outerWidth());			
			var menu_bounds = $("#u_menu")[0].getBoundingClientRect();
			// window.innerWidth - 
			w = menu_bounds.left - (OUTER_MARGIN/2 + WALL_MARGIN); // (OUTER_MARGIN*5); // so it gets reset
		}
		
		trace("reflowGrid", w);
		
		if(SHOW_MENU && !MENU_ON_TOP) {
			// TODO: Try: .u_menu_sel off | fitWidth | determine cols, then re add and fix. ??
			
			wall.fitWidth(w);
			
		//	var wall_col_props = wall.getColumnCountProps( ); //true );
			
		//	fixMenuPos(wall_col_props); // update the fixed pos of the menu
			
			/*var post_wall_col_props = wall.getColumnCountProps();
			
			if( wall_col_props.count != post_wall_col_props.count ) {
				// Col count changed - rerun as menu will be in wrong spot
				trace("refix menu pos");
				fixMenuPos( post_wall_col_props );
				wall.fitWidth( w );
			}*/
			
			wall.fillHoles();
			
		}else{
			
			wall.fitWidth(w);			
		}
		
		// wall.fitHeight(window.innerHeight-30);
		// wall.fitZone( window.innerWidth, window.innerHeight );
	}
	
	function isAnimating() {
		if(ANIMATE == 0) return wall.isAnimating();
		
		return wall.isAnimating() || TweenMax.isTweening("#details-card") || TweenMax.isTweening("#u_overlay_bg") || TweenMax.isTweening("#instruction-box");
	}
	
	function coverClick(e) {
		trace("coverClick", e);
		if( isAnimating() ) {
			trace("Can't launch as something is animating");
			return;
		}

		active.card_div = $(e.currentTarget);		
		var id = parseInt( active.card_div.attr("data-id").substr(4) ); // remove card prefix to get at int eg, card34
		
		trace("clicked id of ", active.card_div.attr("data-id"), id);
		
		showDetailsView(id, e.shiftKey);
	}
	
	function createHtmlCover(id, slo, d) {
		
		var palette = {bg:NON_PUB_NO_IMG_BG_COL, text:"#ffffff" };
		
		if(slo.isPublished()) { // use dewey
			palette.bg = Dewey.getHex(slo.dewey_index);
		}
		
		$("div[data-id=" + id + "]").prepend("<div id='cover_" +  slo.index + "' class='cover' style='min-height:" + d + "px' >" + // width:" + d + "px; 
																		"<p>" + slo.title + "</p>" +
																	"</div>");
				
		$("div[data-id=" + id + "]").css({"background-color":palette.bg});
		
		// pad out the bottom of box to allow for a label
		var has_label = $("div[data-id=" + id + "] > .card_text_label > .title").text().length > 1;
		
		// how to make it square
		// get the height of the thing, and work out how many pix (ems?) it needs to make it d?
		
		// $("div[data-id=" + id + "] > .cover").css({"margin-bottom": (has_label ? "4.0em" : "2.2em") });
		
	}
	
	function createCanvasCover(id, slo, d) {
		
		// find the canvas and add text to it.
		$("div[data-id=" + id + "]").prepend("<canvas id='cover_canvas_" + slo.index + "' width='" + d + "px' height='" + d + "px' />");
		
		var canvas = $("#cover_canvas_" + slo.index)[0];
		var context = canvas.getContext('2d');
		
		var palette = {bg:NON_PUB_NO_IMG_BG_COL, text:"#ffffff" };
		
		if(slo.isPublished()) { // use dewey
			palette.bg = Dewey.getHex(slo.dewey_index);
		}
		
		context.fillStyle = palette.bg;
		context.fillRect(0, 0, canvas.width, canvas.height);		
		context.fillStyle = palette.text; // "#f9b233";
		
		var size_mod = Utils.isMobile.any() && !Utils.isMobile.iPad() ? 1.5 : 1.0; // increase text on device
		
		context.font = (14 * size_mod) + 'px Gotham-Medium';
		context.textAlign = "left"; 
		
		var maxWidth = canvas.width-30;
		var lineHeight = 18 * size_mod;
		
		var rect = wrapTextToCanvas(context, slo.title, 15, 30, maxWidth, lineHeight, false, 5);
		
		var draw_icon = false; // slo.title.charCodeAt(0) < 80// ABCDEFGHIJKLMNOPQRSTUVWXYZ = 65 66 67 68 69 70 71 72 73 74 75 76 77 78 79 80 81 82 83 84 85 86 87 88 89 90
		if(draw_icon) {			
			context.globalAlpha = .4;
			var icon_rect = {x:rect.x, y:rect.y+rect.height+6, width:18, height:18}; // was 15
			context.fillStyle = "#FFFFFF";
			context.beginPath();
			context.moveTo(icon_rect.x, 					icon_rect.y);
		   context.lineTo(icon_rect.x+icon_rect.width,  	icon_rect.y);
		   context.lineTo(icon_rect.x+icon_rect.width,  	icon_rect.y+icon_rect.height);
			context.lineTo(icon_rect.x,  					icon_rect.y+icon_rect.height);
			context.lineTo(icon_rect.x, 					icon_rect.y);
		   context.fill();
		}
		
		/*if(slo.isPublished()) {
			if(slo.creator.length) {
				wrapTextToCanvas(context,  slo.creator, canvas.width/2 + 15, canvas.height - lineHeight - 36, maxWidth, lineHeight);
			}
		}*/
			
	}
	
	function wrapTextToCanvas(context, text, x, y, maxWidth, lineHeight, dont_render, limit_lines) { // candidate for utils
		var words = text.split(' ');
		var line = '';
		dont_render = (dont_render === true);
		limit_lines = (limit_lines == undefined) ? 99999999 : limit_lines;
		
		var used_rect = {x:x,y:y-lineHeight/1.5,width:0,height:0}; // NOTE: y calc is bodge
		
		// TODO: if dontRender, then .. - used to get the rect only.
		var line_counter = 0;
		
		for(var n = 0; n < words.length; n++) {
			
			var nextLineTest = line + words[n] + ' ';			
			var metrics = context.measureText(nextLineTest);
						
			// var is_return = (words[n] == "\n");
			if(line_counter > limit_lines) {
				break;
			}
			
			if ( (metrics.width > maxWidth && n > 0)) { //  || is_return
				
				if(line_counter == limit_lines) { 	// change the last char to an elipse NOTE: not ideal, really should work out where actual text ends on previous line
					line = line.substr(0, line.length-2) + '...';
				}
				
				context.fillText(line, x, y);
				line_counter++;
				line = words[n] + ' ';
				y += lineHeight;
				
				used_rect.height += lineHeight;
				
			} else {
				line = nextLineTest;
				used_rect.width = Math.max(used_rect.width, metrics.width);
			
			}
			
		}
		
		if(line_counter < limit_lines) {
			context.fillText(line, x, y);
			line_counter++;
			used_rect.height += lineHeight;
		}
		
		return used_rect;
	};

	function updateTimelineImage() {
		
		// create a canvas and attach it to the screen
		
		if(timeline.canvas == null) {
			timeline.canvas = document.createElement('canvas');
			timeline.canvas.id = "timeline_canvas";
			timeline.canvas.height = 48;
			
			$("#unstacked").append("<div id=\"timeline\"> " +  
														"<div id=\"timeline_labels\">Start Time - End Time</div> " +
													"</div>");
			
			$("#timeline").append( timeline.canvas );
			
			timeline.canvas.onclick = function(e) {
				var n = e.offsetX / timeline.canvas.width;
				trace("timeinle press", e, n)
				timelineJumpToDateAt(n);
				if(!running) updateTimeline(); 
			};
			
			$("#timeline").append("<div id=\"playback_date\">0:00:00</div>");
			
			// overlay position indicator
			timeline.position_canvas = document.createElement('canvas');
			timeline.position_canvas.id = 'timeline_pos_canvas';
			timeline.position_canvas.width = 1;
			timeline.position_canvas.height = 48+30;
			
			var pctx = timeline.position_canvas.getContext('2d');
			pctx.fillStyle = "#FF0000";
			pctx.fillRect(0, 0, timeline.position_canvas.width, timeline.position_canvas.height);
			
			$("#timeline").append( timeline.position_canvas );
			
		}
		
		timeline.canvas.width = $("#unstacked").width() - 20;//window.innerWidth - 40;
		
		var ctx = timeline.canvas.getContext('2d');
		
		ctx.fillStyle = "#7e5944"; //"#777777"; // "#f9b233"; // base color
		ctx.fillRect(0, 0, timeline.canvas.width, timeline.canvas.height);
		
		// Candy strip days
		var days_dif = (timeline.end_date - timeline.start_date) / (1000*60*60*24);
		var day_pixel_w = timeline.canvas.width / days_dif; // width of a day
		
		ctx.fillStyle = "#EFE0B9"; // "#CCCCCC"; // "#f28290"; // stripe colors;
		
		var c = Math.ceil(days_dif);
		if(c > 0) { // at least a 2 day period
			
			// TODO: find where the first day starts.
			var secs_in_day_one = Utils.secondsTillMidnight(timeline.start_date);
			
			var x = day_pixel_w * (secs_in_day_one / (60*60*24)); // 86400
			
			// work out how many seconds from midnite
			
			for(var i = 1; i<c; i++) {
				if(i % 2 != 0) {
					ctx.fillRect(x, 0, day_pixel_w, timeline.canvas.height);
					x += (day_pixel_w * 2);
				}
			}
		}
		
		var unpub_y_end = (timeline.canvas.height/2) - 3;
		var pub_y_start = (timeline.canvas.height/2) + 3;
		
		ctx.strokeStyle = "#000000";
		ctx.lineWidth = 1;
		// ctx.lineCap = 'butt';
		ctx.globalAlpha = .75;
		
		ctx.beginPath();
		// draw every object that has an image
		for(var i = 0; i<items.length; i++) {
			//if(!items[i].isPublished()){
			if(items[i].hasImage()) {
				var n = ((items[i].date - timeline.start_date) / 1000) / timeline.duration_secs; // decimal pos
				var x = timeline.canvas.width * n;
				if(items[i].isPublished()){ //draw published at bottom
					ctx.moveTo(x,pub_y_start);
					ctx.lineTo(x,timeline.canvas.height);		
				}else{
					ctx.moveTo(x,0);
					ctx.lineTo(x,unpub_y_end);
				}
			}
		}
		ctx.stroke();
		
		// go over top and stripe and thing with no covers
		
		ctx.strokeStyle = "#FFFFFF";		
		ctx.globalAlpha = .66;
		// draw allo objects with out images.
		ctx.beginPath();
		for(var i = 0; i<items.length; i++) {
			if(!items[i].hasImage()) {
				var n = ((items[i].date - timeline.start_date) / 1000) / timeline.duration_secs; // decimal pos
				var x = timeline.canvas.width * n;
				if(items[i].isPublished()){ //draw published at bottom
					ctx.moveTo(x,pub_y_start);
					ctx.lineTo(x,timeline.canvas.height);		
				}else{
					ctx.moveTo(x,0);
					ctx.lineTo(x,unpub_y_end);
				}
			}
		}
		ctx.stroke();
		
		ctx.globalAlpha = 1.0;
		// unit ? work in minutes as thats what we got (for now so make it seconds)?
				
		// now draw lines too.
		
	}
	
	function drawViewedMark(item) {
		
		var ctx = timeline.canvas.getContext('2d');
		ctx.strokeStyle = "#00ff00"; // item.isPublished() ? "#003366" : "maroon";
		ctx.lineWidth = 1;
		// ctx.lineCap = 'butt';
		ctx.globalAlpha = 1.0;
		
		var unpub_y_end = (timeline.canvas.height/2) - 3;
		var pub_y_start = (timeline.canvas.height/2) + 3;
		
		ctx.beginPath();
		var n = ((item.date - timeline.start_date) / 1000) / timeline.duration_secs; // decimal pos
		var x = timeline.canvas.width * n;
		if(item.isPublished()) {
			ctx.moveTo(x, pub_y_start);
			ctx.lineTo(x, timeline.canvas.height);
		}else{
			ctx.moveTo(x, 0);
			ctx.lineTo(x, unpub_y_end);
		}
		
		ctx.stroke();
		
		ctx.globalAlpha = 1.0;
		
	}
	
	//------------------------------------------------------------------------------------------------

	function showDetailsView(index, slowmo) {
		
		var slo = active.slo = items[index]; // TODO will need to store this somewhere else as item indexes will change when we remove

		trace("showDetailsView", index, slo.toString(), slo);
		
		//Utils.hide( "#home-box" );
		//Utils.hide( "#instruction-box" );
		
		trackEvent("show_details_view", index);
		
		var p = $("#details-labels > p");
		
		p.text(""); // clear all paragraphs
		
		if(slo.isPublished()) { 
			
			if(slo.hasImage()) p.eq(0).html("<span class=\"heading\" >" + slo.title + "</span>");
			
			if(slo.date_of_work.length) p.eq(1).html("<span class=\"heading\" >Published:</span>" + slo.date_of_work);
		
			if(slo.call_num.length) {
				p.eq(2).html("<span class=\"heading\" >Call Number:</span>" + slo.call_num);
			}else if(slo.dig_no.length) {
				p.eq(2).html("<span class=\"heading\" >Digital Order Number:</span>" + slo.dig_no);
			}
			
			if(slo.isbn.length) p.eq(3).html("<span class=\"heading\" >ISBN:</span>" + slo.isbn);
			
			// $("#details-type").hide();
			// $("#details-type > h1").text("Collection / Series / Item / Dewey: [" + Dewey.categories[slo.dewey_index] + "]");
			
		}else{
			
			// $("#details-type").show();
			
			p.eq(0).html("<span class=\"heading\" >" + slo.title + "</span>");
		
			var details_txt = "";
		
			if(slo.creator.length) details_txt = slo.creator;
			
			if(slo.date_of_work.length) details_txt += (details_txt.length ? ", " : "") + slo.date_of_work;
		
			if(slo.location.length) details_txt += (details_txt.length ? ", " : "") + slo.location.join(", ");
		
			if(details_txt.length) p.eq(1).text(details_txt);
		
			if(slo.dig_no.length) {
				p.eq(3).html("<span class=\"heading\" >Digital Order Number:</span>" + slo.dig_no);
			}else if(slo.call_num.length) {
				p.eq(3).html("<span class=\"heading\" >Call Number:</span>" + slo.call_num);
			}
			
		}
		
		if(slo.topics.length) {
			p.eq(4).html( "<span class=\"heading\" >Topics:</span>" + slo.topics.join(", ") );
		}
		
		var url = slo.getLocationURL();
		var has_url = url.length > 0 && !isMicroFicheMode();
		
		$("#details-link-anchor").attr("href", url).css({ 	"display": (has_url ? "initial" : "none"), 
																			"visibility":(has_url ? "visible" : "hidden")
																}); 

		$("#details-card > #details-labels").css( {"padding-right": (has_url ? "40px" : "12px") } );	// edit the padding-right so text flows on when													
	
		var mod = (slowmo == true) ? 10.0 : 1.0; // speed modifier for builds
		
		var hero_img = $("#details-card > #hero-img").toggleClass( "pub_details_cover_img", (slo.hasImage() && slo.isPublished()) );
		
		if(slo.hasImage() ) {
			
			var img_url = slo.getBestImgUrl(GET_LARGE_IMAGES ? "" : "img_l");
			
			hero_img.load( function() {
				trace( "image loaded", $(this).attr('src') );
				detailsImageLoaded(this, mod);
			});
			
			$("#u_overlay > #loading_spinner").show(330); // a delay so it can possibly load first before showing
			
			// trace("loading details image " + img_url);
			
			if(hero_img.attr("src") != img_url) {
				hero_img.attr("src", img_url);
			}else{
				setTimeout( function() { hero_img.load(); }, 100 );
			}
			
			Utils.hide( $("#details-card > #details-no-image") );
			
		}else{ // NO image
			
			// Remove & hide image
			Utils.hide( hero_img.attr("src", "") );
			
			$("#details-card > #details-no-image > #details-big-text").text( slo.title );
			
			Utils.show( $("#details-card > #details-no-image") );
			//sizeDetailsView();		
		}
		
		presentDetailsView( (slo.isPublished() ? Dewey.getHex(slo.dewey_index) : NON_PUB_NO_IMG_BG_COL), slo.hasImage(), mod );
		
	}
	
	function presentDetailsView( bg_col, has_img, mod, extra ) {
		
		details_view_visible = true;
		
		$("#details-card").css( { "background-color": bg_col, "visibility": (has_img ? "hidden" : "visible"), display:"block"} );
		
		if( !has_img ) {
			sizeDetailsView();
			buildOnDetailsCard(mod);
		}
		
		Utils.show( $("#u_overlay") );
			
		mod = isNaN(mod) ? 1 : mod;
				
		TweenMax.to("#u_overlay_bg", mod*.33, {autoAlpha:1, delay:.2*mod});		
	}
	
	function detailsImageLoaded( img, mod ) {
		$("#u_overlay > #loading_spinner").hide();
		
		Utils.show( $(img) );
		sizeDetailsView();
		buildOnDetailsCard(mod);
		
		Utils.show( "#details-card" ); // reveal whole thing
	}
	
	function hideDetailsView( mod, callback ) {
		trace("hideDetailsView");
		
		if( isAnimating() ) {
			trace("Can't hide details view as animating");
			return
		}
		
		if( callback == null && !Utils.isHidden("#home-box") ) { // its a home page view
			callback = homeHidden;
		}
		
		if(AUTO_CLOSE_HOME) clearTimeout(home_closer_timeout_id);
		
		details_view_visible = false;

	 	mod = (mod == null || isNaN(mod)) ? 1.0 : mod;
				
		TweenMax.to("#u_overlay_bg", .25*mod, {autoAlpha:0, delay:.25*mod, onComplete:function () { detailsViewHidden(callback);} } );

		$("#details-card").unbind('click');
		$("#u_overlay_bg").unbind('click');
		
		buildOffDetailsCard(mod);
		
	}
	
	function detailsViewHidden( callback ) {		
		active.slo = active.card_div = null;		
		$("#u_overlay, #u_overlay_bg, #details-card, #details-card > #hero-img, #details-card > #details-no-image, #home-box, #instruction-box").css({"visibility":"hidden"});
		$("#details-card").css({"width": "1px", "height": "1px", "display":"none"}); // minimise it's size
		if(callback && typeof callback == "function") callback(); // apply() might be better?
	}
	
	function buildOnDetailsCard( mod ) {
		
		var dims = getActiveDivTargetDims();
		mod = (mod == null || isNaN(mod)) ? 1.0 : mod;
		
		trace("buildOnDetailsCard", mod, dims);
		
		var labels_h = $("#details-labels").outerHeight();
		var details_card_h = $("#details-card").outerHeight();
		// Adjusting the height, so the image grows exactly from the other, and the label slides down/on
		
		var start_props = {scaleX:dims.scaleX, scaleY:dims.scaleY, top:dims.top+"px", left:dims.left+"px", height:(details_card_h-labels_h)+"px", autoAlpha:0};
		var end_props   = {scale:1, top:0+"px", left:0+"px", height:details_card_h+"px", autoAlpha:1, ease:Power2.easeOut, onComplete: detailsCardBuiltOn};
		
		if(active.slo) {
			if(active.slo.isPublished() && active.slo.hasImage() ) {
				// Animate the width to show the coloured strip at side appearing
				// Note: may not work as expected if its a non-portait scape cover image.
				start_props.width = $("#details-card > #hero-img").outerWidth();
				end_props.width =  $("#details-card").outerWidth();
			}
		}
		
		TweenMax.fromTo("#details-card", .5*mod, start_props, end_props);

		$("#u_overlay_bg").click( function(e) {
				trace("click on u_overlay_bg");
				hideDetailsView( e.shiftKey ? 10 : 1 ); 
				trackEvent("close_details_view", "click", "overlay_bg");
			}
		);
				
	}
	
	function detailsCardBuiltOn() {
		trace("detailsCardBuiltOn");
		
		$("#details-card").click( function(e) {
				// an event to stop the click off happening
				// trace("details-card click");
				
				var over_check = function (target, id) {
					return target.id == id || $(target).parents("#" + id).size();
				};
				
				// Check if we are over the link buton
				if ( over_check(e.target, "details-link-anchor") ) { // e.target.id == "details-link-anchor" || $(e.target).parents("#details-link").size() ) { 
		         	// trace("Over the link");
						trackEvent("details_view_anchor", "click");
						
		      } else if( over_check(e.target, "details-labels") ){  
					// over the text labels, so dont close
					if(e.altKey) console.log(active.slo);
				   e.stopPropagation(); e.preventDefault(); e.stopImmediatePropagation(); 
					return false;
				}else{
		         /* 	// Block it e.stopPropagation();e.preventDefault(); e.stopImmediatePropagation(); return false;*/
					trackEvent("close_details_view", "click", "details_view");
					hideDetailsView( e.shiftKey ? 10 : 1 ); // close it
				}
			
			});
			
	}
	
	function buildOffDetailsCard(mod) {
		// target the 	
		var dims = getActiveDivTargetDims();
		mod = (mod == null || isNaN(mod)) ? 1.0 : mod;
		
		var labels_h = $("#details-labels").outerHeight();
		var details_card_h = $("#details-card").outerHeight();
		
		var tween_props = {autoAlpha:0, scaleX:dims.scaleX, scaleY:dims.scaleY, top:dims.top+"px", left:dims.left+"px", height:(details_card_h-labels_h)+"px"};
		
		if(active.slo) {
			if(active.slo.isPublished() && active.slo.hasImage() ) {
				// Animate the width to show the coloured strip at side disappears
				// Note: may not work as expected if its a non-portait scape cover image.
				tween_props.width = $("#details-card > #hero-img").outerWidth();
			}
		}
		
		TweenMax.to("#details-card", .5*mod, tween_props);
	}

	function getActiveDivTargetDims() {
		
		var details_sizes = getDetailsViewSizes();
//		trace("getActiveDivTargetDims", pos, "w=" + w, "h=" + h, "x=" + x, "y=" + y, "dw=" + details_sizes.width, "dh=" + details_sizes.height, "sw="+window.innerWidth, "sh="+window.innerHeight);
		
		// NOTE: the coordinate space of the #details-card (due to centernig css) is 0,0 in centre, - to the right, & + to the left

		if(active.card_div == null) {
			
			var w = 320;
			var h = 240;
			
			var x = w*-.5; // window.scrollX - (window.innerWidth  / 2);
			var y = h*-.5; // window.scrollY - (window.innerHeight / 2);
		
			var sx = w / details_sizes.width;
			var sy = h / details_sizes.height;
			
		 }else{
		
			var pos = active.card_div.offset(); //  offset

			var w = active.card_div.width();
			var h = active.card_div.height();


			var x = (pos.left + w/2) - window.scrollX - (window.innerWidth  / 2);
			var y = (pos.top + h/2)  - window.scrollY - (window.innerHeight / 2);
		
			var sx = w / details_sizes.width;
			var sy = h / details_sizes.height;
		}
		
		return {left:x, top:y, scaleX:sx, scaleY:sy};
	}
	
	function getDetailsViewSizes() {
		
		var details_box_h = (window.innerHeight * .9);
		var details_box_w = 0;
		
		var window_landscape = (window.innerWidth > window.innerHeight);
		
		var has_img = $("#details-card > #hero-img").attr("src") != "";		
		var new_img_h = "";		
		var min_edge = 30;
		
		if( has_img ) {
			
			var img = $("#details-card > #hero-img");
		
			var img_w = img[0].naturalWidth;
			var img_h = img[0].naturalHeight;
			var img_landscape = (img_w > img_h);
			
			var win_bounds = {width:window.innerWidth - min_edge, height:window.innerHeight - min_edge};
			
			var label_below = !active.slo.isPublished(); // true; // active.slo.isPublished();
			
			/*
			TODO:
				get  active.slo.isPublished() code working inside this label_below code.
			*/
			
			if( label_below ) {
				
				var labels_h = $("#details-labels").outerHeight();
				
				var img_ratio = img_landscape ? (img_w / img_h) : (img_h / img_w); 
				// new_img_h = details_box_h - labels_h;
				
				if( active.slo.isPublished() ) { 	// NOTE: this will give a bit of color to the right
					img_ratio = (img_w * 1.1) / img_h; // : img_landscape ? (img_h / (img_w * 1.1)); 
				}
				
				var setRelativeWidth = function () { 
					return img_landscape ? (details_box_h - labels_h) * img_ratio : (details_box_h - labels_h) / img_ratio;
				};
				
				var setRelativeHeight = function () { 
					return img_landscape ? (details_box_w / img_ratio) + labels_h : (details_box_w * img_ratio) + labels_h;						
				};
				
				details_box_w = setRelativeWidth();
				
				if(details_box_w > win_bounds.width) { // need to shrink it down.
					details_box_w = win_bounds.width;
					details_box_h = setRelativeHeight();					
				}
				
				if(details_box_h > win_bounds.height) {
					details_box_h = win_bounds.height;
					details_box_w = setRelativeWidth();
				}
				
				new_img_h = details_box_h - labels_h;
			
			}else if( active.slo.isPublished() ) {
				// Size image to the natural width
				
				var labels_h = $("#details-labels").outerHeight();
				
				var img_ratio = window_landscape ? (img_w * 1.1) / img_h : (2/3);  // 1 for square
				// NOTE: this gives the stripe of color to the right, use + 30 instead of * for a fixed dimension
			
				details_box_w = window_landscape ? details_box_h * img_ratio : details_box_h / img_ratio;
				
				if(details_box_w > win_bounds.width) { // need to shrink it down.
					details_box_w = win_bounds.width;
					details_box_h = details_box_w / img_ratio;
				}
				
				if(details_box_h > win_bounds.height) {
					details_box_h = win_bounds.height;
					details_box_w = details_box_h * img_ratio; 
				}
				
				new_img_h = details_box_h - labels_h;
				
			}else{ // non pub, fit box to img
				// hard code a width too to get better inner box flow
				var img_ratio = img_landscape ? (img_w / img_h) : (img_h / img_w); 
				
				if(img_landscape) { 
					details_box_w = details_box_h * img_ratio;
				}else{
					details_box_w = details_box_h / img_ratio;
				}
				
				if(details_box_w > win_bounds.width) { // need to shrink it down.
					details_box_w = win_bounds.width;
				}
				
				if(details_box_h > win_bounds.height) {
					details_box_h = win_bounds.height;
				}
				
				if(img_landscape) {
					details_box_h = details_box_w / img_ratio;
				}else{
					details_box_h = details_box_w * img_ratio;
				}
				
			}
			
		}else{ // no image
			
			// size it to a ratio
			
			var ratio = window_landscape ? 3/2 : 2/3;
			
			details_box_w = details_box_h * ratio;	// make it a 3:2 ratio
			
			if(details_box_w > window.innerWidth - min_edge) { // need to shrink it down.
				details_box_w = window.innerWidth - min_edge;
			 	details_box_h = details_box_w / ratio;
			}
		}
		
		return {width:details_box_w, height:details_box_h, img_h:new_img_h};
	}
	
	function sizeDetailsView( sizes ) {
		
		if(sizes == null) sizes = getDetailsViewSizes();

		if(!sizes.hasOwnProperty("img_h")) sizes.img_h = 0;

		trace("sizeDetailsView", sizes.height, sizes.width, sizes.img_h);

		$("#details-card").css( {"height":sizes.height+"px", "width":sizes.width+"px"} );
		
		$("#details-card > #hero-img").css( {"height": sizes.img_h} ); // if not hard coded will be empty ""
		
		var ps = $('#details-labels > p');  //[0]; // :last-child'); // [0];
		
		// TODO: 
		// find the widths of all the p's as well, as the widest is the one we would size to?
		
		var isOverflowing  = false;
		
		for(var i = 0; i<ps.length; i++) {
			var over = ps[i].clientWidth < ps[i].scrollWidth || ps[i].clientHeight < ps[i].scrollHeight;
			if(over) {
				isOverflowing = true;
				break;
			}
		}
		// var isOverflowing = el.clientWidth < el.scrollWidth  || el.clientHeight < el.scrollHeight;
		
		if (isOverflowing) { //
		//if( $('#details-labels')[0].scrollWidth >  $('#details-labels').innerWidth()) {
		    trace("Truncated Text @ details-label p[" + i + "]");
		}
		
		// $("#details-card")[0].offsetWidth;// force reflow?
		
		//trace( $("#details-card")[0].offsetWidth );		
	}
		
	//------------------------------------------------------------------------------------------------
	
	function onOrientationChange(event) {
		//trace( "onOrientationChange" );
		setTimeout(function() {
			resize(true);
		}, 250); // slight delay so width and height are updated first
		
	}
	
	function onWindowResize(event) {
		resize();
	}
	
	function resize( orientation_change ) {
		
		if(orientation_change === true){
			// alert("resize w" + window.innerWidth +",h" +window.innerHeight + ", "  + window.scrollY);		
			reflowGrid();
			//wall.resize()?
		}
		
		trace("resize", window.innerWidth, window.innerHeight, window.scrollY);		
		
		if(SHOW_TIMELINE) updateTimelineImage();	
		
		if(details_view_visible) sizeDetailsView();
		
		var cpy = control_panel._panel.style.top.split("px")[0];
		
		control_panel.setPosition(window.innerWidth-170, cpy);
		
		if( isMicroFicheMode() ) ficheScrollUpdate();
		
	}
	
	function onWindowScroll(event) {
		//	trace("scroll", window.scrollY);
		var cpx = control_panel._panel.style.left.split("px")[0];
		control_panel.setPosition(cpx, window.scrollY + 45);
		
		if(!isAnimating()) {
			if(details_view_visible) hideDetailsView(event.shiftKey ? 10 : 1);
			if(instruction_dialog_visible) closeInstruction(event.shiftKey ? 10 : 1);			
		}
		
	}
	
	function onDocumentMouseMove( event ) {
		updateMousePos(event.clientX, event.clientY);
		
		if( isMicroFicheMode() ) ficheScrollUpdate();
		
	}
	
	function updateMousePos( x, y ) {
		// trace("updateMousePos", x, y);		
		mouse_pos.x = x;
		mouse_pos.y = y;		
	}
	
	function onDocumentKeyUp(event) {
		// trace("onDocumentKeyUp", event);
		
		switch(event.keyCode) {
			
			case 27: // ESC
				if(!isAnimating()) {
					if(details_view_visible) hideDetailsView(event.shiftKey ? 10 : 1);
					if(instruction_dialog_visible) closeInstruction(event.shiftKey ? 10 : 1);
				}
				break;
			case 32:// SPACE		
				break;
			case 76: // L
				if(event.altKey) toggleTextLabels();
				break;
			case 67: // C
				break;
			case 83: // S
				if(event.altKey) toggleStatus();
				break;
			case 85: // U
				if(event.altKey) {
					control_panel.toggleVisibility();
					DEV_UI_VISIBLE = !DEV_UI_VISIBLE;
				}
				break;
				
			case 84: // T
				if(event.altKey) toggleTimeline();
				break;
				
			case 68: // D 
				if(event.altKey && event.shiftKey) {
					DEBUG_LABELS = !DEBUG_LABELS;
					$(".card_text_label").show(); // for things with labels hidden (unpub)
					$(".card_text_label > .debug_label").toggle(DEBUG_LABELS);			
				}
				break;
				
			case 80: // P
				if(running) {
					stop();
					if(SHOW_STATUS) updateStatus();
				}else{
					start();
				}
				break;	
				
				/*
				case  90: // Z
				if(event.altKey) {
					var m = (OUTER_MARGIN+WALL_MARGIN) * 2;
					wall.fitZone(window.innerWidth-m, window.innerHeight-m); // search-n-discover .free-wall { margin * 2 } - WALL_MARGIN
					//wall.refresh();
				}
				break;
				*/
			
		}
        
	}
	
	//------------------------------------------------------------------------------------------------
	
	//-------------------------------------------------------------------------------------------
	// Date wrapper
	//-------------------------------------------------------------------------------------------
	
	if(USE_MOMENT) {	
		moment.tz.add(["Australia/Sydney|AEST AEDT|-a0 -b0|0101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101010101|-293lX xcX 10jd0 yL0 1cN0 1cL0 1fB0 19X0 17c10 LA0 1C00 Oo0 1zc0 Oo0 1zc0 Oo0 1zc0 Rc0 1zc0 Oo0 1zc0 Oo0 1zc0 Oo0 1zc0 Oo0 1zc0 Oo0 1zc0 14o0 1o00 Oo0 1zc0 Oo0 1zc0 Oo0 1zc0 U00 1qM0 WM0 1tA0 WM0 1tA0 U00 1tA0 Oo0 1zc0 Oo0 1zc0 Oo0 1zc0 Rc0 1zc0 Oo0 1zc0 Oo0 1zc0 11A0 1o00 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 11A0 1o00 1qM0 11A0 1o00 11A0 1o00 11A0 1qM0 WM0 1qM0 11A0 1o00 WM0 1qM0 14o0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1cM0 1fA0 1cM0 1cM0 1cM0 1cM0|40e5"]);	
	}
	
	var SL_Tz_Date = function(d) { // State Library Timezoned Date
		
		this.use_moment = USE_MOMENT;
		this.zone = 'Australia/Sydney';
		
		if(this.use_moment) {
			this.date = (d == null) ? moment.tz(this.zone) : moment.tz(d,this.zone);
		}else{
			this.date = (d == null) ? new Date() : new Date(d);
		}
		
		// .tz('Australia/Sydney'); //Australia/Sydney');
	};
	
	SL_Tz_Date.fromSQLStamp = function( stamp ) {
		 // stamp = "2016-12-03 12:43:21"			
		
		if(USE_MOMENT) {
			return new SL_Tz_Date( stamp );			
		}else{
			return new SL_Tz_Date( new Date(	stamp.slice(0, 4),   stamp.slice(5, 7) - 1, stamp.slice(8, 10), stamp.slice(11, 13), stamp.slice(14, 16),  stamp.slice(17, 19) ) );
      }
		
	}
	
	SL_Tz_Date.prototype.getZoneAbbreviation = function() {
		return this.use_moment ? moment.tz(this.zone).zoneAbbr() : "AEST";
	}
				
	SL_Tz_Date.prototype.toLocaleTimeString = function() {
		return this.use_moment ? this.date.format("h:mm a") : this.date.toLocaleTimeString();
	}
							
	SL_Tz_Date.prototype.getSeconds = function() {
		return this.use_moment ? this.date.seconds() : this.date.getSeconds();
	}
	
	SL_Tz_Date.prototype.setSeconds = function(n) {
		this.use_moment ? this.date.seconds(n) : this.date.setSeconds(n);
	}
	
	SL_Tz_Date.prototype.getTime = function(n) {
		return this.use_moment ? this.date.valueOf() : this.date.getTime();
	}
	
	SL_Tz_Date.prototype.setTime = function(n) {
		if(this.use_moment) {
			 this.date = moment(n).tz(this.zone);
		}else{
			 this.date.setTime(n);
		}
	}
	
	SL_Tz_Date.prototype.getHours = function() {
		return this.use_moment ? this.date.hours() : this.date.getHours();
	}
	
/*	SL_Tz_Date.prototype.setHours = function(h) {
		return this.use_moment ? this.date.hours(h) : this.date.setHours(h);
	}*/
	
	SL_Tz_Date.prototype.getMinutes = function() {
		return this.use_moment ? this.date.minutes() : this.date.getMinutes();
	}
	
/*	SL_Tz_Date.prototype.setMinutes = function(m) {
		return this.use_moment ? this.date.minutes(m) : this.date.setMinutes(m);
	}*/
	
	SL_Tz_Date.prototype.getMonth = function() {
		return this.use_moment ? this.date.month() : this.date.getMonth();
	}
	
/*	SL_Tz_Date.prototype.setMonth = function(m) {
		return this.use_moment ? this.date.month(m) : this.date.setMonth(m);
	}*/
	
	SL_Tz_Date.prototype.getDay = function() {
		return this.use_moment ? this.date.day() : this.date.getDay();
	}
	
	/*SL_Tz_Date.prototype.setDay = function(d) {
		return this.use_moment ? this.date.day(d) : this.date.setDay(d);
	}*/
	
	SL_Tz_Date.prototype.getDate = function() {
		return this.use_moment ? this.date.date() : this.date.getDate();
	}
	
	SL_Tz_Date.prototype.getFullYear = function() {
		return this.use_moment ? this.date.year() : this.date.getFullYear();
	}
	
	//-------------------------------------------------------------------------------------------
	// Data object for State Library Objects
	//-------------------------------------------------------------------------------------------
	
	var SLO = function(_index){
		this.index = _index;
		this.published = true;
		this.date_stamp = ""; // date of interaction / view
		this.date = null; // date of interaction / view
		this.uri = "";
		this.title = "";
		this.date_of_work = "";
		this.location = [];
		this.type_of_material = "";
		this.creator = "";
		this.topics = [];
		this.dig_no = "";
		this.isbn = "";
		this.dewey = "";
		this.dewey_index = Dewey.UnknownIndex; // default to the unknown value
		this.call_num = "";
		this.img_t = ""; // thumbnail
		this.img_r = ""; // large
		this.img_l = ""; // xlarge
	};
	
	SLO.prototype.getSeedString = function() {
		// return a string that will be used by as a random seed
		var seed = this.date_stamp;
		if(this.isbn.length) {
			seed += this.isbn;
		}else if(this.dewey.length) {
			seed += this.dewey;
		}else if(this.uri.length) {
			seed += this.uri;
		}
		
		return seed;
	}
	
	SLO.fromJson = function(json, index) {
		var slo = new SLO(index);
		
		slo.setVar(json, "title");		
		slo.setVar(json, "creator");
		slo.setVar(json, "location");		
		slo.setVar(json, "work_date", "date_of_work");
		slo.setVar(json, "dig_no");
		
		slo.setVar(json, "call_num");
		slo.setVar(json, "dewey");
		
		slo.setVar(json, "isbn");
		slo.setVar(json, "topics");
		slo.setVar(json, "mat_type", "type_of_material");
		slo.setVar(json, "img_t");
		slo.setVar(json, "img_r");
		slo.setVar(json, "img_l");
		
		slo.published = json["pub"] == "1";
		
		if(json.hasOwnProperty("uri")){
			if(slo.published)  {
				slo.uri = unescape(json.uri).split("'").join("%27").split(" ").join("+"); // NOTE: Crazy millenium url decode
			}else{
				slo.uri = unescape(json.uri);
			}
		}
		
		if(slo.published ){
			if(slo.dewey.length) {
				slo.dewey_index = Dewey.getIndex(slo.dewey);
			}else if(slo.call_num.length) {  
				// Sspecial case look up the dewey from the call num
				if(slo.call_num.indexOf(".") != -1) { // saftey look for .
					slo.dewey_index = Dewey.getIndex(slo.call_num);
					//trace("LOOKUP Dewey -> call_num", slo.call_num, slo.dewey_index, slo.getLocationURL());
				}else{	
					//trace("NOT Dewey -> call_num\t" + slo.call_num + "\t\t\t\t\t" + Dewey.getIndex(slo.call_num) + "\t\t\t" + slo.getLocationURL());
					//$("body").append("<div style='color:white;' >" +  slo.call_num + "#@$%" + slo.getLocationURL() + "</div>");
				}
			}
		}
		
		if(json.hasOwnProperty("date")) { 
			slo.date_stamp = json.date; // YYYY-MM-DD HH:MM:SS

			slo.date = SL_Tz_Date.fromSQLStamp( json.date );
			
			if( GENERATED_SECONDS ) {
				Math.seedrandom(slo.getSeedString()); // seed the random so the seconds result is the same across all installs
				slo.date.setSeconds( Math.floor(Math.random()*59) );
			}
			
			// trace(slo.date_stamp, slo.date, Utils.getSQLTimeStamp(slo.date) );
		}
		
		return slo;
	};
	
	SLO.prototype.setVar = function (json, json_prop_name, local_prop_name) {
		if(local_prop_name == undefined) local_prop_name = json_prop_name;
		if(json.hasOwnProperty(json_prop_name)) {
			var value;
			if(typeof json[json_prop_name] == "object") {
				// TODO: walk each value and escapeUnicode 
				value = json[json_prop_name];
				
			}else if(typeof json[json_prop_name] == "string") {
				// value = Utils.escapeUnicode(json[json_prop_name]);
				value = (json[json_prop_name]);
				//value = Utils.unicodeEscape(json[json_prop_name]);
			}else{
				value = json[json_prop_name];
			}
			this[local_prop_name] = value;
		}
	}
	
	SLO.prototype.getLocationURL = function() {
		if(this.published) {
			return "http://library.sl.nsw.gov.au/search~S2?/" + this.uri + "&srchanddisc=1";
		}else{
			return "http://acmssearch.sl.nsw.gov.au/search/itemDetailPaged.cgi?" + this.uri + "&srchanddisc=1";
		}
	};
	
	SLO.prototype.getImageURL = function(id) {
		
		switch (id) {
			case "img_t": case "img_r": case "img_l": return this.makeImageURL(id);
				break;
		}
		
		return "";		
	};
	
	SLO.prototype.getDivID = function() {
		return "card" + this.index;
	};
	
	SLO.prototype.makeImageURL = function(id) {
		if(this[id] == "" || this[id] == undefined) return ""; 		
		var use_image_cache = true;
		
		if(this.isPublished()){
			return PUB_IMG_CACHE_PATH + this[id];
		}else{
			return NON_PUB_IMG_CACHE_PATH + this[id];
		}
		
		/*if(this.isPublished()){
			return this[id];
		}else{
			return (use_image_cache ? SERVICE_PATH + "get_img.php?img=" : "") + this[id] + ("?srchanddisc=1");
		}*/
			
	};
		
	SLO.prototype.isPublished = function() {
		return this.published;
	};

	SLO.prototype.getDateString = function() {
		return this.date.getFullYear() + "/" + Utils.pad(this.date.getMonth()+1) + "/" + Utils.pad(this.date.getDate()) + " " + Utils.pad(this.date.getHours()) + ":" + Utils.pad(this.date.getMinutes()) + ":" + Utils.pad(this.date.getSeconds());
	};
	
	SLO.prototype.hasImage = function() {
		return (this.img_t.length > 0);
	};
	
	SLO.prototype.hasRegularImage = function() {
		return (this.img_r.length > 0);
	};
	
	SLO.prototype.hasLargeImage = function() {
		return (this.img_l.length > 0);
	};
	
	SLO.prototype.getBestImgUrl = function(excluding) {
		if(this.hasLargeImage() && excluding != 'img_l') {
			return this.makeImageURL('img_l');
		}else if(this.hasRegularImage() && excluding != 'img_r') {
			return this.makeImageURL('img_r');
		}else if(excluding != 'img_t'){
			return this.makeImageURL('img_t');
		}
		return null;
	}
	
	SLO.prototype.toString = function() {
		return "[ " + this.index + ", date='" + this.getDateString() + "', title='" + this.title +"' , img_t='" + this.img_t + "', url='" + this.getLocationURL() + "' ]";
	};
	
	//------------------------------------------------------------------------------------------------
		
	var Dewey = function() { };
	Dewey.UnknownIndex = 10;
	Dewey.colours = ["#edcb48", "#b4d05f", "#6fbb93", "#6594bd", "#52abb5", "#bc74af", "#dc8382", "#e34476", "#e52920", "#e48031", "#6b6b6b"]; // Note: last one (10) is catch all, unknown colour
	// og yellow:#fae36e new one:#edcb48 index 0
	Dewey.ranges = [0,100,200,300,400,500,600,700,800,900,1000]; // Note: 1000 not used, added to get range algorithm working
	Dewey.categories = ["Comp science, information and General Works", "Philosophy and Psychology", "Religion", "Social Sciences", "Language","Science","Technology","Arts and Recreation","Literature","History and Geography", "Unknown"];
	
/*	Dewey.test = function () {
		trace("Dewey.test");
		var tests = ["M2 824.4/1894/1  ", "-1023.323 FAIL TEST", "1023.323 FAIL TEST", "923.323 FAIL TEST", "615.892 SOUL", "615.892 REQU [1]", "330 COLL (1995.ED) [2]", "548.83 WILL", "780.904/M 2", "720.5/49 No. 9-12 (2011)", "291.13 ELIA", "616.99477 BISH", "306.44 OZOL", "547.2 GREE (ED.3)", "572.028 LABO [8]", "499.15 MCKA", "306.47 APPL (ED.3)", "700.82 GLEN", "823.3 ELLI", "621.2 RADH", "346.35 MCRA", "616.99477 THOM", "306.0973 MICK", "543.0284 WALL", "658.57505/1 Vol. 12 (1995)", "621.2/10", "153.83 JANI", "515.352 OREG", "515.62/2", "004.6 BHAN", "620.0045/10", "553.28 HUCA", "307.12 SCHN", "332.10681 HUAN", "300.72 LAWR", "574.018/12", "005.131 BEZE", "551.9 JOHN", "739.278 ZABA", "739.278 ZABA", "364.349915 CUNN", "440.141 WILL", "300.72 LAWR", "199.492 DELE", "418.00711 COOK", "551.9 JOHN", "005.131 BEZE", "301.24305/2 Vol. 38 (1988)", "650.14 IBAR", "658.4038 DENI", "616.399 CLAV", "621.8672/62", "004.0684 CHEW", "001.51 POSN", "333.7315 FORE", "005.7565 MELT", "621.3/377", "658.827 STEG", "808.06665 IREL (ED.2)", "650.14 CAGE", "650.14 DICK", "294.3 NHAT", "798.4 MAYN (2003.ED)", "620.82 PEWR", "823.309 COLL", "954.03 FALK [2]", "823.4 BROO", "398.20934/IONS", "300.8 WEBE (1991 ED)", "362.292 DRIS", "629.231 POTE (ED.3)", "200 CUPI", "711.4 MOUG (ED.2)", "302.2244 BARN", "302.2244 CROW", "388.41 PEOP (1985)", "920.720973 SMIT", "687.042 HAND", "515.352/15", "001.51 POSN", "687.042 HAND", "337.015193 MCMI", "994/244", "297.27 FOLT", "341.6 DORE", "341.51 MULT", "003.54 COHE", "003.54 COHE", "305.42 MCRO", "305.42 MCRO", "378.12/22", "378.12/22", "371.102 ATKI", "371.102 ATKI", "345.065 BENN", "370.951 BAII", "610.72 DONN", "305.4889915 DELS", "428.24 HARW", "299.92 ELKI (ED.2)", "370.72 ARYD (ED.8)", "006.7 HALV", "329.994 OAKS", "709.046 FRIE", "709.04075 WILL", "994.003 AUST (ED.6) [8]", "994.003 AUST (ED.6) [7]", "994.003 AUST (ED.6) [6]", "994.003 AUST (ED.6) [5]", "994.003 AUST (ED.6) [4]", "994.003 AUST (ED.6) [1]", "994.003 AUST (ED.6) [2]", "994.003 AUST (ED.6) [3]", "994/191", "696 STEN (ED.9)", "747.03 BANH [2]", "747.03 BANH [1]", "994 HISO [8]", "423.1 JONE (ED.5)", "808.882 KNOW (ED.3)", "808.882 STEV", "305.8991505 JOUR Vol. 13 (2010) - v.", "341.782 HOLZ", "341.173 PARR (ED.3)", "004.019 WANG", "371.10023 SARA", "306.20994 IRVI", "179.7 KAPL", "418 LARD", "371.8299915 BERE", "347.446158 RIGH (ED.4)", "006.7 CROD (ED.3)", "176 ETTO", "994.0049275/MACK", "302.23 BOYR", "320.54 SMIH", "649.33 BENG", "515.7/70 [2PT.B]", "659.1 MOOI (ED.2)", "780.94/1", "332.06/1 july/Dec. 1990", "332.06/1 july/Dec. 1989", "658.049 DERE (ED.6)", "006.3 ZENG", "747.03 BANH [2]", "747.03 BANH [1]", "615.58 DUNN", "994.003 AUST (ED.6) [2]", "994.003 AUST (ED.6) [4]", "994.003 AUST (ED.6) [3]", "994.003 AUST (ED.6) [1]", "994.003 AUST (ED.6) [8]", "994.003 AUST (ED.6) [5]", "994.003 AUST (ED.6) [6]", "994.003 AUST (ED.6) [7]", "301.01 OYEN", "809 GENE", "670.427 BART", "591.994/WHEE", "920.720973 SMIT", "374.0124 WHIT", "403 WOOD", "305.8991505 JOUR Vol. 13 (2010) - v.", "374.0124 SISS", "428.0071 SMOK", "020.3 DIOD", "082 RATL", "020.3 PRYT (ED.10)", "203 BOWK", "103 AUDI (ED.2)", "341.3 PANH", "332.06/1 Jan./June 1985", "658.4022 LENC", "325.41 HALL", "299.92 ELKI (ED.2)", "370.72 ARYD (ED.8)", "552.1/31", "194/FOUC: RA", "631.416/5", "549.18 YODE", "549.67 THOR", "549.67/1", "624.15136 PUSC", "552.5/84", "553.61 GILL (ED.2)", "549.67/4", "541.3451/14", "553.61/8", "302.35 CORA", "617.8005 JOU 1 Vol. 55 (1990)", "628.21 INTN (2002)", "512.7/55", "071.3 WALL", "347.2 MULA", "378.1 LENI", "620.1230994/1", "347.89 LITM", "005.8 WAYN", "349.94/FINN", "302.35 RESE 1 Vol. 34 (2012)", "306.43 WELL", "307.1216 SAND", "628.21 INTN (2002)", "709.04 HARR", "345.941 LYON (ED.2)", "346.25 WINT", "354.94 MACM", "617.8005 JOU 1 Vol. 55 (1990)", "627.05/6 Vol. 23, no. 7-12 (1990)", "302.2 NOTH", "823.91 RUSS", "340.15 UNGE", "340.12 KELM", "301.01 BRAN", "301.01 HONN", "657 CHED", "375.001/26", "791.433 MARK", "791.433 MARK", "535/1", "332.06/1 Jan./June (1980); incomplet", "332.06/1 July/Dec. 1988", "338.542 TEMI", "617.51 HOER", "150.195 MOLL", "617.1028/1", "332.45 CAMP", "375.001/26", "657 CHED", "332.06/1 july/Dec. 1989", "332.06/1 july/Dec. 1990", "371.397/19a", "332.06/1 1983", "791.4375 MACA", "515.353/133", "305.868073 SURO", "621.305/50 Vol. 56 (1983)-v. 60 (1987", "801.92 TURN", "341.19 SANS", "347.162 SILI", "347.779 OSHE", "362.292 DRIS", "362.292 DRIS", "519.56 KANJ (ED.3)", "796.334 REIL (ED.2)", "378 DELA", "021 SAMI", "338.040924 TRUM", "823.91/CON 27", "808.3 RIMM (ED.2)", "813.51/ITEM 5C", "332.645 TALE", "621.382 MOVA", "627.8 MCCU", "712.6 HEYN", "346.194 LANA", "320.994 WELL", "346.2 WYNE (ED.4)", "327.1283 DING", "324.2944 LOVE", "331.398133 SARG", "332.06/1 Jan./June 1985", "302.23 COUD", "332.06/1 1984", "332.06/1 1983", "332.06/1 July/Dec. 1988", "332.06/1 July/Dec. 1982", "332.06/1 July/Dec. 1981", "332.06/1 Jan./June (1980); incomplet", "621.3821 RAMA", "621.382 PLEV", "621.3821 RAMA", "629.8042/10", "629.287/MAY 1 v.2", "822.3/WILL 7", "519.2/24", "401.4 FOUC", "823.3 WIND", "302.35 RESE 1 Vol. 34 (2012)", "791.4375 MACA", "618.2023305 MIDW 2 24 (2006) - 25 (20", "501/140", "651.84/5", "346.5311 BLAC (2007.ED)", "607.294 SCHE", "618.2023305 MIDW 2 24 (2006) - 25 (20", "321.8 BRYC [2]", "346.194 CRIP", "808.543 MACO", "158.1 CONW", "303.372 BENN", "994.4/84 [1]", "994.4/84 [1]", "994.4/84 [2]", "994.4/84 [2]", "625.734/13", "629.287/50 [1] (ED.4)", "629.8042/11", "362.1072 BASS", "628.1 BRAS (ED.2)", "658.0019 ALDE", "519.54 KUSH", "718 AALF", "658.514 DODG", "428.2 SINC", "428.2 BURT (ED.2)", "535.84 PAVI", "543.0858 SILV (ED.6)", "428.2 BURT (ED.2)", "519.50285 FIEL (ED.2)", "428.0072 MCDO", "428.0072 MCDO", "610.915 BODO", "006.3 ZENG", "370.115 CLAU", "378.015 EYLE", "361.37 BERM", "374.013 CANA", "320.58 LATO", "301.072/SILV/25", "306 GOOD", "616.0019 KLEI", "335.411 MARX [1] v.1", "657.3 TJIA (ED.2)", "658.403 SIMO (ED.4)", "389.152/9", "389.6/14", "896/ACH/1", "306.0994/LIEO/202", "306.484 BENT", "338.9 DIMA", "341.2 ROSN", "341.73 GAIL", "994.602/BRAN/2", "153.092 COMP (1989)", "330.092 SIMO (1996.ED)", "501/140", "153.4 SIMO [2]", "658.403 SIMO", "153.4 SIMN", "306.0994/LIEO/202", "306.484 BENT", "341.2 ROSN", "341.73 GAIL", "338.9 DIMA", "994.602/BRAN/2", "389.152/9", "302/ARO 2/1984", "302.2 DANS", "344.4701/26 Vol. 62 (1890)", "621.382 MOVA", "003 MIDG [3]", "003 MIDG [2]", "003 MIDG [1]", "150.72 KERL (ED.4)", "300.72 BRYM (ED.2)", "150.195 MOLL", "530.41 CHAG", "128.3/BECK", "519.2/24", "389.6/14", "300.72 BRYM (ED.2)", "346.364 EADE", "291.13 ELIA", "620.0045 MONT (ED.2)", "620.0045 MONT (ED.3)", "711.5099441/5", "711.4099441/16 [1]", "813.51/ITEM 5C", "373.22409944/1", "901 MARC", "346.35 WILL", "621.31 MOMO", "371.4047 TOPP", "344.4701/26 Vol. 62 (1890)", "346.35 WILL", "621.31 MOMO", "373.22409944/1", "901 MARC", "428.3495922/2 [2]", "576.8 VERM", "371.4047 TOPP"];
		var c = tests.length;//5; // 
		for(var i = 0; i<c; i++) {
			trace( tests[i], this.getIndex(tests[i]), this.getHexFromCallNum(tests[i]), this.getCategoryNameFromCallNum(tests[i]) );
		}
	};*/
	
	Dewey.getCategoryNameFromCallNum = function(callNum) {
		return this.getCategoryName( this.getIndex(callNum) );
	};
	
	Dewey.getCategoryName = function(index) {
		return this.categories[index];
	};

	Dewey.getHexFromCallNum = function(callNum) {
		return this.getHex(this.getIndex(callNum) );
	};
	
	Dewey.getHex = function(index) {
		return this.colours[index];
	};
	
	Dewey.getRGBAFromCallNum = function(callNum, alpha) {
		return this.getRGBA( this.getIndex(callNum), alpha );
	};
	
	Dewey.getRGBA = function(index, alpha) {
		return Utils.hexToRGBA( this.getHex(index), alpha);
	};

	Dewey.getIndex = function(callNum) {
		// e.g, callNum = "364.349915 CUNN"  or "659.105/7 Vol. 38 (May/Aug. 1988)"		
		var res = callNum.match(/([\d]{3,})/g); // find the first at least 3 digit num		
		var num;
		if(res != null) num = parseInt( res[0] );
		
		/// invalid set it to the unknown value
		if(isNaN(num)) num = this.UnknownIndex;
		if(num < 0) num = this.UnknownIndex;

		var c = this.ranges.length-1;
		for(var i=1; i<=c; i++) {
			if(this.ranges[i] > num) {
				i--;
				break;
			}
		}

		if(i > this.UnknownIndex) i = this.UnknownIndex; // catch all for end
		
		//trace(callNum, num, i);

		return i;
	};
	
	//------------------------------------------------------------------------------------------------
	
	// Public defined here functions
	
	return {
		init: init
	 }
	
})();

$(document).ready(function(){
   UnstackedApp.init();
});

