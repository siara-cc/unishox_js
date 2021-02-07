/*
 * Copyright (C) 2020 Siara Logics (cc)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @author Arundale Ramanathan
 *
 */

var USX_HCODES_DFLT = new Uint8Array([0x00, 0x40, 0xE0, 0x80, 0xC0]);
var USX_HCODE_LENS_DFLT = new Uint8Array([2, 2, 3, 2, 3]);
var USX_FREQ_SEQ_DFLT = null;

const USX_ALPHA = 0;
const USX_SYM = 1;
const USX_NUM = 2;
const USX_DICT = 3;
const USX_DELTA = 4;

var usx_sets = [new Uint8Array([  0, ' ', 'e', 't', 'a', 'o', 'i', 'n',
                 's', 'r', 'l', 'c', 'd', 'h', 'u', 'p', 'm', 'b', 
                 'g', 'w', 'f', 'y', 'v', 'k', 'q', 'j', 'x', 'z']),
                new Uint8Array(['"', '{', '}', '_', '<', '>', ':', '\n',
                   0, '[', ']', '\\', ';', '\'', '\t', '@', '*', '&',
                 '?', '!', '^', '|', '\r', '~', '`', 0, 0, 0]),
                new Uint8Array([  0, ',', '.', '/', '(', ')', '-', '1',
                 '0', '9', '2', '3', '4', '5', '6', '7', '8', ' ',
                 '=', '+', '$', '%', '#', 0, 0, 0, 0, 0])];

// Stores position of letter in usx_sets.
// First 3 bits - position in usx_hcodes
// Next  5 bits - position in usx_vcodes
var usx_code_94 = new Array(94);

var usx_vcodes = new Uint8Array(
  [ 0x00, 0x40, 0x60, 0x80, 0x90, 0xA0, 0xB0,
    0xC0, 0xD0, 0xD8, 0xE0, 0xE4, 0xE8, 0xEC,
    0xEE, 0xF0, 0xF2, 0xF4, 0xF6, 0xF7, 0xF8,
    0xF9, 0xFA, 0xFB, 0xFC, 0xFD, 0xFE, 0xFF ]);
