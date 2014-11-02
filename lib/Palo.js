window.Palo = {
	packages: {
		/*
		'package-name': {
			version: Number,
			dependencies: Array,
			implemented: undefined or boolean true,
			executed: undefined or boolean true
		},
		...
		*/
	},
	isCompatible: function ( ua ) {
		if ( ua === undefined ) {
			ua = navigator.userAgent;
		}

		// Browsers with outdated or limited JavaScript engines get the no-JS experience
		return !(
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
		);
	},
	startup: function ( pkgs, epoch, initial ) {
		var i, j, pkg, scripts,
			v = 0;

		if ( this.isCompatible() ) {
			// Detect the palo mount point
			scripts = document.getElementsByTagName( 'script' );
			this.uri = scripts[scripts.length - 1].src
				.replace( /\\/g, '/' )
				.replace( /\/[^\/]*\/?$/, '' );

			// Store pakage information
			i = pkgs.length;
			while ( i-- ) {
				pkg = pkgs[i];
				// Resolve dependency names
				if ( pkg[2] ) {
					j = pkg[2].length;
					while ( j-- ) {
						pkg[2][j] = pkgs[pkg[2][j]][0];
					}
				}
				this.packages[pkg[0]] = {
					version: pkg[1] + epoch,
					dependencies: pkg[2] || [],
					implemented: false,
					executed: false
				};
			}

			// Calculate version
			i = initial.length;
			while ( i-- ) {
				v = Math.max( v, this.packages[initial[i]].version );
			}

			// Load initial packages
			/*jshint evil:true */
			document.write(
				'\u003Cscript src="' +
					this.uri + '/packages/' + initial.join( ';' ) + '?v=' + v +
				'"\u003E\u003C/script\u003E'
			);

			// Resolve startup package
			this.packages['palo-startup'].implemented = true;
			this.packages['palo-startup'].executed = true;

			// Cleanup
			delete this.isCompatible;
			delete this.startup;
		}
	},
	implement: function ( name, resources ) {
		if ( !this.packages[name] ) {
			throw new Error( 'Implementation of unknown package: ' + name );
		}
		this.packages[name].resources = resources;
		if ( name === 'palo' ) {
			this.packages[name].resources.modules['.']();
		}
	}
};
