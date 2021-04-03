const { run } = require('jest');
const usx2 = require('./unishox2');
var util = require('util');

var USX_HCODES_DFLT = new Uint8Array([0x00, 0x40, 0xE0, 0x80, 0xC0]);
var USX_HCODE_LENS_DFLT = new Uint8Array([2, 2, 3, 2, 3]);
var USX_FREQ_SEQ_DFLT = ["\": \"", "\": ", "</", "=\"", "\":\"", "://"];
var USX_TEMPLATES = ["tfff-of-tfTtf:rf:rf.fffZ", "tfff-of-tf", "(fff) fff-ffff", "tf:rf:rf", 0];

var buf = new Uint8Array(512);
var buf1 = new Uint8Array(512);

var input_arr = [];
var compressed_arr = [];
var tot_input_len = 0;
var tot_comp_len = 0;

function run_test(str) {

  var utf8arr = new util.TextEncoder("utf-8").encode(str);
  var buf_len = usx2.unishox2_compress(str, str.length, buf, USX_HCODES_DFLT, USX_HCODE_LENS_DFLT, USX_FREQ_SEQ_DFLT, USX_TEMPLATES);
  var out_str = usx2.unishox2_decompress(buf, buf_len, null, USX_HCODES_DFLT, USX_HCODE_LENS_DFLT, USX_FREQ_SEQ_DFLT, USX_TEMPLATES);
  var buf_len = usx2.unishox2_compress(utf8arr, utf8arr.length, buf, USX_HCODES_DFLT, USX_HCODE_LENS_DFLT, USX_FREQ_SEQ_DFLT, USX_TEMPLATES);
  var out_len = usx2.unishox2_decompress(buf, buf_len, buf1, USX_HCODES_DFLT, USX_HCODE_LENS_DFLT, USX_FREQ_SEQ_DFLT, USX_TEMPLATES);
  var out_str1 = new util.TextDecoder("utf-8").decode(buf1.slice(0, out_len));
  var input_len = encodeURI(str).split(/%..|./).length - 1;
  test(str + " (" + buf_len + "/" + input_len + " = " + (Math.round((input_len-buf_len)*1000/input_len) / 10) + "%)", () => {
    expect(out_str).toBe(str);
    expect(out_str1).toBe(str);
  });
  input_arr[input_arr.length] = str;
  out_len = usx2.unishox2_compress(input_arr, input_arr.length - 1, buf1, USX_HCODES_DFLT, USX_HCODE_LENS_DFLT, USX_FREQ_SEQ_DFLT, USX_TEMPLATES);
  compressed_arr[compressed_arr.length] = buf1.slice(0, out_len);
  tot_input_len += utf8arr.length;
  tot_comp_len += out_len;
  
}

run_test("Hello");
run_test("Hello World");
run_test("The quick brown fox jumped over the lazy dog");
run_test("HELLO WORLD");
run_test("HELLO WORLD HELLO WORLD");

// Numbers
run_test("Hello1");
run_test("Hello1 World2");
run_test("Hello123");
run_test("12345678");
run_test("12345678 12345678");
run_test("HELLO WORLD 1234 hello world12");
run_test("HELLO 234 WORLD");
run_test("9 HELLO, WORLD");
run_test("H1e2l3l4o5 w6O7R8L9D");
run_test("8+80=88");

// Symbols
run_test("~!@#$%^&*()_+=-`;'\\|\":,./?><");
run_test("\"H1e2l3l4o5 w6O7R8L9D\"");
run_test("Hello\tWorld\tHow\tare\tyou?");
run_test("Hello~World~How~are~you?");
run_test("Hello\rWorld\rHow\rare\ryou?");

// Repeat
run_test("-----------------///////////////");
run_test("-----------------Hello World1111111111112222222abcdef12345abcde1234_////////Hello World///////");

