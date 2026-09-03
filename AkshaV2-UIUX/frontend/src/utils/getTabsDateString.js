import {  format } from "date-fns";
//used date-fns since react-date-range uses it to compute date

const getTabsDateString = (value) => {
    return ( format(new Date(value), 'dd/MM/yy') );
    }

export default getTabsDateString;  


//prev
// const currStartDate = moment(dates[0].startDate).format("DD/MM/YY");
// const currEndDate = moment(dates[0].endDate).format("DD/MM/YY");


//moment not supporting so changed 


//warning in browsers
//Deprecation warning: value provided is not in a recognized RFC2822 or ISO format. 
//moment construction falls back to js Date(), which is not reliable across all browsers and versions. 
//Non RFC2822/ISO date formats are discouraged and will be removed in an upcoming major release.