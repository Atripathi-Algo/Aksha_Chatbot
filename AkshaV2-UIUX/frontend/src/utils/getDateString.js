import {  format } from "date-fns";
//used date-fns since react-date-range uses it to compute date

const getDateString = (value) => {
//the match .format('YYYY-MM-DD') used in mongoDb route
//format(new Date(`Wed Jun 07 2023 16:21:14 GMT+0530 (India Standard Time)`), 'YYYY-MM-DD')

    return ( format(new Date(value), 'yyyy-MM-dd') );

    }


export default getDateString;  


//prev was error  --> could have done moment(new Date(value)).format('YYYY-MM-DD') ---> but changed

//warning in browsers
//Deprecation warning: value provided is not in a recognized RFC2822 or ISO format. 
//moment construction falls back to js Date(), which is not reliable across all browsers and versions. 
//Non RFC2822/ISO date formats are discouraged and will be removed in an upcoming major release.


////prev
// const currStartDate = moment(dates[0].startDate).format('YYYY-MM-DD');  //the match .format('YYYY-MM-DD') used in mongoDb route
// const currEndDate = moment(dates[0].endDate).format('YYYY-MM-DD'); //the match .format('YYYY-MM-DD') used in mongoDb route