// Nibbles
run_test("fa01b51e-7ecc-4e3e-be7b-918a4c2c891c");
run_test("Fa01b51e-7ecc-4e3e-be7b-918a4c2c891c");
run_test("fa01b51e-7ecc-4e3e-be7b-9182c891c");
run_test("760FBCA3-272E-4F1A-BF88-8472DF6BD994");
run_test("760FBCA3-272E-4F1A-BF88-8472DF6Bd994");
run_test("760FBCA3-272E-4F1A-BF88-8472DF6Bg994");
run_test("FBCA3-272E-4F1A-BF88-8472DF6BD994");
run_test("Hello 1 5347a688-d8bf-445d-86d1-b470f95b007fHello World");
run_test("01234567890123");

// Templates
run_test("2020-12-31");
run_test("1934-02");
run_test("2020-12-31T12:23:59.234Z");
run_test("1899-05-12T23:59:59.23434");
run_test("1899-05-12T23:59:59");
run_test("2020-12-31T12:23:59.234Zfa01b51e-7ecc-4e3e-be7b-918a4c2c891c");
run_test("顔に(993) 345-3495あり");
run_test("HELLO(993) 345-3495WORLD");
run_test("顔に1899-05-12T23:59:59あり");
run_test("HELLO1899-05-12T23:59:59WORLD");

run_test("Cada buhonero alaba sus agujas. - A peddler praises his needles (wares).");
run_test("Cada gallo canta en su muladar. - Each rooster sings on its dung-heap.");
run_test("Cada martes tiene su domingo. - Each Tuesday has its Sunday.");
run_test("Cada uno habla de la feria como le va en ella. - Our way of talking about things reflects our relevant experience, good or bad.");
run_test("Dime con quien andas y te diré quién eres.. - Tell me who you walk with, and I will tell you who you are.");
run_test("Donde comen dos, comen tres. - You can add one person more in any situation you are managing.");
run_test("El amor es ciego. - Love is blind");
run_test("El amor todo lo iguala. - Love smoothes life out.");
run_test("El tiempo todo lo cura. - Time cures all.");
run_test("La avaricia rompe el saco. - Greed bursts the sack.");
run_test("La cara es el espejo del alma. - The face is the mirror of the soul.");
run_test("La diligencia es la madre de la buena ventura. - Diligence is the mother of good fortune.");
run_test("La fe mueve montañas. - Faith moves mountains.");
run_test("La mejor palabra siempre es la que queda por decir. - The best word is the one left unsaid.");
run_test("La peor gallina es la que más cacarea. - The worst hen is the one that clucks the most.");
run_test("La sangre sin fuego hierve. - Blood boils without fire.");
run_test("La vida no es un camino de rosas. - Life is not a path of roses.");
run_test("Las burlas se vuelven veras. - Bad jokes become reality.");
run_test("Las desgracias nunca vienen solas. - Misfortunes never come one at a time.");
run_test("Lo comido es lo seguro. - You can only be really certain of what is already in your belly.");
run_test("Los años no pasan en balde. - Years don't pass in vain.");
run_test("Los celos son malos consejeros. - Jealousy is a bad counsellor.");
run_test("Los tiempos cambian. - Times change.");
run_test("Mañana será otro día. - Tomorrow will be another day.");
run_test("Ningún jorobado ve su joroba. - No hunchback sees his own hump.");
run_test("No cantan dos gallos en un gallinero. - Two roosters do not crow in a henhouse.");
run_test("No hay harina sin salvado. - No flour without bran.");
run_test("No por mucho madrugar, amanece más temprano.. - No matter if you rise early because it does not sunrise earlier.");
run_test("No se puede hacer tortilla sin romper los huevos. - One can't make an omelette without breaking eggs.");
run_test("No todas las verdades son para dichas. - Not every truth should be said.");
run_test("No todo el monte es orégano. - The whole hillside is not covered in spice.");
run_test("Nunca llueve a gusto de todos. - It never rains to everyone's taste.");
run_test("Perro ladrador, poco mordedor.. - A dog that barks often seldom bites.");
run_test("Todos los caminos llevan a Roma. - All roads lead to Rome.");

