import React, { useState } from "react";
import "./styles/kpiReportTable.scss";
import ImageZoomModal from "component/common/imageZoomModal/ImageZoomModal";
const KPIReportTable = ({ data,selectedOOILabels }) => {
  const [expandedCamera, setExpandedCamera] = useState(null);
  const [currentImg, setCurrentImg] = useState(null);
  const [openImgModal, setOpenImgModal] = useState(false);

  const toggleCamera = (name) =>
    setExpandedCamera(expandedCamera === name ? null : name);

    const formatCounts = (countsObj, selectedOOILabels = []) => {
      if (!countsObj) return "-";
    
      const entries = Object.entries(countsObj)
        .filter(([key, value]) => {
          // If no OOI selected → show all
          if (!selectedOOILabels.length) return value > 0;
    
          // Show only selected OOI
          return selectedOOILabels.includes(key) && value > 0;
        })
        .map(([k, v]) => `${k}: ${v}`);
    
      return entries.length ? entries.join(", ") : "-";
    };
    

  const handleImageClick = (url) => {
    setCurrentImg(url);
    setOpenImgModal(true);
  };

  return (
    <>
      <div className="kpi-table-wrapper">
        <table className="kpi-table">
          <thead>
            <tr>
              <th>Camera</th>
              <th>Date</th>
              <th>Time</th>
              <th>Counts</th>
              <th>Image</th>
            </tr>
          </thead>

          <tbody>
            {data.map((cam) => {
              const latest = cam.records?.[0] || null;

              const isExpanded = expandedCamera === cam.camera_name;

              return (
                <React.Fragment key={cam.camera_name}>
                  {/* MAIN CAMERA ROW */}
                  <tr
                    className="camera-row"
                    onClick={() => toggleCamera(cam.camera_name)}
                    style={{ cursor: "pointer" }}
                  >
                    <td>{isExpanded ? "▼" : "▶"} <b>{cam.camera_name}</b></td>

                    <td>
                      {latest
                        ? new Date(latest.timestamp).toLocaleDateString("en-GB")
                        : "-"}
                    </td>

                    <td>
                      {latest
                        ? new Date(latest.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "-"}
                    </td>

                    <td>
                      {latest
                        ? formatCounts(latest.counts, selectedOOILabels)
                        : "-"}
                    </td>

                    <td>
                      {latest?.frame_link ? (
                        <span
                          className="image-link"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleImageClick(latest.frame_link);
                          }}
                        >
                          View Image ↗
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>

                  {/* EXPANDED ROWS */}
                  {isExpanded &&
                    cam.records.map((rec, idx) => {
                      if (idx === 0) return null;

                      return (
                        <tr key={idx} className="frame-row">
                          <td></td>

                          <td>
                            {new Date(rec.timestamp).toLocaleDateString("en-GB")}
                          </td>

                          <td>
                            {new Date(rec.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>

                          <td>{formatCounts(rec.counts, selectedOOILabels)}</td>



                          <td>
                            {rec.frame_link ? (
                              <span
                                className="image-link"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleImageClick(rec.frame_link);
                                }}
                              >
                                View Image ↗
                              </span>
                            ) : (
                              "-"
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* IMAGE MODAL */}
      {openImgModal && (
  
        <ImageZoomModal
          isOpen={openImgModal}
          imageSrc={currentImg}
          onClose={() => setOpenImgModal(false)}
        /> 
      )}
    </>
  );
};

export default KPIReportTable;
