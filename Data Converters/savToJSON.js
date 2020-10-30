"use strict";
const { debug } = require('console');
const fs = require('fs');

function seekNull(buffer, startIndex = 0) {
    var index = buffer.slice(startIndex).indexOf(0);
    return (index > -1 ? startIndex + index : -1);
}

function seekNonNull(buffer, startIndex = 0) {
    var index = buffer.slice(startIndex).findIndex(el => el != 0);
    return (index > -1 ? startIndex + index : -1);
}


/**
 * 
 * @param {Buffer} source 
 * @param {string} id 
 */
function readSavVariable(source, id) {
    if (!(source instanceof Buffer)) throw {error: "Source is not a buffer"};

    var srch;
    if (id instanceof Buffer) srch = id;
    else var srch = Buffer.from(id);

    var index = source.findIndex((el, index, array) => (array.slice(index, index+id.length).equals(srch)));
    if (index >= 0) index += id.length;
    else throw {error: "Variable not found"};

    index += 10;
    var length = source.slice(index).readUInt32LE();

    index += 4;
    return source.slice(index, index+length-1);
}

var srch = Buffer.concat([Buffer.from("String"), Uint8Array.from([0x00, 0x0c, 0x00, 0x00, 0x00]), Buffer.from("StrProperty")]);

fs.readFile(`${process.env.LOCALAPPDATA}/Mordhau/Saved/SaveGames/mordstats_sav.sav`, (err, data) => {
    var res = readSavVariable(data, srch);
    console.log(res.toString('utf8'));

    try {
        var equipment = JSON.parse(res);
        console.log(equipment);

        var kickT3 = JSON.parse(JSON.stringify(equipment["Kick"]));
        var damages = kickT3.attacks[0].damage;
        for (var p in damages) {
            var part = damages[p];
            for (var t=0; t<part.length; t++) {
                part[t] *= 2;
            }
        }

        equipment["Kick (T3 Legs)"] = kickT3;
    } catch (err) {
        console.error(err);
    }

    fs.writeFile("./res/mordstats.json", JSON.stringify(equipment), () => {
        console.log("Written");
    });
});

process.stdin.resume();