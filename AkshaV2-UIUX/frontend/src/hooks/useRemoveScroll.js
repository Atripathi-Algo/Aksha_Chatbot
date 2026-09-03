import React from 'react';

//removes scroll if array empty i.e  if array length is zero
//tracks array change
//cssClass -- class name optional

//body.removeScroll and body.remove-Y-Scroll present in main index.scss
//'removeScroll' classs removes scroll from both x-axis and y-axis
//'remove-Y-Scroll'  removes scroll from  y-axis only

const useRemoveScroll = (dependencyArray, cssClass) => {
  
    const documentDefined = typeof document !== 'undefined';
    const cssClassNamed= cssClass ? cssClass:'removeScroll'; //deafult class to be used if cssClass falsy

    React.useEffect(() => {
      if (!documentDefined) return; //check if document exists

      if (typeof window !== "undefined") {
        //scroll to top on change in tab/component
       setTimeout(() => window.scrollTo(0, 0), 0); //window.scrollTo called inside useEffect... hence window.scrollTo needs to be called inside setTimeout
      }
  
    //if array length is zero add class to body
     if(dependencyArray && dependencyArray?.length === 0){
        document.body.classList.add(cssClassNamed);
     }
  

     //on unmount i.e tab/component change removed previoiusly added class (i.e 'remove-Y-Scroll' or  'removeScroll')
      return () => {
        document.body.classList.remove(cssClassNamed);
      };
    }, [dependencyArray, cssClassNamed]);//rerun array on  dependencyArray or  cssClassNamed change
  };


  export default useRemoveScroll;