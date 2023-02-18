import { createLibp2p } from 'libp2p'
import { webRTCDirect } from '@libp2p/webrtc-direct'
import { noise } from '@chainsafe/libp2p-noise'
import { mplex } from '@libp2p/mplex'
import { createFromJSON } from '@libp2p/peer-id-factory'
import wrtc from 'wrtc'

const hardcodedPeerId = await createFromJSON({
    "id": "12D3KooWCuo3MdXfMgaqpLC5Houi1TRoFqgK9aoxok4NK5udMu8m",
    "privKey": "CAESQAG6Ld7ev6nnD0FKPs033/j0eQpjWilhxnzJ2CCTqT0+LfcWoI2Vr+zdc1vwk7XAVdyoCa2nwUR3RJebPWsF1/I=",
    "pubKey": "CAESIC33FqCNla/s3XNb8JO1wFXcqAmtp8FEd0SXmz1rBdfy"
})

const node = await createLibp2p({
    // libp2p nodes are started by default, pass false to override this
    start: false, // don't immediately start
    peerId: hardcodedPeerId,
    addresses: {
        listen: ['/ip4/127.0.0.1/tcp/9090/http/p2p-webrtc-direct']
    },
    transports: [webRTCDirect({ wrtc })],
    connectionEncryption: [noise()],
    streamMuxers: [mplex()]
})

// start libp2p
await node.start()
console.log('libp2p has started')

node.connectionManager.addEventListener('peer:connect', (evt) => {
    console.info(`Connected to ${evt.detail.remotePeer.toString()}!`)
})

const listenAddrs = node.getMultiaddrs()
console.log('libp2p is listening on the following addresses: ')
node.getMultiaddrs().forEach((ma) => console.log(ma.toString()))

// stop libp2p
// await node.stop()
// console.log('libp2p has stopped')
