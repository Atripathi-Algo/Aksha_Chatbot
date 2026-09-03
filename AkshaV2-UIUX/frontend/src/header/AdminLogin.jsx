
//to be noted
//statusCode, Client, Email, message need to be sent in the axios.post payload on sucess else login will fail in ui
import React, { Component } from 'react'
import { message } from 'antd';
import axios from 'axios';
import Modal from 'react-bootstrap/Modal';

/// main component
export default class AdminLogin extends Component {
    // list of state variables
    constructor(props){
        super(props);
        this.state ={
            isModalOpen:false,
            username:'',
            password:'',
            loading:false
        }
    }

    // show admin login modal
    showModal = (e) => {
      e.preventDefault();
        this.setState({isModalOpen:true,username:'',password:''});
      }

      // closing modal
      handleOk = () => {
        this.setState({isModalOpen:false});
      }

      // closing modal
      handleCancel = () => {
        this.setState({isModalOpen:false});
      }

      // login function
      login=()=>{

       // validation Username and Password
        if(!this.state.username){
          message.warning('Username is required.'); //Username mandatory toast message 
          return;
        } else if(!this.state.password){
          message.warning('Password is required');//Password mandatory toast message
          return;
        } 
        
        axios
      .post(
        `${process.env.REACT_APP_USER_LOGIN }`,
        {
          Username: this.state.username, //params to be sent to axios
          Password: this.state.password,
          
        }
      )
      .then(
        (res) => {
          if (res.status === 200) { //please note statusCode is returned in payload of request
            console.log('res.data.message = ',res.data.message);
            if(res.data.message === "Authentication Successful!"){
            message.success(res.data.message);
            window.localStorage.setItem("isLoggedIn", "true"); //set the login boolean to show settings icon
            window.localStorage.setItem(
              "userInfo",   //store userinfo in localstorage
              JSON.stringify({
                Client: res.data.Client,
                Email: res.data.Email,
                Username: this.state.username,
                Password: this.state.password,
              })
            );
            setTimeout(() => {
              this.setState({isModalOpen:false});
              //console.log('789 res.data', res);
              window.location.assign('/monitor');  //navigate to /monitor and remount components
            }, 1000);
          }
          else{
            message.warn('incorrect password');
          }
          } else {
            message.error(res.data.message);
            setTimeout(() => {
              message.error(res.data.message);
            }, 1000);
          }
        },
        (error) => {
        }
      );
      }
      // html rendered
    render() {
        return (
        <div>
            <a href="#" onClick={(e)=>this.showModal(e)} className='admin-login-custom'>Admin Login</a>
             <Modal show={this.state.isModalOpen} onHide={this.handleClose}>
            <Modal.Header>
              <Modal.Title>Admin Login</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div className="profile-model profile-model-custom" >
                    <div className="flex-main-info flex-main-info-custom" >
                    <div className="information">
                        <div className="flex-input">
                        <label>Username</label>
                        {/* <PersonOutlinedIcon className="lockIcon" /> */}
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Username"
                            value={this.state.username}
                            onChange={(e) => this.setState({username:e.target.value})} //set username state
                            style={{marginBottom:29}}
                        />
                        {/* <PencilIcon className="pencil-icon" /> */}
                        </div>
                        <div className="flex-input">
                          <label>Password</label>
                        {/* <LockOutlinedIcon className="lockIcon" /> */}
                        <input
                            type="password"
                            className="form-control"
                            placeholder="Password"
                            value={this.state.password}
                            onChange={(e) => this.setState({password:e.target.value})}//set password state
                            style={{marginBottom:29}}
                        />
                        {/* <VisibilityOffIcon className="pencil-icon" /> */}
                        </div>
                    </div>
                    </div>
                    <div className="flex-btn-pass">
                    <button
                    className="btn btn-reset-pass btn-reset-pass-custom" 
                    onClick={this.handleCancel}  
                    > Cancel
                    </button>
                    <button className="btn btn-primary" onClick={this.login}> 
                        Login
                    </button>
                    </div>
                </div>
              </Modal.Body>
            </Modal> 
        </div>
    )
  }
}