// Unicode
run_test("案ずるより産むが易し。 - Giving birth to a baby is easier than worrying about it.");
run_test("出る杭は打たれる。 - The stake that sticks up gets hammered down.");
run_test("知らぬが仏。 - Not knowing is Buddha. - Ignorance is bliss.");
run_test("見ぬが花。 - Not seeing is a flower. - Reality can't compete with imagination.");
run_test("花は桜木人は武士 - Of flowers, the cherry blossom; of men, the warrior.");

run_test("小洞不补，大洞吃苦 - A small hole not mended in time will become a big hole much more difficult to mend.");
run_test("读万卷书不如行万里路 - Reading thousands of books is not as good as traveling thousands of miles");
run_test("福无重至,祸不单行 - Fortune does not come twice. Misfortune does not come alone.");
run_test("风向转变时,有人筑墙,有人造风车 - When the wind changes, some people build walls and have artificial windmills.");
run_test("父债子还 - Father's debt, son to give back.");
run_test("害人之心不可有 - Do not harbour intentions to hurt others.");
run_test("今日事，今日毕 - Things of today, accomplished today.");
run_test("空穴来风,未必无因 - Where there's smoke, there's fire.");
run_test("良药苦口 - Good medicine tastes bitter.");
run_test("人算不如天算 - Man proposes and God disposes");
run_test("师傅领进门，修行在个人 - Teachers open the door. You enter by yourself.");
run_test("授人以鱼不如授之以渔 - Teach a man to take a fish is not equal to teach a man how to fish.");
run_test("树倒猢狲散 - When the tree falls, the monkeys scatter.");
run_test("水能载舟，亦能覆舟 - Not only can water float a boat, it can sink it also.");
run_test("朝被蛇咬，十年怕井绳 - Once bitten by a snake for a snap dreads a rope for a decade.");
run_test("一分耕耘，一分收获 - If one does not plow, there will be no harvest.");
run_test("有钱能使鬼推磨 - If you have money you can make the devil push your grind stone.");
run_test("一失足成千古恨，再回头\n已百年身 - A single slip may cause lasting sorrow.");
run_test("自助者天助 - Those who help themselves, God will help.");
run_test("早起的鸟儿有虫吃 - Early bird gets the worm.");
run_test("This is first line,\r\nThis is second line");
run_test("{\"menu\": {\n  \"id\": \"file\",\n  \"value\": \"File\",\n  \"popup\": {\n    \"menuitem\": [\n      {\"value\": \"New\", \"onclick\": \"CreateNewDoc()\"},\n      {\"value\": \"Open\", \"onclick\": \"OpenDoc()\"},\n      {\"value\": \"Close\", \"onclick\": \"CloseDoc()\"}\n    ]\n  }\n}}");
run_test("{\"menu\": {\r\n  \"id\": \"file\",\r\n  \"value\": \"File\",\r\n  \"popup\": {\r\n    \"menuitem\": [\r\n      {\"value\": \"New\", \"onclick\": \"CreateNewDoc()\"},\r\n      {\"value\": \"Open\", \"onclick\": \"OpenDoc()\"},\r\n      {\"value\":\"Close\", \"onclick\": \"CloseDoc()\"}\r\n    ]\r\n  }\r\n}}");
run_test("https://siara.cc");

run_test("符号\"δ\"表");
run_test("学者地”[3]。学者");
run_test("한데......아무");

// English
run_test("Beauty is not in the face. Beauty is a light in the heart.");
// Spanish
run_test("La belleza no está en la cara. La belleza es una luz en el corazón.");
// French
run_test("La beauté est pas dans le visage. La beauté est la lumière dans le coeur.");
// Portugese
run_test("A beleza não está na cara. A beleza é a luz no coração.");
// Dutch
run_test("Schoonheid is niet in het gezicht. Schoonheid is een licht in het hart.");

