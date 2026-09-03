import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  is_mobile: false
};
// console.log("==========123456===========678===")

const mobileDeviceReducers = createSlice({
  name: "isMobileDevice",
  initialState,
  reducers: {
    mobileDevice: (state: any, action) => {
      // console.log("==========123456===========", action)
      state.is_mobile = action.payload;
    },
  },
});

const { actions, reducer } = mobileDeviceReducers;
export const { mobileDevice } = actions;

export default reducer;
