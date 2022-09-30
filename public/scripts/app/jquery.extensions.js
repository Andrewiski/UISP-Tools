(function ($) {

    // Extend the deui class/namespace
    $.extend($, {
        /** Define a method for logging to the console */
        logToConsole: function (msg) {
            // Is a console defined?
            if ($.uisptools && $.uisptools.isClientSideDebugging && $.uisptools.isClientSideDebugging()) {
                if (window.console && console.log) {
                    var isChrome = navigator.userAgent.indexOf("Chrome") !== -1;
                    if (isChrome) {
                        try {
                            var stack = new Error().stack;
                            var callingFile = stack.split("\n")[2];
                            var url = callingFile.split("(")[1];
                            url = url.substring(0, url.length - 1);
                            var urlparts = url.split("/");
                            var file = urlparts[urlparts.length - 1];
                            //var line = stack.split("\n")[2].split(":")[5];
                            //var append = file + ":" + line;
                            console.log(msg, url);
                        } catch (ex) {
                            console.log(msg);
                        }
                    } else {
                        console.log(msg);
                    }

                }
            }
        },
        getQueryStringParms: function () {
            var queryString = location.search.split('&'),
                  params = {};

            $.each(queryString, function (index, string) {
                var parts = string.split('='),
                    paramName = parts[0].replace(/^\?/gi, '');
                if (params[paramName]) {
                    if (Array.isArray(params[paramName])) {
                        params[paramName].push(parts[1]);
                    } else {
                        // Duplicate names in query string, store as array.
                        var prevValue = params[paramName];
                        params[paramName] = [prevValue, parts[1]];
                    }
                } else {
                    params[paramName] = parts[1];
                }
            });
            return params
        }
    });

    /**
     * 	Add a logging function to the base widget object. It is available to
     *	all widgets and will have access to a widget's internal state.
     *
     *  @param parms An object containing: <br />
     *  logToConsole: Boolean to toggle logging the exception to the browser's console (default: true) <br />
     *  logToDatabase: Boolean to toggle logging to the database (default: true)<br />
     *  raiseEvent: Boolean to toggle raising the On_Error event (default: true)<br />
     *  friendlyError: Boolean to toggle displaying an error message to the user (default: true)<br />
     *  methodName: A string indicating the name of the function that threw the exception (default: '')<br />
     *  exception: An Exception object.
     *
     *  @example
     *  $.widget("deui.myWidget", {
     *  	_create: function(){
     *  		try {
     *  			undefined.property;
     *  		} catch (ex) {
     *  			this.handleException({
     *  				methodName: '_create',
     *  				exception: ex,
     * 					logToDatabase: false
     *  			});
     *  		}
     *  	}
     *  }
     */

    /**
    * This function is used to dynamically invoke a javascript function<br>
    * <br>
    * 
    * parms:<br>
    * fn = a function or a function name<br>
    * args = an array containing the arguments for the call
    */
    $.dynamicInvoke = function (fn, args) {
        fn = (typeof fn == "function") ? fn : window[fn]; // Allow fn to be a
        // function object
        // or the name of a
        // global function
        return fn.apply(this, args || []); // args is optional, use an empty
        // array by default
    }

    /**
	 * This function is used to dynamically invoke a javascript statement<br>
	 * <br>
	 * 
	 * parms:<br>
	 * statement = the string of javascript to execute<br>
	 */
    $.dynamicEval = function (statement) {
        eval(statement);
    }

    


    // A makeIdsUnique function to the jQuery object. 
    // Adds the suffix parameter to any IDs that are found as children of the selected element
    /*
    Given the html: 

        <div id="a">
            <label for="b">OK</label>
            <input id="b" />
        </div>
    
    Executing this jQuery:

        $('#a').makeIdsUnique('-example')

    Would yield the following html:

        <div id="a">
            <label for="b-example">OK</label>
            <input id="b-example" />
        </div>

    */
    
    $.fn.extend({
        makeIdsUnique: function (suffix) {
            return this.each(function () {
                return $(this).find('*[id]')
                    .each(function (index, element) {
                        var $this = $(this),
                            thisID = $this.prop('id');

                        $this.prop('id', thisID + suffix);
                        $this.addClass('thisID');
                    })
                    .end()
                .find('*[for]')
                    .each(function (index, element) {
                        var $this = $(this);
                        $this.prop('for', $this.prop('for') + suffix);

                    })
                    .end();
            });
        }
    });



})(jQuery);


