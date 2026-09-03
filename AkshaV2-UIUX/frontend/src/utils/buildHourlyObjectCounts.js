export const buildHourlyObjectCounts = (reportData) => {
    const hourMap = {};
  
    reportData.forEach((camera) => {
      const camName = camera.camera_name;
  
      camera.records.forEach((rec) => {
        const date = new Date(rec.timestamp);
        const hour = date.getHours();
        const endHour = (hour + 1) % 24;
        const hourKey = String(endHour).padStart(2, "0") + ":00";

  
        if (!hourMap[hourKey]) {
          hourMap[hourKey] = {};
        }
  
        const camKey = `${camName}__person`;
  
        if (!hourMap[hourKey][camKey]) {
          hourMap[hourKey][camKey] = {
            total: 0,
            count: 0,
          };
        }
  
        const personCount = rec.counts?.person || 0;
  
        hourMap[hourKey][camKey].total += personCount;
        hourMap[hourKey][camKey].count += 1;
      });
    });
  
    const result = {};
  
    Object.entries(hourMap).forEach(([hour, camData]) => {
      result[hour] = {};
  
      Object.entries(camData).forEach(([camKey, obj]) => {
        result[hour][camKey] =
  obj.count > 0 ? Math.round(obj.total / obj.count) : 0;

      });
    });
  
    return {
      labels: Object.keys(result).sort(),
      data: result,
    };
  };
  