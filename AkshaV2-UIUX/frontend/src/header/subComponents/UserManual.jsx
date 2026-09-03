import Modal from 'react-bootstrap/Modal';


const UserManual = ({value, onModalClose }) => {
    return ( 
<>
{/* Start User manual modal  */}
      <Modal show={value} onHide={onModalClose} dialogClassName="user-manual">
        <div>
        <Modal.Header closeButton>
          <Modal.Title>User Manual</Modal.Title>
        </Modal.Header>
        <div className="pdf-outer-style">
          <iframe
          //user manual for aksha
            src='https://aksha-storage.s3.ap-south-1.amazonaws.com/aksha-resources/Aksha_V2_User_Manual.pdf'
            frameBorder="0"
            scrolling="auto"
            height="550px"
            width="100%"
            type="application/pdf"
            marginTop="10%"
          ></iframe>
        </div>
        </div>
      </Modal>
      {/* End User manual modal  */}
      </>
     );
}
 
export default UserManual;