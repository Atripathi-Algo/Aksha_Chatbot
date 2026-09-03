// This code sets up and renders a React app using ReactDOM and Redux.

// First, the necessary dependencies are imported. React and ReactDOM are imported, along with the styles for the app in "./index.scss". 
// The main App component is imported from "./App", and a function called "reportWebVitals" is imported from "./reportWebVitals". 
// The Redux Provider component is also imported from "react-redux", along with the store from "./global_store/store".

// Next, a root element is created using ReactDOM.createRoot() and assigned to the root variable. 
// This root element is where the app will be rendered.

// The app is rendered by calling root.render(), passing in the main App component wrapped in a Redux Provider component. 
// The Provider component is passed the store variable, which provides the app's global state.

// Finally, the function reportWebVitals is invoked to report web vitals such as performance metrics.


import React from "react";
import ReactDOM from "react-dom/client";
import "./index.scss";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { Provider } from "react-redux";
import store from "./global_store/store";
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import './index.scss'

// Creating a root element for ReactDOM to render the app
const root = ReactDOM.createRoot(
  document.getElementById("root")
);

// Rendering the App component within a Redux Provider component
root.render(
  <Provider store={store}>
    <React.StrictMode>
      <App />
    </React.StrictMode>
  </Provider>
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://cra.link/PWA
// Need to add public url for service worker to work
serviceWorkerRegistration.unregister();

// Invoking the function to report web vitals
reportWebVitals();
