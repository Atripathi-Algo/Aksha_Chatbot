
//component returns a reusable datepicker
//DateRangePicker taken from react-date-range library

import { DateRangePicker } from "react-date-range";
import "react-date-range/dist/styles.css"; // main style file
import "react-date-range/dist/theme/default.css"; // theme css file
// import "./DatesModel.scss"; // custom scss file
import './styles/DatesModel.scss';
// import { addDays } from 'date-fns';


// main component
const CustomDatePicker = ({ dates, onDateChange, index, maxDate, minDate, months, showPreview }) => {

  //index -- index of object  heading: "Date*" in tabs array
  //dates has the structure sames as [item.selection] in onChange 
 
  // jsx returned by DatesModel
  return (
    <div className="range-picker-search-bar">
      <DateRangePicker
        ranges={dates} //default state
        onChange={(item) => { onDateChange(item, index) }}
        showSelectionPreview={false} //hide preview on focused/hovered dates
        moveRangeOnFirstSelection={false} //move range on startDate selection.
        
        direction="horizontal" //direction of calendar months
        preventSnapRefocus={true} //prevents unecessary refocus of shown range on selection
        showDateDisplay={false}  //hide selection display row. 
        showMonthAndYearPickers={false}  //hide month and year dropdown
        fixedHeight={true} //by setting this prop, you can force 6 lines for all months even if less required
        showPreview={showPreview}  //when user selects startdate shows css to select end date
        months={months}  //rendered month count
        minDate={minDate} //days occuring before max date allowed
        maxDate={maxDate} //can select range only till todays date

      />
    </div>
  );
};

export default CustomDatePicker;


//default values for timepicker props
// CustomDatePicker.defaultProps = {
//   minDate:addDays(new Date(), -10),
//   maxDate:new Date(),
//   months:2  //prev was 2
// }


