const USX_HCODES_DFLT = [0x00, 0x40, 0x80, 0xC0, 0xE0];
const USX_HCODE_LENS_DFLT = [2, 2, 2, 3, 3];

const USX_HCODES_ALPHA_ONLY = [0x00, 0x00, 0x00, 0x00, 0x00];
const USX_HCODE_LENS_ALPHA_ONLY = [0, 0, 0, 0, 0];

const USX_HCODES_ALPHA_NUM_ONLY = [0x00, 0x00, 0x80, 0x00, 0x00];
const USX_HCODE_LENS_ALPHA_NUM_ONLY = [1, 0, 1, 0, 0];

const USX_HCODES_ALPHA_NUM_SYM_ONLY = [0x00, 0x80, 0xC0, 0x00, 0x00];
const USX_HCODE_LENS_ALPHA_NUM_SYM_ONLY = [1, 2, 2, 0, 0];

const USX_HCODES_FAVOR_ALPHA = [0x00, 0x80, 0xA0, 0xC0, 0xE0];
const USX_HCODE_LENS_FAVOR_ALPHA = [1, 3, 3, 3, 3];

const USX_HCODES_FAVOR_DICT = [0x00, 0x40, 0xC0, 0x80, 0xE0];
const USX_HCODE_LENS_FAVOR_DICT = [2, 2, 3, 2, 3];

const USX_HCODES_FAVOR_SYM = [0x80, 0x00, 0xA0, 0xC0, 0xE0];
const USX_HCODE_LENS_FAVOR_SYM = [3, 1, 3, 3, 3];

//[{0x00, 0x40, 0xE0, 0xC0, 0x80}],
//[{2, 2, 3, 3, 2}],

const USX_HCODES_FAVOR_UMLAUT = [0x80, 0xA0, 0xC0, 0xE0, 0x00];
const USX_HCODE_LENS_FAVOR_UMLAUT = [3, 3, 3, 3, 1];

const USX_HCODES_NO_DICT = [0x00, 0x40, 0x80, 0x00, 0xC0];
const USX_HCODE_LENS_NO_DICT = [2, 2, 2, 0, 2];

const USX_HCODES_NO_UNI = [0x00, 0x40, 0x80, 0xC0, 0x00];
const USX_HCODE_LENS_NO_UNI = [2, 2, 2, 2, 0];

const USX_FREQ_SEQ_DFLT = ["\": \"", "\": ", "</", "=\"", "\":\"", "://"];
const USX_FREQ_SEQ_TXT = [" the ", " and ", "tion", " with", "ing", "ment"];
const USX_FREQ_SEQ_URL = ["https://", "www.", ".com", "http://", ".org", ".net"];
const USX_FREQ_SEQ_JSON = ["\": \"", "\": ", "\",", "}}}", "\":\"", "}}"];
const USX_FREQ_SEQ_HTML = ["</", "=\"", "div", "href", "class", "<p>"];
const USX_FREQ_SEQ_XML = ["</", "=\"", "\">", "<?xml version=\"1.0\"", "xmlns:", "://"];

const USX_TEMPLATES = ["tfff-of-tfTtf:rf:rf.fffZ", "tfff-of-tf", "(fff) fff-ffff", "tf:rf:rf", 0];

const USX_PSETS = [[USX_HCODES_DFLT, USX_HCODE_LENS_DFLT, USX_FREQ_SEQ_DFLT],
[USX_HCODES_ALPHA_ONLY, USX_HCODE_LENS_ALPHA_ONLY, USX_FREQ_SEQ_TXT],
[USX_HCODES_ALPHA_NUM_ONLY, USX_HCODE_LENS_ALPHA_NUM_ONLY, USX_FREQ_SEQ_TXT],
[USX_HCODES_ALPHA_NUM_SYM_ONLY, USX_HCODE_LENS_ALPHA_NUM_SYM_ONLY, USX_FREQ_SEQ_DFLT],
[USX_HCODES_ALPHA_NUM_SYM_ONLY, USX_HCODE_LENS_ALPHA_NUM_SYM_ONLY, USX_FREQ_SEQ_DFLT],
[USX_HCODES_FAVOR_ALPHA, USX_HCODE_LENS_FAVOR_ALPHA, USX_FREQ_SEQ_TXT],
[USX_HCODES_FAVOR_DICT, USX_HCODE_LENS_FAVOR_DICT, USX_FREQ_SEQ_DFLT],
[USX_HCODES_FAVOR_SYM, USX_HCODE_LENS_FAVOR_SYM, USX_FREQ_SEQ_DFLT],
[USX_HCODES_FAVOR_UMLAUT, USX_HCODE_LENS_FAVOR_UMLAUT, USX_FREQ_SEQ_DFLT],
[USX_HCODES_NO_DICT, USX_HCODE_LENS_NO_DICT, USX_FREQ_SEQ_DFLT],
[USX_HCODES_NO_UNI, USX_HCODE_LENS_NO_UNI, USX_FREQ_SEQ_DFLT],
[USX_HCODES_NO_UNI, USX_HCODE_LENS_NO_UNI, USX_FREQ_SEQ_TXT],
[USX_HCODES_DFLT, USX_HCODE_LENS_DFLT, USX_FREQ_SEQ_URL],
[USX_HCODES_DFLT, USX_HCODE_LENS_DFLT, USX_FREQ_SEQ_JSON],
[USX_HCODES_NO_UNI, USX_HCODE_LENS_NO_UNI, USX_FREQ_SEQ_JSON],
[USX_HCODES_DFLT, USX_HCODE_LENS_DFLT, USX_FREQ_SEQ_XML],
[USX_HCODES_DFLT, USX_HCODE_LENS_DFLT, USX_FREQ_SEQ_HTML]];

var args = process.argv.slice(2);

const usx2 = require('./unishox2');
var buf = new Uint8Array(512);

var pset = 0;
if (args.length > 1)
  pset = parseInt(args[1], 10);
var buf_len = usx2.unishox2_compress(args[0], args[0].length, buf, USX_PSETS[pset][0], USX_PSETS[pset][1], USX_PSETS[pset][2], USX_TEMPLATES);
var out_str = usx2.unishox2_decompress(buf, buf_len, USX_PSETS[pset][0], USX_PSETS[pset][1], USX_PSETS[pset][2], USX_TEMPLATES);
console.log("");
console.log("Input: " + args[0]);
console.log("");
console.log("Compressed (Uint8Array) : " + buf.slice(0, buf_len));
console.log("");
console.log("Decompressed: " + out_str);
console.log("");
console.log("Compression ratio:(" + buf_len + "/" + args[0].length + " = " + (Math.round((args[0].length-buf_len)*1000/args[0].length) / 10) + "% savings)");
console.log("");
