ace.define("ace/theme/tea", ["require", "exports", "module", "ace/lib/dom"], function (require, exports, module) {
	"use strict";

	exports.isDark = true;
	exports.cssClass = "ace-tea";
	exports.cssText = `
.ace-tea .ace_gutter { background: #1c1e1f; color: #5b595c; }
.ace-tea { background-color: #1c1e1f; color: #fcfcfa; }
.ace-tea .ace_cursor { color: #fcfcfa; }
.ace-tea .ace_marker-layer .ace_selection { background: #49483e; }
.ace-tea.ace_multiselect .ace_selection.ace_start { box-shadow: 0 0 3px 0 #1c1e1f; }
.ace-tea .ace_marker-layer .ace_step { background: #665200; }
.ace-tea .ace_marker-layer .ace_bracket { margin: -1px 0 0 -1px; border: 1px solid #727072; }
.ace-tea .ace_marker-layer .ace_active-line { background: #272822; }
.ace-tea .ace_gutter-active-line { background-color: #272822; }
.ace-tea .ace_invisible { color: #727072; }
.ace-tea .ace_keyword, .ace-tea .ace_storage { color: #ff6188; }
.ace-tea .ace_constant.ace_language, .ace-tea .ace_constant.ace_numeric { color: #ab9df2; }
.ace-tea .ace_support.ace_function { color: #a9dc76; }
.ace-tea .ace_string { color: #ffd866; }
.ace-tea .ace_comment { color: #727072; font-style: italic; }
.ace-tea .ace_constant.ace_character, .ace-tea .ace_constant.ace_other { color: #78dce8; }
.ace-tea .ace_variable { color: #fcfcfa; }
.ace-tea .ace_keyword.ace_operator { color: #ff6188; }
.ace-tea .ace_paren, .ace-tea .ace_punctuation { color: #939293; }
.ace-tea .ace_invalid { color: #fcfcfa; background-color: #ff6188; }
.ace-tea .ace_indent-guide { background: linear-gradient(to bottom, transparent 50%, #3c3d38 50%) right repeat-y; background-size: 1px 4px; }
`;

	const dom = require("ace/lib/dom");
	dom.importCssString(exports.cssText, exports.cssClass);
});