// German
run_test("Schönheit ist nicht im Gesicht. Schönheit ist ein Licht im Herzen.");
// Spanish
run_test("La belleza no está en la cara. La belleza es una luz en el corazón.");
// French
run_test("La beauté est pas dans le visage. La beauté est la lumière dans le coeur.");
// Italian
run_test("La bellezza non è in faccia. La bellezza è la luce nel cuore.");
// Swedish
run_test("Skönhet är inte i ansiktet. Skönhet är ett ljus i hjärtat.");
// Romanian
run_test("Frumusețea nu este în față. Frumusețea este o lumină în inimă.");
// Ukranian
run_test("Краса не в особі. Краса - це світло в серці.");
// Greek
run_test("Η ομορφιά δεν είναι στο πρόσωπο. Η ομορφιά είναι ένα φως στην καρδιά.");
// Turkish
run_test("Güzellik yüzünde değil. Güzellik, kalbin içindeki bir ışıktır.");
// Polish
run_test("Piękno nie jest na twarzy. Piękno jest światłem w sercu.");

// Africans
run_test("Skoonheid is nie in die gesig nie. Skoonheid is 'n lig in die hart.");
// Swahili
run_test("Beauty si katika uso. Uzuri ni nuru moyoni.");
// Zulu
run_test("Ubuhle abukho ebusweni. Ubuhle bungukukhanya enhliziyweni.");
// Somali
run_test("Beauty ma aha in wajiga. Beauty waa iftiin ah ee wadnaha.");

// Russian
run_test("Красота не в лицо. Красота - это свет в сердце.");
// Arabic
run_test("الجمال ليس في الوجه. الجمال هو النور الذي في القلب.");
// Persian
run_test("زیبایی در چهره نیست. زیبایی نور در قلب است.");
// Pashto
run_test("ښکلا په مخ کې نه ده. ښکلا په زړه کی یوه رڼا ده.");
// Azerbaijani
run_test("Gözəllik üzdə deyil. Gözəllik qəlbdə bir işıqdır.");
// Uzbek
run_test("Go'zallik yuzida emas. Go'zallik - qalbdagi nur.");
// Kurdish
run_test("Bedewî ne di rû de ye. Bedewî di dil de ronahiyek e.");
// Urdu
run_test("خوبصورتی چہرے میں نہیں ہے۔ خوبصورتی دل میں روشنی ہے۔");

// Hindi
run_test("सुंदरता चेहरे में नहीं है। सौंदर्य हृदय में प्रकाश है।");
// Bangla
run_test("সৌন্দর্য মুখে নেই। সৌন্দর্য হৃদয় একটি আলো।");
// Punjabi
run_test("ਸੁੰਦਰਤਾ ਚਿਹਰੇ ਵਿੱਚ ਨਹੀਂ ਹੈ. ਸੁੰਦਰਤਾ ਦੇ ਦਿਲ ਵਿਚ ਚਾਨਣ ਹੈ.");
// Telugu
run_test("అందం ముఖంలో లేదు. అందం హృదయంలో ఒక కాంతి.");
// Tamil
run_test("அழகு முகத்தில் இல்லை. அழகு என்பது இதயத்தின் ஒளி.");
// Marathi
run_test("सौंदर्य चेहरा नाही. सौंदर्य हे हृदयातील एक प्रकाश आहे.");
// Kannada
run_test("ಸೌಂದರ್ಯವು ಮುಖದ ಮೇಲೆ ಇಲ್ಲ. ಸೌಂದರ್ಯವು ಹೃದಯದಲ್ಲಿ ಒಂದು ಬೆಳಕು.");
// Gujarati
run_test("સુંદરતા ચહેરા પર નથી. સુંદરતા હૃદયમાં પ્રકાશ છે.");
// Malayalam
run_test("സൗന്ദര്യം മുഖത്ത് ഇല്ല. സൗന്ദര്യം ഹൃദയത്തിലെ ഒരു പ്രകാശമാണ്.");
// Nepali
run_test("सौन्दर्य अनुहारमा छैन। सौन्दर्य मुटुको उज्यालो हो।");
// Sinhala
run_test("රූපලාවන්ය මුහුණේ නොවේ. රූපලාවන්ය හදවත තුළ ඇති ආලෝකය වේ.");

