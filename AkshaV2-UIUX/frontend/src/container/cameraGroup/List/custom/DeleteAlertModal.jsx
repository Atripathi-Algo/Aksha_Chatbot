/**
 * @fileoverview Delete Alert Modal Component - Provides a modal interface for deleting security alerts
 * @module DeleteAlertModal
 * @description This component provides a comprehensive modal interface for deleting security alerts with
 * camera selection, confirmation dialogs, and proper error handling.
 * 
 * @example
 * ```tsx
 * <DeleteAlertModal
 *   data={alertData}
 *   camera={cameraName}
 *   onRefresh={handleRefresh}
 * />
 * ```
 */

import React, { useState, useEffect } from 'react';
import { message } from 'antd';
import axios from 'axios';
import { 
  Dialog, 
  DialogActions, 
  DialogContent, 
  DialogTitle, 
  Button, 
  Select, 
  FormControlLabel, 
  Checkbox,
  Tooltip,
  SelectChangeEvent
} from '@mui/material';
import "./DeleteAlertModal.scss";
import { t } from 'i18next';


/**
 * DeleteAlertModal Component
 * 
 * @component
 * @description Provides a modal interface for deleting security alerts with camera selection
 * and confirmation dialogs. Supports both single and bulk deletion of alerts.
 * 
 * @param {AlertData} data - The alert data to be deleted
 * @param {string} camera - The camera name associated with the alert
 * @param {Function} onRefresh - Callback to refresh the alert list after deletion
 */
const DeleteAlertModal= ({ data, camera, onRefresh }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [cameraList, setCameraList] = useState([]);
  const [selectAllCameras, setSelectAllCameras] = useState(false);
  const [cameras, setCameras] = useState([camera]);
  const [deleteCameraList, setDeleteCameraList] = useState([]);
  const [cameraListAll, setCameraListAll] = useState([]);
  const [selectedCameras, setSelectedCameras] = useState(data.Camera_Name);
  const [alertId, setAlertId] = useState(data._id);

  // Base URL configuration
  const react_app_base_url = `${process.env.REACT_APP_BASE_URL_PROTOCOL}://${window.location.hostname}:${process.env.REACT_APP_BASE_URL_PORT}`;

  /**
   * Shows the delete alert modal
   */
  const showModal = () => {
    setIsModalVisible(true);
    setSelectAllCameras(false);
    setCameras([camera]);
  };

  /**
   * Handles modal close
   */
  const handleOk = () => {
    setIsModalVisible(false);
  };

  /**
   * Handles modal cancel
   */
  const handleCancel = () => {
    setIsModalVisible(false);
  };

  /**
   * Handles select all cameras checkbox
   */
  const handleAllCamsSelected = (e) => {
    setSelectAllCameras(e.target.checked);
    if (e.target.checked) {
      getCameraById(true);
    } else {
      setCameras([camera]);
    }
  };

  /**
   * Handles camera selection change
   */
  const handleChange = (event) => {
    const selectedValue = event.target.value;
    setCameras(selectedValue);
  };

  /**
   * Fetches camera list on component mount
   */
  useEffect(() => {
    setSelectedCameras(data.Camera_Name);
    setCameras([camera]);
    setSelectAllCameras(false);
    setAlertId(data._id);
    getCameraById();
    getCameraList();
  }, [data, camera]);

  /**
   * Fetches camera list
   */
  const getCameraList = async (alertsByCam, _surveillance = false) => {
    try {
      const response = await axios.get(`${react_app_base_url}${import.meta.env.VITE_CAMERA}`);
      const { cameras } = response.data;
      const activeCams = cameras?.length > 0 ? cameras.filter((cam) => cam.Active === true) : [];
      setCameraListAll(activeCams);
    } catch (ex) {}
  };

  /**
   * Fetches cameras by alert ID
   */
  const getCameraById = async (checkBox = false) => {
    const alertId = data._id;
    const url = `${react_app_base_url}/api/alert/findCamerasByAlertId/${alertId}`;
    try {
      const response = await axios.get(url);
      if (response.data.success === true) {
        const { CameraNames } = response.data;
        setCameraList(CameraNames);
        setDeleteCameraList(CameraNames);
        if (checkBox) {
          setCameras(CameraNames);
        }
      }
    } catch (ex) {}
  };

  /**
   * Deletes alert
   */
  const deleteAlert = async () => {
    try {
      const alertId = data._id;
      const url = `${react_app_base_url}/api/alert/delete/${alertId}`;
      const params = { Camera_Name: cameras };
      const response = await axios.put(url, params);
      if (response.data.success === true) {
        message.success('Alert is deleted successfully.');
        setIsModalVisible(false);
        onRefresh();
      }
    } catch (ex) {
      message.warning('Please try again!');
    }
  };

  /**
   * Gets alert list
   */
  const getAlertList = async (getCameraListAgain = false) => {
    const url = `${react_app_base_url}/api/alert/${camera}`;
    try {
      const response = await axios.get(url);
      if (response.data.success === true) {
        const { alerts } = response.data;
        // Handle alert list update
      }
    } catch (ex) {}
  };

  return (
    <div>
      <Tooltip title={t("Delete Alert")}>
        <i
          onClick={showModal}
          className='bx bx-trash delete-alert-icon'
        />
      </Tooltip>

      <Dialog
        open={isModalVisible}
        onClose={handleCancel}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {`Are you sure you want to delete alert ${data.Alert_Name}?`}
        </DialogTitle>
        <DialogContent>
          <Select
            native
            multiple
            value={cameras}
            onChange={handleChange}
            style={{ width: '100%' }}
          >
            {cameraList.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
          <FormControlLabel
            control={
              <Checkbox
                checked={selectAllCameras}
                onChange={handleAllCamsSelected}
              />
            }
            label='Select All Cameras'
          />
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={handleCancel}>Cancel</Button>
          <Button variant="contained" onClick={deleteAlert}>Delete</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default DeleteAlertModal;
