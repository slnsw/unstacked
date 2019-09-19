<?php 
	
	global $bust; // cache busting addon arg
	$bust = 16;
	
	global $fullsrc;
	$fullsrc = isset($_GET["fullsrc"]) && $_GET["fullsrc"] == "1"; // 1
	
	function javascriptInclude() {
			
		global $bust;
		global $fullsrc;
		
		if( $fullsrc ) {					
			$src = array("js/lib/greensock/minified/TweenMax.min.js", "js/lib/stats.min.js", 
							 "js/lib/jquery-2.1.4.min.js", "js/lib/quicksettings.min.js",
							 "js/lib/seedrandom.min.js",
							 "js/lib/moment.min.js", "js/lib/moment-timezone.min.js",
							 "js/lib/freewall.js", "js/utils.js", "js/main.js");							
		}else{
			$src = array("js/libs.min.js", "js/main.min.js");			
		}
		 
		// $ie = (ereg("MSIE", $_SERVER["HTTP_USER_AGENT"])) ? true : false;
		// $ie = strpos($_SERVER['HTTP_USER_AGENT'], 'MSIE');
		     
		if( isset($_GET["audiofx"]) ) {
			array_unshift($src, "js/lib/Tone.min.js");
		};
		
		for($i = 0; $i<count($src); $i++) {
			echo "<script type='text/javascript' src='" . $src[$i] . "?b={$bust}' ></script>\n";
		}
		
	}
	
	function cssInclude() {
		global $bust;
		global $fullsrc;
		
		if( $fullsrc ) {				
			$src = array("css/style.css", "css/qs/quicksettings_tiny.css");
		}else{
			$src = array("css/style.min.css");
		}
		
		for($i = 0; $i<count($src); $i++) {
			echo "<link href='" . $src[$i] . "?b={$bust}'  rel='stylesheet' type='text/css' />\n";
			// echo "<link href='" . $src[$i] . "?b={$bust}'  media='print' rel='stylesheet' type='text/css' />\n";
		}
		
	}
	
	function toggleWidgetInclude($id = '') {
		echo '<div class="widget" >';
		echo 		'<svg ' . ( $id != '' ? ('id="' . $id . '"') : '') . ' class="u_toggle_widget_svg" viewBox="0 0 15 15" version="1.1" width="15px" height="15px">';
		echo 			'<use x="0" y ="0" xlink:href="#u_toggle_button_widget"/>';
		echo  		'<use x="0" y ="0" xlink:href="#u_toggle_button_widget_selected"/>';
		echo 		'</svg>';
		echo '</div>';
	}
	
?>

