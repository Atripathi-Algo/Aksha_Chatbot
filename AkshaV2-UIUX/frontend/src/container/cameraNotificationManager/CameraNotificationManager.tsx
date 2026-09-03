import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useApi } from "../../hooks/useAPI";
import { useTranslation } from "react-i18next";

import AddGroup from "./List/AddGroup";
import Edit from "./List/Edit";
import CameraNotificationPanel from "./CameraNotificationPanel";

import "./List/notification.scss";
import { CircularProgress, Box } from "@mui/material";
import Messagebox from "../../component/common/messagebox/Messagebox";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";

/**
 * Base URL — same as your project
 */
const react_app_base_url = `${process.env.REACT_APP_BASE_URL_PROTOCOL}://${window.location.hostname}:${process.env.REACT_APP_BASE_URL_PORT}`;


interface NotificationManagerType {
  _id: string;
  camera_group_id?: any;
  email: { enabled: boolean; email_list: string };
  mobile: { enabled: boolean; mobile_numbers: string };
  telegram: { enabled: boolean; bot_token: string; chat_id: string };
  alerts_enabled: boolean;
}

const CameraNotificationManager: React.FC<any> = ({
  setActiveTab,
  setCamDirectory,
}) => {
  const { callApi } = useApi();
  const { t } = useTranslation();

  const { is_mobile } = useSelector((state: any) => state.isMobileDevice);

  // 0 = table view, 1 = Add/Edit view
  const [activescreen, setActivescreen] = useState<0 | 1>(0);
  const [tableloader, setTableloader] = useState(false);
  const [list, setList] = useState<any>([]);
  const [selected, setSelected] = useState<NotificationManagerType | null>(null);

  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [warning, setWarning] = useState(false);

  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState("");

  const handleClose = () => setOpen(false);

  useEffect(() => {
    if (localStorage.getItem("isLoggedIn") !== "true") {
      window.location.assign("/monitor");
      return;
    }
    load();
  }, []);

  const load = () => {
    setTableloader(true);
    callApi(`${react_app_base_url}/api/notification`, { method: "GET" })
      .then((res: any) => {
        console.log("Notifications fetched:", res.data);
        setList(res.data?.data ?? []); // <-- Use 'data' from backend
        setTableloader(false);
      })
      .catch(() => {
        setMessage(t("genericError"));
        setWarning(true);
        setOpen(true);
        setTableloader(false);
      });
  };


  const showAddGroup = () => {
    setSelected(null); // clear selection for Add
    setActivescreen(1);
    setCamDirectory(false);          // 👈 HIDE OTHER TABS
    setActiveTab("notification");
  };

  const showEdit = (item: any) => {
    setSelected(item);
    setActivescreen(1);
    setCamDirectory(true);
  };

  const showDelete = (item: any) => {
    setDeleteId(item._id);
    setDeleteModal(true);
  };

  const deleteManager = () => {
    callApi(`${react_app_base_url}/api/notification/${deleteId}`, { method: "DELETE" })
      .then(() => {
        setMessage(t("Deleted successfully"));
        setWarning(false);
        setOpen(true);
        load();
        setDeleteModal(false);
      })
      .catch(() => {
        setMessage(t("genericError"));
        setWarning(true);
        setOpen(true);
      });
  };

  if (tableloader)
    return (
      <Box sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)" }}>
        <CircularProgress />
      </Box>
    );

  return (
    <>
      <Messagebox open={open} handleClose={handleClose} message={message} warning={warning} />

      {activescreen === 0 ? (
        <CameraNotificationPanel
          is_mobile={is_mobile}
          list={list}
          showAddGroup={showAddGroup}
          showeditpage={showEdit}
          showdeletemodal={showDelete}
          refreshList={load}
        />
      ) : selected ? (
        <Edit data={selected} back={() => {
          setActivescreen(0);
          setCamDirectory(true);     
        }} loadlist={load} />
      ) : (
        <AddGroup back={() => {
          setActivescreen(0);
          setCamDirectory(true);     
        }} refresh={load} />
      )}

      <Modal show={deleteModal} onHide={() => setDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{t("Delete Confirmation")}</Modal.Title>
        </Modal.Header>

        <Modal.Body>{t("Are you sure you want to delete notification manager?")}</Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setDeleteModal(false)}>
            {t("Cancel")}
          </Button>
          <Button variant="danger" onClick={deleteManager}>
            {t("Delete")}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default CameraNotificationManager;
