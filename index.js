'use strict';
var Alexa = require('alexa-sdk');

var data = {"もえる": "火曜日と木曜日",
"かん": "月曜日",
"ペットボトル": "水曜日",
"もえない": "水曜日",
"こしるい" : "水曜日",
"ダンボール" : "水曜日",
"びん" : "月曜日",
"きけん" : "月曜日",
"はくしょくトレイ" : "月曜日",
"ふるぎ": "水曜日"
};

var trush_data = {
  "もえる" : {"week": [3,6], "status": -1},
  "かん" : {"week": [1], "status": 1},
  "ペットボトル": {"week": [3], "status": 1},
  "もえない": {"week":[3], "status": 0},
  "こしるい": {"week": [3], "status": 0},
  "ダンボール": {"week": [3], "status": 0},
  "びん": {"week": [1], "status": 0},
  "きけん": {"week": [1], "status": 0},
  "はくしょくトレイ": {"week": [1], "status": 0},
  "ふるぎ": {"week": [3], "status": 0}
}

Date.prototype.getDayOfYear = function() {
  var onejan = new Date(this.getFullYear(), 0, 1);
  return Math.ceil((this - onejan) / 86400000);
};

Date.prototype.getWeekOfYear = function() {
  var onejan = new Date(this.getFullYear(), 0, 1);
  var offset = onejan.getDay() - 1;
  var weeks = Math.floor((this.getDayOfYear() + offset) / 7);
  return (onejan.getDay() == 0) ? weeks + 1 : weeks;
};

function getDayFromWeekNumber(year, weekNumber, date){
    var onejan = new Date(year, 0, 1);
    // 曜日を取得(日=0, 月=1, 火=2, 水=3, 木=4, 金=5, 土=6)
    var offset = onejan.getDay();
    // 1月1日から日付を週数分進め、曜日分を引く
    return onejan.setDate( onejan.getDate() + (weekNumber * 7) - offset + date);
}

exports.handler = function(event, context, callback) {
    var alexa = Alexa.handler(event, context);
    alexa.appId = process.env.ALEXA_APPLICATION_ID;
    alexa.registerHandlers(handlers);
    alexa.execute();
};

var handlers = {
    'WhenTrush': function() {
      var slot_value = this.event.request.intent.slots.TrashType.value;
      console.log(slot_value);
      var speechOutput = slot_value + "ゴミの曜日は" + data[slot_value] + "です。";
      console.log(speechOutput);
      this.emit(':tell', speechOutput);
    },
    'NextTrush': function() {
      const trush_name = this.event.request.intent.slots.TrashType.value;
      const trush_weeks = trush_data[trush_name]["week"];
      const now = new Date();
      const now_week_status = new Date().getWeekOfYear() % 2;
      const week_status_number = getWeekStatusNumber(trush_weeks, now_week_status);
      let next_trush_date_millsecond;
      if (trush_data["status"] === -1) {
        // 毎週の場合
        if (trush_weeks.length === week_status_number) {
          next_trush_date_millsecond = getDayFromWeekNumber(now.getFullYear(), now.getWeekOfYear() + 1, trush_weeks[0]);
        } else {
          next_trush_date_millsecond = getDayFromWeekNumber(now.getFullYear(), now.getWeekOfYear(), trush_weeks[week_status_number]);
        }
      } elseif (trush_data["status"] === now_week_status) {
        // 今週か、2週後か
        if  (trush_weeks.length === week_status_number) {
          next_trush_date_millsecond = getDayFromWeekNumber(now.getFullYear(), now.getWeekOfYear() + 2, trush_weeks[0]);
        } else {
          next_trush_date_millsecond = getDayFromWeekNumber(now.getFullYear(), now.getWeekOfYear(), trush_weeks[week_status_number]);
        }
      } else {
        // 来週
        next_trush_date_millsecond = getDayFromWeekNumber(now.getFullYear(), now.getWeekOfYear() + 1, trush_weeks[0]);
      }

      const time = new Date(next_trush_date_millsecond);
      const month = time.getMonth() + 1;
      const day = time.getDate();
      this.emit(':tell', "次の" + trush_name + "ゴミの日は" + month + "がつ" * day + "にちです。");
    },
    'WhatTrash': function() {

    }
};

function getWeekStatusNumber(trush_week_array, now_week_status) {
  for (var i = 0; i < trush_week_array.length; i++) {
    if (now_week_status < trush_week_array[i] ||
    (now_week_status === trush_week_array[i] && new Date().getHours() < 10)) {
      return i;
    }
  }

  // ここに来るときは今週ダメな場合
  return trush_week_array.length;
}
