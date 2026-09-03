
//to be noted
//window.location.assign mounts component again
//window.location.assign('/Login')  -->  path "/Login" doesnt exist

import React, { Component } from 'react';
//import { UserOutlined, LogoutOutlined } from '@ant-design/icons';
import { IconButton, Avatar } from "@mui/material";
import AdminLogin from './AdminLogin';
import Profile from '../component/profile';
import CustomDropdown from '../component/common/customDropDown';
import PersonIcon from '@mui/icons-material/Person';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';

// main component
class UserProfileDropDown extends Component {

  // logout functionality
  logout = (e) => {
    e.preventDefault();
    window.localStorage.removeItem('isLoggedIn'); //remove isLoggedIn from localStorage
    window.localStorage.removeItem('userInfo'); //remove userInfo from localStorage
    window.location.assign('/Login'); // since "/Login" doesnt exist it will redirect to "/"
  }

  preventRefresh=(e)=>{
    e.preventDefault();
  }

  // html rendered
  render() {

    //if user logged in show menu
    const menu = [
      {
        key: '1',
        label: (<Profile><a href="#" className='anchor-style' onClick={ e => this.preventRefresh(e) }>User Details</a></Profile>), //on click show user profile component
        icon: <PersonIcon className='icon-styled' />,
      },
      {
        key: '2',
        label: (<a href="#" onClick={ e =>  this.logout(e)} className='anchor-style'>Logout</a>),
        icon: <ExitToAppIcon className='icon-styled' />,
      },

    ];

    //if user logged out show menu
    const menu2 = [
      {
        key: '1',
        label: (<AdminLogin />),
        icon: <PersonIcon className='icon-styled' />,
      },
    ];


    //jsx returned by DropdownMenu
    return (
      <div>
        <CustomDropdown
          items={localStorage.getItem('isLoggedIn') === 'true' ? menu : menu2}
        >
          <div className='user-profile-dropdown'>
            <IconButton sx={{ p: 0 }} //creates a button out of jsx inside it
            >
              {/* &nbsp;
              <img
                alt="company logo" //compnay logo , e.g currently shrada
                src={require("../assets/images/header/user.png")}
                style={{maxHeight:34, minHeight:34,  minWidth:72,  maxWidth:72, objectFit:'fill'}}  //objectFit:'fill' makes take entire width of box
              /> */}
              &nbsp;
              <Avatar
                alt="avatar" //created rounded image
                src={require("../assets/images/header/avatar.png")}
              />
            </IconButton>
          </div>
        </CustomDropdown>

      </div>
    )
  }
}

export default UserProfileDropDown;