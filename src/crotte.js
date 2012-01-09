/*jslint devel: true, bitwise: true, browser: true, regexp: true, unparam: false, forin: true, plusplus: true, maxerr: 50, indent: 4 */

/*

server side:

- URL rewriting for legacy URLs
	- RegExp -> Pattern with back references
	- RegExp -> RewriteHandler
- New URLs:
	- /[handler/]something[.format]
		- handler in "", "s" (static), "x" (api)
		- format in (html[defaut], json, rss, atom)
	- /blog-title-minus-common-words
	- /YYYY/MM/DD
	- /YYYY/MM
	- /YYYY
	- /tag1-tag2-tag3-tag4
	- /latest
	- /
	- /s/static-file.png
	
	/robots.txt
	/humans.txt
	/favicon.ico
	/sitemap.xml + /sitemap.gz
	/ror.xml
*/

(function (document, window) {
	"use strict";
	var YES = true,
		NO = !YES,
		UNDEF,
		RE = function (x) { return new RegExp(x); },
		domIsReady = NO,
		documentElement = 'documentElement',
		readyState = 'readyState',
		draggable = 'draggable',
		appendChild = 'appendChild',
		setAttribute = 'setAttribute',
		addEventListener = 'addEventListener',
		attachEvent = 'attachEvent',
		parentNode = 'parentNode',
		nextSibling = 'nextSibling',
		className = 'className',
		createElement = function (x) {
			return document.createElement(x);
		},
		each = function (collection, func) {
			var i = 0, len = collection.length >>> 0, x;
			for (; i < len; ++i) {
				x = collection[i];
				if (x !== UNDEF) {
					if (func.call(x, i) === false) {
						break;
					}
				}
			}
		},
		can_drag = document[documentElement][draggable] !== UNDEF,
		load_script = function (s, cb) {
			var js = createElement('script');
			js.src = s;
			js.onload = js.onreadystatechange = function () {
				if (!js[readyState] || (/loaded|complete/).test(js[readyState])) {
					js.onload = js.onreadystatechange = null;
					if (typeof cb === "function") {
						cb();
					}
				}
			};
			document[documentElement].firstChild[appendChild](js);
		},
		load_stylesheet = function (src, i) {
			if (document.getElementById(i)) {
				return UNDEF;
			}
			var css = null;
			if (document.createStyleSheet) {
				if (document.createStyleSheet(src)) {
					css = createElement('style');
				}
			} else {
				css = createElement("link");
				if (css) {
					css.rel  = "stylesheet";
					css.type = "text/css";
					css.href = src;
				}
			}
			if (css) {
				css.id = i;
				document[documentElement].firstChild[appendChild](css);
			}
		},
		iframe = function (src, classname) {
			var e = createElement("iframe");
			e.src = src;
			e.frameBorder = 0;
			e.allowfullscreen = 1;
			e.scrolling = 'no';
			e.seamless = 1;
			e[className] = classname;
			return e;
		},
		expand_iframe = function (src, classname) {
			var outer = createElement('div'),
				inner = createElement('div');
			outer[className] = 'expand';
			inner[appendChild](iframe(src, classname));
			outer[appendChild](inner);
			return outer;
		},
		white_space_re = RE(/\s+/),
		element_classes = function (el) {
			var o = {};
			each(el.classList, function () { o[this] = YES; });
			return o;
		},
		element = 'element',
		ready = 'ready',
		expand_reference = function (pattern, cb) {
			var e = document.querySelectorAll([
					".hentry .post-body a[href*='" + pattern + "']",
					"aside a[href*='" + pattern + "']"
				].join(', ')),
				cls,
				next_sibling,
				first_child,
				parent_node,
				ancestor,
				uncle,
				r,
				valid_ancestors = {
					'body': true,
					'div': true,
					'section': true,
					'nav': true,
					'header': true,
					'footer': true,
					'aside': true,
					'td': true
				},
				noexpand = 'noexpand',
				replaceparent = 'replaceparent',
				replace = 'replace';
			each(e, function () {
				var x = this;
				cls = element_classes(x);
				if (!cls[noexpand]) {
					r = cb(x.href);
					if (r.element) {
						r.element[className] = (x[className] || '') + ' ' + (r.element[className]);
						if (cls[replaceparent]) {
							parent_node = x[parentNode];
							x = parent_node.removeChild(x);
							ancestor = parent_node[parentNode];
							while (!valid_ancestors[ancestor.tagName.toLowerCase()]) {
								parent_node = ancestor;
								ancestor = ancestor[parentNode];
							}
							ancestor.insertBefore(r[element], parent_node);
							ancestor.removeChild(parent_node);
						} else {
							uncle = next_sibling = x[nextSibling];
							ancestor = parent_node = x[parentNode];
							if (!cls[replace]) {
								while (!valid_ancestors[ancestor.tagName.toLowerCase()]) {
									uncle = ancestor[nextSibling];
									ancestor = ancestor[parentNode];
								}
							}
							// detach element
							x = parent_node.removeChild(x);
							if (!cls[replace]) {
								// replace it with its content
								while ((first_child = x.firstChild) !== null) {
									first_child = x.removeChild(first_child);
									if (next_sibling) {
										parent_node.insertBefore(first_child, next_sibling);
									} else {
										parent_node[appendChild](first_child);
									}
								}
							}
							// add referenced content
							if (uncle) {
								ancestor.insertBefore(r[element], uncle);
							} else {
								ancestor[appendChild](r[element]);
							}
						}
						if (typeof r[ready] === 'function') {
							r[ready]();
						}
					}
				}
			});
		},
		role = 'role',
		application = 'application',
		youtube_com = 'youtube.com/',
		youtube_re = /v=([^&]+)/,
		vimeo_com = 'vimeo.com/',
		vimeo_re = RE(vimeo_com + '([0-9]+)'),
		gist_re = RE(/gist.github.com\/([0-9]+)/),
		expand_references = function () {
			expand_reference(youtube_com + 'watch', function (href) {
				var x = {};
				x[element] = expand_iframe(
					[
						"//www.",
						youtube_com,
						'embed/',
						href.match(youtube_re)[1],
						"?hd=1&autohide=1&fs=1&iv_load_policy=3&loop=1&rel=0&showsearch=0& showinfo=0&modestbranding=1"
					].join(''),
					'youtube'
				);
				x[element][role] = application;
				return x;
			});
			expand_reference(vimeo_com, function (href) {
				var x = {};
				x[element] = expand_iframe(
					[
						'//player.',
						vimeo_com,
						'video/',
						href.match(vimeo_re)[1],
						'?title=0&byline=0&portrait=0&loop=1'
					].join(''),
					'vimeo'
				);
				x[element][role] = application;
				return x;
			});
			expand_reference('gist.github.com/', function (href) {
				var code = href.match(gist_re)[1],
					cb = 'on_gist_' + code + '_' + Math.floor(Math.random() * 99999999 + 1),
					x = {};
				x[element] = createElement('div');
				x[ready] = function () {
					load_script('https://gist.github.com/' + code + '.json?callback=' + cb);
				};
				x[element].id = 'gist-container-' + code;
				window[cb] = function (x) {
					var pre,
						div,
						i,
						link,
						sendlink = function (e) {
							e.dataTransfer.setData('DownloadURL', this.href);
						},
						sdiv = x.div;
					window[cb] = null;

					if (!sdiv) {
						return UNDEF;
					}

					// TODO: Find a way to do this using CSS instead.
					// Neither tab-interval, tab-size or tab-stops seem to work as specified.
					sdiv = sdiv.replace(/\t/g, '<span class="tab"><span class="nocss">\t</span></span>');

					div = document.querySelector('div#gist-container-' + code);
					div.innerHTML = sdiv;
					each(div.querySelectorAll('.gist-data'), function (i) {
						var filename = x.files[i];
						if (filename.substr(0, 8) !== 'gistfile') {
							link = createElement('a');
							link.href = 'https://raw.github.com/gist/' + code + '/' + filename;
							link.innerHTML = filename;
							link.target = '_blank';
							link[setAttribute]('data-repo', code);
							link[setAttribute]('data-filename', filename);
							link[className] = 'gist-raw-link font-sans';
							if (can_drag) {
								link[className] += ' dragout';
								link[setAttribute](draggable, YES);
								link[setAttribute]('data-downloadurl', [
									'text/plain',
									filename,
									link.href
								].join(':'));
								link[addEventListener]('dragstart', sendlink, false);
							}
							this[appendChild](link);
						}
					});
				};
				return x;
			});
		};

	(function () {
		document.body.classList.add('js');
		load_stylesheet('//cdn-jcayzac.appspot.com/files/combined.min.css', 'crottecss');
	}());

	(function (fn) {
		var f = 'DOMContentLoaded',
			o = 'onreadystatechange',
			c = 'complete',
			x,
			toplevel = false,
			sc;
		sc = function () {
			if (domIsReady) {
				return UNDEF;
			}
			try {
				document[documentElement].doScroll("left");
			} catch (e) {
				window.setTimeout(sc, 1);
				return UNDEF;
			}
			fn();
		};
		if (document[readyState] === c) {
			window.setTimeout(fn, 1);
		} else if (document[addEventListener]) {
			x = function () {
				document.removeEventListener(f, x, NO);
				fn();
			};
			document[addEventListener](f, x, NO);
			window[addEventListener]("load", fn, NO);
		} else if (document[attachEvent]) {
			x = function () {
				if (document[readyState] === c) {
					document.detachEvent(o, x);
					fn();
				}
			};
			document[attachEvent](o, x);
			window[attachEvent]("onload", fn);
			try {
				toplevel = !window.frameElement;
			} catch (e) { }
			if (document[documentElement].doScroll && toplevel) {
				sc(fn);
			}
		}
	}(function () {
		if (domIsReady) {
			return UNDEF;
		}
		domIsReady = YES;
		expand_references();
	}));
}(document, window));
