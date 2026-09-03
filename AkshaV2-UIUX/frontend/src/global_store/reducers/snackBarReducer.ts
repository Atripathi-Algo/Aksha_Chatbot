import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  toast: {
    show: false,
    indicator: "",
    message: "",
  },
};

const snackBarReducer = createSlice({
  name: "snackbar",
  initialState,
  reducers: {
    showToast: (state: any, action) => {
      let { show, indicator, message } = action.payload;
      state.toast = {
        show: show,        
        indicator: indicator,
        message: message,
      };
    },
  },
});

const { actions, reducer } = snackBarReducer;
export const { showToast } = actions;

export default reducer;
