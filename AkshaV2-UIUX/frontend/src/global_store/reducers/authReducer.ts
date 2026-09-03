import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  token: null,
  email: null,
  role: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      state.token = action.payload.token;
      state.email = action.payload.email;
      state.role = action.payload.role;
    },
    logout: (state) => {
      state.token = null;
      state.email = null;
      state.role = null;
    },
  },
});

export const { loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;
