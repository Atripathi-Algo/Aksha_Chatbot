//popover snippet taken from mui 5
//component shows text and on click returns a popover containing list object name labels with different color for active selected

//to be noted
//labels.text file needed for it to work else will get error

import React, { useState, useEffect } from "react";
// import '../asterics_styles/asteric.css';
import "./Dropdown.scss";

type DropdownProps = {
  heading: string;
  // text: any;
  active: boolean;
  // index: any;
  // setTabStore: any;
  // tabStore: any;
  options: string[];
  selectedLabels: string[];
  setSelectedLabels: React.Dispatch<React.SetStateAction<string[]>>;
  mobile: any;
  isOpen: any;
  setIsOpen: any;
  menuRef: any;
};

const Dropdown = ({
  heading,
  // text,
  active,
  // index,
  // setTabStore,
  // tabStore,
  options,
  selectedLabels,
  setSelectedLabels,
  mobile,
}: // isOpen,
// setIsOpen,
DropdownProps) => {
  const menuRef = React.useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  // const [checkedItems, setCheckedItems] = useState<any>({});
  // const [ooiarray, setooiarray] = useState<any[]>([]);
  let arr = [];

  useEffect(() => {
    const closeDropdown = (e: any) => {
      if (
        e.target.id !== menuRef.current?.id &&
        e.target.type != "checkbox" &&
        e.target.id != "selectooi"
      ) {
        setIsOpen(false); // to close the dropdown if the user clicks outside
      }
    };
    document.body.addEventListener("click", closeDropdown);
    return () => document.body.removeEventListener("click", closeDropdown);
  }, []);
  //open modal click event

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };


  const handleChange = (name: string) => {
    if (selectedLabels.includes(name)) {
      // when the user clicks a checked box, we'll remove that ooi from the array
      // let arr2 = selectedLabels.filter(function (val: any) {
      //   return val !== name;
      // });
      // setooiarray(arr2);
      setSelectedLabels(prev => prev.filter((val) => val !== name));
    } else {
      // arr.push(name);
      setSelectedLabels(prev => [...prev, name]);
      // setooiarray(arr);
    }
    // setCheckedItems({
    //   ...checkedItems,
    //   [id]: !checkedItems[id],
    // });
  };

  // text = typeof text === "string" ? [text] : text; //[ "person", "car", "helmet" ]

  // text =
  //   text && text.filter((item: any, pos: any) => text.indexOf(item) === pos); //text.indexOf(item) === pos) if true returns item,

  // let items = [];
  // for (let i = 0; i < options.length; i++) {
  //   items.push({ id: i, name: options[i] });
  // }
  // items.push({ id: options.length, name: "crowd" });

  return (
    <div>
      <div className="dropdown">
        <div
          className={`inner-content text-center ${
            active === true && "activeTab"
          }`}
          // key={index}
          id="ooi_button"
          ref={menuRef}
          onClick={() => toggleDropdown()}
        >
          {mobile === false && (
            <p id="selectooi">
              <span id="selectooi">{heading}</span>
              <span className="asterics_style">* </span>
            </p>
          )}
          <p className="text-label mb-0 paragah" id="selectooi">
            {selectedLabels && selectedLabels.length > 0 ? (
              selectedLabels.map(
                (ele, idx) => (
                  <span id="selectooi">{`${ele}${
                    selectedLabels.length !== idx + 1 ? "," : ""
                  }`}</span>
                ) //text.length greater than 1 than add comma after each
              )
            ) : (
              <span id="selectooi">select objects</span>
            )}
          </p>
        </div>
        {/* dropdown menu */}
        {isOpen && (
          <ul className="dropdown-menu" id="checkbox_menu">
            {options.map((item, i) => (
              <li key={`${item}-${i}`} id="selectooi">
                <div
                  className="form-check"
                  id="selectooi"
                  onClick={() => handleChange(item)}
                >
                  <input
                    className="form-check-input"
                    checked={selectedLabels.includes(item)} //checked state comes from state
                    type="checkbox"
                    id="selectooi"
                  />

                  <label
                    className="form-check-label"
                    style={{ fontSize: 18 }}
                    id="selectooi"
                  >
                    {item}
                  </label>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Dropdown;
