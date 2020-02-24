const td = new TextDecoder();
const te = new TextEncoder();
const basicEncode = (int) => new Uint8Array([int]);
const basicDecode = (payload) => payload[0];
module.exports = {
    client_hello: {
        ID: 0x01,
        name: "CLIENT HELLO",
        encode: (name) => {
            return te.encode(name);
        },
        decode: (payload) => {
            return td.decode(payload);
        }
    },

    server_hello: {
        ID: 0x02,
        name: "SERVER HELLO",
        encode: basicEncode,
        decode: basicDecode
    },

    client_start_matchmaking: {
        ID: 0x03,
        name: "CLIENT PLAYER LIST REQUEST",
        encode: () => {
            return new Uint8Array(0);
        },
        decode: (payload) => {
            return 0;
        }
    },

    server_player_list: {
        ID: 0x04,
        name: "SERVER PLAYER LIST UPDATE",
        encode: (connectionList) => {
            let totalLength = 0;
            let intermediary = connectionList.map((x) => {
                let numeric = new Uint8Array([x.ID, x.name.length]);
                let text = te.encode(x.name);
                let result = new Uint8Array(numeric.length + text.length);
                result.set(numeric);
                result.set(text, numeric.length);
                totalLength += result.length;
                return result;
            });

            let payload = new Uint8Array(totalLength);
            let length = 0;
            for(let array of intermediary) {
                payload.set(array, length);
                length += array.length;
            }
            return payload;
        },

        decode: (payload) => {
            let players = [];
            let n = 0;
            while (n < payload.length) {
                let player = {};
                player.ID = payload.slice(n, n + 1)[0];
                let nameLength = payload.slice(n + 1, n + 2)[0];
                player.name = td.decode(payload.slice(n + 2, n + 2 + nameLength));
                n += nameLength + 2;
                players.push(player);
            }
            return players;
        }
    },

    client_player_select: {
        ID: 0x05,
        name: "CLIENT PLAYER SELECTION",
        encode: basicEncode,
        decode: basicDecode
    },

    server_match_request: {
        ID: 0x06,
        name: "SERVER CONFIRM PLAYER SELECTION",
        encode: basicEncode,
        decode: basicDecode
    },

    client_match_response: {
        ID: 0x07,
        name: "CLIENT MATCH RESPONSE",
        encode: basicEncode,
        decode: basicDecode
    },

    encodePacket: (header, payload) => {
        let packetHeader = new Uint8Array([header]);
        let result = new Uint8Array(packetHeader.length + payload.length);
        result.set(packetHeader);
        result.set(payload, packetHeader.length);
        return result;
    },

    decodePacket: (packet) => {
        return {
            ID: new Uint8Array(packet.slice(0, 1))[0],
            payload: new Uint8Array(packet.slice(1))
        }
    },
};

module.exports.packets = {};
for (let item in module.exports) {
    item = module.exports[item];
    if (item.ID) module.exports.packets[item.ID] = item;
}