// Chinese
run_test("美是不是在脸上。 美是心中的亮光。");
// Javanese
run_test("Beauty ora ing pasuryan. Kaendahan iku cahya ing sajroning ati.");
// Japanese
run_test("美は顔にありません。美は心の中の光です。");
// Filipino
run_test("Ang kagandahan ay wala sa mukha. Ang kagandahan ay ang ilaw sa puso.");
// Korean
run_test("아름다움은 얼굴에 없습니다。아름다움은 마음의 빛입니다。");
// Vietnam
run_test("Vẻ đẹp không nằm trong khuôn mặt. Vẻ đẹp là ánh sáng trong tim.");
// Thai
run_test("ความงามไม่ได้อยู่ที่ใบหน้า ความงามเป็นแสงสว่างในใจ");
// Burmese
run_test("အလှအပမျက်နှာပေါ်မှာမဟုတ်ပါဘူး။ အလှအပစိတ်နှလုံးထဲမှာအလင်းကိုဖြစ်ပါတယ်။");
// Malay
run_test("Kecantikan bukan di muka. Kecantikan adalah cahaya di dalam hati.");

// Emoji
run_test("🤣🤣🤣🤣🤣🤣🤣🤣🤣🤣🤣");
run_test("😀😃😄😁😆😅🤣😂🙂🙃😉😊😇🥰😍🤩😘😗😚😙😋😛😜🤪😝🤑🤗🤭🤫🤔🤐🤨😐😑😶😏😒🙄😬🤥😌😔😪🤤😴😷🤒🤕🤢");

test("Testing binary compression", () => {
  var input_bin_arr = new Uint8Array([245, 124, 235, 190, 42, 12, 3, 0, 5, 23]);
  var clen = usx2.unishox2_compress_simple(input_bin_arr, input_bin_arr.length, buf1);
  var dlen = usx2.unishox2_decompress(buf1, clen, buf, USX_HCODES_DFLT, USX_HCODE_LENS_DFLT, USX_FREQ_SEQ_DFLT, USX_TEMPLATES);
  expect(input_bin_arr).toStrictEqual(buf.slice(0, dlen));
});

test("Testing array compression (String array) (" + tot_comp_len + "/" + tot_input_len + " = " + (Math.round((tot_input_len-tot_comp_len)*1000/tot_input_len) / 10) + "%)", () => {
  for (var i = 0; i < compressed_arr.length; i++) {
    str = usx2.unishox2_decompress(compressed_arr, i, null, USX_HCODES_DFLT, USX_HCODE_LENS_DFLT, USX_FREQ_SEQ_DFLT, USX_TEMPLATES);
    input_len = input_arr[i].length;
    buf_len = compressed_arr[i].length;
    expect(str).toBe(input_arr[i]);
  }
});

test("Testing array compression (utf-8 uint8 array) (" + tot_comp_len + "/" + tot_input_len + " = " + (Math.round((tot_input_len-tot_comp_len)*1000/tot_input_len) / 10) + "%)", () => {
  for (var i = 0; i < compressed_arr.length; i++) {
    var utf8arr = new util.TextEncoder("utf-8").encode(input_arr[i]);
    input_arr[i] = utf8arr;
    out_len = usx2.unishox2_compress(input_arr, i, buf1, USX_HCODES_DFLT, USX_HCODE_LENS_DFLT, USX_FREQ_SEQ_DFLT, USX_TEMPLATES);
    compressed_arr[i] = buf1.slice(0, out_len);
    dlen = usx2.unishox2_decompress(compressed_arr, i, buf, USX_HCODES_DFLT, USX_HCODE_LENS_DFLT, USX_FREQ_SEQ_DFLT, USX_TEMPLATES);
    var decoder = new util.TextDecoder("utf-8");
    expect(decoder.decode(buf.slice(0, dlen))).toStrictEqual(decoder.decode(input_arr[i]));
  }
});
