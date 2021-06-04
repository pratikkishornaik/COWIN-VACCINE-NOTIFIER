const express = require("express");
const app = express();
const player = require("play-sound")((opts = {}));
const moment = require("moment");
const fetchCall = require("node-fetch");
const cron = require("node-cron");

const port = 3002;

const DOSE = {
  dose1: "available_capacity_dose1",
  dose2: "available_capacity_dose2",
};
const AGE = {
  18: 18,
  45: 45,
};
const SELECTED_AGE = AGE[18];
const SELECTED_DOSE = DOSE.dose1;
const DISTRICT_ID = 167; //COWIN APP AND FIND OUT YOUR DISTRICT ID BY INSPECTING THE NETWORK TAB

const SEC = 5; //DONT USE LESS THAN 3 SECONDS OR ELSE IT WILL BLOCK YOUR API REQUESTS

cron.schedule(`*/${SEC} * * * * *`, function () {
  getAPIData();
});

const getAPIData = async () => {
  const date = new moment(new Date()).format("DD-MM-YYYY");

  try {
    const resp = await fetchCall(
      `https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByDistrict?district_id=${DISTRICT_ID}&date=${date}`
    );
    const json = await resp.json();
    return findAvailableSlots(json);
  } catch (err) {
    console.log(err);
  }
};

const findAvailableSlots = ({ centers }) => {
  const centersAvailable = centers.filter((center) => {
    const availableSlots = center.sessions.filter((session) => {
      const age = "min_age_limit";

      if (session[age] == SELECTED_AGE && session[SELECTED_DOSE]) {
        return true;
      }
      return false;
    });
    return !!availableSlots.length;
  });

  console.log(centersAvailable); // CONSOLE LOGS THE CENTERS
  if (centersAvailable.length) {
    player.play("./beep.mp3", function (err) {
      if (err) throw err;
    });
  }
  return centersAvailable;
};

app.listen(port, () => console.log(`Cowin app listening on port ${port}!`));
