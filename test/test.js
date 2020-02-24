const Packets = require("../shared/Packets");
class Tester {
    constructor(ID, name) {
        this.ID = ID;
        this.name = name;
    }
}
let encoded = Packets.encodePacket(Packets.server_player_list.ID, Packets.server_player_list.encode([new Tester(1, "rude"), new Tester(2, "nick"), new Tester(3, "dan")]));
console.log(encoded.length);
console.log(encoded);
let decoded = Packets.server_player_list.decode(Packets.decodePacket(encoded).payload);
console.log(decoded);
console.log(decoded[0]);
console.log("REEEE");


