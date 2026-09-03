import { configureStore } from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import monitorReducer from "./reducers/monitorReducer";
import investigationReducer from "./reducers/investigationReducer";
import snackBarReducer from "./reducers/snackBarReducer";
import deviceCheckReducer from "./reducers/deviceCheckReducer";
import  alertReportReducer from './reducers/alertReportReducer';
import authReducer from './reducers/authReducer'

const store = configureStore({
  reducer: {
    monitor: monitorReducer,
    investigation: investigationReducer,
    snackBar: snackBarReducer,
    isMobileDevice: deviceCheckReducer,
    alertReport: alertReportReducer,
    auth: authReducer
  },
  devTools: true,
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export default store;
