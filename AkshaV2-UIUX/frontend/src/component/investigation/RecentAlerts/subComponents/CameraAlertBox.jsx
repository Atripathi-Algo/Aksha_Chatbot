
import React, { useState, useEffect, useRef } from 'react';
import ImageModel from "../../../common/imageModel";
import ChatPopover from "../../ChatPopover/ChatPopover";
import axiosJWT from "context/axiosAuthIntercept";
const imagesLimit = 4; // since 4 images per page limit

const initialState = { itemsCount: imagesLimit };

const CameraAlertBox = ({ data, indexed }) => {

    const [itemsToShow, setItemsToShow] = useState(initialState);
    const [aIFrames, setAIFrames] = useState([]); //alert data to be shown
    const [open, setOpen] = useState(false);
    const onOpenModal = () => setOpen(true);
    const onCloseModal = () => setOpen(false);
    const [imgUrl, setImgUrl] = useState("");
    const modalRef = useRef(null);
    const [imageLoader, setImageLoader] = useState(false);
    const [base64Image, setBase64Image] = useState('');

    // console.log('CameraAlertBox', data)

    //show more functionality 
    const showMore = () => {
        if (aIFrames.slice(0, itemsToShow.itemsCount).length === aIFrames.length) { //if Show more(100/100) the resets state to initial  to show as 50
            setItemsToShow({ itemsCount: imagesLimit });
        } else {
            setItemsToShow({ itemsCount: Number(itemsToShow?.itemsCount) + imagesLimit }); //increase max items can be shown by 50
        }
    }
    function toDataUrl(url, callback) {
        var xhr = new XMLHttpRequest();
        xhr.onload = function () {
          var reader = new FileReader();
          reader.onloadend = function () {
            callback(reader.result);
          };
          reader.readAsDataURL(xhr.response);
        };
        xhr.open("GET", url);
        xhr.responseType = "blob";
        xhr.send();
      }

    const convertBase64 = (img) => {
        toDataUrl(img, async function (myBase64) { //Convert image from url to Base64
          let base64image = await myBase64
          setBase64Image(base64image); 
        });
      }
    const openImageLoader = () => {
        setImageLoader(true);
      };
    
    const checkGenAIstatus = async (image) => {
        let url = `${process.env.REACT_APP_BASE_URL}${process.env.REACT_APP_GET_EMAIL_DETAILS}`;
        let gen_ai_features = false;
        await axiosJWT.get(url).then((res) => {
            if (res.data.success == true) {
            gen_ai_features = res.data.genai_features;
            //setGenAIfeatures(gen_ai_features);
            }})
            setImgUrl(image);
            if(gen_ai_features){
              convertBase64(image);
              setImageLoader(false);
              if (modalRef.current) {
                modalRef.current.showModal();
              }
            }
            else{
              setImgUrl(image);
              openImageLoader();
            }
      }

    useEffect(() => {
      
        if (data.images && data.images?.length > 0) {
            //console.log('condtion 1')
            // console.log('CameraAlertBox', data)
            setAIFrames(data.images);
            setItemsToShow(initialState);
        } else {
            //console.log('condtion 2')
            setAIFrames([]);
            setItemsToShow(initialState);
        }
    }, [data])

    return (
        data.images?.length > 0 ? //show nothing if images array empty
            <div className="row mx-0 cam-name-container">
                <ChatPopover modalRef={modalRef} imgUrl={imgUrl} base64Image={base64Image} setImgUrl={setImgUrl} />
                {indexed !== 0 && <div className="mb-3">
                    <hr className="hr-seperator"   //separate each cameraName with a break , other than first box do for all
                    />
                </div>}

                <div>
                    <h4>{data.cameraName}</h4>
                </div>


                <div className="container-fluid ">
                    <div
                        className="row mt-2 mx-0 images-container">
                        {aIFrames?.length > 0  && //display the array of cam images for current cameraName
                            aIFrames.slice(0, itemsToShow.itemsCount).map((imgg, index) =>
                                <div
                                    className='col-lg-4 col-md-6 col-sm-12 col-xs-12 col-xl-3 col-xl-3 col-xxl-3'
                                    key={index}>
                                <div>
                                    <img
                                        alt="camera img"
                                        crossOrigin="anonymous"
                                        src={imgg}
                                        className="w-100 image-styling"
                                        onClick={() => {
                                            checkGenAIstatus(imgg);
                                          }}
                                    />
                                </div>
                                </div>
                            )
                        }
                    </div>
                </div>
                {(imgUrl && imageLoader) && (
                    <ImageModel        //only if "imgUrl" is truthy show ImageModel dialog component
                    open={imageLoader}
                    setOpen={setImageLoader}
                    imgUrl={imgUrl}
                    />
                )}


                {aIFrames &&  
                 aIFrames.length > 0 &&
                 aIFrames.length > imagesLimit && //hide when Show less(imagesLimit/imagesLimit) i.e 50/50 OR hide when aIFrames.length < imagesLimit 
                <div className="show-more-info">
                  
                         <a className="btn-color" onClick={showMore}>
                            {aIFrames.slice(0, itemsToShow.itemsCount).length < aIFrames.length ? (  //shows increasing each time by 50
                                <span>Show more ({aIFrames.slice(0, itemsToShow.itemsCount).length}/{aIFrames.length})</span>
                            ) : (
                                //resets to show only 50
                                <span>Show less ({aIFrames.slice(0, itemsToShow.itemsCount).length}/{aIFrames.length})</span>
                            )}
                        </a>
                </div>
            }


            </div>
            : null
    );



}

export default CameraAlertBox;