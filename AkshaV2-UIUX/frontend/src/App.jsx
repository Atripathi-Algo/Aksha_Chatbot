// This is a ReactJS application that renders the main App component. 
// The component imports several modules and components that are used within it.

// ThemeProvider and theme are imported from @emotion/react and ./theme respectively. 
// These are used to set the theme of the application.

// BrowserRouter is imported from react-router-dom and used to provide client-side routing functionality. 
// Router is a component that handles all the routes of the application.

// Snackbar is a custom component that displays a message at the bottom of the screen. 
// It receives three props: show, a boolean that determines whether or not to show the component, indicator, a string that determines what kind of message to display (success, warning, error, etc.), and message, a string that contains the text of the message.

// mobileDevice is a Redux action creator that sets a boolean flag based on whether the user is accessing the application from a mobile device or not.

// useDispatch and connect are Redux hooks that allow the component to dispatch actions to the Redux store and subscribe to updates in the store respectively.

// The App component receives props as an argument, which are passed down from the Redux store via the mapStateToProps function. 
// Inside the component, there is a useEffect hook that runs once when the component mounts. 
// It checks if the user is accessing the application from a mobile device and dispatches the appropriate action.

import { ThemeProvider } from "@emotion/react";
import Router from "./router/Router";
import theme from "./theme";
import { BrowserRouter } from "react-router-dom";
import Snackbar from "./component/common/toast";
import { mobileDevice } from "./global_store/reducers/deviceCheckReducer";
import { connect, useDispatch } from "react-redux";
import { isMobile } from './utils/common'
import { useEffect } from "react";
import { ToastContainer } from "react-toastify";

// setting prototype type
// type propTypes = {
//   show: boolean;
//   indicator: string;
//   message: string;
// };

// main app component
const App = (props) => {
  const dispatch = useDispatch()
  // on load component function
  useEffect(() => {
    if (isMobile.any()) {
      dispatch(mobileDevice({ is_mobile: true }))
    } else {
      dispatch(mobileDevice({ is_mobile: false }))
    }
  })
  // Router setting
  return (
    <div>
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <Router />
        </ThemeProvider>
      </BrowserRouter>
      <Snackbar
        show={props.show}
        indicator={props.indicator}
        message={props.message}
      />
      {/* Toast container (place once globally) */}
      <ToastContainer
        position="bottom-right"
        autoClose={2000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        draggable
        theme="light"
      />
    </div>
  );
};

function mapStateToProps(state) {
  let { show, indicator, message } = state.snackBar["toast"];

  return { show, indicator, message };
}
export default connect(mapStateToProps)(App);
