import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  allCameraNames: [],
  allObjectOfInterestLabels: [],
  areaOfInterestImage: "",
  durationTime: 0,
  isCoordinatesSelected: null,
};

const investigationReducer = createSlice({
  name: "investigation",
  initialState,
  reducers: {
    fetchAllCamerasName: (state, action) => {
      state.allCameraNames = action.payload;
    },
    fetchAllObjectOfInterestLabels: (state, action) => {
      state.allObjectOfInterestLabels = action.payload;
    },
    fetchAreaOfInterestImage: (state, action) => {
      state.areaOfInterestImage = action.payload;
    },
    getDurationTime: (state, action) => {
      state.durationTime = action.payload;
    },
    coordinatesSelected: (state, action) => {
      state.isCoordinatesSelected = action.payload;
    },
  },
});

const { actions, reducer } = investigationReducer;
export const {
  fetchAllCamerasName,
  fetchAllObjectOfInterestLabels,
  fetchAreaOfInterestImage,
  getDurationTime,
  coordinatesSelected,
} = actions;

export default reducer;