var usx_vcode_lens = new Uint8Array(
  [  2,    3,    3,    4,    4,    4,    4,
     4,    5,    5,    6,    6,    6,    7,
     7,    7,    7,    7,    8,    8,    8,
     8,    8,    8,    8,    8,    8,    8 ];

var usx_freq_codes = new Uint8Array([(1 << 5) + 25, (1 << 5) + 26, (1 << 5) + 27, (2 << 5) + 23, (2 << 5) + 24, (2 << 5) + 25]);

var NICE_LEN = 5;

const RPT_CODE = ((2 << 5) + 26);
const TERM_CODE = ((2 << 5) + 27);
const LF_CODE = ((1 << 5) + 7);
const CRLF_CODE = ((1 << 5) + 8);
const CR_CODE = ((1 << 5) + 22);
const TAB_CODE = ((1 << 5) + 14);
const NUM_SPC_CODE = ((2 << 5) + 17);

const UNI_STATE_SPL_CODE = 0xF8;
const UNI_STATE_SPL_CODE_LEN = 5;
const UNI_STATE_SW_CODE = 0x80;
const UNI_STATE_SW_CODE_LEN = 2;

const SW_CODE = 0;
const SW_CODE_LEN = 2;

const USX_OFFSET_94 = 33;

// From: https://stackoverflow.com/a/24466476/5072621
// Note that size is the number of array elements to set,
// not the number of bytes.
function memset(array, val, size) {
  for (var i = 0; i < size; ++i) {
    array[i] = val;
  }
}
function sizeof(array) {
  return array.length;
}

function memcmp(array1, array2, length) {
  for (var i = 0; i < length; ++i) {
    if (array1[i] != array2[i]) {
      return false;

    }
  }
  return true;
}

var is_inited = 0;
function init_coder() {
  if (is_inited)
    return;
  memset(usx_code_94, '\0', sizeof(usx_code_94));
  for (var i = 0; i < 3; i++) {
    for (var j = 0; j < 28; j++) {
      var c = usx_sets[i][j];
      if (c != 0 && c != 32) {
        usx_code_94[c - USX_OFFSET_94] = (i << 5) + j;
        if (c >= 'a' && c <= 'z')
          usx_code_94[c - USX_OFFSET_94 - ('a' - 'A')] = (i << 5) + j;
      }
    }
  }
  is_inited = 1;
}

var usx_mask = new Uint8Array([0x80, 0xC0, 0xE0, 0xF0, 0xF8, 0xFC, 0xFE, 0xFF]);
function append_bits(out, ol, code, clen) {

  var cur_bit;
  var blen;
  var a_byte;

  //console.log(util.format("%d,%x,%d,%d\n", ol, code, clen, state));

  while (clen > 0) {
     cur_bit = ol % 8;
     blen = clen;
     a_byte = code & usx_mask[blen - 1];
     a_byte >>= cur_bit;
     if (blen + cur_bit > 8)
        blen = (8 - cur_bit);
     if (cur_bit == 0)
        out[ol / 8] = a_byte;
     else
        out[ol / 8] |= a_byte;
     code <<= blen;
     ol += blen;
     clen -= blen;
   }
   return ol;
}

function append_switch_code(out, ol, state) {
  if (state == USX_DELTA) {
    ol = append_bits(out, ol, UNI_STATE_SPL_CODE, UNI_STATE_SPL_CODE_LEN);
    ol = append_bits(out, ol, UNI_STATE_SW_CODE, UNI_STATE_SW_CODE_LEN);
  } else
    ol = append_bits(out, ol, SW_CODE, SW_CODE_LEN);
  return ol;
}

function append_code(out, ol, code, state, usx_hcodes, usx_hcode_lens) {
  var hcode = code >> 5;
  var vcode = code & 0x1F;
  if (!usx_hcode_lens[hcode] && hcode != USX_ALPHA)
    return ol;
  switch (hcode) {
    case USX_ALPHA:
      if (state != USX_ALPHA) {
        ol = append_switch_code(out, ol, state);
        ol = append_bits(out, ol, usx_hcodes[USX_ALPHA], usx_hcode_lens[USX_ALPHA]);
        state = USX_ALPHA;
      }
      break;
    case USX_SYM:
      ol = append_switch_code(out, ol, state);
      ol = append_bits(out, ol, usx_hcodes[USX_SYM], usx_hcode_lens[USX_SYM]);
      break;
    case USX_NUM:
      if (state != USX_NUM) {
        ol = append_switch_code(out, ol, state);
        ol = append_bits(out, ol, usx_hcodes[USX_NUM], usx_hcode_lens[USX_NUM]);
        if (String.fromCharCode(usx_sets[hcode][vcode]) >= 48 && String.fromCharCode(usx_sets[hcode][vcode]) <= 57)
          state = USX_NUM;
      }
  }
  return [append_bits(out, ol, usx_vcodes[vcode], usx_vcode_lens[vcode]), state];
}

const count_bit_lens = new Uint8Array([2, 4, 7, 11, 16]);
const count_adder = [4, 20, 148, 2196, 67732];
// First five bits are code and Last three bits of codes represent length
const count_codes = new Uint8Array([0x01, 0x82, 0xC3, 0xE4, 0xF4]);
function encodeCount(out, ol, count) {
  for (var i = 0; i < 5; i++) {
    if (count < count_adder[i]) {
      ol = append_bits(out, ol, (count_codes[i] & 0xF8), count_codes[i] & 0x07);
      var count16 = (count - (i ? count_adder[i - 1] : 0)) << (16 - count_bit_lens[i]);
      if (count_bit_lens[i] > 8) {
        ol = append_bits(out, ol, count16 >> 8, 8);
        ol = append_bits(out, ol, count16 & 0xFF, count_bit_lens[i] - 8);
      } else
        ol = append_bits(out, ol, count16 >> 8, count_bit_lens[i]);
      return ol;
    }
  }
  return ol;
}

const uni_bit_len = new Uint8Array([6, 12, 14, 16, 21]);
const uni_adder = [0, 64, 4160, 20544, 86080];

function encodeUnicode(out, ol, code, prev_code) {
  // First five bits are code and Last three bits of codes represent length
  //const byte codes[8] = {0x00, 0x42, 0x83, 0xA3, 0xC3, 0xE4, 0xF5, 0xFD};
  const codes = new Uint8Array([0x01, 0x82, 0xC3, 0xE4, 0xF5, 0xFD]);
  var till = 0;
  var orig_ol = ol;
  var diff = code - prev_code;
  if (diff < 0)
    diff = -diff;
  //printf("%ld, ", code);
  //printf("Diff: %d\n", diff);
  for (var i = 0; i < 5; i++) {
    till += (1 << uni_bit_len[i]);
    if (diff < till) {
      ol = append_bits(out, ol, (codes[i] & 0xF8), codes[i] & 0x07);
      //if (diff) {
        ol = append_bits(out, ol, prev_code > code ? 0x80 : 0, 1);
        var val = diff - uni_adder[i];
        //printf("Val: %d\n", val);
        if (uni_bit_len[i] > 16) {
          val <<= (24 - uni_bit_len[i]);
          ol = append_bits(out, ol, val >> 16, 8);
          ol = append_bits(out, ol, (val >> 8) & 0xFF, 8);
          ol = append_bits(out, ol, val & 0xFF, uni_bit_len[i] - 16);
        } else
        if (uni_bit_len[i] > 8) {
          val <<= (16 - uni_bit_len[i]);
          ol = append_bits(out, ol, val >> 8, 8);
          ol = append_bits(out, ol, val & 0xFF, uni_bit_len[i] - 8);
        } else {
          val <<= (8 - uni_bit_len[i]);
          ol = append_bits(out, ol, val & 0xFF, uni_bit_len[i]);
        }
      //}
      //printf("bits:%d\n", ol-orig_ol);
      return ol;
    }
  }
  return ol;
}

function readUTF8(input, len, l, utf8len) {
  var ret = 0;
  var utf8len = 0;
  if (l < (len - 1) && (input[l] & 0xE0) == 0xC0 && (input[l + 1] & 0xC0) == 0x80) {
    utf8len = 2;
    ret = (input[l] & 0x1F);
    ret <<= 6;
    ret += (input[l + 1] & 0x3F);
    if (ret < 0x80)
      ret = 0;
  } else
  if (l < (len - 2) && (input[l] & 0xF0) == 0xE0 && (input[l + 1] & 0xC0) == 0x80
          && (input[l + 2] & 0xC0) == 0x80) {
    utf8len = 3;
    ret = (input[l] & 0x0F);
    ret <<= 6;
    ret += (input[l + 1] & 0x3F);
    ret <<= 6;
    ret += (input[l + 2] & 0x3F);
    if (ret < 0x0800)
      ret = 0;
  } else
  if (l < (len - 3) && (input[l] & 0xF8) == 0xF0 && (input[l + 1] & 0xC0) == 0x80
          && (input[l + 2] & 0xC0) == 0x80 && (input[l + 3] & 0xC0) == 0x80) {
    utf8len = 4;
    ret = (input[l] & 0x07);
    ret <<= 6;
    ret += (input[l + 1] & 0x3F);
    ret <<= 6;
    ret += (input[l + 2] & 0x3F);
    ret <<= 6;
    ret += (input[l + 3] & 0x3F);
    if (ret < 0x10000)
      ret = 0;
  }
  return [ret, utf8len];
}

function matchOccurance(input, len, l, out, ol, state, usx_hcodes, usx_hcode_lens) {
  var j, k;
  var longest_dist = 0;
  var longest_len = 0;
  for (j = l - NICE_LEN; j >= 0; j--) {
    for (k = l; k < len && j + k - l < l; k++) {
      if (input[k] != input[j + k - l])
        break;
    }
    while ((input[k] >> 6) == 2)
      k--; // Skip partial UTF-8 matches
    //if ((in[k - 1] >> 3) == 0x1E || (in[k - 1] >> 4) == 0x0E || (in[k - 1] >> 5) == 0x06)
    //  k--;
    if (k - l > NICE_LEN - 1) {
      var match_len = k - l - NICE_LEN;
      var match_dist = l - j - NICE_LEN + 1;
      if (match_len > longest_len) {
          longest_len = match_len;
          longest_dist = match_dist;
      }
    }
  }
  if (longest_len) {
    ol = append_switch_code(out, ol, state);
    ol = append_bits(out, ol, usx_hcodes[USX_DICT], usx_hcode_lens[USX_DICT]);
    //printf("Len:%d / Dist:%d\n", longest_len, longest_dist);
    ol = encodeCount(out, ol, longest_len);
    ol = encodeCount(out, ol, longest_dist);
    l += (longest_len + NICE_LEN);
    l--;
    return [l, ol];
  }
  return [-l, ol];
}

function matchLine(input, len, l, out, ol, prev_lines, state, usx_hcodes, usx_hcode_lens) {
  var last_ol = ol;
  var last_len = 0;
  var last_dist = 0;
  var last_ctx = 0;
  var line_ctr = 0;
  var j = 0;
  do {
    var i, k;
    var line_len = prev_lines.data.length;
    var limit = (line_ctr == 0 ? l : line_len);
    for (; j < limit; j++) {
      for (i = l, k = j; k < line_len && i < len; k++, i++) {
        if (prev_lines.data[k] != input[i])
          break;
      }
      while ((prev_lines.data[k] >> 6) == 2)
        k--; // Skip partial UTF-8 matches
      if ((k - j) >= NICE_LEN) {
        if (last_len) {
          if (j > last_dist)
            continue;
          //int saving = ((k - j) - last_len) + (last_dist - j) + (last_ctx - line_ctr);
          //if (saving < 0) {
          //  //printf("No savng: %d\n", saving);
          //  continue;
          //}
          ol = last_ol;
        }
        last_len = (k - j);
        last_dist = j;
        last_ctx = line_ctr;
        ol = append_switch_code(out, ol, state);
        ol = append_bits(out, ol, usx_hcodes[USX_DICT], usx_hcode_lens[USX_DICT]);
        ol = encodeCount(out, ol, last_len - NICE_LEN);
        ol = encodeCount(out, ol, last_dist);
        ol = encodeCount(out, ol, last_ctx);
        /*
        if ((*ol - last_ol) > (last_len * 4)) {
          last_len = 0;
          *ol = last_ol;
        }*/
        //printf("Len: %d, Dist: %d, Line: %d\n", last_len, last_dist, last_ctx);
        j += last_len;
      }
    }
    line_ctr++;
    prev_lines = prev_lines.previous;
  } while (prev_lines != null && prev_lines.data != null);
  if (last_len) {
    l += last_len;
    l--;
    return [l, ol];
  }
  return [-l, ol];
}

function getBaseCode(ch) {
  if (ch >= '0' && ch <= '9')
    return (ch - '0') << 4;
  else if (ch >= 'A' && ch <= 'F')
    return (ch - 'A' + 10) << 4;
  else if (ch >= 'a' && ch <= 'f')
    return (ch - 'a' + 10) << 4;
  return 0;
}

const USX_NIB_NUM = 0;
const USX_NIB_HEX_LOWER = 1;
const USX_NIB_HEX_UPPER = 2;
const USX_NIB_NOT = 3;
function getNibbleType(ch) {
  if (ch >= '0' && ch <= '9')
    return USX_NIB_NUM;
  else if (ch >= 'a' && ch <= 'f')
    return USX_NIB_HEX_LOWER;
  else if (ch >= 'A' && ch <= 'F')
    return USX_NIB_HEX_UPPER;
  return USX_NIB_NOT;
}

function append_nibble_escape(out, ol, state, usx_hcodes, usx_hcode_lens) {
  ol = append_switch_code(out, ol, state);
  ol = append_bits(out, ol, usx_hcodes[USX_NUM], usx_hcode_lens[USX_NUM]);
  ol = append_bits(out, ol, 0, 2);
  return ol;
}

function unishox2_compress_lines(input, len, out, usx_hcodes, usx_hcode_lens, usx_freq_seq, prev_lines) {

  var state;

  var l, ll, ol;
  var c_in, c_next;
  var prev_uni;
  var is_upper, is_all_upper;

  init_coder();
  ol = 0;
  prev_uni = 0;
  state = USX_ALPHA;
  is_all_upper = 0;
  ol = append_bits(out, ol, 0x80, 1); // magic bit
  for (l=0; l<len; l++) {

    c_in = in[l];
    if (to_match_repeats && usx_hcode_lens[USX_DICT] && l < (len - NICE_LEN + 1)) {
      if (prev_lines) {
        [l, ol] = matchLine(input, len, l, out, ol, prev_lines, state, usx_hcodes, usx_hcode_lens);
        if (l > 0) {
          continue;
        }
        l = -l;
      } else {
          [l, ol] = matchOccurance(input, len, l, out, ol, state, usx_hcodes, usx_hcode_lens);
          if (l > 0) {
            continue;
          }
          l = -l;
      }
    }

    c_in = input[l];

    if (l > 0 && l < len - 4 && usx_hcode_lens[USX_NUM] > 0 && c_in <= '~') {
      if (c_in == input[l - 1] && c_in == input[l + 1] && c_in == input[l + 2] &&
          c_in == input[l + 3]) {
        var rpt_count = l + 4;
        while (rpt_count < len && input[rpt_count] == c_in)
          rpt_count++;
        rpt_count -= l;
        [ol, state] = append_code(out, ol, RPT_CODE, state, usx_hcodes, usx_hcode_lens);
        ol = encodeCount(out, ol, rpt_count - 4);
        l += rpt_count;
        l--;
        continue;
      }
    }

    if (l <= (len - 36) && usx_hcode_lens[USX_NUM]) {
      if (input[l + 8] === '-' && input[l + 13] === '-' 
          && input[l + 18] === '-' && input[l + 23] === '-') {
        var is_uid_upper = 0;
        var uid_pos = l;
        for (; uid_pos < l + 36; uid_pos++) {
          var c_uid = input[uid_pos];
          if (c_uid === '-')
            continue;
          c_uid = getNibbleType(c_uid);
          if (c_uid < USX_NIB_NOT) {
            if (c_uid == USX_NIB_HEX_UPPER)
              is_uid_upper = 1;
            continue;
          }
          break;
        }
        if (uid_pos == l + 36) {
          ol = append_nibble_escape(out, ol, state, usx_hcodes, usx_hcode_lens);
          ol = append_bits(out, ol, (is_uid_upper ? 0xF0 : 0xC0), (is_uid_upper ? 5 : 3));
          for (uid_pos = l; uid_pos < l + 36; uid_pos++) {
            var c_uid = input[uid_pos];
            if (c_uid != '-')
              ol = append_bits(out, ol, getBaseCode(c_uid), 4);
          }
          //printf("GUID:\n");
          l += 35;
          continue;
        }
      }
    }

    if (l < (len - 5) && usx_hcode_lens[USX_NUM]) {
      char hex_type = USX_NIB_NUM;
      int hex_len = 0;
      do {
        char nib_type = getNibbleType(in[l + hex_len]);
        if (nib_type == USX_NIB_NOT)
          break;
        if (nib_type != USX_NIB_NUM) {
          if (hex_type != nib_type)
            break;
          hex_type = nib_type;
        }
        hex_len++;
      } while (l + hex_len < len);
      if (hex_len > 10 && hex_type == USX_NIB_NUM)
        hex_type = USX_NIB_HEX_LOWER;
      if ((hex_type == USX_NIB_HEX_LOWER || hex_type == USX_NIB_HEX_UPPER) && hex_len > 3) {
        ol = append_nibble_escape(out, ol, state, usx_hcodes, usx_hcode_lens);
        ol = append_bits(out, ol, (hex_type == USX_NIB_HEX_LOWER ? 0x80 : 0xE0), (hex_type == USX_NIB_HEX_LOWER ? 2 : 4));
        ol = encodeCount(out, ol, hex_len);
        do {
          ol = append_bits(out, ol, getBaseCode(in[l++]), 4);
        } while (--hex_len);
        l--;
        continue;
      }
    }

    if (usx_templates != NULL) {
      int i;
      for (i = 0; i < 5; i++) {
        if (usx_templates[i]) {
          int rem = strlen(usx_templates[i]);
          int j = 0;
          for (; j < rem && l + j < len; j++) {
            char c_t = usx_templates[i][j];
            c_in = in[l + j];
            if (c_t == 'f' || c_t == 'F') {
              if (getNibbleType(c_in) != (c_t == 'f' ? USX_NIB_HEX_LOWER : USX_NIB_HEX_UPPER)
                       && getNibbleType(c_in) != USX_NIB_NUM) {
                break;
              }
            } else
            if (c_t == 'r' || c_t == 't' || c_t == 'o') {
              if (c_in < '0' || c_in > (c_t == 'r' ? '7' : (c_t == 't' ? '3' : '1')))
                break;
            } else
            if (c_t != c_in)
              break;
          }
          if (((float)j / rem) > 0.66) {
            //printf("%s\n", usx_templates[i]);
            rem = rem - j;
            ol = append_nibble_escape(out, ol, state, usx_hcodes, usx_hcode_lens);
            ol = append_bits(out, ol, 0, 1);
            ol = append_bits(out, ol, (count_codes[i] & 0xF8), count_codes[i] & 0x07);
            ol = encodeCount(out, ol, rem);
            for (int k = 0; k < j; k++) {
              char c_t = usx_templates[i][k];
              if (c_t == 'f' || c_t == 'F')
                ol = append_bits(out, ol, getBaseCode(in[l + k]), 4);
              else if (c_t == 'r' || c_t == 't' || c_t == 'o') {
                c_t = (c_t == 'r' ? 3 : (c_t == 't' ? 2 : 1));
                ol = append_bits(out, ol, (in[l + k] - '0') << (8 - c_t), c_t);
              }
            }
            l += j;
            l--;
            break;
          }
        }
      }
      if (i < 5)
        continue;
    }

    if (usx_freq_seq != NULL) {
      for (var i = 0; i < 6; i++) {
        var seq_len = usx_freq_seq[i].length;
        if (len - seq_len > 0 && l < len - seq_len) {
          if (usx_freq_seq[i].substring(0, seq_len) == input.substring(l, l + seq_len) && usx_hcode_lens[usx_freq_codes[i] >> 5]) {
            [ol, state] = append_code(out, ol, usx_freq_codes[i], state, usx_hcodes, usx_hcode_lens);
            l += seq_len;
            i = -1;
          }
        }
      }
    }
    c_in = input[l];

    is_upper = 0;
    if (c_in >= 'A' && c_in <= 'Z')
      is_upper = 1;
    else {
      if (is_all_upper) {
        is_all_upper = 0;
        ol = append_switch_code(out, ol, state);
        ol = append_bits(out, ol, usx_hcodes[USX_ALPHA], usx_hcode_lens[USX_ALPHA]);
        state = USX_ALPHA;
      }
    }
    if (is_upper && !is_all_upper) {
      if (state == USX_NUM) {
        ol = append_switch_code(out, ol, state);
        ol = append_bits(out, ol, usx_hcodes[USX_ALPHA], usx_hcode_lens[USX_ALPHA]);
        state = USX_ALPHA;
      }
      ol = append_switch_code(out, ol, state);
      ol = append_bits(out, ol, usx_hcodes[USX_ALPHA], usx_hcode_lens[USX_ALPHA]);
      if (state == USX_DELTA) {
        state = USX_ALPHA;
        ol = append_switch_code(out, ol, state);
        ol = append_bits(out, ol, usx_hcodes[USX_ALPHA], usx_hcode_lens[USX_ALPHA]);
      }
    }
    c_next = 0;
    if (l+1 < len)
      c_next = input[l+1];

    if (c_in >= 32 && c_in <= 126) {
      if (is_upper && !is_all_upper) {
        for (ll=l+4; ll>=l && ll<len; ll--) {
          if (input[ll] < 'A' || input[ll] > 'Z')
            break;
        }
        if (ll == l-1) {
          ol = append_switch_code(out, ol, state);
          ol = append_bits(out, ol, usx_hcodes[USX_ALPHA], usx_hcode_lens[USX_ALPHA]);
          state = USX_ALPHA;
          is_all_upper = 1;
        }
      }
      if (state == USX_DELTA && (c_in == ' ' || c_in == '.' || c_in == ',' || c_in == '\n')) {
        var spl_code = (c_in == ',' ? 0xC0 : (c_in == '.' ? 0xE0 : (c_in == ' ' ? 0 : (c_in == 13 ? 0xF0 : 0xFF))));
        if (spl_code != 0xFF) {
          var spl_code_len = (c_in == ',' ? 3 : (c_in == '.' ? 4 : (c_in == ' ' ? 1 : (c_in == 13 ? 4 : 4))));
          ol = append_bits(out, ol, UNI_STATE_SPL_CODE, UNI_STATE_SPL_CODE_LEN);
          ol = append_bits(out, ol, spl_code, spl_code_len);
          continue;
        }
      }
      c_in -= 32;
      if (is_all_upper && is_upper)
        c_in += 32;
      if (c_in == 0) {
        if (state == USX_DELTA) {
            ol = append_bits(out, ol, UNI_STATE_SPL_CODE, UNI_STATE_SPL_CODE_LEN);
            ol = append_bits(out, ol, 0, 1);
        } else
        if (state == USX_NUM)
          ol = append_bits(out, ol, usx_vcodes[NUM_SPC_CODE & 0x1F], usx_vcode_lens[NUM_SPC_CODE & 0x1F]);
        else
          ol = append_bits(out, ol, usx_vcodes[1], usx_vcode_lens[1]);
      } else {
        c_in--;
        [ol, state] = append_code(out, ol, usx_code_94[c_in], state, usx_hcodes, usx_hcode_lens);
      }
    } else
    if (c_in == 13 && c_next == 10) {
      [ol, state] = append_code(out, ol, CRLF_CODE, state, usx_hcodes, usx_hcode_lens);
      l++;
    } else
    if (c_in == 10) {
      [ol, state] = append_code(out, ol, LF_CODE, state, usx_hcodes, usx_hcode_lens);
    } else
    if (c_in == 13) {
      [ol, state] = append_code(out, ol, CR_CODE, state, usx_hcodes, usx_hcode_lens);
    } else
    if (c_in == '\t') {
      [ol, state] = append_code(out, ol, TAB_CODE, state, usx_hcodes, usx_hcode_lens);
    } else {
      var uni, utf8len;
      [uni, utf8len] = readUTF8(input, len, l, utf8len);
      if (uni) {
        l += utf8len;
        if (state != USX_DELTA) {
          [uni2, utf8len] = readUTF8(input, len, l + 1, utf8len);
          if (uni2) {
            if (state != USX_ALPHA) {
              ol = append_switch_code(out, ol, state);
              ol = append_bits(out, ol, usx_hcodes[USX_ALPHA], usx_hcode_lens[USX_ALPHA]);
            }
            ol = append_switch_code(out, ol, state);
            ol = append_bits(out, ol, usx_hcodes[USX_ALPHA], usx_hcode_lens[USX_ALPHA]);
            ol = append_bits(out, ol, usx_vcodes[1], usx_vcode_lens[1]); // code for space (' ')
            state = USX_DELTA;
          } else {
            ol = append_switch_code(out, ol, state);
            ol = append_bits(out, ol, usx_hcodes[USX_DELTA], usx_hcode_lens[USX_DELTA]);
          }
        }
        ol = encodeUnicode(out, ol, uni, prev_uni);
        //printf("%d:%d:%d,", l, utf8len, uni);
        if (uni != 0x3002)
          prev_uni = uni;
      } else {
        // Encoding Binary characters does not work
        //printf("Bin:%d:%x\n", (unsigned char) c_in, (unsigned char) c_in);
        uni = c_in;
        ol = encodeUnicode(out, ol, uni, prev_uni);
        prev_uni = uni;
      }
    }
  }
  var ret = ol/8+(ol%8?1:0);
  if (ol % 8) {
    if (state == USX_DELTA)
      ol = append_bits(out, ol, UNI_STATE_SPL_CODE, UNI_STATE_SPL_CODE_LEN);
      [ol, state] = append_code(out, ol, TERM_CODE, state, usx_hcodes, usx_hcode_lens);
  }
  //printf("\n%ld\n", ol);
  return ret;

}

function unishox2_compress(input, len, out, usx_hcodes, usx_hcode_lens, usx_freq_seq) {
  return unishox2_compress_lines(input, len, out, usx_hcodes, usx_hcode_lens, usx_freq_seq, null);
}

function unishox2_compress_simple(input, len, out) {
  return unishox2_compress_lines(input, len, out, USX_HCODES_DFLT, USX_HCODE_LENS_DFLT, USX_FREQ_SEQ_DFLT, null);
}

function readBit(input, bit_no) {
   return input[bit_no >> 3] & (0x80 >> (bit_no % 8));
}

function read8bitCode(input, len, bit_no) {
  var bit_pos = bit_no & 0x07;
  var char_pos = bit_no >> 3;
  var code = (input[char_pos] << bit_pos) & 0xFF;
  if ((bit_no + bit_pos) < len) {
    code |= input[++char_pos] >> (8 - bit_pos);
  } else
    code |= (0xFF >> (8 - bit_pos));
  return [code, bit_no];
}

// Decoder is designed for using less memory, not speed
const SECTION_COUNT = 5;
const usx_vsections = [0x7F, 0xBF, 0xDF, 0xEF, 0xFF];
const usx_vsection_pos = [0, 4, 8, 12, 20];
const usx_vsection_mask = [0x7F, 0x3F, 0x1F, 0x0F, 0x0F];
const usx_vsection_shift = [5, 4, 3, 1, 0];

// Vertical decoder lookup table - 3 bits code len, 5 bytes vertical pos
// code len is one less as 8 cannot be accommodated in 3 bits
const usx_vcode_lookup = [
  (1 << 5) + 0,  (1 << 5) + 0,  (2 << 5) + 1,  (2 << 5) + 2,  // Section 1
  (3 << 5) + 3,  (3 << 5) + 4,  (3 << 5) + 5,  (3 << 5) + 6,  // Section 2
  (3 << 5) + 7,  (3 << 5) + 7,  (4 << 5) + 8,  (4 << 5) + 9,  // Section 3
  (5 << 5) + 10, (5 << 5) + 10, (5 << 5) + 11, (5 << 5) + 11, // Section 4
  (5 << 5) + 12, (5 << 5) + 12, (6 << 5) + 13, (6 << 5) + 14,
  (6 << 5) + 15, (6 << 5) + 15, (6 << 5) + 16, (6 << 5) + 16, // Section 5
  (6 << 5) + 17, (6 << 5) + 17, (7 << 5) + 18, (7 << 5) + 19,
  (7 << 5) + 20, (7 << 5) + 21, (7 << 5) + 22, (7 << 5) + 23,
  (7 << 5) + 24, (7 << 5) + 25, (7 << 5) + 26, (7 << 5) + 27
];

function readVCodeIdx(input, len, bit_no) {
  if (bit_no < len) {
    var code;
    [code, bit_no] = read8bitCode(input, len, bit_no);
    var i = 0;
    do {
      if (code <= usx_vsections[i]) {
        var vcode = usx_vcode_lookup[usx_vsection_pos[i] + ((code & usx_vsection_mask[i]) >> usx_vsection_shift[i])];
        bit_no += ((vcode >> 5) + 1);
        if (bit_no > len)
          return [99, bit_no];
        return [vcode & 0x1F, bit_no];
      }
    } while (++i < SECTION_COUNT);
  }
  return [99, bit_no];
}

const len_masks = [0x80, 0xC0, 0xE0, 0xF0, 0xF8, 0xFC, 0xFE, 0xFF];
function readHCodeIdx(input, len, bit_no, usx_hcodes, usx_hcode_lens) {
  if (!usx_hcode_lens[USX_ALPHA])
    return [USX_ALPHA, bit_no];
  if (bit_no < len) {
    var code;
    [code, bit_no] = read8bitCode(input, len, bit_no);
    for (var code_pos = 0; code_pos < 5; code_pos++) {
      if ((code & len_masks[usx_hcode_lens[code_pos] - 1]) == usx_hcodes[code_pos]) {
        bit_no += usx_hcode_lens[code_pos];
        return [code_pos, bit_no];
      }
    }
  }
  return [99, bit_no];
}

// TODO: Last value check.. Also len check in readBit
function getStepCodeIdx(input, len, bit_no, limit) {
  var idx = 0;
  while (bit_no < len && readBit(input, bit_no) > 0) {
    idx++;
    bit_no++;
    if (idx == limit)
      return [idx, bit_no];
  }
  if (bit_no >= len)
    return [99, bit_no];
  bit_no++;
  return [idx, bit_no];
}

function getNumFromBits(input, bit_no, count) {
   var ret = 0;
   while (count--) {
     ret += (readBit(input, bit_no) > 0 ? 1 << count : 0);
     bit_no++;
   }
   return ret;
}

function readCount(input, bit_no, len) {
  const bit_len = [2, 5,  7, 9, 12, 16, 17];
  const adder = [0, 4, 36, 164, 676, 4772, 0];
  var idx = 0;
  [idx, bit_no] = getStepCodeIdx(input, len, bit_no, 5);
  if (idx == 99)
    return [-1, bit_no];
  if (bit_no + bit_len[idx] - 1 >= len)
    return [-1, bit_no];
  var count = getNumFromBits(input, bit_no, bit_len[idx]) + adder[idx];
  bit_no += bit_len[idx];
  return [count, bit_no];
}

function readUnicode(input, bit_no, len) {
  var idx = 0;
  [idx, bit_no] = getStepCodeIdx(input, len, bit_no, 5);
  if (idx == 99)
    return [0x7FFFFF00 + 99, bit_no];
  if (idx == 5) {
    [idx, bit_no] = getStepCodeIdx(input, len, bit_no, 4);
    return [0x7FFFFF00 + idx, bit_no];
  }
  if (idx >= 0) {
    var sign = readBit(input, bit_no);
    bit_no++;
    if (bit_no + uni_bit_len[idx] - 1 >= len)
      return [0x7FFFFF00 + 99, bit_no];
    var count = 0;
    [count, bit_no] = getNumFromBits(input, bit_no, uni_bit_len[idx]);
    count += uni_adder[idx];
    bit_no += uni_bit_len[idx];
    //printf("Sign: %d, Val:%d", sign, count);
    return [sign ? -count : count, bit_no];
  }
  return [0, bit_no];
}

function writeUTF8(out, uni) {
  out += String.fromCodePoint(uni);
}

function decodeRepeat(input, len, out, bit_no, prev_lines) {
  if (prev_lines != null) {
    var dict_len = 0;
    [dict_len, bit_no] = readCount(input, bit_no, len)
    dict_len += NICE_LEN;
    if (dict_len < 0)
      return bit_no;
    var dist = 0;
    [dist, bit_no] = readCount(input, bit_no, len);
    if (dist < 0)
      return bit_no;
    var ctx = 0;
    [ctx, bit_no] = readCount(input, bit_no, len);
    if (ctx < 0)
      return bit_no;
    var cur_line = prev_lines;
    while (ctx--)
      cur_line = cur_line.previous;
    out += cur_line.data.substring(dist, dict_len);
  } else {
    var dict_len = 0;
    [dict_len, bit_no] = readCount(input, bit_no, len);
    dict_len += NICE_LEN;
    if (dict_len < 0)
      return bit_no;
    var dist = 0;
    [dist, bit_no] = readCount(input, bit_no, len);
    dist += (NICE_LEN - 1);
    if (dist < 0)
      return bit_no;
    //printf("Decode len: %d, dist: %d\n", dict_len - NICE_LEN, dist - NICE_LEN + 1);
    out += out.substr(out.length - dist, dict_len);
  }
  return [bit_no, out];
}

function unishox2_decompress_lines(input, len, usx_hcodes, usx_hcode_lens, usx_freq_seq, prev_lines) {

  var dstate;
  var bit_no;
  var h, v;
  var is_all_upper;

  init_coder();
  bit_no = 0;
  dstate = h = USX_ALPHA;
  is_all_upper = 0;

  var prev_uni = 0;

  len <<= 3;
  var out = "";
  while (bit_no < len) {
    var orig_bit_no = bit_no;
    if (dstate == USX_DELTA || h == USX_DELTA) {
      if (dstate != USX_DELTA)
        h = dstate;
      var delta;
      [delta, bit_no] = readUnicode(input, bit_no, len);
      if ((delta >> 8) == 0x7FFFFF) {
        var spl_code_idx = delta & 0x000000FF;
        if (spl_code_idx == 99)
          break;
        switch (spl_code_idx) {
          case 0:
            out += ' ';
            continue;
          case 1:
            [h, bit_no] = readHCodeIdx(input, len, bit_no, usx_hcodes, usx_hcode_lens);
            if (h == USX_DELTA || h == USX_ALPHA) {
              dstate = h;
              continue;
            }
            if (h == USX_DICT) {
              [bit_no, out] = decodeRepeat(input, len, out, bit_no, prev_lines);
              h = dstate;
              continue;
            }
            break;
          case 2:
            out += ',';
            continue;
          case 3:
            if (prev_uni > 0x3000)
              writeUTF8(out, ol, 0x3002);
            else
              out += '.';
            continue;
          case 4:
            out  += String.fromCharCode(10);
            continue;
        }
      } else {
        prev_uni += delta;
        writeUTF8(out, prev_uni);
        //printf("%ld, ", prev_uni);
      }
      if (dstate == USX_DELTA && h == USX_DELTA)
        continue;
    } else
      h = dstate;
    var c = "";
    var is_upper = is_all_upper;
    [v, bit_no] = readVCodeIdx(input, len, bit_no);
    if (v == 99 || h == 99) {
      bit_no = orig_bit_no;
      break;
    }
    if (v == 0) {
      if (bit_no >= len)
        break;
      [h, bit_no] = readHCodeIdx(input, len, bit_no, usx_hcodes, usx_hcode_lens);
      if (h == 99 || bit_no >= len) {
        bit_no = orig_bit_no;
        break;
      }
      if (h == USX_ALPHA) {
         if (dstate == USX_ALPHA) {
           if (is_all_upper) {
             is_upper = is_all_upper = 0;
             continue;
           }
           [v, bit_no] = readVCodeIdx(input, len, bit_no);
           if (v == 99) {
             bit_no = orig_bit_no;
             break;
           }
           if (v == 0) {
              [h, bit_no] = readHCodeIdx(input, len, bit_no, usx_hcodes, usx_hcode_lens);
              if (h == 99) {
                bit_no = orig_bit_no;
                break;
              }
              if (h == USX_ALPHA) {
                 is_all_upper = 1;
                 continue;
              }
           }
           is_upper = 1;
         } else {
            dstate = USX_ALPHA;
            continue;
         }
      } else
      if (h == USX_DICT) {
        [bit_no, out] = decodeRepeat(input, len, out, bit_no, prev_lines);
        continue;
      } else
      if (h == USX_DELTA) {
        //printf("Sign: %d, bitno: %d\n", sign, bit_no);
        //printf("Code: %d\n", prev_uni);
        //printf("BitNo: %d\n", bit_no);
        continue;
      } else {
        [v, bit_no] = readVCodeIdx(input, len, bit_no);
        if (v == 99) {
          bit_no = orig_bit_no;
          break;
        }
      }
    }
    if (is_upper && v == 1) {
      h = dstate = USX_DELTA; // continuous delta coding
      continue;
    }
    // TODO: Binary    out[ol++] = readCount(in, &bit_no, len);
    if (h < 3 && v < 28)
      c = usx_sets[h][v];
    if (c >= 'a' && c <= 'z') {
      dstate = USX_ALPHA;
      if (is_upper)
        c = String.fromCharCode(c.charCodeAt(0)-32);
    } else {
      if (c !== 0 && c.charCodeAt(0) >= 48 && c.charCodeAt(0) <= 57)
        dstate = USX_NUM;
      else if (c === 0 && c !== '0') {
        if (v == 8) {
          out += "\r\n";
        } else if (h == USX_NUM && v == 26) {
          var count;
          [count, bit_no] = readCount(input, bit_no, len);
          if (count < 0)
            break;
          count += 4;
          var rpt_c = out.charAt(out.length - 1);
          while (count--)
            out += rpt_c;
        } else if (h == USX_SYM && v > 24) {
          v -= 25;
          out += usx_freq_seq[v];
        } else if (h == USX_NUM && v > 22 && v < 26) {
          v -= (23 - 3);
          out += usx_freq_seq[v];
        } else
          break; // Terminator
        continue;
      }
    }
    if (dstate == USX_DELTA)
      h = USX_DELTA;
    out += c;
  }

  return out;

}

function unishox2_decompress(input, len, usx_hcodes, usx_hcode_lens, usx_freq_seq) {
  return unishox2_decompress_lines(input, len, usx_hcodes, usx_hcode_lens, usx_freq_seq, null);
}

function unishox2_decompress_simple(input, len) {
  return unishox2_decompress(input, len, USX_HCODES_DFLT, USX_HCODE_LENS_DFLT, USX_FREQ_SEQ_DFLT);
}

module.exports = {unishox2_compress, unishox2_compress_lines, unishox2_compress_simple,
                  unishox2_decompress, unishox2_decompress_lines, unishox2_decompress_simple};
