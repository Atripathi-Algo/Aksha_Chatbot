//creates a dropdown of selectable items


//to be noted
// active css for selected  items not working properly on refresh 
//prev local storage key  'OBI' not working in sync or change in dropdown  or  refresh
//axios paramters for object_of_interest array not in sync with  local storage key  'OBI' array


import { addDays } from "date-fns";
import { useEffect, useState } from "react";
import "react-date-range/dist/styles.css"; // main style file
import "react-date-range/dist/theme/default.css"; // theme css file
import "./TruckModel.scss";// custom scss file
import { useSelector } from "react-redux";


// main component
const TruckModel = ({
  setTabStore,
  tabStore,
  index,
  close,
  setDefaultval,
  selectedOption,
  setOILable,
}) => {

  //setOILable: modify labels selected in parent

  //array of  all ObjectOfInterest Labels present in labels.txt
  let objectOfInterestLabels = useSelector(
    (state) => state.investigation.allObjectOfInterestLabels
  );


    //days state not needed here, its used only in datepicker
  const [state, setState] = useState([
    {
      startDate: new Date(),
      endDate: addDays(null, 0),
      key: "selection",
    },
  ]);


  let [selectedValue, setSelectedValue] = useState(selectedOption.length > 0 ? selectedOption : ['person']); //found unused


  //  runs on component mount or refresh
  useEffect(() => {
    let data
    if (selectedOption.length > 0) {
      data = [...selectedOption]
    } else {
      data = [objectOfInterestLabels[0].replace(/(?:\\[rn])+/g, "")]
    }
    sessionStorage.setItem('OBI', JSON.stringify(data))   //found unused
  }, []);

  //  runs on component mount or refresh or state change
  useEffect(() => {
    if (!selectedOption) {
      setDefaultval(
        objectOfInterestLabels.length > 0 ? objectOfInterestLabels[0] : ""
      );
    }
    for (let i = 0; i < state.length; i++) {
      tabStore[index].text = selectedOption
        ? selectedOption
        : objectOfInterestLabels.length > 0
          ? objectOfInterestLabels[0]
          : "";
      setTabStore(() => {
        return [...tabStore];
      });
    }
    sessionStorage.setItem('OBI', JSON.stringify(selectedOption.length > 0 ? [...selectedOption] : [objectOfInterestLabels[0].replace(/(?:\\[rn])+/g, "")]))  //found unused
  }, [state]);  //state dependecy not needed as it doesnt rerun here
  
  // on select object of interest
  const showSelected = (val) => {
    let final = []
    if (JSON.parse(localStorage.getItem('OBI')) && JSON.parse(localStorage.getItem('OBI')).length > 0) {
      let arr = JSON.parse(localStorage.getItem('OBI'))
      let arr2=[];
      for(let item of arr){
        item=item.replace("\r", "");
        arr2=[...arr2,item];
      }
      let newArr=arr2;
      if(arr2.includes(val)){
        let arr=[];
        for(let item of arr2){
          if(val!=item){
            arr.push(item);
          }
        }
        newArr=arr;
        setOILable(newArr);
        localStorage.setItem('OBI', JSON.stringify(newArr))
        final = newArr;
        setSelectedValue(newArr);
        setDefaultval(newArr);
        for (let i = 0; i < state.length; i++) {
          tabStore[index].text = newArr;
          setTabStore(() => {
            return [...tabStore];
          });
        }
        console.log('==================first===================');
        console.log('newArr',newArr);
        console.log('arr2',arr2);        
        console.log('val',val);
      }else{
        newArr.push(val);
        setOILable(newArr);
        localStorage.setItem('OBI', JSON.stringify(newArr))
        final = newArr;
        setSelectedValue(newArr);
        setDefaultval(newArr);
        for (let i = 0; i < state.length; i++) {
          tabStore[index].text = newArr;
          setTabStore(() => {
            return [...tabStore];
          });
        }
        console.log('==================second===================');
      }
    } else {
      localStorage.setItem('OBI', JSON.stringify([val.replace(/(?:\\[rn])+/g, "")]))
      final = [val.replace(/(?:\\[rn])+/g, "")]
      setSelectedValue(final);
        setDefaultval(final);
        for (let i = 0; i < state.length; i++) {
          tabStore[index].text = final;
          setTabStore(() => {
            return [...tabStore];
          });
        }
    }
    close();
  };

  

  // html rendered
  const OBI=JSON.parse(localStorage.getItem('OBI'));  //get items selected previously from local storage
  return (
    <div className="object-of-interest-outer-wrapper">
      <ul>
        {objectOfInterestLabels.map((label,index) => {
          let text=label.trim();
          return (
            <li
              key={index}
              className={OBI && OBI.includes(text) ? "active" : ""}  // active css for selected  items
              onClick={() => showSelected(text)}
            >
              <p>{text}</p>
            </li>
          )
        })}
      </ul>
    </div>
  );
};

export default TruckModel;
