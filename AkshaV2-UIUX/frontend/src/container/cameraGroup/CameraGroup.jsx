import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useApi } from '../../hooks/useAPI.js';
import AddGroup from './List/AddGroup.jsx'; // Assumes AddGroup component exists
import Edit from './List/Edit.jsx';
import useRemoveScroll from '../../hooks/useRemoveScroll.js';
import './List/list.scss';
import { CircularProgress } from '@mui/material';
import Box from '@mui/material/Box';
import Messagebox from '../../component/common/messagebox/Messagebox.jsx';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import CameraGroupPanel from './CameraGroupPanel'; // Panel that renders the list & controls
import { useTranslation } from 'react-i18next';

const react_app_base_url = `${process.env.REACT_APP_BASE_URL_PROTOCOL}://${window.location.hostname}:${process.env.REACT_APP_BASE_URL_PORT}`;



const CameraGroup = (props) => {
  const { callApi } = useApi();
  const { t } = useTranslation();

  // Redux - detect mobile
  const { is_mobile } = useSelector((state) => state.isMobileDevice);

  // State
  const [activescreen, setActivescreen] = useState (0); // 0 = list, 1 = add/edit
  const [allselected, setAllselected] = useState (false);
  const [groupList, setGroupList] = useState([]);
  const [copyGroupList, setCopyGroupList] = useState([]);
  const [tableloader, setTableloader] = useState  (false);
  const [groupData, setGroupData] = useState({});
  const [groupId, setGroupId] = useState  ('');
  const [deletemodalstatus, setDeletemodalstatus] = useState  (false);
  const [viewmodalstatus, setViewModalStatus] = useState (false);
  const [viewdata, setViewdata] = useState({});
  const [activepage, setActivepage] = useState  ('add'); // 'view' or '' for add/edit mode ('add','edit')
  const [open, setOpen] = useState  (false);
  const [message, setMessage] = useState  ('');
  const [warning, setWarning] = useState  (false);

  // Helper: close messagebox
  const handleClose = () => setOpen(false);

  useEffect(() => {
    // redirect if not logged in (keeps same behaviour as camera file)
    if (localStorage.getItem('isLoggedIn') !== 'true') {
      window.location.assign('/monitor');
      return;
    }
    // initial load
    getGroupList();
  }, []);

  /**
   * Toggle select all groups (mark rowselected on each)
   */
  const handleSelectAll = () => {
    setAllselected(!allselected);
    groupList.forEach(g => {
      g.rowselected = !allselected;
    });
    setGroupList([...groupList]);
  };

  /**
   * Toggle single group row selection
   */
  const onChangeSingleRowSelected = (id) => {
    const arr = groupList.map(g => {
      if (g._id === id) g.rowselected = !g.rowselected;
      return g;
    });
    setGroupList(arr);
  };

  /**
   * Fetch camera group list
   */
  const getGroupList = () => {
    const url = `${react_app_base_url}/api/camgroup`;
    setTableloader(true);
    callApi(url, { method: 'GET' })
      .then((response) => {
        console.log(response);
        // expect response.data.groups array or response.data.cameraGroups
        const raw = response.data?.groups ?? response.data?.cameraGroups ?? response.data;
        const arr = [];
        if (Array.isArray(raw)) {
          for (const item of raw) {
            // normalize — ensure fields exist
            const group = {
              _id: item._id || item.id || '',
              group_name: item.group_name || item.groupName || '',
              description: item.description || '',
              priority_type: item.priority_type || item.priorityType || '',
              cameras: item.cameras || [],
              created_at: item.created_at || item.createdAt,
              updated_at: item.updated_at || item.updatedAt,
              rowselected: allselected,
            };
            arr.push(group);
          }
        }
        // Sort by priority_type if you want custom ordering; keep nominal order otherwise
        // e.g. custom => 1, high => 2, medium => 3, low => 4
        const priorityOrder = { Custom: 1, High: 2, Medium: 3, Low: 4 };
        const sorted = arr.sort((a, b) => {
          const pa = priorityOrder[a.priority_type ?? 'Custom'] ?? 99;
          const pb = priorityOrder[b.priority_type ?? 'Custom'] ?? 99;
          return pa - pb;
        });

        setGroupList(sorted);
        setCopyGroupList(sorted);
        setTableloader(false);
      })
      .catch((err) => {
        console.error('getGroupList error', err);
        setTableloader(false);
        setMessage(t('genericError'));
        setOpen(true);
      });
  };

  /**
   * Show the add/edit page (add)
   */
  const showAddGroup = () => {
    setGroupData({});
    console.log(" showAddGroup triggered");
    props.setActiveTab("group");
    props.setCamDirectory(false);
    setActivepage('add');
    setActivescreen(1);
  };

  /**
   * Show edit page for a group
   */
  const showeditpage = (item) => {
    console.log("EDIT ITEM:", item);

    const fixed = {
      ...item,
      priority_type: item.priority_type || "Custom",
    };

    setGroupData(fixed);
    props.setActiveTab("group");
    props.setCamDirectory(false);
    setActivepage('edit');
    setActivescreen(1);
  };


  /**
   * Show view (read-only) page for a group
   */
  const showviewpage = (item) => {
    setGroupData(item);
    setActivepage('view');
    props.setActiveTab("group");
    props.setCamDirectory(false);
    setActivescreen(1);
  };

  /**
   * Show delete confirmation
   */
  const showdeletemodal = (item) => {
    setDeletemodalstatus(true);
    setGroupId(item._id);
  };

  /**
   * Hide delete modal
   */
  const hide_delete_modal = () => {
    setDeletemodalstatus(false);
    setGroupId('');
  };

  /**
   * Delete group
   */
  const delete_group = () => {
    if (!groupId) return;
    setTableloader(true);
    const url = `${react_app_base_url}/api/camgroup/${groupId}`;
    callApi(url, { method: 'DELETE' })
      .then((res) => {
        if (res.data?.success === true || res.status === 200) {
          setMessage(t('Camera group deleted successfully.'));
          setOpen(true);
          setDeletemodalstatus(false);
          getGroupList();
        } else {
          setMessage(res.data?.message || t('genericError'));
          setOpen(true);
        }
        setTableloader(false);
      })
      .catch((err) => {
        console.error('delete_group error', err);
        setMessage(t('genericError'));
        setOpen(true);
        setTableloader(false);
      });
  };

  // Disable default scroll when list is small like in camera component
  const dependencyArray = activescreen === 0 && groupList?.length >= 0 && groupList?.length <= 3 ? [] : [1];
  useRemoveScroll(dependencyArray);


  return (
    <section className='camera-directory-list-section' style={{ marginTop: -15 }}>
      {activescreen === 1 ? (
        <>
          {/* Add/Edit/View Group component */}
          <AddGroup
            showScreen={() => {
              setActivescreen(0);
              setActivepage('add');
              props.setCamDirectory(true);
              props.setActiveTab("group");
            }}
            loadlist={getGroupList}
            groupdata={groupData}
            list={copyGroupList}
            screenMode={activepage}
            setMessage={setMessage}
            setOpen={setOpen}
            setWarning={setWarning}
            setCamDirectory={props.setCamDirectory}
            renderedFrom="CamGroupDirectory"
          />

        </>
      ) : (
        <div className="container widthCls">
          <Messagebox open={open} handleClose={handleClose} message={message} warning={warning} />
          <div className="row top-filter-section">
            {tableloader ? (
              <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                <CircularProgress />
              </Box>
            ) : (
              <CameraGroupPanel
                is_mobile={is_mobile}
                allselected={allselected}
                groupList={groupList}
                isEmpty={groupList.length === 0}
                handleSelectAll={handleSelectAll}
                showAddGroup={showAddGroup}
                onChangeSingleRowSelected={onChangeSingleRowSelected}
                showeditpage={showeditpage}
                showviewpage={showviewpage}
                showdeletemodal={showdeletemodal}
                refreshList={getGroupList}
              />
            )}

            {/* Delete modal */}
            <Modal show={deletemodalstatus} onHide={hide_delete_modal} centered>
              <Modal.Header closeButton>
                <Modal.Title>{t('Delete Confirmation')}</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <p style={{ padding: '0px 16px', fontSize: 16 }}>
                  {t('Are you sure you want to delete the selected camera group?')}
                </p>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={hide_delete_modal}>
                  {t('Cancel')}
                </Button>
                <button className="deletebutton" onClick={delete_group}>
                  {t('Delete')}
                </button>
              </Modal.Footer>
            </Modal>

            {/* View modal for quick view (optional) */}
            <Modal show={viewmodalstatus} onHide={() => setViewModalStatus(false)} size="lg">
              <Modal.Header closeButton>
                <Modal.Title>{t('Camera Group Details')}</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <p style={{ padding: '0 0', fontSize: 15 }}>
                  <b>{t('Group name')}:</b> {viewdata?.group_name ?? '---'}<br />
                  <b>{t('Description')}:</b> {viewdata?.description ?? '---'}<br />
                  <b>{t('Priority type')}:</b> {viewdata?.priority_type ?? '---'}<br />
                  <b>{t('Cameras')}:</b>
                  {viewdata?.cameras && viewdata.cameras.length > 0 ? (
                    <ul style={{ margin: '8px 0 0 16px' }}>
                      {viewdata.cameras.map((c, idx) => (
                        <li key={c.camera_id ?? idx}>
                          {c.camera_name} {c.custom_order ? ` (order: ${c.custom_order})` : ''}
                        </li>
                      ))}
                    </ul>
                  ) : ' ---'}<br />
                  <b>{t('Created at')}:</b> {viewdata?.created_at ?? '---'}<br />
                  <b>{t('Updated at')}:</b> {viewdata?.updated_at ?? '---'}<br />
                </p>
              </Modal.Body>
            </Modal>
          </div>
        </div>
      )}
    </section>
  );
};

export default CameraGroup;