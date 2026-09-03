import React, { useState, } from 'react';
import { CaretDownOutlined, CaretRightOutlined } from '@ant-design/icons';
import { format } from 'date-fns';

import deliveryTruck from '../../../../../assets/images/reportIcons/delivery-truck.png';
import forklift from '../../../../../assets/images/reportIcons/forklift.png';
import gateClosed from '../../../../../assets/images/reportIcons/gate-closed.png';
import gateOpen from '../../../../../assets/images/reportIcons/gate-open.png';
import helmet from '../../../../../assets/images/reportIcons/helmet.png';
import motorcycle from '../../../../../assets/images/reportIcons/motorcycle.png';
import noHelmet from '../../../../../assets/images/reportIcons/no-helmet.png';
import person from '../../../../../assets/images/reportIcons/person.png';
import supinePerson from '../../../../../assets/images/reportIcons/supine-person.png';
import crowd from '../../../../../assets/images/reportIcons/crowd.png';
import backpack from '../../../../../assets/images/reportIcons/backpack.png';
import bicycle from '../../../../../assets/images/reportIcons/bicycle.png';
import car from '../../../../../assets/images/reportIcons/car.png';
import noperson from '../../../../../assets/images/reportIcons/noperson.png';
import handbag from '../../../../../assets/images/reportIcons/handbag.png';
import { reduceStringSize } from '../../../../../utils/reduceStringSize';
import { Tooltip } from 'antd';


//table displaying the data inside alerts:{] for each cam object

const CustomTableBody = ({ data, camName, showModal }) => {

    const [open, setOpen] = useState(false)

    //icons stored statically and loaded dynamically based on alerts["11:19:02"].object 
    const renderAlertIcon = (iconData, no_obj_status) => {
        //total -- 16 icons
        let iconUsed = null;
        if (!iconData) {
            //ignore
        } else if (iconData === "Supine person" || iconData === "supine person") {
            iconUsed = supinePerson;
        } else if (iconData === "crowd") {
            iconUsed = crowd;
        } else if (iconData === "backpack") {
            iconUsed = backpack;
        } else if (iconData === "handbag") {
            iconUsed = handbag;
        } else if (iconData === "car") {
            iconUsed = car;
        } else if (iconData === "bicycle") {
            iconUsed = bicycle;
        } else if (iconData === "person" || iconData === "Person") {
            iconUsed = person;
        } else if (iconData === "no helmet" || iconData === "No helmet") {
            iconUsed = noHelmet;
        } else if (iconData === "no person" || iconData === "No person") {
            iconUsed = noperson;    // displaying icon of no person for no person alert
        } else if (iconData === "helmet" || iconData === "Helmet") {
            iconUsed = helmet;
        } else if (iconData === "gate closed" || iconData === "gate_close") {
            iconUsed = gateClosed;
        } else if (iconData === "gate open" || iconData === "gate_open") {
            iconUsed = gateOpen;
        } else if (iconData === "motorbike") {
            iconUsed = motorcycle;
        } else if (iconData === "truck") {
            iconUsed = deliveryTruck;
        } else if (iconData === "fork_lift" || iconData === "fork lift") {
            iconUsed = forklift;
        }

        return (iconUsed ?
            <img src={iconUsed} alt='alert-icon-img' className='alert-named-icon' />
            : iconUsed
        );

    };

    //hide show rows , first row always shown
    const handleIconClass = (indexx) => {
        return indexx === 0 ? 'shown' : indexx !== 0 && open ? 'shown' : 'hidden';
    };



    //const dataaa = data[camName]?.alerts &&
    //Object.keys(data[camName].alerts)?.length > 0 ? Object.fromEntries(Object.entries(data[camName].alerts).slice(1, 5) ) :{}
    //console.log('42314324', dataaa)

    return (
        <tbody>
            {data[camName]?.alerts &&
                Object.keys(data[camName].alerts || {} )?.length > 0 ? // ||{} --> not needed but still used
                Object.keys(data[camName].alerts).map((uselessTime, indexx) =>
                    <tr
                        key={uselessTime}
                        className={handleIconClass(indexx)}
                    >

                        {indexx === 0 && open ? <td style={{ width: 10 }}><CaretDownOutlined onClick={() => setOpen((open) => !open)} /></td>
                            : indexx === 0 && !open ? <td style={{ width: 10 }}><CaretRightOutlined onClick={() => setOpen((open) => !open)} /></td>
                                : <td style={{ width: 10 }}></td>
                        }

                        {indexx % 2 === 0 ? <td className="cam-name-style">{reduceStringSize(camName)}</td> : <td></td>}


                        {data[camName].alerts?.[uselessTime]?.timestamp ?
                            <td>{format(new Date(data[camName].alerts[uselessTime].timestamp), 'do MMMM yyyy')}</td>
                            : <td></td>}


                        {data[camName].alerts?.[uselessTime]?.timestamp ?
                            <td>{format(new Date(data[camName].alerts[uselessTime].timestamp), 'HH:mm aa')}</td>
                            : <td></td>}

                        <td className='alertName-td '>
                        <Tooltip 
                                title={data[camName].alerts[uselessTime]?.object ?
                                    data[camName].alerts[uselessTime].object : ""
                                }>
                            <div className='alertname-items-container'>
                                <div className='alertname-item-one' >

                                    {data[camName].alerts[uselessTime]?.object &&
                                        renderAlertIcon(data[camName].alerts[uselessTime].object,data[camName].alerts[uselessTime].no_obj_status)}
                                </div>

                                <div className='alertname-item-two' >

                                    {data[camName].alerts[uselessTime]?.my_alert_name &&  //told to take first name in alert array
                                        data[camName].alerts[uselessTime]?.my_alert_name?.length > 0 &&
                                        <span>{reduceStringSize(data[camName].alerts[uselessTime].my_alert_name[0])}</span>
                                    }

                                </div>

                            </div>
                            </Tooltip>

                        </td>

                        {data[camName].alerts[uselessTime]?.link ?
                            <td className="td-link-style"
                                onClick={() => {
                                    showModal(data[camName].alerts[uselessTime]?.link);
                                    //  console.log('linkkkk', data[camName].alerts[uselessTime]?.link)
                                }}
                            >https</td>
                            : <td></td>}


                        {/* {indexx % 2 === 0 ?
                            <td className="td-link-style"
                                //onClick={() => showModal("https://loremflickr.com/800/500")}
                                onClick={() => showModal("http://localhost:5000/cam801/alerts/2023-03-23%2018:29:00_alert.jpg")}
                            >https</td>
                            :
                            <td className="td-link-style"
                                onClick={() => showModal("http://localhost:5000/cam801/alerts/2023-03-24%2014:23:41_alert.jpg")}
                            >https</td>} */}


                    </tr>
                )
                :
                <tr className='shown'>
                    <td style={{ width: 10 }}></td>
                    {/* <td colSpan={1} className="cam-name-style">{`CAM ${camName}`}</td> */}
                    <td colSpan={1} className="cam-name-style">{reduceStringSize(camName)}</td>
                    <td className="No-Alerts-Captured" colSpan={4}>No Alerts Captured</td>
                </tr>
            }
            {/* <tr className={open ? 'shown' : 'hidden'}><td colSpan={6} >pagination</td></tr> */}
        </tbody>
    );
}

export default CustomTableBody;