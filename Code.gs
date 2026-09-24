function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
      .setTitle('แดชบอร์ดผลการประเมินการจัดการเรียนการสอน - โรงเรียนมหาไถ่ศึกษาภาคตะวันออกเฉียงเหนือ')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getEvaluationData() {
  var sheetNames = ['ภาษาไทย', 'วิทยาศาสตร์ฯ', 'คณิตศาสตร์', 'ภาษาต่างประเทศ', 'สังคมศึกษา', 'สุขศึกษา พละศึกษา', 'ศิลปะ', 'การงาน', 'การตอบแบบฟอร์ม 1'];
  var allRows = [];
  
  sheetNames.forEach(function(sName) {
    var s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sName);
    if (s) {
      var data = s.getDataRange().getValues();
      for (var i = 1; i < data.length; i++) {
        var rawName = data[i][1] ? data[i][1].toString().trim() : '';
        var groupName = data[i][2] ? data[i][2].toString().trim() : '';
        var cleanName = rawName.replace(/^[:\-\s]+/, '').trim();
        
        if (cleanName && cleanName !== 'nan' && groupName && groupName !== 'กลุ่มสาระการเรียนรู้' && groupName !== 'nan') {
          data[i][1] = cleanName;
          allRows.push(data[i]);
        }
      }
    }
  });

  var teacherMap = {};

  allRows.forEach(function(row) {
    var teacherName = row[1];
    var groupName = row[2].toString().trim();
    
    var d1Sum = 0, d2Sum = 0, d3Sum = 0;
    for (var j = 9; j <= 13; j++) d1Sum += Number(row[j]) || 0;
    for (var j = 14; j <= 18; j++) d2Sum += Number(row[j]) || 0;
    for (var j = 19; j <= 23; j++) d3Sum += Number(row[j]) || 0;
    
    var d1 = (d1Sum / 5) * 20;
    var d2 = (d2Sum / 5) * 20;
    var d3 = (d3Sum / 5) * 20;
    var total = (d1 + d2 + d3) / 3;

    var key = groupName + '_' + teacherName;
    if (!teacherMap[key]) {
      teacherMap[key] = {
        name: teacherName,
        group: groupName,
        rounds: []
      };
    }
    
    teacherMap[key].rounds.push({
      d1: Math.round(d1 * 100) / 100,
      d2: Math.round(d2 * 100) / 100,
      d3: Math.round(d3 * 100) / 100,
      total: Math.round(total * 100) / 100
    });
  });

  var groupsMap = {};
  var allTeachersList = [];
  
  for (var key in teacherMap) {
    var t = teacherMap[key];
    var g = t.group;
    
    if (!groupsMap[g]) {
      groupsMap[g] = [];
    }
    
    var r1 = t.rounds[0] ? t.rounds[0] : {d1: 0, d2: 0, d3: 0, total: 0};
    var r2 = t.rounds[1] ? t.rounds[1] : r1;
    var avgD1 = Math.round(((r1.d1 + r2.d1) / 2) * 100) / 100;
    var avgD2 = Math.round(((r1.d2 + r2.d2) / 2) * 100) / 100;
    var avgD3 = Math.round(((r1.d3 + r2.d3) / 2) * 100) / 100;
    var avgTotal = Math.round(((r1.total + r2.total) / 2) * 100) / 100;
    
    var teacherObj = {
      name: t.name,
      group: g,
      d1: avgD1,
      d2: avgD2,
      d3: avgD3,
      summaryTotal: avgTotal,
      round1: r1,
      round2: r2
    };

    groupsMap[g].push(teacherObj);
    allTeachersList.push(teacherObj);
  }

  // จัดเรียงลำดับในแต่ละกลุ่มสาระ
  for (var g in groupsMap) {
    groupsMap[g].sort(function(a, b) {
      return b.summaryTotal - a.summaryTotal;
    });
  }

  // จัดเรียง 10 อันดับสูงสุดทั่วโรงเรียน
  allTeachersList.sort(function(a, b) {
    return b.summaryTotal - a.summaryTotal;
  });
  var top10School = allTeachersList.slice(0, 10);

  // คำนวณค่าเฉลี่ยภาพรวมทั้งโรงเรียนสำหรับหน้าหลัก
  var schoolD1 = 0, schoolD2 = 0, schoolD3 = 0;
  if (allTeachersList.length > 0) {
    schoolD1 = Math.round((allTeachersList.reduce(function(sum, t){ return sum + t.d1; }, 0) / allTeachersList.length) * 100) / 100;
    schoolD2 = Math.round((allTeachersList.reduce(function(sum, t){ return sum + t.d2; }, 0) / allTeachersList.length) * 100) / 100;
    schoolD3 = Math.round((allTeachersList.reduce(function(sum, t){ return sum + t.d3; }, 0) / allTeachersList.length) * 100) / 100;
  }

  return {
    groups: groupsMap,
    schoolSummary: {
      d1: schoolD1,
      d2: schoolD2,
      d3: schoolD3
    },
    top10: top10School
  };
}
