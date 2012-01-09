/*jslint devel: true, nomen: true, browser: true, regexp: true, unparam: false, forin: true, plusplus: true, bitwise: true, maxerr: 50, indent: 4 */

/*globals HTMLElement, Element*/
(function (document, string_class, array_class, object_class, prototype, element_class, classList, undef) {
	"use strict";
	var white_space_re = new RegExp(/\s+/),
		trim_re = new RegExp(/^\s+|\s+$/g);
	if (string_class[prototype].trim === undef) {
		string_class[prototype].trim = function () {
			return this.replace(trim_re, '');
		};
	}

	if (array_class[prototype].indexOf === undef) {
		array_class[prototype].indexOf = function (item) {
			var i = 0, len = this.length >>> 0;
			for (; i < len; ++i) {
				if (this[i] === item) {
					return i;
				}
			}
			return -1;
		};
	}

	if (array_class[prototype].lastIndexOf === undef) {
		array_class[prototype].lastIndexOf = function (item) {
			var len = this.length >>> 0, i = len - 1;
			for (; i >= 0; --i) {
				if (this[i] === item) {
					return len - i - 1;
				}
			}
			return -1;
		};
	}

	if (array_class[prototype].forEach === undef) {
		array_class[prototype].forEach = function (callback, thisArg) {
			var i = 0, len = this.length >>> 0;
			for (; i < len; ++i) {
				if (this[i] !== undef) {
					callback.call(thisArg, this[i], i, this);
				}
			}
		};
	}

	if (document.createElement("a")[classList] === undef) {
		(function () {
			var updateClassName = '$',
				ClassList = function (elem) {
					var trimmedClasses = elem.className.trim(),
						classes = trimmedClasses ? trimmedClasses.split(white_space_re) : [],
						that = this;
					classes.forEach(function (x) {
						if (that.indexOf(x) === -1) {
							that.push(x);
						}
					});
					this[updateClassName] = function () {
						elem.className = this.toString();
					};
				},
				Proto = ClassList[prototype] = [],
				Getter = function () {
					return new ClassList(this);
				},
				enumerable = 'enumerable',
				PropDesc = {
					'get': Getter,
					'configurable': true
				};
			Proto.item = function (i) {
				return this[i] || null;
			};
			Proto.contains = function (x) {
				return this.indexOf(x) !== -1;
			};
			Proto.add = function (x) {
				if (this.indexOf(x) === -1) {
					this.push(x);
					this[updateClassName]();
				}
			};
			Proto.remove = function (x) {
				var i = this.indexOf(x);
				if (i !== -1) {
					this.splice(i, 1);
					this[updateClassName]();
				}
			};
			Proto.toggle = function (x) {
				if (this.indexOf(x) === -1) {
					this.add(x);
					return true;
				} else {
					this.remove(x);
					return false;
				}
			};
			Proto.toString = function () {
				return this.join(" ");
			};
			if (object_class.defineProperty) {
				try {
					PropDesc[enumerable] = true;
					object_class.defineProperty(element_class[prototype], classList, PropDesc);
				} catch (ex) {
					// IE 8 doesn't support enumerable:true
					if (ex.number === -0x7FF5EC54) {
						PropDesc[enumerable] = false;
						object_class.defineProperty(element_class[prototype], classList, PropDesc);
					}
				}
			} else if (object_class[prototype].__defineGetter__) {
				element_class[prototype].__defineGetter__(classList, Getter);
			}
		}());
	}
}(
	document,
	String,
	Array,
	Object,
	'prototype',
	typeof HTMLElement === 'undefined' ? Element : HTMLElement,
	'classList'
));
