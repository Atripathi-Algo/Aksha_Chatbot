import noDataFound from "../../../assets/images/noDataFound.png"
import './nodatafound.scss'; //custom css

// no alerts found component

//displays an image followed by h3 -- msg no alerts found and also a span msg

const NoDataFound = ({pageType}) => {
    return (
       
        <div>
           <img src={noDataFound} alt="no data found" style={{ width: "400px", height: "400px" }} />
            <div className ="textAlign">
            {
                !pageType ? (
            <>
            <h3>Oops! No alerts added </h3>
            <div><span>Alerts created for cameras will appear here</span></div>
            </>
            ):(
                <>
                <h3>You can add alerts after saving the camera </h3>
                </>
            )
            }
            </div>
        </div>
    );
};

export default NoDataFound;