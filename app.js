class Visit {

    states = {};
    cur_st = "";
  
    state(name, call){
      this.states[name] = call;
    }
  
    going(name){
      let dest = this.states[name];
      if(!dest) return console.log("no such state");
      this.cur_st = name;
      dest();
    }
  
  }
  
  const fs = require('fs');
  const { Bot, listen } = require('./lib/bot');
  const YT = require('./lib/youtube');
  var visit = new Visit();
  // sp
  let finder = new Bot("finder", "gg");
  let drrr = {};
  let rooms = [];
  let blacklist = [];
  let times = {};
  let leaveCheck = {};
  let botCount = JSON.parse(fs.readFileSync("./conf/botCount.json", "utf8"));
  
  const ytReg = new RegExp("^/m\\s|\\s/m$", "gi");
  
  // transfer host to random user
  randHost = (num, min, max) => {
    drrr[num].getLoc(() => {
      let uL = drrr[num].users.length;
      let arg = Math.floor(Math.random() * (max - min + 1)) + min;
      let uN = drrr[num].users[arg].name;
  
      if (uN !== "MusicBot") {
        drrr[num].handOver(uN);
        console.log("Transfer host to - ", uN);
      } else randHost(num, min, uL - 1);
    })
  
  }
  // deleting events and profile after exiting
  delEv = (num, id) => {

    if (leaveCheck[id] === true) {
      drrr[num].leave(() => {
        rooms.find((item, ind) => {
          if (item === id) {
            rooms.splice(ind, 1);
          }
        });
        delete botCount[num];
        fs.writeFileSync("./conf/botCount.json", JSON.stringify(botCount));
        clearInterval(times[id]);
        delete times[id];
        delete drrr[num];
        console.log("MusicBot " + num + " exit ok.");
      })
    }
    else setTimeout(() => delEv(num, id), 1000);
  }
  // launches separate events for the room
  sss = (num, id) => {
    leaveCheck[id] = false;
    rooms.push(id);

        drrr[num] = new Bot("MusicBot", "setton");
        drrr[num].uss = [];
        if (drrr[num].load(num)) {
          drrr[num].save(num);
          console.log("MusicBot " + num + " reloaded ok.");
    
          drrr[num].join(id, () => {
            drrr[num].specId = id;
            setTimeout(() => { leaveCheck[id] = true }, 10000);
            drrr[num].users.forEach((x) => drrr[num].uss.push(x.name));
            console.log("MusicBot " + num + " join room - " + drrr[num].room.name);
            console.log("Users: " + drrr[num].uss.join(", "));
    
            times[id] = setInterval(() => drrr[num].dm("MusicBot", "keep"), 60000*10);
    
            drrr[num].event(["msg", "dm"], (u, m) => {
                if (m.match("/m")) {
                    if (m.match(ytReg)) {
                        YT(m.replace(ytReg, ""), num, (y) => {
                            drrr[num].music(y.title, y.link);
                        });
                    }
                }
            });
    
            drrr[num].event(["new-description"], (u) => {
              drrr[num].getLoc(() => {
                if (!drrr[num].room.description.match("/getmusic")) {
                  delEv(num, id);
                }
              })
            });
    
            drrr[num].event(["new-host"], (u, m, url, trip, e) => {
              drrr[num].getLoc(() => {
                if (e.user === drrr[num].profile.name) {
                  if (drrr[num].users.length > 1) {
                    randHost(num, 0, drrr[num].users.length - 1);
                  }
                  else {
                    delEv(num, id);
                  }
                }
              })
            });
    
            drrr[num].event(["kick", "ban"], (u, m, url, trip, e) => {
              drrr[num].getLoc(() => {
                if (drrr[num].lastTalk.message.match("kicked|banned")) {
                  console.log(num + " you get a " + e.type)
                  blacklist.push(drrr[num].specId);
                  delEv(num, id);
                }
              })
            });

            drrr[num].event(["dm"], (u, m) => {
              if (m.match("/off")) {
                  drrr[num].kick(u, () => delEv(num, id));
              }
            });
  
          })
        }

  }

  getStart = (num, id) => {
    leaveCheck[id] = false;

    if (!drrr[num]) {
      botCount[num] = id;
      fs.writeFileSync("./conf/botCount.json", JSON.stringify(botCount));

        drrr[num] = new Bot("MusicBot", "setton");
        drrr[num].uss = [];
        drrr[num].login(() => {
          drrr[num].save(num);
          console.log("MusicBot " + num + " login ok.");
    
          drrr[num].join(id, () => {
            drrr[num].specId = id;
            setTimeout(() => leaveCheck[id] = true, 8000);
            drrr[num].users.forEach((x) => drrr[num].uss.push(x.name));
            console.log("MusicBot " + num + " join room - " + drrr[num].room.name);
            console.log("Users: " + drrr[num].uss.join(", "));
    
            times[id] = setInterval(() => drrr[num].dm("MusicBot", "keep"), 60000*10);
    
            drrr[num].event(["msg", "dm"], (u, m) => {
                if (m.match("/m")) {
                    if (m.match(ytReg)) {
                        YT(m.replace(ytReg, ""), num, (y) => {
                            drrr[num].music(y.title, y.link);
                        });
                    }
                }
            });
    
            drrr[num].event(["new-description"], (u) => {
              drrr[num].getLoc(() => {
                if (!drrr[num].room.description.match("/getmusic")) {
                  delEv(num, id);
                }
              })
            });
    
            drrr[num].event(["new-host"], (u, m, url, trip, e) => {
              drrr[num].getLoc(() => {
                if (e.user === drrr[num].profile.name) {
                  if (drrr[num].users.length > 1) {
                    randHost(num, 0, drrr[num].users.length - 1);
                  }
                  else {
                    delEv(num, id);
                  }
                }
              })
            });
    
            drrr[num].event(["kick", "ban"], (u, m, url, trip, e) => {
              drrr[num].getLoc(() => {
                if (drrr[num].lastTalk.message.match("kicked|banned")) {
                  console.log(num + " you get a " + e.type)
                  blacklist.push(drrr[num].specId);
                  delEv(num, id);
                }
              })
            });

            drrr[num].event(["dm"], (u, m) => {
              if (m.match("/off")) {
                  drrr[num].kick(u, () => delEv(num, id));
              }
            });
  
          })
        })
      }
      else {
        num++;
        getStart(num, id);
      }
  }
  // looking for a room that needs music
  visit.state("Start", () => {

    if (Object.keys(botCount).length > 0) {
      Object.keys(botCount).forEach((num) => {
        sss(num, botCount[num]);
      });
    }
  
    times.head = setInterval(() => {
      if (!finder.profile) {
        finderErr = true;
        console.log("Profile undefined, try login...");
        visit.going("Reload");
      }
    }, 60000*10);
  
    times.undefined = setInterval(() => {
      if (Object.keys(botCount).length > 0) {
        Object.keys(botCount).forEach((num) => {
          drrr[num].getLoc(() => {
            if (!drrr[num].room.roomId) {
              drrr[num].load(num);
              drrr[num].join(drrr[num].specId);
            }
          })
        });
      }
    }, 60000);

    
  
    times.lounge = setInterval(() => {
  
      finder.getLounge(() => {
        finder.rooms.forEach((room) => {
          if (room.language === "ru-RU") {
            if (room.music === true) {
              if (room.description.match("/getmusic")) {
                if (!blacklist.includes(room.roomId)) {
                  if (room.total !== room.limit) {
                    if (!rooms.includes(room.roomId)) {
                      if (rooms.length !== 5) {
                        rooms.push(room.roomId);
                        getStart(1, room.roomId);
                      }
                    }
                  }
                }
              }
            }
          }
        })
      })
    }, 5000);
  });
  
  visit.state("Reload", () => {
    clearInterval(times.head);
    clearInterval(times.undefined);
    clearInterval(times.lounge);
    tryLog();
  });
  
  var finderErr = false;
  
  tryLog = () => {
    if (finderErr === true) {
      finder = new Bot("finder", "gg");
  
      finder.login(() => {
        finder.save('pf');
        console.log("New finder saved.");
        finderErr = false;
        visit.going("Start");
      })
    } else {
      if (finder.load('pf')) {
        console.log("Finder reloaded");
        visit.going("Start");
      } else {
        finder.login(() => {
          finder.save('pf');
          console.log("Finder started.");
  
          if (!finder.profile) {
            console.log("Login error.");
            setTimeout(() => tryLog(), 5000);
          }
          else {
            visit.going("Start");
          }
        })
      }
    }
  }
  
  tryLog();
