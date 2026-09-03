import axiosJWT from "context/axiosAuthIntercept";

//function to get report data
export async function getDailyAlertReport(formatedDate) {
  const customConfig = { headers: { "Content-Type": "application/json" } };
  let react_app_base_url = `${process.env.REACT_APP_BASE_URL_PROTOCOL}://${window.location.hostname}:${process.env.REACT_APP_BASE_URL_PORT}`;
  const path = `${react_app_base_url}${process.env.REACT_APP_INSIGHT_REPORT}`;
  //const testingPath = 'http://localhost:7000/api/alertDemoReport';
  const reqBody = {
    //date: "2023-07-07",
    date: formatedDate,
  };

  return await axiosJWT.post(path, reqBody, customConfig);
}
