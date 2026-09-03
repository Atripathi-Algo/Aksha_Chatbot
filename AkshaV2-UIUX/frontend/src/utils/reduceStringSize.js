export const reduceStringSize = (nameGiven, maxLimit = 10) => {
    let str = nameGiven;

    //equal to not required

    if (maxLimit === 0) {
        //ignore
    } else if (str.length === 0) {
        //ignore
    } else if (str.length < maxLimit) {
        //ignore
    } else if (str.length > maxLimit) {
        str = str.slice(0, maxLimit) + "..."; 
    }


    return str;

}