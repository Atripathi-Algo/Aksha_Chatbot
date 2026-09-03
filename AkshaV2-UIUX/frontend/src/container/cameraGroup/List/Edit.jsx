import React, { useState, useEffect, ChangeEvent } from 'react';
import './list.scss';
import { useApi } from '../../../hooks/useAPI';
import { useSelector } from 'react-redux';
import Messagebox from '../../../component/common/messagebox/Messagebox';
import Add from './AddGroup.jsx';

const react_app_base_url = `${process.env.REACT_APP_BASE_URL_PROTOCOL}://${window.location.hostname}:${process.env.REACT_APP_BASE_URL_PORT}`;


/**
 * Edit component manages editing of camera details.
 * Handles toggling alerts, adding, editing, deleting cameras.
 * @returns JSX.Element
 */
const Edit = () => {
  const { callApi } = useApi();

  const [allselected, setAllselected] = useState(false);
  const [cameraList, setCameraList] = useState([]);
  const [copyCameraList, setCopyCameraList] = useState([]);
  const [tableloader, setTableloader] = useState(false);
  const [cameradata, setCameradata] = useState({});
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');

  /**
   * Closes the message box.
   */
  const handleClose = () => {
    setOpen(false);
  };

  // On component mount, check login and load camera details from localStorage
  useEffect(() => {
    if (localStorage.getItem('isLoggedIn') !== 'true') {
      window.location.assign('/monitor');
      return;
    }
    let data = localStorage.getItem('camera_details');
    if (data) {
      const parsedData = JSON.parse(data);
      if (parsedData.length > 0) {
        setCameradata(parsedData);
        console.log('data in Edit = ', parsedData);
      } else {
        window.location.assign('/monitor');
      }
    } else {
      window.location.assign('/monitor');
    }
  }, []);

  // on load component
  useEffect(() => {
    getcameralist();
  }, []);


  /**
   * Fetches the list of active cameras from the backend.
   */
  const getcameralist = () => {
    let url = `${react_app_base_url}/api/camera_names`;
    setTableloader(true);
    callApi(url, { method: 'GET' })
      .then((response) => {
        const arr = [];
        for (const item of response.data.cameras) {
          if (item.Active === true) {
            item.rowselected = allselected;
            arr.push(item);
          }
        }
        setCameraList(arr.reverse());
        setCopyCameraList(response.data.cameras);
        setTableloader(false);
      })
      .catch(() => {
        setTableloader(false);
      });
  };

  return (
    <>
      <Messagebox
        open={open}
        handleClose={handleClose}
        message={message}
      />
      <section className='camera-directory-list-section' style={{ marginTop: 20 }}>
        {/* @ts-ignore */}
        {(copyCameraList.length > 0 && cameradata && (cameradata).length > 0) && (
          <Add
            showScreen={() => window.location.assign('/monitor')}
            loadlist={() => getcameralist()}
            cameradata={(cameradata)[0]}
            list={copyCameraList}
            activescreen={'edit'}
            setMessage={setMessage}
            setOpen={setOpen}
            redirectOnSuccess={() => window.location.assign('/monitor')}
            renderedFrom={'Live'}
          />
        )}
      </section>
    </>
  );
};

export default Edit;
