function getData() {
  var data = [];

  for (var i = 0; i < preprocessedData2019.length; i++) {
    var entry = preprocessedData2019[i];
    var weekDate = new Date(entry.weekDate);
    var midWeekDate = new Date(weekDate.getTime());
    midWeekDate.setDate(weekDate.getDate() + 3);

    var monthDateName = MONTHS[midWeekDate.getMonth()] + " " + midWeekDate.getFullYear();
    var weekDateName = MONTHS[weekDate.getMonth()] + " " + weekDate.getDate() + ", " + weekDate.getFullYear();

    data.push({
      weekDate: weekDate,
      records: entry.records,
      monthDateName: monthDateName,
      weekDateName: weekDateName
    });
  }

  return data;
}

var MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];

var preprocessedData2019 = [
  {
    weekDate: "Jan 06 2019 00:00:00",
    records: 1349
  },
  {
    weekDate: "Jan 13 2019 00:00:00",
    records: 1578
  },
  {
    weekDate: "Jan 20 2019 00:00:00",
    records: 1129
  },
  {
    weekDate: "Jan 27 2019 00:00:00",
    records: 1512
  },
  {
    weekDate: "Feb 03 2019 00:00:00",
    records: 1562
  },
  {
    weekDate: "Feb 10 2019 00:00:00",
    records: 1125
  },
  {
    weekDate: "Feb 17 2019 00:00:00",
    records: 622
  },
  {
    weekDate: "Feb 24 2019 00:00:00",
    records: 842
  },
  {
    weekDate: "Mar 03 2019 00:00:00",
    records: 1089
  },
  {
    weekDate: "Mar 10 2019 00:00:00",
    records: 1373
  },
  {
    weekDate: "Mar 17 2019 00:00:00",
    records: 1672
  },
  {
    weekDate: "Mar 24 2019 00:00:00",
    records: 1462
  },
  {
    weekDate: "Mar 31 2019 00:00:00",
    records: 1425
  },
  {
    weekDate: "Apr 07 2019 00:00:00",
    records: 1672
  },
  {
    weekDate: "Apr 14 2019 00:00:00",
    records: 1525
  },
  {
    weekDate: "Apr 21 2019 00:00:00",
    records: 1266
  },
  {
    weekDate: "Apr 28 2019 00:00:00",
    records: 1347
  },
  {
    weekDate: "May 05 2019 00:00:00",
    records: 1674
  },
  {
    weekDate: "May 12 2019 00:00:00",
    records: 1236
  },
  {
    weekDate: "May 19 2019 00:00:00",
    records: 1441
  },
  {
    weekDate: "May 26 2019 00:00:00",
    records: 1266
  }
]