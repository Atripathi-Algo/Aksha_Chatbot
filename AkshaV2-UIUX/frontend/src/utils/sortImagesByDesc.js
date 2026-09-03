

const sortImagesByDesc=(DataArr=[])=>{


    const sorted = [...DataArr].sort(function(a, b) {  //spread array to avoid mutation

        const dateA = getFormattedDate(a);
        const dateB = getFormattedDate(b);
        //console.log('1234 dateA, dateB', dateA, dateB);
        return (dateB - dateA); //desc order
    });

    //console.log('1234 sorted', sorted);

    return  sorted;
    
    }
    


const getFormattedDate = (str) =>{

    const url = str;   //str ---> 'http://localhost:5000/cam701/alerts/2023-06-15 18:47:56_alert.jpg';
    const regex = /\/(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})_/;  //  \d{1,2} matches 1 or 2 digits , \/ matches a slash (the separator), \d{2,4} matches 2 or 4 digits 
    const match = regex.exec(url);
    let dateString = new Date();
    if (match) {   //if false match ==== null
       dateString = new Date(match[1]) ;  
       //match[1] ---> "2023-06-15 18:47:56", 
       //new Date(match[1])  ----> Thu Jun 15 2023 18:47:56 GMT+0530 (India Standard Time)
    } 

    
    return dateString; //op

}




export default sortImagesByDesc;    




// const url = 'http://localhost:5000/cam701/alerts/2023-06-15 18:47:56_alert.jpg';
// const regex = /\/(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})_/;
// const match = regex.exec(url);
// if (match) {
//   const dateString = match[1];
//   console.log(dateString);
// } else {
//   console.log("No date string found in the URL.");
// }