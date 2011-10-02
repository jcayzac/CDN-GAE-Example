/*jslint devel: true, browser: true, regexp: true, unparam: false, forin: true, plusplus: true, maxerr: 50, indent: 4 */

(function () {
	"use strict";
	var F = false,
		domIsReady = F,
		can_drag = document.documentElement.draggable !== undefined,
		base = '//cdn-jcayzac.appspot.com/files/',
		store = function (k, v) {
			try {
				localStorage[k] = JSON.stringify(
					{
						value: v,
						timestamp: (new Date()).getTime()
					}
				);
			} catch (e) { }
		},
		retrieve = function (k) {
			try {
				var r = JSON.parse(localStorage[k]);
				if ((new Date()).getTime() - r.timestamp < 3600000000) {
					return r.value;
				}
				localStorage[k] = null;
			} catch (e) { }
			return null;
		},
		load_script = function (s, cb) {
			var js = document.createElement('script');
			js.src = s;
			js.onload = js.onreadystatechange = function () {
				if (!js.readyState || (/loaded|complete/).test(js.readyState)) {
					js.onload = js.onreadystatechange = null;
					if (typeof cb === "function") {
						cb();
					}
				}
			};
			document.documentElement.firstChild.appendChild(js);
		},
		load_stylesheet = function (src, i) {
			if (document.getElementById(i)) {
				return undefined;
			}
			var css = null;
			if (document.createStyleSheet) {
				if (document.createStyleSheet(src)) {
					css = document.createElement('style');
				}
			} else {
				css = document.createElement("link");
				if (css) {
					css.rel  = "stylesheet";
					css.type = "text/css";
					css.href = src;
				}
			}
			if (css) {
				css.id = i;
				document.documentElement.firstChild.appendChild(css);
			}
		},
		load_local_stylesheet = function (src, i) {
			load_stylesheet(base + src, i);
		},
		iframe = function (src, classname) {
			var e = document.createElement("iframe");
			e.src = src;
			e.frameBorder = 0;
			e.allowfullscreen = 1;
			e.scrolling = 'no';
			e.seamless = 1;
			e.className = classname;
			return e;
		},
		expand_iframe = function (src, classname) {
			var outer = document.createElement('div'),
				inner = document.createElement('div');
			outer.className = 'expand';
			inner.appendChild(iframe(src, classname));
			outer.appendChild(inner);
			return outer;
		},
		no_expand_re = new RegExp(/\bnoexpand\b/),
		expand_reference = function (pattern, cb) {
			var e = document.querySelectorAll("article section a[href*='" + pattern + "']"),
				j,
				x,
				next_sibling,
				first_child,
				parent_node,
				ancestor,
				uncle,
				r,
				valid_ancestors = {
					body: true,
					div: true,
					section: true,
					nav: true,
					header: true,
					footer: true,
					aside: true,
				};
			for (j = 0; j < e.length; ++j) {
				x = e[j];
				if (!(x.className || '').match(no_expand_re)) {
					r = cb(x.href);
					if (r.element) {
						r.element.className = [x.className || '', r.element.className || ''].join(' ');
						uncle = next_sibling = x.nextSibling;
						ancestor = parent_node = x.parentNode;
						while (valid_ancestors[ancestor.tagName.toLowerCase()] === undefined) {
							uncle = ancestor.nextSibling;
							ancestor = ancestor.parentNode;
						}
						// detach element
						x = parent_node.removeChild(x);
						// replace it with its content
						while ((first_child = x.firstChild) !== null) {
							first_child = x.removeChild(first_child);
							if (next_sibling) {
								parent_node.insertBefore(first_child, next_sibling);
							} else {
								parent_node.appendChild(first_child);
							}
						}
						// add referenced content
						if (uncle) {
							ancestor.insertBefore(r.element, uncle);
						} else {
							ancestor.appendChild(r.element);
						}
						if (r.ready) {
							r.ready();
						}
					}
				}
			}
		},
		youtube_re = new RegExp(/watch\?v=([^&]+)/),
		vimeo_re = new RegExp(/vimeo.com\/([0-9]+)/),
		gist_re = new RegExp(/gist.github.com\/([0-9]+)/),
		expand_references = function () {
			expand_reference('youtube.com/watch', function (href) {
				var x = {
					element: expand_iframe(
						[
							"//www.youtube.com/embed/",
							href.match(youtube_re)[1],
							"?hd=1&autohide=1&fs=1&iv_load_policy=3&loop=1&rel=0&showsearch=0& showinfo=0&modestbranding=1"
						].join(''),
						'youtube'
					)
				};
				x.element.role = 'application';
				return x;
			});
			expand_reference('vimeo.com/', function (href) {
				var x = {
					element: expand_iframe(
						[
							'//player.vimeo.com/video/',
							href.match(vimeo_re)[1],
							'?title=0&byline=0&portrait=0&loop=1'
						].join(''),
						'vimeo'
					)
				};
				x.element.role = 'application';
				return x;
			});
			expand_reference('gist.github.com/', function (href) {
				var code = href.match(gist_re)[1],
					cb = 'on_gist_' + code + '_' + Math.floor(Math.random() * 99999999 + 1),
					x = {
						element: document.createElement('div'),
						ready: function () {
							load_script('https://gist.github.com/' + code + '.json?callback=' + cb);
						}
					};
				x.element.id = 'gist-container-' + code;
				window[cb] = function (x) {
					var pre, div, i, filename, link, sendlink = function (e) {
						e.dataTransfer.setData('DownloadURL', this.href);
					};
					window[cb] = null;

					if (!x.div) {
						return undefined;
					}

					div = document.querySelector('div#gist-container-' + code);
					div.innerHTML = x.div;
					pre = div.querySelectorAll('.gist-data');
					for (i = 0; i < pre.length; i++) {
						filename = x.files[i];
						if (filename.substr(0, 8) !== 'gistfile') {
							link = document.createElement('a');
							link.href = 'https://raw.github.com/gist/' + code + '/' + filename;
							link.innerHTML = filename;
							link.target = '_blank';
							link.setAttribute('data-repo', code);
							link.setAttribute('data-filename', filename);
							link.className = 'gist-raw-link font-sans';
							if (can_drag) {
								link.className += ' dragout';
								link.setAttribute('draggable', 'true');
								link.setAttribute('data-downloadurl', [
									'text/plain',
									filename,
									link.href
								].join(':'));
								link.addEventListener('dragstart', sendlink, false);
							}
							pre[i].appendChild(link);
						}
					}
				};
				return x;
			});
		};

	(function () {
		if (!(document.body.className || '').match(/\bjs\b/)) {
			var classes = (document.body.className || '').split(/\s+/);
			classes.push('js');
			document.body.className = classes.join(' ');
		}
		load_local_stylesheet('combined.min.css', 'crottecss');
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
				return undefined;
			}
			try {
				document.documentElement.doScroll("left");
			} catch (e) {
				window.setTimeout(sc, 1);
				return undefined;
			}
			fn();
		};
		if (document.readyState === c) {
			window.setTimeout(fn, 1);
		} else if (document.addEventListener) {
			x = function () {
				document.removeEventListener(f, x, F);
				fn();
			};
			document.addEventListener(f, x, F);
			window.addEventListener("load", fn, F);
		} else if (document.attachEvent) {
			x = function () {
				if (document.readyState === c) {
					document.detachEvent(o, x);
					fn();
				}
			};
			document.attachEvent(o, x);
			window.attachEvent("onload", fn);
			try {
				toplevel = !window.frameElement;
			} catch (e) { }
			if (document.documentElement.doScroll && toplevel) {
				sc(fn);
			}
		}
	}(function () {
		if (domIsReady) {
			return undefined;
		}
		domIsReady = true;
		expand_references();
	}));
}());
