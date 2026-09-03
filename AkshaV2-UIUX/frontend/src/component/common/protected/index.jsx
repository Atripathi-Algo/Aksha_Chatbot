// checks for login
//used in router/Router.tsx


import { Navigate } from "react-router-dom";
const Protected = ({ isLoggedIn, children }) => {
  //isLoggedIn : boolean value 
  // children : shows children that the Protected componenet wraps


  // if not logged in redirect to "/"  such that your unable to go back 
  if (!isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  //else show children
  return children;
};
export default Protected;
