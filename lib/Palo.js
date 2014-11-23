( function () {
	var scripts, uri,
		ua = navigator.userAgent;

	function contains( str ) {
		return ua.indexOf( str ) !== -1;
	}

	function matches( pattern ) {
		return ua.match( pattern );
	}

	function version( str ) {
		return parseFloat( ua.split( str )[1] );
	}

	// Browsers with outdated or limited JavaScript engines get the no-JS experience
	if (
		// Internet Explorer < 8
		( contains( 'MSIE' ) && version( 'MSIE' ) < 8 ) ||
		// Firefox < 3
		( contains( 'Firefox/' ) && version( 'Firefox/' ) < 3 ) ||
		// Opera < 12
		( contains( 'Opera/' ) && (
			contains( 'Version/' ) ?
				// "Opera/9.80 ... Version/x.y"
				version( 'Version/' ) < 12 :
				// "Opera/x.y"
				version( 'Opera/' ) < 10
		) ) ||
		// "Mozilla/0.0 ... Opera x.y"
		( contains( 'Opera ' ) && version( ' Opera ' ) < 10 ) ||
		// BlackBerry < 6
		matches( /BlackBerry[^\/]*\/[1-5]\./ ) ||
		// Open WebOS < 1.5
		matches( /webOS\/1\.[0-4]/ ) ||
		// Anything PlayStation based.
		matches( /PlayStation/i ) ||
		// Any Symbian based browsers
		matches( /SymbianOS|Series60/ ) ||
		// Any NetFront based browser
		matches( /NetFront/ ) ||
		// Opera Mini, all versions
		matches( /Opera Mini/ ) ||
		// Nokia's Ovi Browser
		matches( /S40OviBrowser/ ) ||
		// Google Glass browser groks JS but UI is too limited
		( matches( /Glass/ ) && matches( /Android/ ) )
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
			var i, j, iLen, jLen, item, name, deps, time,
				startupModuleName = 'palo-startup';

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
				( name === startupModuleName ? this.done : this.available )[name] = true;
			}

			// Setup initial load
			time = 0;
			i = initial.length;
			while ( i-- ) {
				name = initial[i];
				if ( name === startupModuleName ) {
					throw new Error( 'Cannot load palo-startup again' );
				}
				// Calculate time of most recently changed initial package
				time = Math.max( time, this.packages[name].time );
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
