

//popover snippet taken from mui 5 
//component shows text and on click returns a popover containing list object name labels with different color for active selected 

//to be noted 
//labels.text file needed for it to work else will get error


import React, { useState, useEffect, useRef } from "react";
import Popover from '@mui/material/Popover';
import Typography from '@mui/material/Typography';
import TruckModel from "./TruckModel";
import '../asterics_styles/asteric.css';
import './Truck.scss';

export default function Truck({
  heading,
  text,
  active,
  index,
  setTabStore,
  tabStore,
  setOILable,
  mobile,
  ooiLabels,
  isOpen,
  setIsOpen,
  menuRef,
}) {
  
//heading, text, active, index, setTabStore, tabStore: this props used to modify  in searchStore state 
// {
//   heading: "Area of Interest",
//   text: "AOI",
//   active: false,
// },
//setOILable: function reference modify state in parent

  const [anchorEl, setAnchorEl] = useState(null);
  const [defaultval, setDefaultval] = useState("");

  const [checkedItems, setCheckedItems] = useState({});
  const [ooiarray, setooiarray] = useState([]);
  let arr=[];

  
  useEffect(()=>{
    const closeDropdown = e => {
       if(e.target.id !== menuRef.current.id && e.target.type!='checkbox' && e.target.id!="selectooi"){
        setIsOpen(false);   // to close the dropdown if the user clicks outside
     }
      
    };
    document.body.addEventListener('click', closeDropdown);
    return () => document.body.removeEventListener('click', closeDropdown);
  }, [])
  //open modal click event
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const toggleDropdown = () => {
    
    setIsOpen(!isOpen)
  };

  //close modal click event
  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleChange = (id, name) => {
    arr=ooiarray;
    if(arr.includes(name)){          // when the user clicks a checked box, we'll remove that ooi from the array
      let arr2= arr.filter(function (val) {
        return val !== name;
    });
    setooiarray(arr2);
    setOILable(arr2);
    }
    else{
      arr.push(name);
      setOILable(arr);
      setooiarray(arr);
    }
    setCheckedItems({
      ...checkedItems,
      [id]: !checkedItems[id],
    });
  };

  //modal custom variables
  const open = Boolean(anchorEl);
  const id = open ? 'simple-popover' : undefined;

  text = typeof text === 'string' ? [text] : text; //[ "person", "car", "helmet" ]

  text = text && text.filter((item, pos) => text.indexOf(item) === pos);  //text.indexOf(item) === pos) if true returns item, 

  let items = [];
  for (let i=0;i<ooiLabels.length;i++){
    if(ooiLabels[i]!="")
    items.push({id: i, name: ooiLabels[i]})
  }
  if(!ooiLabels.includes("crowd")){
  items.push({id: ooiLabels.length, name: "crowd"})
  }
  return (
    <div id="objectOfInterestCls">
      <div className="dropdown" >
      <div
        className={`inner-content text-center ${active === true && "activeTab"}`}
        key={index}
        id="ooi_button"
        ref={menuRef}
        onClick={(e) => {
          for (let i = 0; i < tabStore.length; i++) {
            tabStore[i].active = false;
          }

          tabStore[index].active = true;
          //change the active css of the current selected field (i.e active: false)  in tabs

          setTabStore(() => {
            return [...tabStore];
          });
          toggleDropdown();

          handleClick(e);
        }}
      >
        {mobile === false && <p id="selectooi"><span id="selectooi">{heading.slice(0,-1)}</span><span className='asterics_style'>{heading.charAt(heading.length-1)}</span></p>}
        <p className="text-label mb-0 paragah" id="selectooi">
          {ooiarray && ooiarray.length>0 ? (ooiarray.map((ele, idx) => <span id="selectooi">{`${ele}${ooiarray.length !== idx + 1 ? ',' : ''}`}</span>  //text.length greater than 1 than add comma after each
          )):(<span id="selectooi">select objects</span>)}
        </p>

      </div>
      {/* dropdown menu */}
      {isOpen && (
        <ul className="dropdown-menu" id="checkbox_menu">
          {items.map((item) => (
            <li key={item.id} id="selectooi">
              <div className="form-check" id="selectooi" onClick={() => handleChange(item.id, item.name)}>
                <input
                  className="form-check-input"
                  checked={!!checkedItems[item.id]}//checked state comes from state
                  type="checkbox"
                  id="selectooi"
                />
                
                <label
                  className="form-check-label"
                  style={{ fontSize: 18 }}
                  id="selectooi"
                  
                >
                  {item.name}
                </label>
              </div>
            </li>
          ))}
        </ul>
      )}
      </div>
    </div>
  );
}