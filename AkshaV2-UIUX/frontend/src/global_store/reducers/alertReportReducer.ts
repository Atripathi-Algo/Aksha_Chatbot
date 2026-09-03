import { createSlice } from "@reduxjs/toolkit";
import dayjs from "dayjs";


const initialState = {
    reportData: {},
   // alertDate: dayjs().subtract(1, 'day')
   alertDate: dayjs().subtract(1, 'day').format('YYYY-MM-DD')   //cause redux needs serializable state
};

const alertReportReducers = createSlice({
    name: "alertReport",
    initialState,
    reducers: {
        fetchAlertReport: (state: any, action) => {
           // console.log("54524352435 redux fetchAlertReport", action)
            state.reportData = action.payload;
        },
        setAlertDate: (state: any, action) => {
           // console.log("6456456456456 redux setAlertDate",  action.payload)
            state.alertDate = action.payload;
        },
    },
});

const { actions, reducer } = alertReportReducers;
export const { fetchAlertReport, setAlertDate } = actions;

export default reducer;
