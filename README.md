# Unishox Javascript Library - Guaranteed Compression for Short Strings

This is a C library for compressing short strings.  It was developed to individually compress and decompress small strings. In general compression utilities such as `zip`, `gzip` do not compress short strings well and often expand them. They also use lots of memory which makes them unusable in constrained environments like Arduino.

Note: The present byte-code version is 2 and it replaces Unishox 1.  Unishox 1 is still available [here](https://github.com/siara-cc/Unishox) only as a C Library.

# Applications

- Compression for low memory devices such as Arduino, ESP8266 and ESP32
- Sending messages over Websockets
- Compression of Chat application text exchange including Emojis
- Storing compressed text in database
- Bandwidth and storage cost reduction for Cloud technologies

![Promo Picture](Banner1.png?raw=true)

# How it works

Unishox is an hybrid encoder which uses entropy, dictionary and delta coding techniques.  It works by assigning fixed prefix-free codes for each letter in the printable ANSI character set.  It also encodes repeating letter sets separately (dictionary coding).  For Unicode characters, delta coding is used.  Please read [this article](https://github.com/siara-cc/Unishox/blob/master/Unishox_Article_2.pdf?raw=true) to find out more.

# Getting started

This is a Node.js library, but is made to work even with older Javascript versions to make it compatible with low memory IoT devices.
There are no dependencies.  `Unishox2.js` is all you will need to integrate with your application.

This library is available at `npm` at `https://www.npmjs.com/package/unishox2.siara.cc` and can be included in your Javascript projects with `npm i unishox2.siara.cc`. See below on how to include it in your code.

## Running Unit tests (using Jest)

To run unit tests, clone this repo and issue following commands, assuming `npm` is installed:

```sh
npm update
npm run test
```

## Trying it out with your own strings

You can check out what kind of compression you get with what strings using demo_unishox2.js:

```sh
node demo_unishox2.js "The quick brown fox jumped over the lazy dog"
```

and the output would be:
![Output 1](Output1.png?raw=true)

## Using it in your application

To compress and decompress strings in your application, import `unishox2.js`:

```Javascript
var usx = require("./unishox2.js");
```

The function expects a Javascript `string` or `Uint8Array` as Input and Output an `Uint8Array`.

### Simple API

In its simplest form, just pass the string you want to compress, its length and a UintArray to receive the compressed contents.  While the library can make the output array, it is faster to supply it.  Since this technology guarantees compression, the output buffer needs be only as lengthy as the input string 99.99% of times:

```Javascript
var usx = require("./unishox2.js")
var my_str = "The quick brown fox jumped over the lazy dog";
var out_buf = new Uint8Array(100); // A buffer with arbitrary length
var out_len = usx.unishox2_compress_simple(my_str, my_str.length, out_buf);
var out_str = usx.unishox2_decompress_simple(out_buf, out_len);
console.log(out_str);
```

As shown above, the original string can be obtained by passing the UintArray and length to `unishox2_decompress_simple`.

### More advanced API for customizing according to your context

Depending on the input string, you can press more juice out of the compressor by hinting the type of text being compressed.  Following are the parameters that can be tuned:

- Composition of text, numbers, symbols, repetitions, unicode characters
- Frequently occurring sequences
- Templates such as for Date/Time, GUID and Phone numbers

16 presets are provided with the demo program based on the type of text you may intend to compress:

0. Default, that is optimized for all types of texts
1. Alphabets and space only
2. Alphanumeric and space only
3. Alphanumeric, symbols and space only
4. Alphanumeric, symbols and space only, favouring English sentences
5. Support all types, but favour Alphanumeric
6. Support all types, but favour repeating sequences
7. Support all types, but favour symbols
8. Support all types, but favour Umlaut characters
9. Favor all types except repeating sequences
10. Favor all types except Unicode characters
11. Favor all types, especially English text, except Unicode characters
12. Favor URLs
13. Favor JSON
14. Favor JSON, but no Unicode Characters
15. Favor XML
16. Favor HTML

Please refer to `unishox_compress_lines` and `unishox_decompress_lines` functions in the library to make use of these. However in most cases, the default Simple API provides optimimum compression.

# Character Set

Unishox supports the entire Unicode character set.  As of now it supports UTF-8 as input and output encoding.

# Projects that use Unishox

- [Unishox Compression Library for Arduino Progmem](https://github.com/siara-cc/Unishox_Arduino_Progmem_lib)
- [Sqlite3 User Defined Function as loadable extension](https://github.com/siara-cc/Unishox_Sqlite_UDF)
- [Sqlite3 Library for ESP32](https://github.com/siara-cc/esp32_arduino_sqlite3_lib)
- [Sqlite3 Library for ESP8266](https://github.com/siara-cc/esp_arduino_sqlite3_lib)
- [Port of this library to Python and C++ by Stephan Hadinger for Tasmota](https://github.com/arendst/Tasmota/tree/development/lib/Unishox-1.0-shadinger)

# Issues

In case of any issues, please email the Author (Arundale Ramanathan) at arun@siara.cc or create GitHub issue.
