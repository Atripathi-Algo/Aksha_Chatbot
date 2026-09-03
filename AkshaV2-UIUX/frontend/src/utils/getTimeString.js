import dayjs from 'dayjs';

// This code exports a function called getTimeString which takes a value (presumably a time value) and returns a formatted string representing the time in hours and minutes.

// The function first imports the dayjs library which provides a lightweight and modern JavaScript date library. 
// It then uses dayjs to extract the hour and minute values from the provided value parameter.

// The hour and minute values are then checked to see if they are less than or equal to 9. 
// If they are, a leading zero is added to the value to ensure consistent formatting.

// The function then creates a string in the format "HH:MM" (hours:minutes) using the extracted and formatted hour and minute values. 
// Finally, the formatted string is returned by the function.



//value -- time in dayjs format
//showSeconds : optional

const getTimeString=(value, showSeconds=false, showMinutes = true)=>{

    let hours=  dayjs(value).hour();  //get current hour as a number i.e 8am UTC time to 8
    hours = hours <= 9 ? '0' + hours : hours; //for hours 0 to 9  ..tun into 00, 01, 02, 03, 04 , 05 ..etc format
    
    let minutes=  dayjs(value).minute();  //get current minute as a number i.e 8:10am UTC time to  10
    minutes =  minutes <= 9 ? '0' + minutes : minutes; //for minutes 0 to 9  ..tun into 00, 01, 02, 03, 04 , 05 ..etc format
    

    const minutesSTring = showMinutes ? `${hours}:${minutes}` : `${hours}:00`; 

    const str = showSeconds ? `${minutesSTring}:00` : minutesSTring; //if showseconds add :00 to string i.e 10:00 --> 10:00:001q
    //console.log(str);
    return ( str );
    
    }


export default getTimeString;    