<!DOCTYPE html>
<html lang="en">
    <head>
      <title>Unstacked</title>
		<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
		<meta charset="utf-8" />
		<meta http-equiv="X-UA-Compatible" content="IE=edge" /> <!-- for svg -->
		<meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no" />
		<?php cssInclude(); ?>
	</head>	  
	<body>
		
		<div id="unstacked" >
			
			<!-- defining svg, not visible -->
			<svg viewBox="0 0 0 0" version="1.1" width="0px" height="0px" style="display:block; visibility:hidden" >
			   <defs>
					<filter id="svg_ds_filter" x="0" y="0">
						<feOffset result="offOut" in="SourceAlpha" dx="0" dy="1" />
						<feGaussianBlur result="blurOut" in="offOut" stdDeviation="3" />
						<feBlend in="SourceGraphic" in2="blurOut" mode="normal" />
					</filter>
					
		 			<g id="u_toggle_button_widget" >							
				 		<linearGradient id="SVGID_1_" gradientUnits="userSpaceOnUse" x1="2.9039" y1="2.9038" x2="12.0963" y2="12.0962">
				 			<stop offset="0" style="stop-color:#231F20"/>
				 			<stop offset="1" style="stop-color:#595A5C"/>
				 		</linearGradient>
				 		<circle fill="url(#SVGID_1_)" cx="7.5" cy="7.5" r="6.5"/>
				 		<linearGradient id="SVGID_2_" gradientUnits="userSpaceOnUse" x1="4.1574" y1="4.1573" x2="10.8428" y2="10.8427">
				 			<stop offset="0" style="stop-color:#6E7072"/>
				 			<stop offset="1" style="stop-color:#262223"/>
				 		</linearGradient>
				 		<circle fill="#f0f" _fill="url(#SVGID_2_)" cx="7.5" cy="7.5" r="4.727"/>
				 		<g>
				 			<circle opacity="0" fill="#abs" cx="8.682" cy="8.682" r="4.491"/>
				 			<circle opacity="0.0417" fill="#1A1A1A" cx="8.485" cy="8.485" r="4.511"/>
				 			<circle opacity="0.0833" fill="#1A1A1A" cx="8.288" cy="8.288" r="4.53"/>
				 			<circle opacity="0.125" fill="#1A1A1A" cx="8.091" cy="8.091" r="4.55"/>
				 			<circle opacity="0.1667" fill="#1A1A1A" cx="7.894" cy="7.894" r="4.57"/>
				 			<circle opacity="0.2083" fill="#1A1A1A" cx="7.697" cy="7.697" r="4.589"/>
				 			<circle opacity="0.25" fill="#1A1A1A" cx="7.5" cy="7.5" r="4.609"/>
				 		</g>
				 		<linearGradient id="SVGID_3_" gradientUnits="userSpaceOnUse" x1="4.2409" y1="4.2409" x2="10.7591" y2="10.7591">
				 			<stop  offset="0" style="stop-color:#6E7072"/>
				 			<stop  offset="1" style="stop-color:#231F20"/>
				 		</linearGradient>
				 		<circle fill="url(#SVGID_3_)" cx="7.5" cy="7.5" r="4.609"/>
				 		<linearGradient id="SVGID_4_" gradientUnits="userSpaceOnUse" x1="4.4081" y1="4.4081" x2="10.5919" y2="10.5919">
				 			<stop  offset="0" style="stop-color:#6E7072"/>
				 			<stop  offset="1" style="stop-color:#424143"/>
				 		</linearGradient>
				 		<circle fill="url(#SVGID_4_)" cx="7.5" cy="7.5" r="4.373"/>
				 	</g>
				
					<g id="u_toggle_button_widget_selected" >
						<linearGradient id="pink_x5F_selection_1_" gradientUnits="userSpaceOnUse" x1="4.4081" y1="4.4081" x2="10.5919" y2="10.5919">
				 			<stop  offset="0" style="stop-color:#E9718E"/>
				 			<stop  offset="1" style="stop-color:#E44577"/>
				 		</linearGradient>
				 		<circle id="pink_x5F_selection" fill="url(#pink_x5F_selection_1_)" cx="7.5" cy="7.5" r="4.373"/>
					</g>
					
					<g id='close-icon-svg'>
						<path d="M25.899,23.071L18.828,16l7.071-7.071c0.781-0.781,0.781-2.048,0-2.828c-0.781-0.781-2.048-0.781-2.828,0L16,13.172
								L8.929,6.101c-0.781-0.781-2.048-0.781-2.828,0s-0.781,2.048,0,2.828L13.172,16l-7.071,7.071c-0.781,0.781-0.781,2.048,0,2.828
								c0.781,0.781,2.048,0.781,2.828,0L16,18.828l7.071,7.071c0.781,0.781,2.048,0.781,2.828,0C26.68,25.119,26.68,23.852,25.899,23.071z" />
					</g>
					
					<g id="dx-lab-logo-svg" >
						<style>.a{fill:#FFF;}</style>
						<path d="M26.6 6.1c0-0.8 0.6-1.5 1.5-1.5 0.8 0 1.5 0.6 1.5 1.5v3c0 0.8-0.6 1.5-1.5 1.5 -0.8 0-1.5-0.6-1.5-1.5V6.1z" class="a"/><path d="M0 13.5V1.7c0-0.8 0.6-1.5 1.5-1.5h3c0.8 0 1.5 0.6 1.5 1.5 0 0.8-0.6 1.5-1.5 1.5H3v8.9h1.5c0.8 0 1.5 0.6 1.5 1.5 0 0.8-0.6 1.5-1.5 1.5h-2.9C0.6 14.9 0 14.3 0 13.5zM5.9 4.6c0-0.8 0.6-1.5 1.5-1.5 0.8 0 1.5 0.6 1.5 1.5v5.9c0 0.8-0.6 1.5-1.5 1.5 -0.8 0-1.5-0.6-1.5-1.5V4.6z" class="a"/><path d="M13.3 1.7c0-0.8 0.6-1.5 1.5-1.5 0.8 0 1.5 0.6 1.5 1.5v3c0 0.8-0.6 1.5-1.5 1.5 -0.8 0-1.5-0.6-1.5-1.5V1.7zM13.3 10.5c0-0.8 0.6-1.5 1.5-1.5 0.8 0 1.5 0.6 1.5 1.5v3c0 0.8-0.6 1.5-1.5 1.5 -0.8 0-1.5-0.6-1.5-1.5V10.5zM17.7 6.1c0.8 0 1.5 0.6 1.5 1.5 0 0.8-0.6 1.5-1.5 1.5s-1.5-0.6-1.5-1.5C16.2 6.7 16.9 6.1 17.7 6.1zM20.7 0.2c0.8 0 1.5 0.6 1.5 1.5v3c0 0.8-0.6 1.5-1.5 1.5 -0.8 0-1.5-0.6-1.5-1.5v-2.9C19.2 0.8 19.8 0.2 20.7 0.2zM19.2 10.5c0-0.8 0.6-1.5 1.5-1.5 0.8 0 1.5 0.6 1.5 1.5v3c0 0.8-0.6 1.5-1.5 1.5 -0.8 0-1.5-0.6-1.5-1.5V10.5z" class="a"/><path d="M33.9 13.3V1.5C33.9 0.6 34.6 0 35.4 0c0.8 0 1.5 0.6 1.5 1.5v10.3h4.4c0.8 0 1.5 0.6 1.5 1.5 0 0.8-0.6 1.5-1.5 1.5h-5.9C34.6 14.8 33.9 14.1 33.9 13.3z" class="a"/><path d="M48.5 5.9c0-0.7 0.6-1.3 1.3-1.3h2.6c0.7 0 1.3 0.6 1.3 1.3v7.8c0 0.7-0.6 1.3-1.3 1.3h-5.2c-0.7 0-1.3-0.6-1.3-1.3v-2.6c0-0.7 0.6-1.3 1.3-1.3 0.7 0 1.3 0.6 1.3 1.3v1.3h2.6V7.2h-1.3C49.1 7.2 48.5 6.6 48.5 5.9z" class="a"/><path d="M57.8 1.3c0-0.7 0.6-1.2 1.3-1.2 0.7 0 1.3 0.5 1.3 1.2v3.7h1.3c0.7 0 1.3 0.5 1.3 1.2 0 0.7-0.6 1.2-1.3 1.2h-1.3v3.7c0 0.7-0.6 1.2-1.3 1.2 -0.7 0-1.3-0.5-1.3-1.2V1.3zM60.4 13.7c0-0.7 0.6-1.2 1.3-1.2 0.7 0 1.3 0.5 1.3 1.2 0 0.7-0.6 1.2-1.3 1.2C61 14.9 60.4 14.4 60.4 13.7zM64.4 7.5c0.7 0 1.3 0.5 1.3 1.2v2.5c0 0.7-0.6 1.2-1.3 1.2 -0.7 0-1.3-0.5-1.3-1.2V8.7C63.1 8 63.6 7.5 64.4 7.5z" class="a"/>
					</g>
					
					<g id="slnsw-logo-svg" >
						<style>.a{fill:#FFF;}</style>
						<path d="M34.3 31.1l0.6-1.6h0l0.6 1.6H34.3zM36.5 32.5l-1.4-3.6h-0.5l0.1 0.2 -1.2 3.3c0 0 0 0-0.1 0.1l-0.4 0.2v0h1.2V32.7l-0.4-0.2c0 0 0 0 0 0l0.4-1.2h1.4l0.4 1.2c0 0 0 0 0 0.1l-0.4 0.2v0h1.4V32.7l-0.4-0.2C36.6 32.5 36.6 32.5 36.5 32.5" class="a"/><path d="M1.3 30.5c-0.5-0.3-0.8-0.4-0.8-0.8 0-0.3 0.3-0.6 0.8-0.6 0.3 0 0.5 0.1 0.7 0.2l0.3 0.6h0v-0.8c-0.3-0.1-0.5-0.2-1-0.2 -0.7 0-1.2 0.4-1.2 1 0 0.6 0.5 0.8 1 1.1 0.8 0.4 0.9 0.5 0.9 0.9 0 0.4-0.3 0.7-0.9 0.7 -0.3 0-0.5-0.1-0.7-0.2L0 31.5H0v1c0.2 0.1 0.6 0.2 1.1 0.2 0.8 0 1.3-0.5 1.3-1.1C2.4 31 1.8 30.8 1.3 30.5" class="a"/><path d="M7.6 31.1l0.6-1.6h0l0.6 1.6H7.6zM9.3 32.5L8.9 32.7v0h1.4V32.7l-0.4-0.2c0 0 0 0 0 0l-1.4-3.6H8l0.1 0.2 -1.2 3.3c0 0 0 0-0.1 0.1L6.4 32.7v0h1.2V32.7L7.1 32.5c0 0 0 0 0 0l0.4-1.2h1.4l0.4 1.2C9.3 32.5 9.3 32.5 9.3 32.5" class="a"/><path d="M42.9 28.9v0l0.4 0.2c0 0 0 0 0 0l-0.8 1.7h0l-1-1.7c-0.1-0.2-0.2-0.2-0.4-0.2 -0.2 0-0.4 0-0.6 0.1v0c0.3 0 0.4 0.1 0.5 0.2l1.1 1.9v1.4c0 0 0 0 0 0.1l-0.4 0.2v0h1.5V32.7l-0.4-0.2c0 0 0 0 0-0.1v-1.4l1.1-1.9c0 0 0 0 0.1-0.1l0.4-0.2v0H42.9z" class="a"/><path d="M24.3 29.1l0.5-0.2v0h-1.5v0l0.5 0.2c0 0 0 0 0 0.1v3.3c0 0 0 0 0 0.1l-0.5 0.2v0h1.5V32.7l-0.5-0.2c0 0 0 0 0-0.1V29.2C24.2 29.1 24.2 29.1 24.3 29.1" class="a"/><path d="M30.4 29.2c0 0 0.3 0 0.5 0 0.5 0 0.8 0.2 0.8 0.8 0 0.5-0.3 0.8-0.9 0.8 -0.1 0-0.3 0-0.4 0V29.2zM30.4 32.5v-1.7c0.1 0 0.2 0.1 0.3 0.2l0.3 0.4c0.8 1.1 1.1 1.3 1.5 1.3 0.1 0 0.3 0 0.4 0V32.7c-0.4-0.1-0.6-0.2-1.4-1.3l-0.3-0.5c0.6-0.1 1.1-0.4 1.1-1 0-0.6-0.5-1-1.3-1h-1.6v0l0.4 0.2c0 0 0 0 0 0.1v3.3c0 0 0 0 0 0.1l-0.4 0.2v0h1.5V32.7l-0.4-0.2C30.4 32.5 30.4 32.5 30.4 32.5" class="a"/><path d="M38.3 29.2c0 0 0.3 0 0.5 0 0.5 0 0.8 0.2 0.8 0.8 0 0.5-0.3 0.8-0.9 0.8 -0.1 0-0.3 0-0.4 0V29.2zM38.3 32.5v-1.7c0.1 0 0.2 0.1 0.3 0.2l0.3 0.4c0.8 1.1 1.1 1.3 1.5 1.3 0.1 0 0.3 0 0.4 0V32.7c-0.4-0.1-0.6-0.2-1.4-1.3l-0.3-0.5c0.6-0.1 1.1-0.4 1.1-1 0-0.6-0.5-1-1.3-1H37.3v0l0.4 0.2c0 0 0 0 0 0.1v3.3c0 0 0 0 0 0.1L37.3 32.7v0h1.5V32.7l-0.4-0.2C38.3 32.5 38.3 32.5 38.3 32.5" class="a"/><path d="M26.6 30.8h0.5c0.7 0 1 0.3 1 0.9 0 0.5-0.3 0.8-0.9 0.8 -0.2 0-0.5 0-0.6 0V30.8zM26.6 29.2c0 0 0.3 0 0.6 0 0.5 0 0.7 0.2 0.7 0.7 0 0.5-0.3 0.7-0.9 0.7h-0.4V29.2zM28.6 31.6c0-0.5-0.4-0.9-1.1-1v0c0.5-0.1 0.9-0.4 0.9-0.8 0-0.6-0.6-0.9-1.2-0.9h-1.6v0l0.4 0.2c0 0 0 0 0 0.1v3.3c0 0 0 0 0 0.1l-0.4 0.2v0h1.5C28.1 32.7 28.6 32.2 28.6 31.6" class="a"/><path d="M3.2 28.9l0 1h0l0.4-0.8c0 0 0 0 0.1 0l0.9 0v3.4c0 0 0 0 0 0.1L4 32.7v0h1.5V32.7l-0.4-0.2c0 0 0 0 0-0.1v-3.3l0.9 0c0 0 0 0 0.1 0l0.3 0.8h0v-1H3.2z" class="a"/><path d="M10.3 28.9L10.3 30h0l0.4-0.8c0 0 0 0 0.1 0l0.9 0v3.4c0 0 0 0 0 0.1L11.2 32.7v0h1.5V32.7l-0.4-0.2c0 0 0 0 0-0.1v-3.3l0.9 0c0 0 0 0 0.1 0l0.3 0.8h0v-1H10.3z" class="a"/><path d="M16.6 29.1c0 0 0 0 0.1 0l0.3 0.7h0v-1h-2.8v0l0.4 0.2c0 0 0 0 0 0.1v3.3c0 0 0 0 0 0.1l-0.4 0.2v0h2.9l0.1-1.1h0l-0.4 0.8c0 0 0 0-0.1 0l-1.5 0v-1.6h1.2c0 0 0 0 0.1 0l0.2 0.5h0v-1.2h0l-0.2 0.4c0 0 0 0-0.1 0h-1.2v-1.5L16.6 29.1z" class="a"/><path d="M20 32.5l-0.4 0.2v0h2.7v-1h0l-0.3 0.7c0 0 0 0-0.1 0l-1.4 0v-3.3c0 0 0 0 0-0.1l0.5-0.2v0h-1.5v0l0.4 0.2c0 0 0 0 0 0.1v3.3C20 32.5 20 32.5 20 32.5" class="a"/><path d="M20.7 34.2l0.2 0.1c0 0 0 0 0 0v0.9c0 0.3-0.1 0.5-0.4 0.5 -0.3 0-0.4-0.1-0.4-0.5v-0.9c0 0 0 0 0 0l0.2-0.1v0h-0.6v0l0.2 0.1c0 0 0 0 0 0v0.9c0 0.4 0.3 0.6 0.6 0.6 0.4 0 0.5-0.2 0.5-0.6v-0.9c0 0 0 0 0 0l0.2-0.1v0h-0.5V34.2z" class="a"/><path d="M10.4 34.2l0.2 0.1c0 0 0 0 0 0v1.1h0l-1-1.2H9.3v0l0.2 0.2v1.3c0 0 0 0 0 0l-0.2 0.1v0h0.5v0l-0.2-0.1C9.7 35.7 9.7 35.7 9.7 35.7v-1.1h0l1 1.3h0.1v-1.5c0 0 0 0 0 0l0.2-0.1v0h-0.5V34.2z" class="a"/><path d="M27.9 34.2l0.2 0.1c0 0 0 0 0 0l-0.3 1.1H27.7l-0.5-1.3h0l-0.4 1.3H26.8l-0.3-1.1c0 0 0 0 0 0l0.2-0.1v0H26.1v0l0.2 0.1c0 0 0 0 0 0l0.4 1.5h0.1l0.4-1.2h0l0.4 1.2h0.1l0.4-1.5c0 0 0 0 0 0l0.2-0.1v0h-0.5V34.2z" class="a"/><path d="M24.3 34.2l0.2 0.1c0 0 0 0 0 0v0.6h-0.8v-0.6c0 0 0 0 0 0l0.2-0.1v0h-0.6v0l0.2 0.1c0 0 0 0 0 0v1.4c0 0 0 0 0 0l-0.2 0.1v0h0.6v0l-0.2-0.1c0 0 0 0 0 0v-0.7h0.8v0.7c0 0 0 0 0 0l-0.2 0.1v0h0.6v0l-0.2-0.1c0 0 0 0 0 0v-1.4c0 0 0 0 0 0l0.2-0.1v0h-0.6V34.2z" class="a"/><path d="M18.6 35.7c-0.3 0-0.5-0.3-0.5-0.8 0-0.4 0.2-0.7 0.5-0.7 0.3 0 0.5 0.3 0.5 0.8C19.1 35.5 18.9 35.7 18.6 35.7M18.6 34.2c-0.4 0-0.7 0.4-0.7 0.8 0 0.5 0.3 0.8 0.8 0.8 0.4 0 0.7-0.4 0.7-0.8C19.4 34.5 19 34.2 18.6 34.2" class="a"/><path d="M14.7 34.2l0.2 0.1c0 0 0 0 0 0l-0.3 1.1h0l-0.5-1.3h0l-0.4 1.3h0l-0.3-1.1c0 0 0 0 0 0l0.2-0.1v0h-0.6v0l0.2 0.1c0 0 0 0 0 0l0.4 1.5h0.1l0.4-1.2h0l0.5 1.2h0.1L15 34.3c0 0 0 0 0 0l0.2-0.1v0H14.7V34.2z" class="a"/><path d="M34.3 34.8c-0.2-0.1-0.3-0.2-0.3-0.3 0-0.1 0.1-0.3 0.3-0.3 0.1 0 0.2 0 0.3 0.1l0.1 0.2h0v-0.3c-0.1 0-0.2-0.1-0.4-0.1 -0.3 0-0.5 0.2-0.5 0.4 0 0.2 0.2 0.3 0.4 0.4 0.3 0.2 0.4 0.2 0.4 0.4 0 0.2-0.1 0.3-0.4 0.3 -0.1 0-0.2 0-0.3-0.1l-0.1-0.3h0v0.4c0.1 0 0.2 0.1 0.5 0.1 0.3 0 0.5-0.2 0.5-0.5C34.8 35.1 34.5 34.9 34.3 34.8" class="a"/><path d="M28.9 35.1l0.2-0.7h0l0.2 0.7H28.9zM29.8 35.7l-0.6-1.5h-0.2l0 0.1 -0.5 1.4c0 0 0 0 0 0l-0.2 0.1v0h0.5v0l-0.2-0.1c0 0 0 0 0 0l0.2-0.5h0.6l0.2 0.5c0 0 0 0 0 0l-0.2 0.1v0h0.6v0l-0.2-0.1C29.8 35.7 29.8 35.7 29.8 35.7" class="a"/><path d="M16.9 34.8c-0.2-0.1-0.3-0.2-0.3-0.3 0-0.1 0.1-0.3 0.3-0.3 0.1 0 0.2 0 0.3 0.1l0.1 0.2h0v-0.3c-0.1 0-0.2-0.1-0.4-0.1 -0.3 0-0.5 0.2-0.5 0.4 0 0.2 0.2 0.3 0.4 0.4 0.3 0.2 0.4 0.2 0.4 0.4 0 0.2-0.1 0.3-0.4 0.3 -0.1 0-0.2 0-0.3-0.1l-0.1-0.3h0v0.4c0.1 0 0.2 0.1 0.5 0.1 0.3 0 0.5-0.2 0.5-0.5C17.4 35.1 17.2 34.9 16.9 34.8" class="a"/><path d="M12.6 35.3h0l-0.2 0.4c0 0 0 0 0 0l-0.6 0v-0.7h0.5c0 0 0 0 0 0l0.1 0.2h0v-0.5h0l-0.1 0.2c0 0 0 0 0 0h-0.5V34.3l0.6 0c0 0 0 0 0 0l0.1 0.3h0v-0.4h-1.2v0l0.2 0.1c0 0 0 0 0 0v1.4c0 0 0 0 0 0l-0.2 0.1v0h1.2L12.6 35.3z" class="a"/><path d="M21.6 34.2L21.6 34.6h0l0.1-0.3c0 0 0 0 0 0l0.4 0v1.4c0 0 0 0 0 0l-0.2 0.1v0h0.6v0l-0.2-0.1c0 0 0 0 0 0v-1.4l0.4 0c0 0 0 0 0 0l0.1 0.3h0v-0.4H21.6z" class="a"/><path d="M30.8 34.3l0.2-0.1v0H30.4v0l0.2 0.1c0 0 0 0 0 0v1.4c0 0 0 0 0 0l-0.2 0.1v0h1.1v-0.4h0l-0.1 0.3c0 0 0 0 0 0l-0.6 0v-1.4C30.8 34.3 30.8 34.3 30.8 34.3" class="a"/><path d="M33 34.3c0 0 0 0 0 0l0.1 0.3h0v-0.4h-1.2v0l0.2 0.1c0 0 0 0 0 0v1.4c0 0 0 0 0 0l-0.2 0.1v0h1.2l0-0.5h0l-0.2 0.4c0 0 0 0 0 0l-0.6 0v-0.7h0.5c0 0 0 0 0 0l0.1 0.2h0v-0.5h0l-0.1 0.2c0 0 0 0 0 0h-0.5V34.3L33 34.3z" class="a"/><path d="M28 1.8C26.7 0.6 25 0 22.9 0c-2.7 0-4.1 0.8-5.4 1.9 -1.3 1.1-2.2 2.8-2.2 4 0 0.9 0.2 1.5 0.7 2.1 0.5 0.5 1.1 0.8 1.8 0.8 0.6 0 1.2-0.4 1.5-0.9 0.1-0.2 0.2-0.3 0.2-0.5 0-0.2 0-0.4 0-0.5 0-0.5-0.2-0.9-0.6-1.3 -0.3-0.3-0.8-0.5-0.9-1 -0.1-0.2-0.1-0.4-0.1-0.6 0-0.5 0.3-1.2 1-1.7 0.7-0.5 1.9-1 3.2-1 1.2 0 2.2 0.4 3 1.3 0.8 0.8 1.2 1.9 1.2 3.3 0 1-0.2 1.9-0.5 2.8 -0.3 0.8-0.9 1.7-1.6 2.7 -0.6 0.8-1.1 1.4-1.4 1.8 0.1-0.9 0.3-1.9 0.5-3.1 0.4-2.1 0.6-3.6 0.6-4.3 0-0.8-0.2-1.5-0.5-1.9 -0.3-0.4-0.8-0.6-1.4-0.6 -0.6 0-1 0.2-1.3 0.6C20.5 4.4 20.4 5 20.4 5.9c0 0.7 0.2 2.1 0.6 4.2 0.3 1.9 0.6 3.6 0.7 5 0.1 0.8 0.1 1.9 0.1 3.8v0 0 0 0.1c0 0 0 0 0 0h0.9c0 0 0 0 0 0v0h0c0-1.7 0.3-2.9 0.6-3.6 0.4-0.7 1.5-1.9 3.3-3.4 1.4-1.2 2.3-2.1 2.6-2.8 0.5-0.9 0.7-1.9 0.7-3C30 4.4 29.3 3 28 1.8M22.3 21.3c-0.6 0-1.1 0.2-1.6 0.6 -0.4 0.4-0.7 1-0.7 1.6 0 0.7 0.2 1.2 0.7 1.7 0.4 0.4 1 0.7 1.6 0.7 0.6 0 1.2-0.2 1.6-0.7 0.4-0.5 0.7-1 0.7-1.7 0-0.6-0.2-1.1-0.7-1.6C23.4 21.5 22.9 21.3 22.3 21.3" class="a"/>
					</g>
					
					<g id="anchor-svg">
						<path d="M459.7 233.4l-90.5 90.5c-50 50-131 50-181 0 -7.9-7.8-14-16.7-19.4-25.8l42.1-42.1c2-2 4.5-3.2 6.8-4.5 2.9 9.9 8 19.3 15.8 27.2 25 25 65.6 24.9 90.5 0l90.5-90.5c25-25 25-65.6 0-90.5 -24.9-25-65.5-25-90.5 0l-32.2 32.2c-26.1-10.2-54.2-12.9-81.6-8.9l68.6-68.6c50-50 131-50 181 0C509.6 102.3 509.6 183.4 459.7 233.4zM220.3 382.2l-32.2 32.2c-25 24.9-65.6 24.9-90.5 0 -25-25-25-65.6 0-90.5l90.5-90.5c25-25 65.5-25 90.5 0 7.8 7.8 12.9 17.2 15.8 27.1 2.4-1.4 4.8-2.5 6.8-4.5l42.1-42c-5.4-9.2-11.6-18-19.4-25.8 -50-50-131-50-181 0l-90.5 90.5c-50 50-50 131 0 181 50 50 131 50 181 0l68.6-68.6C274.6 395.1 246.4 392.3 220.3 382.2z" />
					</g>
				
			    </defs>
			</svg>
			
			<div id="freewall" class="free-wall"></div>
		
			<div id="u_overlay">
				
				<div id ="u_overlay_bg" ></div>
				
				<div id="u_overlay_outer" >
					<div id="u_overlay_inner" >
						
						<div id="details-card" >			
						
							<img id="hero-img" class="unselectable undragable" src="" /> 
						
							<div id="details-no-image">
								<div id="details-big-text"></div>
								<div id="details-type">
									<h1>Collection / Series / Item</h1>
									<div class="details-icon" ></div>
									<div class="details-icon" ></div>
								</div>
							</div>	
							
							<div id="home-box" >
								<h1>UNSTACKED</h1>
								<h2>A time-based visualisation of materials people are accessing from the State Library of NSW collection.</h2>
								
								<div class="credits" >
									
									<div class='credit_box' >
										<h3>A PROJECT BY</h3> 
										<div class='credit_logo' ><a href="http://elisalee.net" target="_blank" >ELISA LEE</a> &amp;<br/><a href="http://adamhinshaw.com" target="_blank" >ADAM HINSHAW</a></div>
								 	</div>
									<div class='credit_box' >
										<h3>FOR</h3>
										<div class='credit_logo' >
											<a href="http://dxlab.sl.nsw.gov.au/" target="_blank" >
												<svg width="66" height="15" viewBox="0 0 65.7 14.9" preserveAspectRatio="xMinYMin meet" >
														<use x="0" y ="0" xlink:href="#dx-lab-logo-svg"/>
												</svg>
											</a>
										</div>
								 	</div>
									<div class='credit_box'>	
										<h3>POWERED BY</h3>
										<div class='credit_logo' style='-text-align:center' >
											<a href="http://www.sl.nsw.gov.au" target="_blank">
												<svg width="44" height="36" viewBox="0 0 44.1 35.8" preserveAspectRatio="xMinYMin meet" >
													<use x="0" y ="0" xlink:href="#slnsw-logo-svg"/>
												</svg>
											</a>
										</div>
								 	</div>
								</div>	
								
							</div>
							
							<div id="details-labels">
								<p></p>
								<p></p>
								<p></p>
								<p></p>
								<p></p>
									<a id="details-link-anchor" class="unselectable" title="View Page" href="#" target="_blank" >
										<svg width="100%" height="100%" viewBox="0 0 512 512">
											<use x="0" y ="0" xlink:href="#anchor-svg"/> 
										</svg>
									</a>
							</div>
							
						</div>
						
						<div id="instruction-box" >
							<div id="instruction_close_icon" >
								<svg class="close_icon" width="24px" height="24px" style="enable-background:new 0 0 24 24;" version="1.1" viewBox="0 0 32 32">
									<use x="0" y ="0" xlink:href="#close-icon-svg"/>
								</svg>
							</div>
							<div class='copy' >
								<p>Items from the collection appear when they are accessed.</p>
								<p>So, as you see an item appear, it means someone just looked at it. If no items appear, no one is looking at anything at the moment.</p>
								<p>The busiest time is between 10am and 3pm.<br />The quietest time is between 2am and 6am.</p>
							</div>
							<div class="footer"/></div>
						</div>
						
						
					</div>
				</div>	
				
				<div id="loading_spinner">
					<img src="img/spinner.gif" />
				</div>
				
			</div>

			<div id='u_menu' class='u_menu_sel card u_menu_min' style='transform: scale(1);' >
				<div class='u_menu_inner'>
									
					<div id='u_menu_header_minimised' class='u_menu_header unselectable' > 
						
						<div class='u_menu_header_button' >						
							<svg id="hamburger_button" width="32px" height="32px" style="enable-background:new 10 10 48 48;" 
								version="1.1" viewBox="0 0 32 32">
								<path d="M4,10h24c1.104,0,2-0.896,2-2s-0.896-2-2-2H4C2.896,6,2,6.896,2,8S2.896,10,4,10z M28,14H4c-1.104,0-2,0.896-2,2  s0.896,2,2,2h24c1.104,0,2-0.896,2-2S29.104,14,28,14z M28,22H4c-1.104,0-2,0.896-2,2s0.896,2,2,2h24c1.104,0,2-0.896,2-2  S29.104,22,28,22z"/>
							</svg>
							<!-- filter="url(#svg_ds_filter)"  -->
						</div>

							<div class='main_title text_shadow' > UNSTACKED </div>
						<div class='heading_text' >
							<div class='time_stamp text_shadow' > 12<span style='vertical-align:top;'>:</span>10pm </div>
							<div class='tzone text_shadow'>AEST</div>
						</div>
						
					</div>
				
					<div id='u_menu_header_maximised' class='u_menu_header unselectable' > 
						
						<div class='u_menu_header_button' >
							<svg class="close_icon" width="32px" height="32px" style="enable-background:new 0 0 32 32;" version="1.1" viewBox="0 0 32 32">
								<use x="0" y ="0" xlink:href="#close-icon-svg"/>
							</svg>
						</div>
						
						<div class='main_title text_shadow' > UNSTACKED </div>
						
						<div class='time_display text_shadow' >
							<div class='date' ></div>
							<div class='time_stamp' > 12:10pm </div>
							<div class='tzone'>AEST</div>
						</div>
						
						<div class='blurb antialias' >
							A time-based visualisation of materials people are accessing from the State Library of NSW collection.
						</div>
					</div>
					
					<div id='u_menu_options' class="unselectable" >
					
						<div class='section_title row' style='display:none;' >SETTINGS</div>
					
						<div class='options_content' >
							<div class='u_menu_source_items' >
								<div class='ui_group_title row antialias' > View what people are accesing from </div>
								<div class='u_source_0 row selected_row u_menu_border_v_shadows' >
									<?php toggleWidgetInclude(); ?>
									<div class="label" >The entire collection</div>
								</div>
								<div class='u_source_1 clickable_row row u_menu_item_divider' >
									<?php toggleWidgetInclude(); ?>
									<div class="label" >Manuscript &amp; pictures only</div>
								</div>
								<div class='u_source_2 clickable_row row' > 
									<?php toggleWidgetInclude(); ?>
									<div class="label" >Published only</div>
								</div>
							</div>
							<div class='u_menu_img_items' >
								<div class='ui_group_title row antialias' >Show items with images only</div>
								<div class='u_imgs_0 toggle_widget row clickable_row' >
									<?php toggleWidgetInclude(); ?>
									<div class="label" >Off</div>
								</div>
							</div>
						</div>
					</div>
				
					<div id='u_menu_about' >
				
						<div class='section_title row' style='display:none;' >ABOUT THE PROJECT</div>
				
						<div class='about_content u_menu_border_v_bigger_shadows antialias' style='display:none'>
							<h1>ABOUT THE PROJECT</h1>
						
							<p>What occurs when human interaction with the collection is visualised in real-time and made accessible? How can this information be experienced so it adds value to the library and its visitors? What behaviours and insights can be deduced and what effect will it have on viewers? Will they be inspired, surprised, educated? These questions framed the research and exploration of this project.</p>
							
							<p class="pemph" >Unstacked is a time-based visualisation of materials people are accessing from the State Library's collection.</p>
							
							<p>It is the collection curated by the people accessing it at any time, revealing the richness and diversity it holds and the broad interests of those using it. Unstacked aims to inspire conversation and further exploration of the collection.</p>
							
							<p>Items from the collection appear as they are accessed. So, as you see an item appear, it means someone just looked at it. If no items appear, no one is looking at anything at the moment. Select an item to show more detail and link back to its catalogue record.</p>
								
							<p>The library organises its collection into two catalogues, Manuscripts & Pictures and Published. Items in Unstacked are represented by a preview image or a colour if no image is available.</p>
							
							<div id="palette_table" class="" >
								<table>
									<tbody>
		 								<tr> <td style="background-color:#333333" ></td> <td>Manuscripts & Pictures</td>               </tr>
										<tr class="tr_spacer"><td></td><td></td></tr>
		 								<tr> <td style="background-color:#edcb48" ></td> <td>000 Generalities</td>                     </tr>
		 								<tr> <td style="background-color:#b4d05f" ></td> <td>100 Philosophy and Psychology</td>        </tr>
		 								<tr> <td style="background-color:#6fbb93" ></td> <td>200 Religion</td>                         </tr>
		 								<tr> <td style="background-color:#6594bd" ></td> <td>300 Social Sciences</td>                  </tr>
		 								<tr> <td style="background-color:#52abb5" ></td> <td>400 Languages</td>                        </tr>
		 								<tr> <td style="background-color:#bc74af" ></td> <td>500 Science</td>                          </tr>
		 								<tr> <td style="background-color:#dc8382" ></td> <td>600 Technology (Applied Sciences)</td>    </tr>
		 								<tr> <td style="background-color:#e34476" ></td> <td>700 Arts and Recreation</td>              </tr>
		 								<tr> <td style="background-color:#e52920" ></td> <td>800 Literature</td>                       </tr>
		 								<tr> <td style="background-color:#e48031" ></td> <td>900 Geography and History</td>            </tr>
		 								<tr> <td style="background-color:#6b6b6b" ></td> <td>Unknown</td>                              </tr>
								    </tbody>
								</table>
							</div>
							
							<p class="pal_attrib" >Dewey Decimal colour palette designed by <a href="http://chrisgaul.net/utslibrary/" target="_blank">Chris Gaul</a> for the UTS Library</p>
							<p>The visualisation is currently powered by four months of cached data and will be updated to a real-time feed in the future.</p>
							
							<p>Created through the inaugural DX Lab Fellowship 2016.
							The DX Lab Fellowship is supported through a gift to the State Library of NSW Foundation – a not-for-profit organisation which supports key Library fellowships, and innovative exhibitions and landmark acquisitions.</p>
							<p>Read about our process <a href='http://dxlab.sl.nsw.gov.au/unstackedlaunch/' target="_blank" >here.</a></p>
						</div>
					
						<div class='about_footer' style='display:none;' > 
							<div class="credits" >
								<div class='credit_box' >
									<h3>A PROJECT BY</h3> 
									<div class='credit_logo' ><a href="http://elisalee.net" target="_blank" >ELISA LEE</a> &amp;<br/><a href="http://adamhinshaw.com" target="_blank" >ADAM HINSHAW</a></div>
							 	</div>
								<div class='credit_box' >
									<h3>FOR</h3>
									<div class='credit_logo' >
										<a href="http://dxlab.sl.nsw.gov.au/" target="_blank" >
											<svg width="66" height="15" viewBox="0 0 65.7 14.9">
													<use x="0" y ="0" xlink:href="#dx-lab-logo-svg"/>
											</svg>
										</a>
									</div>
							 	</div>
								<div class='credit_box'>	
									<h3>POWERED BY</h3>
									<div class='credit_logo' style='-text-align:center' >
										<a href="http://www.sl.nsw.gov.au" target="_blank">
											<svg width="44" height="36" viewBox="0 0 44.1 35.8" preserveAspectRatio="xMinYMin meet">
												<use x="0" y ="0" xlink:href="#slnsw-logo-svg"/>
											</svg>
										</a>
									</div>
							 	</div>
							</div>
						</div>
					
					</div>
				
					<div id='u_menu_overlay' class='u_menu_border_shadows' ></div>
				</div>
			</div>
			
			<div id="drawing">
			 <!-- <svg width="100%" height="100%">
			    <rect width="100%" height="400" fill="#f06"></rect>
			  </svg> -->
			</div>
			
			<div id="status"><p></p></div>
		
		</div>
		
		<?php 
			javascriptInclude();
		?>
		
		
	</body>
</html>