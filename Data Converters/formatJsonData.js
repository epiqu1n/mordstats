const fs = require('fs');

fs.readFile(`${process.env.LOCALAPPDATA}/Mordhau/Saved/PlayerFiles/mordstats_raw.json`, (err, data) => {
  try {
      var equipment = JSON.parse(data);

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
      console.log("Formatted raw json data and output to res/mordstats.json");
  });
});