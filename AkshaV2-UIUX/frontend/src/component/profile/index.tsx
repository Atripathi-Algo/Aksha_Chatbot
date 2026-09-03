
//current profile code actually used
// if notificationEmail absent --> REACT_APP_UPDATE_EMAIL doesnt work which causes an error on ui when opnened 
//REACT_APP_UPDATE_EMAIL is the old aws link

import React, { useState, useEffect } from "react";
import PencilIcon from "@mui/icons-material/ModeEditOutlineOutlined";
import Dialog from "@mui/material/Dialog";
import profileImg from "../../assets/images/profileImg.png";
import Slide from "@mui/material/Slide";
import { TransitionProps } from "@mui/material/transitions";
import CloseIcon from "@mui/icons-material/Close";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import Visibility from "@mui/icons-material/Visibility";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import AlternateEmailOutlinedIcon from "@mui/icons-material/AlternateEmailOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import CallOutlinedIcon from "@mui/icons-material/CallOutlined";
import {Tooltip} from '@mui/material';
import "./profile.scss";
import axiosJWT from "context/axiosAuthIntercept";
import { message } from "antd";
// transition 
const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

// props
type profileProps = {
  children: React.ReactNode;
};
// main component 
export default function Profile(props: profileProps) {
  const [open, setOpen] = React.useState(false);
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [bot_token, setBot_token] = useState("");
  const [chat_ids, setChat_ids] = useState("");
  const [notificationEmail, setNotificationEmail] = useState("");
  const [alertReportMail, setAlertReportMail] = useState("");
  const [changeEmailText, setChangeEmailText] = useState("Save");
  const [newPassword, setNewPassword] = useState();
  const [confirmPassword, setConfirmPassword] = useState();
  const [currentPassword, setCurrentPassword] = useState();
  const [showPassword, setShowPassword] = useState(false);
  const [passwordIndex, setPasswordIndex] = useState(0);
  const [genAIfeatures, setGenAIfeatures] = useState(false);

 let globalInfo = window.localStorage.getItem("userInfo");

  //on load component function
  useEffect(() => {
    let userInfo: any = JSON.parse(globalInfo as any);
    try {
      setUserName(userInfo["Client"]);
      setEmail(userInfo["Email"]);
    } catch (error) { }
  }, [globalInfo]);

  useEffect(() => {
    get_email_details();
  }, []);

  // get email details from db
  const get_email_details = () => {
    let url = `${process.env.REACT_APP_BASE_URL}${process.env.REACT_APP_GET_EMAIL_DETAILS}`;
    axiosJWT.get(url).then((res: any) => {
      if (res.data.success == true) {
        let emailtext: any = res.data.notification_email.join(",");
        let alert_report_mail: any = res.data.alert_report_email.join(",");
        let bot_token: any = res.data.bot_token;
        let chat_ids: any = res.data.chat_ids.join(",");
        let client_email_id: any = res.data.new_email;
        let gen_ai_features: any = res.data.genai_features;
        setNotificationEmail(emailtext);
        setAlertReportMail(alert_report_mail);
        setEmail(client_email_id);
        setBot_token(bot_token);
        setChat_ids(chat_ids);
        setGenAIfeatures(gen_ai_features);
      } else {
      }
    });
  }
  // open modal function
  const handleClickOpen = () => {
    setOpen(true);
  };
  // close modal function
  const handleClose = () => {
    setOpen(false);
  };

  const displaypassword = (indexNumber: number) => {
    setShowPassword(false);
    setPasswordIndex(indexNumber)
  };

  const hidepassword = () => {
    setShowPassword(true);
  };

  // change email
  const changeEmail = () => {



    setChangeEmailText("Please Wait...");
    let userInfo: any = JSON.parse(globalInfo as any);
    if (!userInfo.Username) {
      message.warn('Username is required.');
      setChangeEmailText("Save");
      return;
    } else if (!email) {
      message.warn('Admin Email Address is required.');
      setChangeEmailText("Save");
      return;
    } else if (!notificationEmail) {
      message.warn('Notification Email Address is required.');
      setChangeEmailText("Save");
      return;
    }
    let emails: any = notificationEmail.trim().split(',');
    let arr: any = [];
    for (let item of emails) {
      item = item.trim();
      arr.push(item)
    }

    let alert_report_emails: any = alertReportMail.trim().split(',');
    let alert_report_arr: any = [];
    for (let item of alert_report_emails) {
      item = item.trim();
      alert_report_arr.push(item)
    }

    let telegram_chat_ids: any = chat_ids.trim().split(',');
    let arr_chat_ids: any = [];
    for (let item of telegram_chat_ids) {
      item = item.trim();
      arr_chat_ids.push(item)
    }
    let params = {
      Username: userInfo.Username,
      Password: userInfo.Password,
      New_Email: email,
      Notification_Email: arr,
      Alert_Report_Emails: alert_report_arr,
      Bot_token: bot_token,
      Chat_ids: arr_chat_ids,
      Gen_AI_features: genAIfeatures
    }


    axiosJWT
      .post(
        `${process.env.REACT_APP_UPDATE_EMAIL}`, params   //run email authentication in aws to check if user email valid
      )
      .then(
        (res: any) => {
          setChangeEmailText("Save");

          if (res.data.statusCode == 200) {
            message.success("Details are updated successfully");
            let emaillist = JSON.stringify(arr);
            start_servilence(emaillist);
            localStorage.setItem("emailList", JSON.stringify(arr));

            // update details in mongo db
            update_email_details(params);
          } else {
            message.warning("Something went wrong.Please try again!");
          }
        },
        (err) => {
          setChangeEmailText("Save");
          message.warning("Something went wrong.Please try again!");
        }
      );
      setOpen(false);
  };
  // update email details
  const update_email_details = (params: any) => {
    delete params["Password"]
    let url = `${process.env.REACT_APP_BASE_URL}${process.env.REACT_APP_UPDATE_EMAIL_DETAILS}`;
    axiosJWT.put(url, params).then((res: any) => {
      if (res.data.success == true) {
      } else {
      }
    });
  }
  const toggleCheckBox = () => {
    //setIsChecked(!ischecked);
    setGenAIfeatures(!genAIfeatures);
}
  // start survilence
  const start_servilence = (emailList: any) => {
    let params = {
      email: emailList,
      type: 'update'
    }
    return;
    const headers = {
      "Content-Type": "application/json; charset=utf-8"
    }
    let url = `${process.env.REACT_APP_BASE_URL}${process.env.REACT_APP_START_SURVIELLANCE}`;
    axiosJWT
      .post(url, params, {
        headers: headers,
      })
      .then((res:any) => {
        if (res.data.success == true) {
        } else {
        }
      });
  }
  const changepassword = () => {
    if (!currentPassword) {
      message.warn('Invalid current password');
      return;
    } else if (!newPassword) {
      message.warn('Invalid new password');
      return;
    } else if (!confirmPassword) {
      message.warn('Invalid confirm password');
      return;
    } else if (newPassword != confirmPassword) {
      message.warn('New password and confirm password is not matching.');
      return;
    }
    let userInfo: any = JSON.parse(globalInfo as any);
    let username = userInfo.Username;
    let params = {
      Username: username,
      Current_Password: currentPassword,
      New_Password: newPassword,
    }

    axiosJWT.post(`${process.env.REACT_APP_UPDATE_PASSWORD}`, params).then(
      (response:any) => {
        if (response.data.statusCode == "200") {
          message.success("Password is changed successfully.");
          return;
        } else {
          message.warn("Something went wrong. Pleae check once again.");
          return;
        }
      },
      (error) => {}
    );
  };
  // html rendered
  return (
    <div>
      <div onClick={handleClickOpen}>{props.children}</div>
      
      <Dialog
        open={open}
        TransitionComponent={Transition}
        keepMounted
        onClose={handleClose}
        aria-describedby="alert-dialog-slide-description"
      >
        
        <div className="profile-model">
          <div className="profile-header">
            <div className="userInfo">
              <div className="flex-info">
                <img src={profileImg} alt="profile icon" />
                <div>
                  <h3 className="mb-0">{userName}</h3>      
                </div>
              </div>
              <CloseIcon className="close-icon" onClick={handleClose} />
            </div>
          </div>
          <div className="flex-main-info">
            <div className="row">
              <div className="col-lg-6">
                <div className="information">
                  <h2>User Information</h2>
                  <p className="credential-title">Username</p>
                  <div className="flex-input">
                    {/* <PersonOutlinedIcon className="lockIcon" /> */}
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Full name"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                    />
                    {/* <PencilIcon className="pencil-icon" /> */}
                  </div>
                  <p className="credential-title"> From </p>
                  
                  <div className="flex-input">
                  <Tooltip title={<p style={{ fontSize: "17px" ,margin: "0", padding: "0"}}>Email notifications will be sent from this email id</p>} PopperProps={{ style: { zIndex: 4600 } }} placement="bottom-start">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Admin Email address"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                      }}
                    />
                   </Tooltip>
                  </div>
                  
                  <p className="credential-title"> To </p>
                  
                  <div className="mt-3 flex-input">
                    {/* <AlternateEmailOutlinedIcon className="lockIcon" /> */}
                    <Tooltip title={<p style={{ fontSize: "17px", margin: "0", padding: "0"}}>You will receive notifications on this email ID</p>} PopperProps={{ style: { zIndex: 4600 } }} placement="bottom-start">
                    <textarea
                      id="txtid"
                      className="form-control"
                      rows={2}
                      cols={50}
                      maxLength={200}
                      
                      placeholder="Notification Email address"
                      value={notificationEmail}
                      style={{ width: '100%'}}
                      onChange={(e) => {
                        setNotificationEmail(e.target.value);
                      }}
                    ></textarea>
                    </Tooltip>
                    {/* <PencilIcon className="pencil-icon" /> */}
                  </div>

                  <p className="credential-title"> Send alert report to: </p>
                  
                  <div className="mt-3 flex-input">
                    {/* <AlternateEmailOutlinedIcon className="lockIcon" /> */}
                    <Tooltip title={<p style={{ fontSize: "17px", margin: "0", padding: "0"}}>You will receive alert report on this email ID bimonthly</p>} PopperProps={{ style: { zIndex: 4600 } }} placement="bottom-start">
                    <textarea
                      id="txtid"
                      className="form-control"
                      rows={2}
                      cols={50}
                      maxLength={200}
                      
                      placeholder="Email address to receive alert report"
                      value={alertReportMail}
                      style={{ width: '100%'}}
                      onChange={(e) => {
                        setAlertReportMail(e.target.value);
                      }}
                    ></textarea>
                    </Tooltip>
                    {/* <PencilIcon className="pencil-icon" /> */}
                  </div>
                  
                  <Tooltip title="telegram">
                  <p className="credential-title">Telegram Bot Token</p>
                  </Tooltip>
                  <div className="flex-input">
                    {/* <CallOutlinedIcon className="lockIcon" /> */}
                    
                    <input
                      type="text"
                      className="form-control"
                      placeholder="telegram bot_token"
                      value={bot_token}
                      onChange={(e) => {
                        setBot_token(e.target.value);
                      }}
                    />
                    
                    {/* <PencilIcon className="pencil-icon" /> */}
                  </div>
                  <p className="credential-title">Telegram Chat IDs</p>
                  <div className="flex-input">
                    {/* <CallOutlinedIcon className="lockIcon" /> */}
                    <Tooltip title={<p style={{ fontSize: "17px", margin: "0", padding: "0"}}>You will receive telegram notifications on these chat ids</p>} PopperProps={{ style: { zIndex: 4600 } }} placement="bottom-start">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="telegram chat ids"
                      value={chat_ids}
                      onChange={(e) => {
                        setChat_ids(e.target.value);
                      }}
                    />
                    </Tooltip>
                    {/* <PencilIcon className="pencil-icon" /> */}
                  </div>
                  <div className="enable-gen-ai-features" onClick = {toggleCheckBox}>
                    <input className="form-check-input" value = "Five" type = "checkbox" checked={genAIfeatures}  />
                    <p className="credential-title">Enable Gen AI features</p>
                  </div>
                  {/* <div className="flex-input">
                    <CallOutlinedIcon className="lockIcon" />
                    <input
                      type="text"
                      className="form-control"
                      placeholder="9584651200"
                    />
                    <PencilIcon className="pencil-icon" />
                  </div> */}
                </div>
              </div>
              <div className="col-lg-6">
                <div className="change-password">
                  <h2>Change Password</h2>
                  <div className="flex-input">
                    <LockOutlinedIcon className="lockIcon" />
                    <input
                      type={!(!showPassword && passwordIndex===1)?"password":"text"}
                      className="form-control"
                      placeholder="Current password"
                      value={currentPassword}
                      // @ts-ignore
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                    {(!showPassword && passwordIndex===1)?<Visibility className="pencil-icon" onClick={hidepassword} /> : <VisibilityOffIcon className="pencil-icon" onClick={() => displaypassword(1)} />}
                  </div>
                  <div className="flex-input">
                    <LockOutlinedIcon className="lockIcon" />
                    <input
                      type={!(!showPassword && passwordIndex===2)?"password":"text"}
                      className="form-control"
                      placeholder="New password"
                      value={newPassword}
                      // @ts-ignore
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    {(!showPassword && passwordIndex===2)? <Visibility className="pencil-icon" onClick={hidepassword} /> : <VisibilityOffIcon className="pencil-icon" onClick={() => displaypassword(2)} />}
                  </div>
                  <div className="flex-input">
                    <LockOutlinedIcon className="lockIcon" />
                    <input
                      type={!(!showPassword && passwordIndex===3)?"password":"text"}
                      className="form-control"
                      placeholder="confirm password"
                      value={confirmPassword}
                      // @ts-ignore
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    {(!showPassword && passwordIndex===3)? <Visibility className="pencil-icon" onClick={hidepassword} /> : <VisibilityOffIcon className="pencil-icon" onClick={() => displaypassword(3)} />}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex-btn-pass">
            <button className="btn btn-primary" onClick={changeEmail}>
              {changeEmailText}
            </button>
            <button className="btn btn-reset-pass" onClick={changepassword}>Reset password</button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}