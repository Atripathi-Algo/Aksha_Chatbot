import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  cameraDetails: {
    info: [],
    message: "",
  },
  spotLightCameras: {
    info: [],
    message: "",
  },
  notificationsCount: 0
};

const monitorReducer = createSlice({
  name: "monitor",
  initialState,
  reducers: {
    fetchUser: (state, action) => {
      state.cameraDetails = action.payload;
    },
    getAllSpotLight: (state, action) => {
      state.spotLightCameras = action.payload;
    },
    notifications: (state, action) => {
      state.notificationsCount = action.payload?.notificationsCount;
    },
  },
});

const { actions, reducer } = monitorReducer;
export const { fetchUser, getAllSpotLight, notifications } = actions;

export default reducer;
