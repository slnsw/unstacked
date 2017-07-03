import os

# Uses Googles closure compiler see https://developers.google.com/closure/compiler/docs/api-tutorial3
# Run from Terminal with % python build.py

import sys

#print 'Number of arguments:', len(sys.argv), 'arguments.'
#print 'Argument List:', str(sys.argv)

libs_pre_min_src = 'html/js/lib/greensock/minified/TweenMax.min.js html/js/lib/stats.min.js html/js/lib/jquery-2.1.4.min.js html/js/lib/moment.min.js html/js/lib/moment-timezone.min.js html/js/lib/seedrandom.min.js html/js/lib/quicksettings.min.js'                        
libs_src = 'html/js/lib/freewall.js'
libs_out_tmp = 'html/js/tmp.libs.min.js'
libs_out = 'html/js/libs.min.js'
libs_src_map = 'html/js/libs.min.map'
libs_optimisations = 'SIMPLE_OPTIMIZATIONS';

source = 'html/js/utils.js html/js/main.js'
output = 'html/js/main.min.js'
source_map = 'html/js/main.min.map'

optimisations = "SIMPLE_OPTIMIZATIONS" # SIMPLE WHITESPACE_ONLY

if len(sys.argv) > 1 :
	
	if sys.argv[1] == "adv" : # minimal minyfying, just compile together?
		print "ADVANCED_OPTIMIZATIONS defined"
		optimisations = "ADVANCED_OPTIMIZATIONS"
		
	elif  sys.argv[1] == "soft":
		print "SOFT Compile defined. Just CAT'ing files together"
		os.system('cat ' + source + ' > ' + output)
		sys.exit()
		

os.system('java -jar compiler/closure-compiler.jar --create_source_map ' + source_map + ' --compilation_level ' + optimisations + ' --language_in=ECMASCRIPT6 --js ' + source + ' --js_output_file ' + output)

with open(output,'r') as f: text = f.read()
with open(output,'w') as f: f.write("// Unstacked by Adam Hinshaw & Elisa Lee : [adamhinshaw.com, elisalee.net]\n" + text)

os.system('java -jar compiler/closure-compiler.jar --create_source_map ' +libs_src_map + ' --compilation_level ' + libs_optimisations + ' --language_in=ECMASCRIPT6 --js ' + libs_src + ' --js_output_file ' + libs_out_tmp)

#cat in pre minimised libraries too
os.system('cat ' + libs_pre_min_src + " " + libs_out_tmp + ' > ' + libs_out)
os.system('rm ' + libs_out_tmp ) # remove tmp file


# CSS compile: see https://github.com/google/closure-stylesheets
os.system('java -jar compiler/closure-stylesheets.jar html/css/style.css html/css/qs/quicksettings_tiny.css > html/css/style.min.css')
