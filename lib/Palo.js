( function () {
	var scripts, uri,
		ua = navigator.userAgent;

	// Browsers with outdated or limited JavaScript engines get the no-JS experience
	if (
		// Internet Explorer < 8
		( ua.indexOf( 'MSIE' ) !== -1 && parseFloat( ua.split( 'MSIE' )[1] ) < 8 ) ||
		// Firefox < 3
		( ua.indexOf( 'Firefox/' ) !== -1 && parseFloat( ua.split( 'Firefox/' )[1] ) < 3 ) ||
		// Opera < 12
		( ua.indexOf( 'Opera/' ) !== -1 && ( ua.indexOf( 'Version/' ) === -1 ?
			// "Opera/x.y"
			parseFloat( ua.split( 'Opera/' )[1] ) < 10 :
			// "Opera/9.80 ... Version/x.y"
			parseFloat( ua.split( 'Version/' )[1] ) < 12
		) ) ||
		// "Mozilla/0.0 ... Opera x.y"
		( ua.indexOf( 'Opera ' ) !== -1 && parseFloat( ua.split( ' Opera ' )[1] ) < 10 ) ||
		// BlackBerry < 6
		ua.match( /BlackBerry[^\/]*\/[1-5]\./ ) ||
		// Open WebOS < 1.5
		ua.match( /webOS\/1\.[0-4]/ ) ||
		// Anything PlayStation based.
		ua.match( /PlayStation/i ) ||
		// Any Symbian based browsers
		ua.match( /SymbianOS|Series60/ ) ||
		// Any NetFront based browser
		ua.match( /NetFront/ ) ||
		// Opera Mini, all versions
		ua.match( /Opera Mini/ ) ||
		// Nokia's Ovi Browser
		ua.match( /S40OviBrowser/ ) ||
		// Google Glass browser groks JS but UI is too limited
		( ua.match( /Glass/ ) && ua.match( /Android/ ) )
	) {
		return;
	}

	// Detect palo base URI
	scripts = document.getElementsByTagName( 'script' );
	uri = scripts[scripts.length - 1].src.replace( /\\/g, '/' ).replace( /\/[^\/]*\/?$/, '' );

	// Add global palo object
	window.Palo = {
		packages: {},
		dependents: {},
		available: {},
		loading: {},
		resolving: {},
		done: {},
		uri: uri,

		/**
		 * Specify which packages are available on the server.
		 *
		 * A call to this function is appended to the end of this script by the server, and once it
		 * is called the method will remove itself.
		 *
		 * @param {Array[]} pkgs List of packages, each an array of name string and version
		 *   timestamp number elements followed by an optional dependencies element containing an
		 *   array of indicies referring to packages in the main array
		 * @param {[type]} epoch Version timestamp offset which package version timestamps will be
		 *   increased by, should be the minimum timestamp of all packages
		 * @param {string[]} initial List of package names to be initially loaded
		 */
		startup: function ( list, epoch, initial ) {
			var i, j, iLen, jLen, item, name, deps, time;

			// Unpack list of packages
			for ( i = 0, iLen = list.length; i < iLen; i++ ) {
				item = list[i];
				name = item[0];
				deps = item[2] || [];

				for ( j = 0, jLen = deps.length; j < jLen; j++ ) {
					deps[j] = list[deps[j]][0];
					if ( !this.dependents[deps[j]] ) {
						this.dependents[deps[j]] = [ name ];
					} else {
						this.dependents[deps[j]].push( name );
					}
				}

				this.packages[name] = {
					name: name,
					time: item[1] + epoch,
					deps: deps
				};
				// Mark this module as done
				( name === 'palo-startup' ? this.done : this.available )[name] = true;
			}

			// Calculate time of most recently changed initial package
			time = 0;
			i = initial.length;
			while ( i-- ) {
				time = Math.max( time, this.packages[initial[i]].time );
			}

			// Load initial packages
			/*jshint evil:true */
			document.write( '\u003Cscript src="' +
				this.uri + '/packages/' + initial.join( ';' ) + '?t=' + time +
			'"\u003E\u003C/script\u003E' );

			// Remove this method, preventing it from being run twice
			delete this.startup;
		},

		/**
		 * Placeholder for the proper implement method.
		 *
		 * Stores resources to be used by the loader, and executes the main module of the palo
		 * package, which implements the loader.
		 *
		 * @param {string} name Name of package
		 * @param {Object} res Package resources
		 */
		implement: function ( name, res ) {
			if ( !this.packages[name] ) {
				throw new Error( 'Implementation of unknown package: ' + name );
			}
			this.packages[name].res = res;
			if ( name === 'palo' ) {
				if ( !res.modules || typeof res.modules['.'] !== 'function' ) {
					throw new Error( 'Invalid module: palo' );
				}
				res.modules['.']();
			}
		}
	};
} )();
