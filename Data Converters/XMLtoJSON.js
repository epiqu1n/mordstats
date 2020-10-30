"use strict";
const { debug } = require('console');
const fs = require('fs');
const _source = "res/data_tables/MordStats_p19.xml";
const _target = _source.replace(".xml", ".json");
const DOMParser = require('xmldom').DOMParser;

/**
 * Lowers first letter in a string
 * @param {string} str 
 */
function lowerFirst(str) {
    return str[0].toLowerCase() + str.substring(1);
}

/**
 * Converts yes/no to boolean
 * @param {string} yn 
 */
function YNtoBool(yn) {
    if (yn.toLowerCase() == "yes") return true;
    else if (yn.toLowerCase() == "no") return false;
    else return null;
}


fs.readFile(_source, (err, data) => {
    try {
        var equipment = (new DOMParser()).parseFromString(data.toString("utf8"), "text/xml");

        var name, att, dam, spd, gen, attacks, newAttacks;
        var equip, newEquipment = {};
        var weapons = equipment.getElementsByTagName("Weapon");
        
        for (var w=0; w<weapons.length; w++) {
            name = weapons[w].getElementsByTagName("Name")[0].textContent;
            attacks = weapons[w].getElementsByTagName("Attack");
            newAttacks = [];

            for (var a=0; a<attacks.length; a++) {
                dam = attacks[a].getElementsByTagName("Damage");
                spd = attacks[a].getElementsByTagName("Speed");
                gen = attacks[a].getElementsByTagName("GeneralStats");
                
                if (dam.length > 0) {
                    dam = {
                        head: Array.prototype.slice.call(dam[0].getElementsByTagName("Head")[0].childNodes).map((el) => Number.parseFloat(el.textContent.trim())).filter((el) => !isNaN(el)),
                        torso: Array.prototype.slice.call(dam[0].getElementsByTagName("Torso")[0].childNodes).map((el) => Number.parseFloat(el.textContent.trim())).filter((el) => !isNaN(el)),
                        legs: Array.prototype.slice.call(dam[0].getElementsByTagName("Legs")[0].childNodes).map((el) => Number.parseFloat(el.textContent.trim())).filter((el) => !isNaN(el))
                    }
                }
                if (spd.length > 0) {
                    spd = Object.fromEntries(
                        Array.prototype.slice.call(spd[0].childNodes).filter((el) => el.constructor.name == "Element").map((el) => [lowerFirst(el.tagName), Number.parseFloat(el.textContent)])
                    );
                }
                if (gen.length > 0) {
                    gen = Object.fromEntries(
                        Array.prototype.slice.call(gen[0].childNodes).filter((el) => el.constructor.name == "Element").map((el) => [lowerFirst(el.tagName), (!isNaN(Number.parseFloat(el.textContent)) ? Number.parseFloat(el.textContent) /* : YNtoBool(el.textContent) != null ? YNtoBool(el.textContent) */ : el.textContent)])
                    );
                }

                att = {};
                att.type = lowerFirst(attacks[a].getElementsByTagName("AttackType")[0].textContent.replace(/ /g, "")).replace("kick", "misc");
                if (dam.constructor.name == "Object") att.damage = dam;
                if (spd.constructor.name == "Object") att.speed = spd;
                if (gen.constructor.name == "Object") att.general = gen;
                newAttacks.push(att);
            }
            
            equip = {
                type: lowerFirst(weapons[w].getElementsByTagName("Type")[0].textContent),
                pointCost: Number.parseInt(weapons[w].getElementsByTagName("Points")[0].textContent),
                peasantOnly: YNtoBool(weapons[w].getElementsByTagName("PeasantOnly")[0].textContent),
                isMisc: YNtoBool(weapons[w].getElementsByTagName("Misc")[0].textContent),
                attacks: newAttacks
            }
            newEquipment[name] = equip;
        }
        
    } catch (err) {
        console.error(err);
    }

    debug(newEquipment);

     fs.writeFile(_target, JSON.stringify(newEquipment), () => {
        console.log("Written");
    });
});

// process.stdin.resume();