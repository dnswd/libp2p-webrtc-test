import { createLibp2p } from 'libp2p'
import { webRTCDirect } from '@libp2p/webrtc-direct'
import { bootstrap } from '@libp2p/bootstrap'
import { noise } from '@chainsafe/libp2p-noise'
import { mplex } from '@libp2p/mplex'
import { createFromJSON } from '@libp2p/peer-id-factory'
import { bkeys } from "./keys.js"
import { pipe } from 'it-pipe'
import { toString as uint8ArrayToString } from 'uint8arrays/to-string'
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'
import wrtc from 'wrtc'

const bootstrapers = [
    '/ip4/104.131.131.82/tcp/4001/p2p/QmaCpDMGvV2BGHeYERUEnRQAwe3N8SzbUtfsmvsqQLuvuJ',
    '/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN',
    '/dnsaddr/bootstrap.libp2p.io/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb',
    '/dnsaddr/bootstrap.libp2p.io/p2p/QmZa1sAxajnQjVM8WjWXoMbmPd7NsWhfKsPkErzpm9wGkp',
    '/dnsaddr/bootstrap.libp2p.io/p2p/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa',
    '/dnsaddr/bootstrap.libp2p.io/p2p/QmcZf59bWwK5XFi76CZX8cbJ4BhTzzA3gU1ZjYZcYW3dwt'
]

const b_key = await createFromJSON(bkeys)
const protocol = "/echo/1.0.0"
const libp2p = await createLibp2p({
    peerId: b_key,
    transports: [webRTCDirect({ wrtc })],
    streamMuxers: [mplex()],
    connectionEncryption: [noise()],
    // define multiaddress for the transport protocol to listen
    addresses: {
        listen: [
            '/ip4/0.0.0.0/tcp/10333/http/p2p-webrtc-direct',
            '/ip4/0.0.0.0/tcp/0/http/p2p-webrtc-direct',            
        ]
    },
    peerDiscovery: [
        bootstrap({
            interval: 60e3,
            list: bootstrapers
        })
    ]
})

// Listen for new connections to peers
libp2p.connectionManager.addEventListener('peer:connect', (evt) => {
    console.log(`Connected to ${evt.detail.remotePeer.toString()}`)
})

// Listen for peers disconnecting
libp2p.connectionManager.addEventListener('peer:disconnect', (evt) => {
    console.log(`Disconnected from ${evt.detail.remotePeer.toString()}`)
})

console.log("Status: libp2p started!")
console.log(`libp2p id is ${libp2p.peerId.toString()}`)

// Listen for new peers
libp2p.addEventListener('peer:discovery', (evt) => {
    console.log(`Found peer ${evt.detail.id.toString()}`)

    // dial them when we discover them
    console.log('Dialing to peer:', evt.detail.id.toString())
    libp2p.dialProtocol(evt.detail.id, protocol).catch(err => {
        console.log(`Could not dial ${evt.detail.id}`, err)
    }).then((stream) => {
        console.log(`nodeB dialed to nodeA on protocol: ${protocol}`)
        pipe(
            // Source data
            [uint8ArrayFromString('hey')],
            // Write to the stream, and pass its output to the next function
            stream,
            // Sink function
            async function (source) {
                // For each chunk of data
                for await (const data of source) {
                    // Output the data
                    console.log('received echo:', uint8ArrayToString(data.subarray()))
                }
            }
        )
    })
})

// Handle incoming connections for the protocol by piping from the stream
// back to itself (an echo)
await libp2p.handle(protocol, ({ stream }) => pipe(stream.source, stream.sink))

console.log('libp2p is listening on the following addresses: ')
libp2p.getMultiaddrs().forEach((ma) => console.log(ma.toString()))


